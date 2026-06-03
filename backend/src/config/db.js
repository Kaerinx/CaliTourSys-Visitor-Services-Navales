const { Pool } = require('pg')
const mysql = require('mysql2/promise')
const { env } = require('./env')

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

const legacyPool = mysql.createPool({
  host: process.env.VISITOR_DB_HOST || process.env.DB_HOST || 'localhost',
  port: Number(process.env.VISITOR_DB_PORT || process.env.DB_PORT || 3306),
  user: process.env.VISITOR_DB_USER || process.env.DB_USER || 'root',
  password: process.env.VISITOR_DB_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.VISITOR_DB_NAME || process.env.DB_NAME || 'calitoursys',
  waitForConnections: true,
  connectionLimit: Number(process.env.VISITOR_DB_CONNECTION_LIMIT || process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  namedPlaceholders: true,
})

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error', error)
})

legacyPool.on?.('error', (error) => {
  console.error('Unexpected Visitor Services MySQL pool error', error)
})

function query(text, params) {
  return pool.query(text, params)
}

async function legacyQuery(sql, params = {}) {
  const [rows] = await legacyPool.execute(sql, params)
  return rows
}

async function legacyTransaction(callback) {
  const connection = await legacyPool.getConnection()
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

async function testDatabaseConnection() {
  const startedAt = Date.now()
  const result = await query('SELECT 1 AS ok')

  return {
    connected: result.rows[0]?.ok === 1,
    latencyMs: Date.now() - startedAt,
  }
}

async function closeDatabasePool() {
  await Promise.allSettled([pool.end(), legacyPool.end()])
}

module.exports = {
  pool,
  query,
  legacyPool,
  legacyQuery,
  legacyTransaction,
  testDatabaseConnection,
  closeDatabasePool,
}
