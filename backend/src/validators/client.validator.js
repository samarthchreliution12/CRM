function validateCreateClientInput(data) {
  const errors = [];

  if (!data.name || !data.name.trim()) {
    errors.push({ field: "name", message: "Client name is required" });
  }

  if (!data.ucc_no || !data.ucc_no.trim()) {
    errors.push({ field: "ucc_no", message: "UCC number is required" });
  }

  if (!data.client_type_id || !Number.isInteger(Number(data.client_type_id)) || Number(data.client_type_id) <= 0) {
    errors.push({ field: "client_type_id", message: "Valid client_type_id is required" });
  }

  if (data.email && data.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push({ field: "email", message: "Invalid email format" });
    }
  }

  if (data.mobile_no && data.mobile_no.trim()) {
    const mobileClean = data.mobile_no.trim().replace(/[\s\-()]/g, "");
    const mobileRegex = /^[0-9]{10,15}$/;
    if (!mobileRegex.test(mobileClean)) {
      errors.push({ field: "mobile_no", message: "Invalid mobile number format" });
    }
  }

  if (data.whatsapp_no && data.whatsapp_no.trim()) {
    const whatsappClean = data.whatsapp_no.trim().replace(/[\s\-()]/g, "");
    const mobileRegex = /^[0-9]{10,15}$/;
    if (!mobileRegex.test(whatsappClean)) {
      errors.push({ field: "whatsapp_no", message: "Invalid WhatsApp number format" });
    }
  }

  // PAN is MANDATORY for Client creation
  if (!data.pan || !data.pan.toString().trim()) {
    errors.push({ field: "pan", message: "PAN number is required to create a client" });
  } else {
    const panClean = data.pan.toString().trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panClean)) {
      errors.push({ field: "pan", message: "Invalid PAN number format (e.g. ABCDE1234F)" });
    }
  }

  // DOB is MANDATORY for Client creation
  if (!data.dob || !data.dob.toString().trim()) {
    errors.push({ field: "dob", message: "Date of birth (dob) is required to create a client" });
  } else {
    const dobDate = new Date(data.dob);
    if (isNaN(dobDate.getTime())) {
      errors.push({ field: "dob", message: "Invalid date of birth format" });
    } else {
      const today = new Date();
      if (dobDate > today) {
        errors.push({ field: "dob", message: "Date of birth cannot be in the future" });
      }
    }
  }

  if (data.status && data.status.trim()) {
    const validStatuses = ["active", "inactive"];
    if (!validStatuses.includes(data.status.trim().toLowerCase())) {
      errors.push({ field: "status", message: "Status must be 'active' or 'inactive'" });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateUpdateClientInput(data) {
  const errors = [];

  if (data.name !== undefined && !data.name.trim()) {
    errors.push({ field: "name", message: "Client name cannot be empty" });
  }

  if (data.ucc_no !== undefined && !data.ucc_no.trim()) {
    errors.push({ field: "ucc_no", message: "UCC number cannot be empty" });
  }

  if (data.client_type_id !== undefined) {
    if (!Number.isInteger(Number(data.client_type_id)) || Number(data.client_type_id) <= 0) {
      errors.push({ field: "client_type_id", message: "Valid client_type_id is required" });
    }
  }

  if (data.email !== undefined && data.email && data.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push({ field: "email", message: "Invalid email format" });
    }
  }

  if (data.mobile_no !== undefined && data.mobile_no && data.mobile_no.trim()) {
    const mobileClean = data.mobile_no.trim().replace(/[\s\-()]/g, "");
    const mobileRegex = /^[0-9]{10,15}$/;
    if (!mobileRegex.test(mobileClean)) {
      errors.push({ field: "mobile_no", message: "Invalid mobile number format" });
    }
  }

  if (data.whatsapp_no !== undefined && data.whatsapp_no && data.whatsapp_no.trim()) {
    const whatsappClean = data.whatsapp_no.trim().replace(/[\s\-()]/g, "");
    const mobileRegex = /^[0-9]{10,15}$/;
    if (!mobileRegex.test(whatsappClean)) {
      errors.push({ field: "whatsapp_no", message: "Invalid WhatsApp number format" });
    }
  }

  if (data.pan !== undefined && data.pan && data.pan.trim()) {
    const panClean = data.pan.trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panClean)) {
      errors.push({ field: "pan", message: "Invalid PAN number format (e.g. ABCDE1234F)" });
    }
  }

  if (data.status !== undefined && data.status.trim()) {
    const validStatuses = ["active", "inactive"];
    if (!validStatuses.includes(data.status.trim().toLowerCase())) {
      errors.push({ field: "status", message: "Status must be 'active' or 'inactive'" });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateStatusInput(data) {
  const errors = [];
  if (!data || !data.status || !data.status.trim()) {
    errors.push({ field: "status", message: "Status is required" });
  } else {
    const validStatuses = ["active", "inactive"];
    if (!validStatuses.includes(data.status.trim().toLowerCase())) {
      errors.push({ field: "status", message: "Status must be 'active' or 'inactive'" });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateCreateClientInput,
  validateUpdateClientInput,
  validateStatusInput,
};
