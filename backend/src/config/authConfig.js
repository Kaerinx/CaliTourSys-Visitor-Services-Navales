const { env } = require("./env");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || env.JWT_ACCESS_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (
    !secret ||
    (isProduction &&
      ["replace-with-a-long-random-secret", "dev_only_change_me_to_a_long_random_secret_for_local_auth"].includes(
        secret
      ))
  ) {
    throw new Error("JWT_SECRET or JWT_ACCESS_SECRET must be set to a strong secret before starting the API.");
  }

  return secret;
}

function assertProductionConfig() {
  getJwtSecret();
}

module.exports = { assertProductionConfig, getJwtSecret };
