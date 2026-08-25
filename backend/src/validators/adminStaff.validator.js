const { sendError } = require("../utils/response.util");

function validateStaffIdParam(req, res, next) {
  const { id } = req.params;
  const numId = Number(id);

  if (!id || isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
    return sendError(res, 400, "Invalid Staff user ID format");
  }

  next();
}

function validateCreateStaffInput(req, res, next) {
  const { name, email, mobile, password } = req.body;
  const errors = [];

  if (!name || typeof name !== "string" || !name.trim()) {
    errors.push({ field: "name", message: "Name is required" });
  } else if (name.trim().length > 100) {
    errors.push({ field: "name", message: "Name must not exceed 100 characters" });
  }

  if (!email || typeof email !== "string" || !email.trim()) {
    errors.push({ field: "email", message: "Email is required" });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push({ field: "email", message: "Please enter a valid email address" });
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

  if (!password || typeof password !== "string" || !password.trim()) {
    errors.push({ field: "password", message: "Password is required" });
  } else if (password.length < 6) {
    errors.push({ field: "password", message: "Password must be at least 6 characters long" });
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation error", errors);
  }

  next();
}

function validateUpdateStaffInput(req, res, next) {
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
    errors.push({ field: "body", message: "At least one editable field (name, email, or mobile) must be provided" });
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation error", errors);
  }

  next();
}

function validateUpdateStaffStatusInput(req, res, next) {
  const { status } = req.body;
  const errors = [];

  if (!status || typeof status !== "string" || !status.trim()) {
    errors.push({ field: "status", message: "Status is required" });
  } else {
    const validStatuses = ["active", "inactive"];
    if (!validStatuses.includes(status.trim().toLowerCase())) {
      errors.push({ field: "status", message: "Status must be either 'active' or 'inactive'" });
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, "Validation error", errors);
  }

  next();
}

module.exports = {
  validateStaffIdParam,
  validateCreateStaffInput,
  validateUpdateStaffInput,
  validateUpdateStaffStatusInput,
};
