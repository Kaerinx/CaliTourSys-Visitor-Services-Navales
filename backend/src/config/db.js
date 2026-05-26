const { Pool } = require('pg')
const { env } = require('./env')

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error', error)
})

function query(text, params) {
  return pool.query(text, params)
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
  await pool.end()
}

module.exports = {
  pool,
  query,
  testDatabaseConnection,
  closeDatabasePool,
}
