const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT || 5050,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || "default_jwt_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  enableSignup: process.env.ENABLE_SIGNUP === "true",
};
