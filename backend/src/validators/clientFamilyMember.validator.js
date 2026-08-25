function validateCreateFamilyMemberInput(data) {
  const errors = [];

  if (!data.relationship || !data.relationship.trim()) {
    errors.push({ field: "relationship", message: "Relationship is required" });
  }

  if (!data.name || !data.name.trim()) {
    errors.push({ field: "name", message: "Family member name is required" });
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

  if (data.pan_no && data.pan_no.trim()) {
    const panClean = data.pan_no.trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panClean)) {
      errors.push({ field: "pan_no", message: "Invalid PAN number format (e.g. ABCDE1234F)" });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateUpdateFamilyMemberInput(data) {
  const errors = [];

  if (data.relationship !== undefined && !data.relationship.trim()) {
    errors.push({ field: "relationship", message: "Relationship cannot be empty" });
  }

  if (data.name !== undefined && !data.name.trim()) {
    errors.push({ field: "name", message: "Family member name cannot be empty" });
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

  if (data.pan_no !== undefined && data.pan_no && data.pan_no.trim()) {
    const panClean = data.pan_no.trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panClean)) {
      errors.push({ field: "pan_no", message: "Invalid PAN number format (e.g. ABCDE1234F)" });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateCreateFamilyMemberInput,
  validateUpdateFamilyMemberInput,
};
