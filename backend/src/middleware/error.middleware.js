const { sendError } = require("../utils/response.util");

function errorHandler(err, req, res, next) {
  // Handle Multer errors (file size limit, invalid format, etc.)
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, 400, "File size exceeds maximum allowed limit of 10MB.");
    }
    return sendError(res, 400, err.message);
  }

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
