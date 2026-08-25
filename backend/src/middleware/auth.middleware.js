const jwt = require("jsonwebtoken");
const config = require("../config/env");
const UserModel = require("../models/user.model");
const { sendError } = require("../utils/response.util");

/**
 * Authentication middleware to verify JWT Bearer token and attach authenticated user to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, 401, "Authentication token missing or invalid");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return sendError(res, 401, "Authentication token missing");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return sendError(res, 401, "Token has expired. Please log in again.");
      }
      return sendError(res, 401, "Invalid authentication token");
    }

    const userId = decoded.id || decoded.user_id;
    const user = await UserModel.findByIdWithRoleAndPermissions(userId);

    if (!user) {
      return sendError(res, 401, "User account no longer exists");
    }

    if (user.status !== "active") {
      return sendError(res, 403, "Your account is inactive. Please contact an administrator.");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authorization middleware to check if user has one of the allowed roles.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 401, "Authentication required");
    }

    const userRole = req.user.role.name;
    if (!allowedRoles.includes(userRole)) {
      return sendError(res, 403, "Forbidden: You do not have permission to access this resource");
    }

    next();
  };
}

/**
 * Authorization middleware to check if user has required permission(s).
 */
function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return sendError(res, 401, "Authentication required");
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      return sendError(res, 403, "Forbidden: Required permission missing");
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  requirePermission,
};
