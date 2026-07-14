<script setup>
import { onMounted, ref, watch } from "vue";
import CmsConfirmDialog from "../../components/content/CmsConfirmDialog.vue";
import CmsContentToolbar from "../../components/content/CmsContentToolbar.vue";
import CmsDataTable from "../../components/content/CmsDataTable.vue";
import CmsEmergencyFacilityForm from "../../components/content/CmsEmergencyFacilityForm.vue";
import CmsPagination from "../../components/content/CmsPagination.vue";
import CmsStatusBadge from "../../components/content/CmsStatusBadge.vue";
import { friendlyContentError, useCmsList } from "../../composables/useCmsList";
import { cmsContentApi } from "../../services/cmsContentApi";
import { useCmsAuthStore } from "../../stores/authStore";

const auth = useCmsAuthStore();
const { filters, items, pagination, isLoading, error, load, setPage } =
  useCmsList(cmsContentApi.getEmergencyFacilities, {
    facilityType: "",
    sort: "displayOrder",
  });
const formOpen = ref(false);
const selected = ref(null);
const formError = ref("");
const notice = ref("");
const isSaving = ref(false);
const isOpening = ref(false);
const confirmAction = ref(null);
const isActionBusy = ref(false);
const columns = [
  { key: "name", label: "Facility" },
  { key: "type", label: "Type" },
  { key: "location", label: "Location" },
  { key: "contacts", label: "Public contacts" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];
const facilityTypes = [
  ["", "All facility types"],
  ["health_center", "Health center"],
  ["hospital", "Hospital"],
  ["emergency_service", "Emergency service"],
  ["first_aid", "First aid"],
  ["fire_station", "Fire station"],
  ["police_station", "Police station"],
  ["responder", "Responder"],
  ["other", "Other"],
];
let filterTimer;

onMounted(load);
watch(
  () => filters.facilityType,
  () => {
    window.clearTimeout(filterTimer);
    filterTimer = window.setTimeout(() => {
      filters.page = 1;
      load();
    }, 150);
  },
);
const can = (permission) => auth.hasPermission(permission);
const typeLabel = (value) =>
  facilityTypes.find(([key]) => key === value)?.[1] || value;
function openCreate() {
  selected.value = null;
  formError.value = "";
  formOpen.value = true;
}
async function openEdit(item) {
  isOpening.value = true;
  formError.value = "";
  try {
    const { data } = await cmsContentApi.getEmergencyFacilityById(item.id);
    selected.value = data;
    formOpen.value = true;
  } catch (err) {
    error.value = friendlyContentError(err);
  } finally {
    isOpening.value = false;
  }
}
async function submitRecord(payload) {
  isSaving.value = true;
  formError.value = "";
  try {
    if (selected.value?.id)
      await cmsContentApi.updateEmergencyFacility(selected.value.id, payload);
    else await cmsContentApi.createEmergencyFacility(payload);
    notice.value = selected.value?.id
      ? "Emergency facility updated."
      : "Emergency facility created.";
    formOpen.value = false;
    await load();
  } catch (err) {
    formError.value = friendlyContentError(err);
  } finally {
    isSaving.value = false;
  }
}
function askAction(type, item) {
  confirmAction.value = { type, item };
}
async function runConfirmedAction() {
  isActionBusy.value = true;
  try {
    if (confirmAction.value.type === "publish") {
      await cmsContentApi.publishEmergencyFacility(confirmAction.value.item.id);
      notice.value = "Emergency facility published on the map.";
    } else {
      await cmsContentApi.archiveEmergencyFacility(confirmAction.value.item.id);
      notice.value = "Emergency facility archived.";
    }
    confirmAction.value = null;
    await load();
  } catch (err) {
    error.value = friendlyContentError(err);
  } finally {
    isActionBusy.value = false;
  }
}
</script>

<template>
  <section
    class="cms-content-page"
    aria-labelledby="emergency-facilities-title"
  >
    <header class="cms-content-page__header">
      <div>
        <p>Map Operations</p>
        <h1 id="emergency-facilities-title">Emergency Facilities</h1>
        <span
          >Maintain verified health, first-aid, safety, and responder locations
          shown independently on the public map.</span
        >
      </div>
    </header>
    <div v-if="notice" class="cms-content-page__notice" role="status">
      {{ notice }}
    </div>
    <CmsContentToolbar
      v-model:search="filters.search"
      v-model:status="filters.status"
      create-label="Create emergency facility"
      :can-create="can('map_locations.create')"
      @create="openCreate"
    />
    <label class="facility-filter"
      ><span>Facility type</span
      ><select v-model="filters.facilityType">
        <option v-for="type in facilityTypes" :key="type[0]" :value="type[0]">
          {{ type[1] }}
        </option>
      </select></label
    >
    <CmsDataTable
      :columns="columns"
      :items="items"
      :loading="isLoading || isOpening"
      :error="error"
      empty-title="No emergency facilities found"
      empty-text="Create a draft facility or adjust your filters. Empty data is valid until records are verified."
      @retry="load"
    >
      <template #rows="{ items: rows }"
        ><tr v-for="item in rows" :key="item.id">
          <td>
            <span class="cms-table-title"
              ><strong>{{ item.name }}</strong
              ><span>{{ item.slug }}</span></span
            >
          </td>
          <td>{{ typeLabel(item.facilityType) }}</td>
          <td>
            <span class="cms-table-title"
              ><strong>{{ item.barangay || item.municipality }}</strong
              ><span>{{ item.latitude }}, {{ item.longitude }}</span></span
            >
          </td>
          <td>
            <span class="cms-table-title"
              ><strong>{{
                item.emergencyHotline || item.publicPhone || "Not provided"
              }}</strong
              ><span>{{ item.email || "No public email" }}</span></span
            >
          </td>
          <td><CmsStatusBadge :status="item.status" /></td>
          <td>
            <span class="cms-table-actions"
              ><button
                v-if="can('map_locations.update')"
                type="button"
                @click="openEdit(item)"
              >
                Edit</button
              ><button
                v-if="
                  can('map_locations.update') && item.status !== 'published'
                "
                type="button"
                @click="askAction('publish', item)"
              >
                Publish</button
              ><button
                v-if="can('map_locations.update') && item.status !== 'archived'"
                class="is-danger"
                type="button"
                @click="askAction('archive', item)"
              >
                Archive
              </button></span
            >
          </td>
        </tr></template
      >
      <template #cards="{ items: cards }"
        ><article v-for="item in cards" :key="item.id" class="cms-mobile-card">
          <span class="cms-table-title"
            ><strong>{{ item.name }}</strong
            ><span>{{ typeLabel(item.facilityType) }}</span></span
          >
          <div class="cms-mobile-meta">
            <CmsStatusBadge :status="item.status" /><span>{{
              item.barangay || item.municipality
            }}</span>
          </div>
          <span>{{
            item.emergencyHotline || item.publicPhone || "No public phone"
          }}</span>
          <div class="cms-mobile-card__actions cms-table-actions">
            <button
              v-if="can('map_locations.update')"
              type="button"
              @click="openEdit(item)"
            >
              Edit</button
            ><button
              v-if="can('map_locations.update') && item.status !== 'published'"
              type="button"
              @click="askAction('publish', item)"
            >
              Publish</button
            ><button
              v-if="can('map_locations.update') && item.status !== 'archived'"
              class="is-danger"
              type="button"
              @click="askAction('archive', item)"
            >
              Archive
            </button>
          </div>
        </article></template
      >
    </CmsDataTable>
    <CmsPagination :pagination="pagination" @page-change="setPage" />
    <CmsEmergencyFacilityForm
      :open="formOpen"
      :value="selected"
      :busy="isSaving"
      :server-error="formError"
      @close="formOpen = false"
      @submit="submitRecord"
    />
    <CmsConfirmDialog
      :open="Boolean(confirmAction)"
      :title="
        confirmAction?.type === 'publish'
          ? 'Publish this emergency facility?'
          : 'Archive this emergency facility?'
      "
      :message="
        confirmAction?.type === 'publish'
          ? 'The verified facility will become available to the public emergency map layer.'
          : 'The facility will be removed from the public emergency map layer.'
      "
      :confirm-label="confirmAction?.type === 'publish' ? 'Publish' : 'Archive'"
      :tone="confirmAction?.type === 'archive' ? 'danger' : 'primary'"
      :busy="isActionBusy"
      @cancel="confirmAction = null"
      @confirm="runConfirmedAction"
    />
  </section>
</template>

<style scoped>
@import "./cms-content-page.css";
.facility-filter {
  display: grid;
  width: min(280px, 100%);
  gap: 6px;
  color: #334155;
  font-size: 0.84rem;
  font-weight: 800;
}
.facility-filter select {
  min-height: 38px;
  padding: 7px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font: inherit;
}
.facility-filter select:focus {
  border-color: #0ea5e9;
  outline: 3px solid rgba(14, 165, 233, 0.16);
}
</style>
