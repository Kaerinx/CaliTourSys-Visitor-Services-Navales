import { PRODUCT_OPTION_GROUPS } from './product.constants.js'

export const productModuleStatus = {
  moduleName: 'Tourism Product Development Program',
  currentPhase: 'Readiness, reports, and promotion handoff',
  scope:
    'Tourism asset management, product development planning, package creation, readiness review, reports, and promotion handoff are active.',
  roles: ['Tourism Staff', 'Tourism Officer', 'LGU Official', 'System Administrator'],
  options: PRODUCT_OPTION_GROUPS,
  plannedApiGroups: [
    '/api/assets',
    '/api/development-plans',
    '/api/packages',
    '/api/reports',
  ],
}
