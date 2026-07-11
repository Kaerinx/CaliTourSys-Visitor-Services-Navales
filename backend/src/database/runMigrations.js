import { pathToFileURL } from 'node:url'

import { openDatabase } from './connection.js'
import { migrations } from './migrations/index.js'

function isDirectRun() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
}

function ensureMigrationTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

export function runMigrations(db) {
  ensureMigrationTable(db)

  const appliedMigrationNames = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM schema_migrations
          ORDER BY id ASC
        `,
      )
      .all()
      .map((row) => row.name),
  )
  const insertMigration = db.prepare('INSERT INTO schema_migrations (name) VALUES (?)')
  const applied = []
  const skipped = []

  for (const migration of migrations) {
    if (appliedMigrationNames.has(migration.name)) {
      skipped.push(migration.name)
      continue
    }

    db.exec('BEGIN')
    try {
      migration.up(db)
      insertMigration.run(migration.name)
      db.exec('COMMIT')
      applied.push(migration.name)
    } catch (error) {
      db.exec('ROLLBACK')
      throw new Error(`Migration failed: ${migration.name}. ${error.message}`)
    }
  }

  return { applied, skipped }
}

if (isDirectRun()) {
  const db = openDatabase()

  try {
    const result = runMigrations(db)
    console.log(
      `Database migrations complete. Applied: ${result.applied.length}. Skipped: ${result.skipped.length}.`,
    )
  } finally {
    db.close()
  }
}
