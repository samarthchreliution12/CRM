function validateReplaceRolePermissionsInput(data) {
  const errors = [];

  if (!data || !Array.isArray(data.permission_ids)) {
    errors.push({ field: "permission_ids", message: "permission_ids must be an array of permission IDs" });
  } else {
    for (const id of data.permission_ids) {
      if (!Number.isInteger(id) || id <= 0) {
        errors.push({ field: "permission_ids", message: `Invalid permission ID: ${id}` });
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateReplaceRolePermissionsInput,
};
