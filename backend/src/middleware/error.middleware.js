const { sendError } = require("../utils/response.util");

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";

  // Log 500 server errors or unexpected errors
  if (statusCode >= 500) {
    console.error("Internal Server Error:", err);
  }

  // Hide internal database / unexpected details in production
  if (statusCode === 500 && process.env.NODE_ENV === "production") {
    message = "An unexpected server error occurred";
  }

  return sendError(res, statusCode, message, err.errors || null);
}

module.exports = errorHandler;
