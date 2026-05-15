const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-env';

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      assigned_establishment_id: user.assigned_establishment_id || null,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  );
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this resource.' });
    }
    return next();
  };
}

module.exports = {
  authenticate,
  authorize,
  signToken,
};
