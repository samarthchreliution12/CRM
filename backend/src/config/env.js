const dotenv = require("dotenv");
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || (jwtSecret ? `${jwtSecret}_refresh` : null);

if (isProduction && (!jwtSecret || !jwtRefreshSecret)) {
  console.error("FATAL CONFIG ERROR: JWT_SECRET must be explicitly set in production environment.");
  process.exit(1);
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5050,
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: jwtSecret || "dev_jwt_access_secret_parshwa_consultancy_key_2026",
  jwtRefreshSecret: jwtRefreshSecret || "dev_jwt_refresh_secret_parshwa_consultancy_key_2026",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  enableSignup: process.env.ENABLE_SIGNUP === "true",
};
