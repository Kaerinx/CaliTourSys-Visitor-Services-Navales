import { getProductModuleStatus } from './product.service.js'

export function getStatus(req, res) {
  res.json(getProductModuleStatus())
}
