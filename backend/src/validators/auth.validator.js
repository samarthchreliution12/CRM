const { sendError } = require("../utils/response.util");

function validateLoginInput(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== "string" || !email.trim()) {
    errors.push({ field: "email", message: "Email is required" });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push({ field: "email", message: "Please enter a valid email address" });
    }
  }

  if (!password || typeof password !== "string" || !password.trim()) {
    errors.push({ field: "password", message: "Password is required" });
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation error", errors);
  }

  next();
}

function validateSignupInput(req, res, next) {
  const { name, email, password, mobile, role_id } = req.body;
  const errors = [];

  if (!name || typeof name !== "string" || !name.trim()) {
    errors.push({ field: "name", message: "Name is required" });
  }

  if (!email || typeof email !== "string" || !email.trim()) {
    errors.push({ field: "email", message: "Email is required" });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push({ field: "email", message: "Please enter a valid email address" });
    }
  }

  if (!password || typeof password !== "string" || !password.trim()) {
    errors.push({ field: "password", message: "Password is required" });
  } else if (password.length < 6) {
    errors.push({ field: "password", message: "Password must be at least 6 characters long" });
  }

  if (mobile && (typeof mobile !== "string" || !/^\+?[0-9\s\-()]{7,20}$/.test(mobile.trim()))) {
    errors.push({ field: "mobile", message: "Please enter a valid mobile number" });
  }

  if (role_id === undefined || role_id === null || isNaN(Number(role_id))) {
    errors.push({ field: "role_id", message: "Valid role ID is required" });
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation error", errors);
  }

  next();
}

function validateForgotPasswordInput(req, res, next) {
  const { email } = req.body;
  const errors = [];

  if (!email || typeof email !== "string" || !email.trim()) {
    errors.push({ field: "email", message: "Email is required" });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push({ field: "email", message: "Please enter a valid email address" });
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation error", errors);
  }

  next();
}

function validateResetPasswordInput(req, res, next) {
  const { token, password, confirm_password } = req.body;
  const errors = [];

  if (!token || typeof token !== "string" || !token.trim()) {
    errors.push({ field: "token", message: "Password reset token is required" });
  }

  if (!password || typeof password !== "string" || !password.trim()) {
    errors.push({ field: "password", message: "New password is required" });
  } else if (password.length < 6) {
    errors.push({ field: "password", message: "Password must be at least 6 characters long" });
  }

  if (!confirm_password || typeof confirm_password !== "string" || !confirm_password.trim()) {
    errors.push({ field: "confirm_password", message: "Confirmation password is required" });
  }

  if (password && confirm_password && password !== confirm_password) {
    errors.push({ field: "confirm_password", message: "Password and confirmation password do not match" });
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation error", errors);
  }

  next();
}

function validateUpdateProfileInput(req, res, next) {
  const { name, email, mobile } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      errors.push({ field: "name", message: "Name cannot be empty" });
    } else if (name.trim().length > 100) {
      errors.push({ field: "name", message: "Name must not exceed 100 characters" });
    }
  }

  if (email !== undefined) {
    if (typeof email !== "string" || !email.trim()) {
      errors.push({ field: "email", message: "Email cannot be empty" });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push({ field: "email", message: "Please enter a valid email address" });
      }
    }
  }

  if (mobile !== undefined && mobile !== null && mobile !== "") {
    if (typeof mobile !== "string") {
      errors.push({ field: "mobile", message: "Please enter a valid 10-digit mobile number" });
    } else {
      const mobileClean = mobile.trim().replace(/[\s\-()]/g, "");
      if (!/^[0-9]{10}$/.test(mobileClean)) {
        errors.push({ field: "mobile", message: "Please enter a valid 10-digit mobile number" });
      }
    }
  }

  if (name === undefined && email === undefined && mobile === undefined) {
    errors.push({ field: "body", message: "At least one editable profile field (name, email, or mobile) must be provided" });
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation error", errors);
  }

  next();
}

module.exports = {
  validateLoginInput,
  validateSignupInput,
  validateForgotPasswordInput,
  validateResetPasswordInput,
  validateUpdateProfileInput,
};
