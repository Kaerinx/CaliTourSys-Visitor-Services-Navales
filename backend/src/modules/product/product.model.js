import { PRODUCT_OPTION_GROUPS } from './product.constants.js'

export const productModuleStatus = {
  moduleName: 'Tourism Product Development Program',
  currentPhase: 'Readiness, reports, and promotion handoff',
  scope:
    'Tourism asset management, product development planning, improvement monitoring, tourism activity management, package creation, readiness review, status history, reports, and promotion handoff are active.',
  roles: ['Tourism Staff', 'Tourism Officer', 'LGU Official', 'System Administrator'],
  options: PRODUCT_OPTION_GROUPS,
  plannedApiGroups: [
    '/api/assets',
    '/api/development-plans',
    '/api/improvements',
    '/api/activities',
    '/api/packages',
    '/api/reports',
    '/api/status-history',
  ],
}
