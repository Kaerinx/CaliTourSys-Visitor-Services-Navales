export const ASSET_CATEGORIES = Object.freeze([
  'Nature',
  'Cultural',
  'Food',
  'Events',
])

export const ASSET_STATUSES = Object.freeze([
  'Draft',
  'Archived',
])

export const DEVELOPMENT_PLAN_STATUSES = Object.freeze([
  'Draft',
  'Archived',
])

export const IMPROVEMENT_STATUSES = Object.freeze([
  'Not Started',
  'Ongoing',
  'Delayed',
  'Completed',
  'On Hold',
  'Archived',
])

export const ACTIVITY_STATUSES = Object.freeze([
  'Draft',
  'In Development',
  'For Review',
  'Ready for Promotion',
  'Archived',
])

export const PACKAGE_STATUSES = Object.freeze([
  'Draft',
  'In Development',
  'For Review',
  'Ready for Promotion',
  'Archived',
])

export const PACKAGE_CATEGORIES = Object.freeze([
  'Nature',
  'Cultural',
  'Food',
  'Events',
  'Nature and Cultural',
  'Nature and Food',
  'Nature and Events',
  'Cultural and Food',
  'Cultural and Events',
  'Food and Events',
])

export const PACKAGE_ITEM_TYPES = Object.freeze(['Asset'])

export const PRODUCT_OPTION_GROUPS = Object.freeze({
  assetCategories: ASSET_CATEGORIES,
  assetStatuses: ASSET_STATUSES,
  developmentPlanStatuses: DEVELOPMENT_PLAN_STATUSES,
  packageStatuses: PACKAGE_STATUSES,
  packageCategories: PACKAGE_CATEGORIES,
  packageItemTypes: PACKAGE_ITEM_TYPES,
})
