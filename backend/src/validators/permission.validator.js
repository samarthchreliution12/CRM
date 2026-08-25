function validateCreatePermissionInput(data) {
  const errors = [];
  const name = data.name || data.permission_key;

  if (!name || !name.trim()) {
    errors.push({ field: "name", message: "Permission name is required" });
  } else {
    const keyTrimmed = name.trim().toLowerCase();
    const keyRegex = /^[a-z0-9_]+\.[a-z0-9_]+$/;
    if (!keyRegex.test(keyTrimmed)) {
      errors.push({ field: "name", message: "Permission name must follow format 'module.action' (e.g. client.view)" });
    }
  }

  if (!data.module || !data.module.trim()) {
    errors.push({ field: "module", message: "Module is required" });
  }

  if (!data.action || !data.action.trim()) {
    errors.push({ field: "action", message: "Action is required" });
  }

  if (!data.description || !data.description.trim()) {
    errors.push({ field: "description", message: "Description is required" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateUpdatePermissionInput(data) {
  const errors = [];
  const name = data.name || data.permission_key;

  if (name !== undefined) {
    if (!name.trim()) {
      errors.push({ field: "name", message: "Permission name cannot be empty" });
    } else {
      const keyRegex = /^[a-z0-9_]+\.[a-z0-9_]+$/;
      if (!keyRegex.test(name.trim().toLowerCase())) {
        errors.push({ field: "name", message: "Permission name must follow format 'module.action' (e.g. client.view)" });
      }
    }
  }

  if (data.module !== undefined && !data.module.trim()) {
    errors.push({ field: "module", message: "Module cannot be empty" });
  }

  if (data.action !== undefined && !data.action.trim()) {
    errors.push({ field: "action", message: "Action cannot be empty" });
  }

  if (data.description !== undefined && !data.description.trim()) {
    errors.push({ field: "description", message: "Description cannot be empty" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateCreatePermissionInput,
  validateUpdatePermissionInput,
};
