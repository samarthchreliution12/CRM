const rateLimit = require("express-rate-limit");
const { sendError } = require("../utils/response.util");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 login attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 429, "Too many login attempts. Please try again after 15 minutes.");
  },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // limit each IP to 60 token refresh requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 429, "Too many session refresh requests. Please try again later.");
  },
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 429, "Too many password reset attempts. Please try again after 15 minutes.");
  },
});

module.exports = {
  loginLimiter,
  refreshLimiter,
  passwordResetLimiter,
};
