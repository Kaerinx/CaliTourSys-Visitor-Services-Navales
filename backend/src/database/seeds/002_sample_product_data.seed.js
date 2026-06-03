export const name = '002_sample_product_data'

const assets = Object.freeze([
  {
    id: 'AST-MANGROVE-SABANG',
    name: 'Calabanga Mangrove Eco Site',
    description:
      'A natural coastal area with potential for eco-tourism activities, environmental education, and guided mangrove tours.',
    location: 'Barangay Sabang',
    category: 'Natural',
    targetMarket: 'Eco-tourists, students, families',
    developmentStatus: 'Validated',
    remarks: 'Suitable for future eco-tourism package development.',
    createdBy: 'USR-OFFICER',
  },
  {
    id: 'AST-DRIED-FISH',
    name: 'Calabanga Dried Fish Product',
    description:
      'A local food product commonly sold in Calabanga and nearby municipalities, suitable for local product promotion.',
    location: 'Santa Salud',
    category: 'Cultural',
    targetMarket: 'Families, food tourists, local buyers',
    developmentStatus: 'For Review',
    remarks: 'Can be linked to local livelihood and product promotion activities.',
    createdBy: 'USR-STAFF',
  },
])

const developmentPlans = Object.freeze([
  {
    id: 'PLAN-MANGROVE-TOUR',
    assetId: 'AST-MANGROVE-SABANG',
    title: 'Mangrove Eco-Tour Readiness Plan',
    objectives:
      'Prepare the mangrove area for guided educational visits and responsible eco-tourism activities.',
    targetMarket: 'Eco-tourists, students, families',
    improvementNeeds:
      'Visitor briefing materials, trail safety review, guide assignment, and coordination with barangay stakeholders.',
    proposedActivities:
      'Orientation walk, mangrove conservation talk, photo stop, and basic visitor feedback collection.',
    timelineStart: '2026-06-01',
    timelineEnd: '2026-08-31',
    assignedPersonnel: 'Tourism Staff and Barangay Tourism Coordinator',
    status: 'Ongoing',
    remarks: 'Priority plan for tourism product readiness.',
    createdBy: 'USR-OFFICER',
  },
])

const improvements = Object.freeze([
  {
    id: 'IMP-MANGROVE-001',
    planId: 'PLAN-MANGROVE-TOUR',
    progressPercentage: 45,
    status: 'Ongoing',
    updateDate: '2026-06-15',
    remarks:
      'Initial coordination completed. Visitor briefing points and guide assignments are being prepared.',
    createdBy: 'USR-STAFF',
  },
])

const activities = Object.freeze([
  {
    id: 'ACT-MANGROVE-WALK',
    assetId: 'AST-MANGROVE-SABANG',
    planId: 'PLAN-MANGROVE-TOUR',
    name: 'Guided Mangrove Learning Walk',
    description:
      'A guided activity introducing visitors to mangrove conservation, coastal protection, and local stewardship.',
    duration: '1 hour',
    targetMarket: 'Students and eco-tourists',
    status: 'In Development',
    remarks: 'Activity content should be reviewed before promotion.',
    createdBy: 'USR-STAFF',
  },
])

function runInsert(statement, records, mapValues) {
  let changes = 0

  for (const record of records) {
    changes += statement.run(...mapValues(record)).changes
  }

  return changes
}

export function run(db) {
  const insertAsset = db.prepare(`
    INSERT OR IGNORE INTO tourism_assets (
      asset_id,
      asset_name,
      description,
      location,
      category,
      target_market,
      development_status,
      remarks,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertPlan = db.prepare(`
    INSERT OR IGNORE INTO development_plans (
      plan_id,
      asset_id,
      plan_title,
      objectives,
      target_market,
      improvement_needs,
      proposed_activities,
      timeline_start,
      timeline_end,
      assigned_personnel,
      plan_status,
      remarks,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertImprovement = db.prepare(`
    INSERT OR IGNORE INTO improvement_records (
      improvement_id,
      plan_id,
      progress_percentage,
      improvement_status,
      update_date,
      remarks,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const insertActivity = db.prepare(`
    INSERT OR IGNORE INTO tourism_activities (
      activity_id,
      asset_id,
      plan_id,
      activity_name,
      description,
      duration,
      target_market,
      activity_status,
      remarks,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  return {
    assets: runInsert(insertAsset, assets, (asset) => [
      asset.id,
      asset.name,
      asset.description,
      asset.location,
      asset.category,
      asset.targetMarket,
      asset.developmentStatus,
      asset.remarks,
      asset.createdBy,
    ]),
    developmentPlans: runInsert(insertPlan, developmentPlans, (plan) => [
      plan.id,
      plan.assetId,
      plan.title,
      plan.objectives,
      plan.targetMarket,
      plan.improvementNeeds,
      plan.proposedActivities,
      plan.timelineStart,
      plan.timelineEnd,
      plan.assignedPersonnel,
      plan.status,
      plan.remarks,
      plan.createdBy,
    ]),
    improvements: runInsert(insertImprovement, improvements, (improvement) => [
      improvement.id,
      improvement.planId,
      improvement.progressPercentage,
      improvement.status,
      improvement.updateDate,
      improvement.remarks,
      improvement.createdBy,
    ]),
    activities: runInsert(insertActivity, activities, (activity) => [
      activity.id,
      activity.assetId,
      activity.planId,
      activity.name,
      activity.description,
      activity.duration,
      activity.targetMarket,
      activity.status,
      activity.remarks,
      activity.createdBy,
    ]),
  }
}

export default { name, run }
