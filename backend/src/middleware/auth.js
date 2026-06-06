const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'local-dev-secret'
const ROLES = Object.freeze({
  TOURISM_STAFF: 'Tourism Staff',
  TOURISM_OFFICER: 'Tourism Officer',
  LGU_OFFICIAL: 'LGU Official',
  SYSTEM_ADMINISTRATOR: 'System Administrator',
})

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      assigned_establishment_id: user.assigned_establishment_id || null,
      status: user.status || 'active',
      is_active: user.is_active ?? 1,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  )
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' })
  }

  try {
    const user = jwt.verify(token, JWT_SECRET)
    const inactive = user.status === 'inactive' || Number(user.is_active) === 0
    if (inactive) {
      return res.status(403).json({
        message: 'Your account has been deactivated. Please contact the system administrator.',
      })
    }

    req.user = user
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this resource.' })
    }

    return next()
  }
}

module.exports = {
  ROLES,
  authenticate,
  authorize,
  signToken,
}
