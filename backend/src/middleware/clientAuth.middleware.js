const jwt = require("jsonwebtoken");
const config = require("../config/env");
const ClientModel = require("../models/client.model");
const ClientSessionModel = require("../models/clientSession.model");
const { sendError } = require("../utils/response.util");

/**
  * Client Portal Authentication Middleware.
  * Validates the client session token and attaches the authenticated client to req.client.
  * Ensures client authentication is logically and cryptographically isolated from Admin/Staff authentication.
  */
async function clientAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, 401, "Authentication token missing or invalid");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return sendError(res, 401, "Authentication token missing");
    }

    // 1. Verify JWT signature & expiration using clientJwtSecret
    let decoded;
    try {
      decoded = jwt.verify(token, config.clientJwtSecret);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return sendError(res, 401, "Session has expired. Please log in again.");
      }
      return sendError(res, 401, "Invalid client authentication token");
    }

    // 2. Verify token type matches CLIENT_PORTAL (prevents token domain cross-contamination)
    if (decoded.type !== "CLIENT_PORTAL" || !decoded.client_id) {
      return sendError(res, 401, "Invalid client session token format");
    }

    // 3. Verify session in client_sessions table (checks revoked_at & DB expiry)
    const session = await ClientSessionModel.findByToken(token);
    if (!session) {
      return sendError(res, 401, "Session not found or has been terminated. Please log in again.");
    }

    if (session.revoked_at) {
      return sendError(res, 401, "Session has been revoked. Please log in again.");
    }

    if (new Date(session.expires_at) <= new Date()) {
      return sendError(res, 401, "Session has expired. Please log in again.");
    }

    // 4. Retrieve client record from database
    const clientId = parseInt(decoded.client_id, 10);
    const client = await ClientModel.findById(clientId);

    if (!client) {
      return sendError(res, 401, "Client account no longer exists");
    }

    if (client.status !== "active") {
      return sendError(res, 403, "Your client account is inactive. Please contact support.");
    }

    // 5. Attach authenticated client & session to req (never trust client_id from query/body)
    req.client = client;
    req.clientSession = session;
    req.clientToken = token;

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  clientAuthMiddleware,
};
