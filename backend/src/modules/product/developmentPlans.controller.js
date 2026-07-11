import {
  archiveProductDevelopmentPlan,
  createProductDevelopmentPlan,
  getDevelopmentPlanOptions,
  getProductDevelopmentPlan,
  listProductDevelopmentPlans,
  updateProductDevelopmentPlan,
} from './developmentPlans.service.js'

export function listDevelopmentPlans(req, res) {
  const plans = listProductDevelopmentPlans(req.query)

  res.json({
    data: plans,
    meta: {
      total: plans.length,
      options: getDevelopmentPlanOptions(),
    },
  })
}

export function getDevelopmentPlan(req, res) {
  res.json({
    data: getProductDevelopmentPlan(req.params.planId),
  })
}

export function createDevelopmentPlan(req, res) {
  const plan = createProductDevelopmentPlan(req.body, req.user)

  res.status(201).json({
    data: plan,
    message: 'Development plan created successfully.',
  })
}

export function updateDevelopmentPlan(req, res) {
  const plan = updateProductDevelopmentPlan(req.params.planId, req.body)

  res.json({
    data: plan,
    message: 'Development plan updated successfully.',
  })
}

export function archiveDevelopmentPlan(req, res) {
  const plan = archiveProductDevelopmentPlan(req.params.planId)

  res.json({
    data: plan,
    message: 'Development plan archived successfully.',
  })
}
