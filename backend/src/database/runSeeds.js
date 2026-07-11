import { pathToFileURL } from 'node:url'

import { openDatabase } from './connection.js'
import { runMigrations } from './runMigrations.js'
import { seeds } from './seeds/index.js'

function isDirectRun() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
}

export function runSeeds(db) {
  runMigrations(db)

  const results = []

  for (const seed of seeds) {
    db.exec('BEGIN')
    try {
      const result = seed.run(db)
      db.exec('COMMIT')
      results.push({ name: seed.name, result })
    } catch (error) {
      db.exec('ROLLBACK')
      throw new Error(`Seed failed: ${seed.name}. ${error.message}`)
    }
  }

  return results
}

if (isDirectRun()) {
  const db = openDatabase()

  try {
    const results = runSeeds(db)
    console.log(`Database seeds complete. Seed groups: ${results.length}.`)
  } finally {
    db.close()
  }
}
