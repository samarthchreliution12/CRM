/**
 * Sends a standardized success response.
 */
function sendSuccess(res, statusCode, message, data = null) {
  const response = {
    success: true,
    message,
  };
  if (data !== null) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
}

/**
 * Sends a standardized error response.
 */
function sendError(res, statusCode, message, errors = null) {
  const response = {
    success: false,
    message,
  };
  if (errors !== null) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
}

module.exports = {
  sendSuccess,
  sendError,
};
