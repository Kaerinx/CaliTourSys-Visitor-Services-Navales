function createForbiddenError(message = 'You do not have permission to perform this action.') {
  const error = new Error(message)
  error.statusCode = 403
  error.code = 'FORBIDDEN'
  error.publicMessage = message
  return error
}

function authorize(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('Authentication is required.')
      error.statusCode = 401
      error.code = 'UNAUTHENTICATED'
      error.publicMessage = 'Authentication is required.'
      return next(error)
    }

    const permissions = new Set(req.user.permissions || [])
    const hasPermission = requiredPermissions.every((permission) => permissions.has(permission))

    if (!hasPermission) {
      return next(createForbiddenError())
    }

    return next()
  }
}

module.exports = { authorize }

