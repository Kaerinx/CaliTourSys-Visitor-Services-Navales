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
  'Ready for Promotion',
  'Archived',
])

export const PACKAGE_BASE_CATEGORIES = Object.freeze([
  'Nature',
  'Cultural',
  'Food',
  'Events',
])

export const PACKAGE_CATEGORIES = Object.freeze([
  ...PACKAGE_BASE_CATEGORIES,
  'Nature and Cultural',
  'Nature and Food',
  'Nature and Events',
  'Cultural and Food',
  'Cultural and Events',
  'Food and Events',
])

export const PACKAGE_ITEM_TYPES = Object.freeze(['Plan', 'Asset'])

export const TOURISM_TARGET_MARKETS = Object.freeze([
  'Local tourist',
  'Domestic tourist',
  'International tourist',
  'Students',
  'Families',
  'Adventure travelers',
  'Cultural tourist',
])

export const PACKAGE_TARGET_MARKETS = Object.freeze([...TOURISM_TARGET_MARKETS])

export const PACKAGE_DURATIONS = Object.freeze([
  '2 hours',
  'Half day',
  'Full day',
  '2 days and 1 night',
  '3 days and 2 nights',
])
