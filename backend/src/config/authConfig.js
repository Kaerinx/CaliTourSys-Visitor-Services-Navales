function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret || (isProduction && secret === "replace-with-a-long-random-secret")) {
    throw new Error("JWT_SECRET must be set to a strong secret before starting the API.");
  }

  return secret;
}

function assertProductionConfig() {
  getJwtSecret();
}

module.exports = { assertProductionConfig, getJwtSecret };
