const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../../config/authConfig");
const { verifyAccessToken } = require("../../utils/tokens");

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication token is required." });
  }

  try {
    req.user = normalizeAuthPayload(verifyAccreditationToken(token));
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: "You do not have permission to access this resource." });
    }
    return next();
  };
}

function verifyAccreditationToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (legacyError) {
    try {
      return verifyAccessToken(token);
    } catch {
      throw legacyError;
    }
  }
}

function normalizeAuthPayload(payload) {
  const roles = Array.isArray(payload.roles) ? payload.roles : [payload.role].filter(Boolean);
  const role = normalizeRole(payload.role || roles[0]);

  return {
    ...payload,
    id: payload.id || payload.sub,
    role,
    roles,
  };
}

function normalizeRole(role) {
  if (role === "system_admin") return "admin";
  if (role === "tourism_officer") return "tourism_staff";
  return role;
}

module.exports = { authenticate, authorize };
