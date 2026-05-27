import createUsers from './001_create_users.js'
import createTourismAssets from './002_create_tourism_assets.js'
import createDevelopmentPlans from './003_create_development_plans.js'
import createImprovementRecords from './004_create_improvement_records.js'
import createTourismActivities from './005_create_tourism_activities.js'
import createTourismPackages from './006_create_tourism_packages.js'
import createStatusHistory from './007_create_status_history.js'
import addTourismPackageCategory from './008_add_tourism_package_category.js'

export const migrations = Object.freeze([
  createUsers,
  createTourismAssets,
  createDevelopmentPlans,
  createImprovementRecords,
  createTourismActivities,
  createTourismPackages,
  createStatusHistory,
  addTourismPackageCategory,
])
