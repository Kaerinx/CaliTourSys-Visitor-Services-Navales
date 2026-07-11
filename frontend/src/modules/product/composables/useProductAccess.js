import { computed, reactive } from 'vue'
import { useRoute } from 'vue-router'

import { useCmsAuthStore } from '@/modules/cms/stores/authStore'
import { USER_ROLES, useAuthStore } from '@/stores/auth'

const cmsRoleMap = Object.freeze({
  system_admin: USER_ROLES.SYSTEM_ADMINISTRATOR,
  'System Administrator': USER_ROLES.SYSTEM_ADMINISTRATOR,
  tourism_officer: USER_ROLES.TOURISM_OFFICER,
  'Tourism Officer': USER_ROLES.TOURISM_OFFICER,
  tourism_staff: USER_ROLES.TOURISM_STAFF,
  'Tourism Staff': USER_ROLES.TOURISM_STAFF,
  content_editor: USER_ROLES.TOURISM_STAFF,
  read_only_staff: USER_ROLES.LGU_OFFICIAL,
  'LGU Official': USER_ROLES.LGU_OFFICIAL,
})

export function useProductAccess() {
  const legacyAuth = useAuthStore()
  const cmsAuth = useCmsAuthStore()
  const route = useRoute()

  const role = computed(() => {
    if (!route.path.startsWith('/cms')) return legacyAuth.user?.role || USER_ROLES.LGU_OFFICIAL

    const roles = cmsAuth.currentUser?.roles || []
    if (roles.includes('system_admin') || roles.includes('System Administrator')) {
      return USER_ROLES.SYSTEM_ADMINISTRATOR
    }
    if (roles.includes('tourism_officer') || roles.includes('Tourism Officer')) {
      return USER_ROLES.TOURISM_OFFICER
    }
    if (roles.includes('tourism_staff') || roles.includes('content_editor') || roles.includes('Tourism Staff')) {
      return USER_ROLES.TOURISM_STAFF
    }

    return cmsRoleMap[roles[0]] || USER_ROLES.LGU_OFFICIAL
  })

  const user = computed(() => ({
    ...(legacyAuth.user || {}),
    role: role.value,
  }))

  const isViewOnly = computed(() => role.value === USER_ROLES.LGU_OFFICIAL)

  return reactive({
    get isAuthenticated() {
      return route.path.startsWith('/cms') ? cmsAuth.isAuthenticated : legacyAuth.isAuthenticated
    },
    get isViewOnly() {
      return isViewOnly.value
    },
    get role() {
      return role.value
    },
    get user() {
      return user.value
    },
  })
}
