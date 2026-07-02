const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const pinoHttp = require('pino-http')
const cookieParser = require('cookie-parser')
const path = require('path')
const { env } = require('./config/env')
const routes = require('./routes')
const { requestId } = require('./middleware/requestId')
const { notFound } = require('./middleware/notFound')
const { errorHandler } = require('./middleware/errorHandler')

const app = express()

function isLocalDevOrigin(origin) {
  if (env.IS_PRODUCTION) return false

  try {
    const { hostname, protocol } = new URL(origin)
    return (
      protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(hostname)
    )
  } catch (_error) {
    return false
  }
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGINS.includes(origin) || isLocalDevOrigin(origin)) {
      return callback(null, true)
    }

    const error = new Error('CORS origin is not allowed')
    error.statusCode = 403
    error.code = 'CORS_NOT_ALLOWED'
    error.publicMessage = 'CORS origin is not allowed.'

    return callback(error)
  },
  credentials: true,
}

app.disable('x-powered-by')
app.set('trust proxy', env.IS_PRODUCTION ? 1 : false)

app.use(requestId)
app.use(
  pinoHttp({
    genReqId: (req) => req.id,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  }),
)
app.use(helmet())
app.use(cors(corsOptions))
app.use(compression())
app.use(cookieParser())
app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }))
app.use(express.urlencoded({ extended: false, limit: env.REQUEST_BODY_LIMIT }))
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads'), {
  setHeaders(res) {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  },
}))

app.use('/api/v1', routes)

app.use(notFound)
app.use(errorHandler)

module.exports = app
