function isAtLeast18YearsOld(dobInput) {
  if (!dobInput) return false;
  const dob = new Date(dobInput);
  if (isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 18;
}

function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(trimmed);
}

function isValidPhoneNumber(phone) {
  if (!phone || typeof phone !== "string") return false;
  const clean = phone.trim().replace(/[\s\-()]/g, "");
  return /^[0-9]{10,15}$/.test(clean);
}

function validateCreateClientInput(data) {
  const errors = [];

  // 1. Client Name (Mandatory)
  if (!data.name || !data.name.toString().trim()) {
    errors.push({ field: "name", message: "Client name is required" });
  }

  // 2. Mobile Number (Mandatory)
  if (!data.mobile_no || !data.mobile_no.toString().trim()) {
    errors.push({ field: "mobile_no", message: "Mobile number is required" });
  } else if (!isValidPhoneNumber(data.mobile_no.toString())) {
    errors.push({ field: "mobile_no", message: "Please enter a valid mobile number." });
  }

  // 4. WhatsApp Number (Mandatory)
  if (!data.whatsapp_no || !data.whatsapp_no.toString().trim()) {
    errors.push({ field: "whatsapp_no", message: "WhatsApp number is required" });
  } else if (!isValidPhoneNumber(data.whatsapp_no.toString())) {
    errors.push({ field: "whatsapp_no", message: "Please enter a valid WhatsApp number." });
  }

  // 5. Email Address (Mandatory)
  if (!data.email || !data.email.toString().trim()) {
    errors.push({ field: "email", message: "Email address is required" });
  } else if (!isValidEmail(data.email.toString())) {
    errors.push({ field: "email", message: "Please enter a valid email address." });
  }

  // 6. PAN Number (Mandatory)
  if (!data.pan || !data.pan.toString().trim()) {
    errors.push({ field: "pan", message: "PAN number is required" });
  } else {
    const panClean = data.pan.toString().trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panClean)) {
      errors.push({ field: "pan", message: "Invalid PAN number format (e.g. ABCDE1234F)" });
    }
  }

  // 7. Date of Birth (Mandatory & 18+ years old)
  if (!data.dob || !data.dob.toString().trim()) {
    errors.push({ field: "dob", message: "Date of birth is required" });
  } else {
    const dobDate = new Date(data.dob);
    if (isNaN(dobDate.getTime())) {
      errors.push({ field: "dob", message: "Invalid date of birth format" });
    } else if (dobDate > new Date()) {
      errors.push({ field: "dob", message: "Date of birth cannot be in the future" });
    } else if (!isAtLeast18YearsOld(data.dob)) {
      errors.push({ field: "dob", message: "Client must be at least 18 years old." });
    }
  }

  // 8. Gender (Mandatory)
  if (!data.gender || !data.gender.toString().trim()) {
    errors.push({ field: "gender", message: "Gender is required" });
  } else {
    const validGenders = ["male", "female", "other"];
    if (!validGenders.includes(data.gender.toString().trim().toLowerCase())) {
      errors.push({ field: "gender", message: "Gender must be Male, Female, or Other" });
    }
  }

  // 9. Client Type ID (Defaults to 1 if not provided)
  if (!data.client_type_id) {
    data.client_type_id = 1;
  } else if (!Number.isInteger(Number(data.client_type_id)) || Number(data.client_type_id) <= 0) {
    errors.push({ field: "client_type_id", message: "Invalid client type ID" });
  }

  // 10. Status (Mandatory)
  if (!data.status || !data.status.toString().trim()) {
    errors.push({ field: "status", message: "Status is required" });
  } else {
    const validStatuses = ["active", "inactive"];
    if (!validStatuses.includes(data.status.toString().trim().toLowerCase())) {
      errors.push({ field: "status", message: "Status must be 'active' or 'inactive'" });
    }
  }

  // Handle is_client boolean flag if provided
  if (typeof data.is_client === "boolean") {
    data.client_status = data.is_client ? "CLIENT" : "NON_CLIENT";
  }

  // 11. Client Status (Optional - defaults to CLIENT)
  if (data.client_status !== undefined && data.client_status !== null && data.client_status.toString().trim()) {
    const validClientStatuses = ["client", "non_client"];
    if (!validClientStatuses.includes(data.client_status.toString().trim().toLowerCase())) {
      errors.push({ field: "client_status", message: "Client status must be 'CLIENT' or 'NON_CLIENT'" });
    }
  }

  // 12. Client Category (Optional - BRONZE, SILVER, GOLD, PLATINUM)
  if (data.client_category !== undefined && data.client_category !== null && data.client_category.toString().trim()) {
    const validCategories = ["bronze", "silver", "gold", "platinum"];
    if (!validCategories.includes(data.client_category.toString().trim().toLowerCase())) {
      errors.push({ field: "client_category", message: "Client category must be 'BRONZE', 'SILVER', 'GOLD', or 'PLATINUM'" });
    }
  }

  // 13. Address (Optional)
  if (data.address !== undefined && data.address !== null && typeof data.address !== "string") {
    errors.push({ field: "address", message: "Address must be a string" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateUpdateClientInput(data) {
  const errors = [];

  if (data.name !== undefined && !data.name.toString().trim()) {
    errors.push({ field: "name", message: "Client name cannot be empty" });
  }

  if (data.client_type_id !== undefined) {
    if (!Number.isInteger(Number(data.client_type_id)) || Number(data.client_type_id) <= 0) {
      errors.push({ field: "client_type_id", message: "Valid client_type_id is required" });
    }
  }

  if (data.email !== undefined) {
    if (!data.email || !data.email.toString().trim()) {
      errors.push({ field: "email", message: "Email address cannot be empty" });
    } else if (!isValidEmail(data.email.toString())) {
      errors.push({ field: "email", message: "Please enter a valid email address." });
    }
  }

  if (data.mobile_no !== undefined) {
    if (!data.mobile_no || !data.mobile_no.toString().trim()) {
      errors.push({ field: "mobile_no", message: "Mobile number cannot be empty" });
    } else if (!isValidPhoneNumber(data.mobile_no.toString())) {
      errors.push({ field: "mobile_no", message: "Please enter a valid mobile number." });
    }
  }

  if (data.whatsapp_no !== undefined) {
    if (!data.whatsapp_no || !data.whatsapp_no.toString().trim()) {
      errors.push({ field: "whatsapp_no", message: "WhatsApp number cannot be empty" });
    } else if (!isValidPhoneNumber(data.whatsapp_no.toString())) {
      errors.push({ field: "whatsapp_no", message: "Please enter a valid WhatsApp number." });
    }
  }

  if (data.pan !== undefined) {
    if (!data.pan || !data.pan.toString().trim()) {
      errors.push({ field: "pan", message: "PAN number cannot be empty" });
    } else {
      const panClean = data.pan.toString().trim().toUpperCase();
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panClean)) {
        errors.push({ field: "pan", message: "Invalid PAN number format (e.g. ABCDE1234F)" });
      }
    }
  }

  if (data.dob !== undefined) {
    if (!data.dob || !data.dob.toString().trim()) {
      errors.push({ field: "dob", message: "Date of birth cannot be empty" });
    } else {
      const dobDate = new Date(data.dob);
      if (isNaN(dobDate.getTime())) {
        errors.push({ field: "dob", message: "Invalid date of birth format" });
      } else if (dobDate > new Date()) {
        errors.push({ field: "dob", message: "Date of birth cannot be in the future" });
      } else if (!isAtLeast18YearsOld(data.dob)) {
        errors.push({ field: "dob", message: "Client must be at least 18 years old." });
      }
    }
  }

  if (data.gender !== undefined) {
    if (!data.gender || !data.gender.toString().trim()) {
      errors.push({ field: "gender", message: "Gender cannot be empty" });
    } else {
      const validGenders = ["male", "female", "other"];
      if (!validGenders.includes(data.gender.toString().trim().toLowerCase())) {
        errors.push({ field: "gender", message: "Gender must be Male, Female, or Other" });
      }
    }
  }

  if (data.status !== undefined && data.status.toString().trim()) {
    const validStatuses = ["active", "inactive"];
    if (!validStatuses.includes(data.status.toString().trim().toLowerCase())) {
      errors.push({ field: "status", message: "Status must be 'active' or 'inactive'" });
    }
  }

  // Handle is_client boolean flag if provided
  if (typeof data.is_client === "boolean") {
    data.client_status = data.is_client ? "CLIENT" : "NON_CLIENT";
  }

  if (data.client_status !== undefined && data.client_status !== null && data.client_status.toString().trim()) {
    const validClientStatuses = ["client", "non_client"];
    if (!validClientStatuses.includes(data.client_status.toString().trim().toLowerCase())) {
      errors.push({ field: "client_status", message: "Client status must be 'CLIENT' or 'NON_CLIENT'" });
    }
  }

  if (data.client_category !== undefined && data.client_category !== null && data.client_category.toString().trim()) {
    const validCategories = ["bronze", "silver", "gold", "platinum"];
    if (!validCategories.includes(data.client_category.toString().trim().toLowerCase())) {
      errors.push({ field: "client_category", message: "Client category must be 'BRONZE', 'SILVER', 'GOLD', or 'PLATINUM'" });
    }
  }

  if (data.address !== undefined && data.address !== null && typeof data.address !== "string") {
    errors.push({ field: "address", message: "Address must be a string" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateStatusInput(data) {
  const errors = [];
  if (!data || !data.status || !data.status.toString().trim()) {
    errors.push({ field: "status", message: "Status is required" });
  } else {
    const validStatuses = ["active", "inactive"];
    if (!validStatuses.includes(data.status.toString().trim().toLowerCase())) {
      errors.push({ field: "status", message: "Status must be 'active' or 'inactive'" });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  isAtLeast18YearsOld,
  isValidEmail,
  isValidPhoneNumber,
  validateCreateClientInput,
  validateUpdateClientInput,
  validateStatusInput,
};
