import { getReportsSummary } from './reports.service.js'

export function getReports(req, res) {
  res.json({
    data: getReportsSummary(),
  })
}
