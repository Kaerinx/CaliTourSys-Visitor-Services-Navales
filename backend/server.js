const app = require('./src/app')
const { env } = require('./src/config/env')
const { testDatabaseConnection, closeDatabasePool } = require('./src/config/db')

let server

async function startServer() {
  try {
    const database = await testDatabaseConnection()
    console.log(`PostgreSQL connection ready (${database.latencyMs}ms)`)

    server = app.listen(env.PORT, () => {
      console.log(`CaliTourSys API listening on port ${env.PORT}`)
      console.log(`Health: http://localhost:${env.PORT}/api/v1/health`)
    })
  } catch (error) {
    console.error('Failed to start CaliTourSys API', error)
    process.exit(1)
  }
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`)

  if (server) {
    server.close(async (error) => {
      if (error) {
        console.error('Error while closing HTTP server', error)
        process.exitCode = 1
      }

      try {
        await closeDatabasePool()
        console.log('Database pools closed')
      } catch (poolError) {
        console.error('Error while closing database pools', poolError)
        process.exitCode = 1
      } finally {
        process.exit()
      }
    })
  } else {
    try {
      await closeDatabasePool()
    } finally {
      process.exit()
    }
  }
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

startServer()
