const ASSET_CATEGORIES = Object.freeze([
  'Natural',
  'Cultural',
  'Historical',
  'Recreational',
  'Agricultural',
  'Religious',
  'Other',
])

const ASSET_STATUSES = Object.freeze([
  'Draft',
  'Validated',
  'In Development',
  'For Review',
  'Ready for Promotion',
  'Archived',
])

const DEVELOPMENT_PLAN_STATUSES = Object.freeze([
  'Draft',
  'Ongoing',
  'Completed',
  'On Hold',
  'Archived',
])

const IMPROVEMENT_STATUSES = Object.freeze([
  'Not Started',
  'Ongoing',
  'Delayed',
  'Completed',
  'On Hold',
  'Archived',
])

const ACTIVITY_STATUSES = Object.freeze([
  'Draft',
  'In Development',
  'For Review',
  'Ready for Promotion',
  'Archived',
])

const PACKAGE_STATUSES = Object.freeze([
  'Draft',
  'In Development',
  'For Review',
  'Ready for Promotion',
  'Approved',
  'Published',
  'Archived',
])

const PUBLIC_PACKAGE_STATUSES = Object.freeze(['Ready for Promotion', 'Approved', 'Published'])

const PACKAGE_CATEGORIES = Object.freeze([
  'Faith & Heritage',
  'Coastal & Island',
  'Nature & Eco',
  'Agri-Tourism & Farm',
  'Food & Local Products',
])

const PACKAGE_ITEM_TYPES = Object.freeze(['Asset', 'Activity'])

const PRODUCT_OPTION_GROUPS = Object.freeze({
  assetCategories: ASSET_CATEGORIES,
  assetStatuses: ASSET_STATUSES,
  developmentPlanStatuses: DEVELOPMENT_PLAN_STATUSES,
  improvementStatuses: IMPROVEMENT_STATUSES,
  activityStatuses: ACTIVITY_STATUSES,
  packageStatuses: PACKAGE_STATUSES,
  packageCategories: PACKAGE_CATEGORIES,
  packageItemTypes: PACKAGE_ITEM_TYPES,
})

const productModuleStatus = Object.freeze({
  moduleName: 'Tourism Product Development Program',
  currentPhase: 'Readiness, reports, and promotion handoff',
  scope:
    'Tourism asset management, product development planning, improvement monitoring, tourism activity management, package creation, readiness review, status history, reports, and promotion handoff are active.',
  roles: ['Tourism Staff', 'Tourism Officer', 'LGU Official', 'System Administrator'],
  options: PRODUCT_OPTION_GROUPS,
  plannedApiGroups: [
    '/api/v1/assets',
    '/api/v1/development-plans',
    '/api/v1/improvements',
    '/api/v1/activities',
    '/api/v1/packages',
    '/api/v1/reports',
    '/api/v1/public/packages',
  ],
})

module.exports = {
  ACTIVITY_STATUSES,
  ASSET_CATEGORIES,
  ASSET_STATUSES,
  DEVELOPMENT_PLAN_STATUSES,
  IMPROVEMENT_STATUSES,
  PACKAGE_CATEGORIES,
  PACKAGE_ITEM_TYPES,
  PACKAGE_STATUSES,
  PRODUCT_OPTION_GROUPS,
  PUBLIC_PACKAGE_STATUSES,
  productModuleStatus,
}
