const jwt = require("jsonwebtoken");
const config = require("../config/env");
const UserModel = require("../models/user.model");
const { sendError } = require("../utils/response.util");


async function checkSignupEnabled(req, res, next) {
  // If authorization header is provided, optionally attach authenticated user
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        const userId = decoded.id || decoded.user_id;
        const user = await UserModel.findByIdWithRoleAndPermissions(userId);
        if (user && user.status === "active") {
          req.user = user;
        }
      } catch (err) {
        // Soft fail if token is invalid or expired
      }
    }
  }

  const isAdmin = req.user && req.user.role && req.user.role.name === "Admin";
  if (config.enableSignup || isAdmin) {
    return next();
  }

  return sendError(res, 403, "Signup is currently disabled.");
}

module.exports = {
  checkSignupEnabled,
};
