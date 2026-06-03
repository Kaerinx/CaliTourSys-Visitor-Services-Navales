import { randomUUID } from 'node:crypto'

import { getDatabase } from '../../config/db.js'

function mapStatusHistory(row) {
  if (!row) {
    return null
  }

  return {
    id: row.history_id,
    recordType: row.record_type,
    recordId: row.record_id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    changedBy: row.changed_by,
    changedByRole: row.changed_by_role,
    changedByName: row.changed_by_name,
    remarks: row.remarks || '',
    changedAt: row.changed_at,
  }
}

export function createStatusHistoryEntry({
  recordType,
  recordId,
  previousStatus,
  newStatus,
  user,
  remarks,
}) {
  const db = getDatabase()
  const historyId = randomUUID()

  db.prepare(
    `
      INSERT INTO status_history (
        history_id,
        record_type,
        record_id,
        previous_status,
        new_status,
        changed_by,
        changed_by_role,
        changed_by_name,
        remarks
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    historyId,
    recordType,
    recordId,
    previousStatus,
    newStatus,
    user?.id || null,
    user?.role || '',
    user?.fullName || '',
    remarks || '',
  )

  return findStatusHistoryById(historyId)
}

export function findStatusHistoryById(historyId) {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM status_history WHERE history_id = ?').get(historyId)

  return mapStatusHistory(row)
}

export function findStatusHistoryForRecord(recordType, recordId) {
  const db = getDatabase()
  const rows = db
    .prepare(
      `
        SELECT *
        FROM status_history
        WHERE record_type = ? AND record_id = ?
        ORDER BY changed_at DESC
      `,
    )
    .all(recordType, recordId)

  return rows.map(mapStatusHistory)
}
