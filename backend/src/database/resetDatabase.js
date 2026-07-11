import { openDatabase } from './connection.js'
import { runMigrations } from './runMigrations.js'
import { runSeeds } from './runSeeds.js'

if (process.env.CONFIRM_DB_RESET !== 'YES') {
  console.error(
    'Database reset was blocked. Set CONFIRM_DB_RESET=YES before running this command because it deletes local SQLite data.',
  )
  process.exit(1)
}

const db = openDatabase()

try {
  db.exec(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS package_items;
    DROP TABLE IF EXISTS status_history;
    DROP TABLE IF EXISTS tourism_packages;
    DROP TABLE IF EXISTS tourism_activities;
    DROP TABLE IF EXISTS improvement_records;
    DROP TABLE IF EXISTS development_plans;
    DROP TABLE IF EXISTS tourism_assets;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS schema_migrations;
    PRAGMA foreign_keys = ON;
  `)

  const migrations = runMigrations(db)
  const seeds = runSeeds(db)

  console.log(
    `Database reset complete. Applied migrations: ${migrations.applied.length}. Seed groups: ${seeds.length}.`,
  )
} finally {
  db.close()
}
