import dotenv from 'dotenv'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

dotenv.config()

export const databasePath = resolve(process.cwd(), process.env.SQLITE_DB_PATH || './data/calitoursys.sqlite')

export function openDatabase() {
  mkdirSync(dirname(databasePath), { recursive: true })

  const db = new DatabaseSync(databasePath)
  db.exec('PRAGMA foreign_keys = ON')

  return db
}
