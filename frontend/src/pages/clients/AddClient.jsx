import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import ClientService from "../../services/client.service";
import useAuth from "../../hooks/useAuth";
import { ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import "./AddClient.css";

const AddClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isEditMode = Boolean(id);

  // Form State
  const [formData, setFormData] = useState({
    ucc_no: "",
    name: "",
    business_name: "",
    mobile_no: "",
    same_as_whatsapp: false,
    whatsapp_no: "",
    email: "",
    pan: "",
    dob: "",
    gender: "",
    occupation: "",
    client_type_id: "",
    status: "active",
    service_ids: [],
  });

  // Dynamic API Options State
  const [clientTypes, setClientTypes] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);

  // Form Submission & Validation State
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Client Types & Client Services dynamically from real backend APIs
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        setLoadingConfig(true);
        setConfigError("");

        const [typesRes, servicesRes] = await Promise.all([
          ClientService.getClientTypes(token),
          ClientService.getClientServices(token),
        ]);

        if (isMounted) {
          if (typesRes && typesRes.data && typesRes.data.client_types) {
            setClientTypes(typesRes.data.client_types);
          }
          if (servicesRes && servicesRes.data && servicesRes.data.client_services) {
            setAvailableServices(servicesRes.data.client_services);
          }
        }
      } catch (err) {
        if (isMounted) {
          setConfigError(err.message || "Failed to load client types and services from server.");
        }
      } finally {
        if (isMounted) {
          setLoadingConfig(false);
        }
      }
    };

    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Preload Client details if in Edit Mode
  useEffect(() => {
    if (!isEditMode) return;
    let isMounted = true;

    const fetchClient = async () => {
      try {
        setLoadingInitial(true);
        const res = await ClientService.getClient(id, token);
        if (isMounted && res && res.data && res.data.client) {
          const c = res.data.client;
          let dobFormatted = "";
          if (c.dob) {
            dobFormatted = new Date(c.dob).toISOString().split("T")[0];
          }

          // Extract assigned service IDs (supports objects array [{id: 1, name: "Demat"}] or ID array)
          let assignedServiceIds = [];
          if (Array.isArray(c.services)) {
            assignedServiceIds = c.services
              .map((s) => (typeof s === "object" ? s.id : s))
              .filter(Boolean);
          }

          setFormData({
            ucc_no: c.ucc_no || "",
            name: c.name || "",
            business_name: c.business_name || "",
            mobile_no: c.mobile_no || "",
            same_as_whatsapp: c.mobile_no && c.whatsapp_no && c.mobile_no === c.whatsapp_no,
            whatsapp_no: c.whatsapp_no || "",
            email: c.email || "",
            pan: c.pan || "",
            dob: dobFormatted,
            gender: c.gender || "",
            occupation: c.occupation || "",
            client_type_id: c.client_type?.id || c.client_type_id || "",
            status: c.status || "active",
            service_ids: assignedServiceIds,
          });
        }
      } catch (err) {
        if (isMounted) {
          setServerError(err.message || "Failed to load client for editing.");
        }
      } finally {
        if (isMounted) {
          setLoadingInitial(false);
        }
      }
    };

    fetchClient();
    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, token]);

  // Handle Input Changes & WhatsApp Synchronization
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: val };

      if (name === "mobile_no" && prev.same_as_whatsapp) {
        updated.whatsapp_no = val;
      }
      if (name === "same_as_whatsapp") {
        if (checked) {
          updated.whatsapp_no = prev.mobile_no;
        }
      }

      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Toggle Services Multi-Select Checkboxes by ID
  const handleServiceToggle = (serviceId) => {
    setFormData((prev) => {
      const exists = prev.service_ids.includes(serviceId);
      const updatedIds = exists
        ? prev.service_ids.filter((idItem) => idItem !== serviceId)
        : [...prev.service_ids, serviceId];
      return { ...prev, service_ids: updatedIds };
    });
  };

  // Validation helper functions
  const getMaxAllowedDob = () => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return maxDate.toISOString().split("T")[0];
  };

  const isAtLeast18YearsOld = (dobString) => {
    if (!dobString) return false;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const isValidEmail = (emailStr) => {
    if (!emailStr || typeof emailStr !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(emailStr.trim());
  };

  const isValidPhoneNumber = (phoneStr) => {
    if (!phoneStr || typeof phoneStr !== "string") return false;
    const clean = phoneStr.trim().replace(/[\s\-()]/g, "");
    return /^[0-9]{10,15}$/.test(clean);
  };

  // Single field validation for blur and submit
  const validateSingleField = (fieldName, fieldValue, currentData = formData) => {
    const val = (fieldValue !== undefined && fieldValue !== null) ? fieldValue.toString().trim() : "";

    switch (fieldName) {
      case "ucc_no":
        if (!val) return "UCC number is required";
        return "";
      case "name":
        if (!val) return "Client Name is required";
        return "";
      case "mobile_no":
        if (!val) return "Mobile Number is required";
        if (!isValidPhoneNumber(val)) return "Please enter a valid mobile number.";
        return "";
      case "whatsapp_no":
        if (!val) return "WhatsApp Number is required";
        if (!isValidPhoneNumber(val)) return "Please enter a valid WhatsApp number.";
        return "";
      case "email":
        if (!val) return "Email address is required";
        if (!isValidEmail(val)) return "Please enter a valid email address.";
        return "";
      case "pan":
        if (!val) return "PAN number is required";
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(val)) return "Invalid PAN format (e.g. ABCDE1234F)";
        return "";
      case "dob":
        if (!val) return "Date of Birth is required";
        const dobDate = new Date(val);
        if (isNaN(dobDate.getTime())) return "Invalid Date of Birth format";
        if (dobDate > new Date()) return "Date of Birth cannot be in the future";
        if (!isAtLeast18YearsOld(val)) return "Client must be at least 18 years old.";
        return "";
      case "gender":
        if (!val) return "Gender is required";
        return "";
      case "client_type_id":
        if (!val) return "Client Type is required";
        return "";
      case "status":
        if (!val) return "Status is required";
        return "";
      default:
        return "";
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const errMessage = validateSingleField(name, value, formData);
    setErrors((prev) => ({ ...prev, [name]: errMessage }));
  };

  // Client-Side Form Validation for all fields on Submit
  const validateForm = () => {
    const newErrors = {};
    const fieldNames = [
      "ucc_no",
      "name",
      "mobile_no",
      "whatsapp_no",
      "email",
      "pan",
      "dob",
      "gender",
      "client_type_id",
      "status",
    ];

    fieldNames.forEach((fName) => {
      const err = validateSingleField(fName, formData[fName], formData);
      if (err) {
        newErrors[fName] = err;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ucc_no: formData.ucc_no.trim().toUpperCase(),
        name: formData.name.trim(),
        business_name: formData.business_name.trim() || null,
        mobile_no: formData.mobile_no.trim(),
        whatsapp_no: formData.whatsapp_no.trim() || null,
        email: formData.email.trim() || null,
        pan: formData.pan.trim() ? formData.pan.trim().toUpperCase() : null,
        dob: formData.dob || null,
        gender: formData.gender || null,
        occupation: formData.occupation.trim() || null,
        client_type_id: parseInt(formData.client_type_id, 10),
        status: formData.status || "active",
        service_ids: formData.service_ids,
      };

      if (isEditMode) {
        await ClientService.updateClient(id, payload, token);
        setSuccessMessage("Client updated successfully.");
        setTimeout(() => {
          navigate(`/clients/${id}`);
        }, 1000);
      } else {
        await ClientService.createClient(payload, token);
        setSuccessMessage("Client created successfully.");
        setTimeout(() => {
          navigate("/clients");
        }, 1000);
      }
    } catch (err) {
      if (err.statusCode === 409 || (err.message && err.message.toLowerCase().includes("ucc"))) {
        setErrors((prev) => ({
          ...prev,
          ucc_no: "This UCC number is already in use.",
        }));
      } else if (err.statusCode === 403) {
        setServerError(`You do not have permission to ${isEditMode ? "edit" : "create"} clients.`);
      } else if (err.errors && Array.isArray(err.errors)) {
        const fieldErrMap = {};
        err.errors.forEach((e) => {
          if (e.field) fieldErrMap[e.field] = e.message;
        });
        setErrors(fieldErrMap);
        if (!fieldErrMap.ucc_no) {
          setServerError(err.message || `Failed to ${isEditMode ? "update" : "create"} client.`);
        }
      } else {
        setServerError(err.message || `Unable to ${isEditMode ? "update" : "create"} client. Please try again.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <AppLayout title={isEditMode ? "Edit Client" : "Add Client"}>
        <div className="add-client-container">
          <div className="add-client-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 1rem auto", color: "#0f172a" }} />
            <p style={{ color: "#64748b", fontWeight: 600 }}>Loading client details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={isEditMode ? "Edit Client" : "Add Client"}>
      <div className="add-client-container">
        {/* Top Header & Back Button */}
        <div className="add-client-header">
          <button
            type="button"
            className="btn-back-link"
            onClick={() => navigate(isEditMode ? `/clients/${id}` : "/clients")}
          >
            <ArrowLeft size={16} />
            <span>{isEditMode ? "Back to Client Details" : "Back to Clients"}</span>
          </button>
          <div className="add-client-title-group">
            <h2 className="add-client-title">{isEditMode ? "Edit Client" : "Add Client"}</h2>
            <p className="add-client-subtitle">
              {isEditMode
                ? "Update client profile and contact information."
                : "Create a new client profile and manage their services and contact information."}
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {serverError && (
          <div className="banner-error">
            <AlertCircle size={18} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div className="banner-success">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Container Card */}
        <form onSubmit={handleSubmit} className="add-client-card" noValidate>
          {/* SECTION 1: BASIC INFORMATION */}
          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>
            <div className="form-grid-2">
              {/* UCC No */}
              <div className="form-group">
                <label className="form-label">
                  UCC No <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="ucc_no"
                  placeholder="Enter UCC number (e.g. UCC001)"
                  value={formData.ucc_no}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.ucc_no ? "is-invalid" : ""}`}
                />
                {errors.ucc_no && <span className="error-text">{errors.ucc_no}</span>}
              </div>

              {/* Client Name */}
              <div className="form-group">
                <label className="form-label">
                  Client Name <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.name ? "is-invalid" : ""}`}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              {/* Business Name */}
              <div className="form-group">
                <label className="form-label">Business Name</label>
                <input
                  type="text"
                  name="business_name"
                  placeholder="Enter business / company name"
                  value={formData.business_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="form-input"
                />
              </div>

              {/* Mobile Number + Same as WhatsApp Checkbox */}
              <div className="form-group">
                <label className="form-label">
                  Mobile Number <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="mobile_no"
                  placeholder="Enter 10-digit mobile number"
                  value={formData.mobile_no}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.mobile_no ? "is-invalid" : ""}`}
                />
                <label className="checkbox-inline-wrapper">
                  <input
                    type="checkbox"
                    name="same_as_whatsapp"
                    checked={formData.same_as_whatsapp}
                    onChange={handleChange}
                    className="checkbox-inline-input"
                  />
                  <span className="checkbox-inline-label">Same as WhatsApp Number</span>
                </label>
                {errors.mobile_no && <span className="error-text">{errors.mobile_no}</span>}
              </div>

              {/* WhatsApp Number */}
              <div className="form-group">
                <label className="form-label">
                  WhatsApp Number <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="whatsapp_no"
                  placeholder="Enter 10-digit WhatsApp number"
                  value={formData.whatsapp_no}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  readOnly={formData.same_as_whatsapp}
                  className={`form-input ${errors.whatsapp_no ? "is-invalid" : ""}`}
                />
                {errors.whatsapp_no && (
                  <span className="error-text">{errors.whatsapp_no}</span>
                )}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">
                  Email <span className="required-star">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="client@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.email ? "is-invalid" : ""}`}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              {/* PAN */}
              <div className="form-group">
                <label className="form-label">
                  PAN <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  name="pan"
                  placeholder="ABCDE1234F"
                  value={formData.pan}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.pan ? "is-invalid" : ""}`}
                />
                {errors.pan && <span className="error-text">{errors.pan}</span>}
              </div>

              {/* Date of Birth */}
              <div className="form-group">
                <label className="form-label">
                  Date of Birth <span className="required-star">*</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  max={getMaxAllowedDob()}
                  value={formData.dob}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.dob ? "is-invalid" : ""}`}
                />
                {errors.dob && <span className="error-text">{errors.dob}</span>}
              </div>

              {/* Gender */}
              <div className="form-group">
                <label className="form-label">
                  Gender <span className="required-star">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-select ${errors.gender ? "is-invalid" : ""}`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <span className="error-text">{errors.gender}</span>}
              </div>

              {/* Occupation */}
              <div className="form-group">
                <label className="form-label">Occupation</label>
                <input
                  type="text"
                  name="occupation"
                  placeholder="Business, Salaried, Doctor, etc."
                  value={formData.occupation}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: CLIENT CLASSIFICATION */}
          <div className="form-section">
            <h3 className="section-title">Client Classification</h3>
            <div className="form-grid-2">
              {/* Dynamic Client Type Dropdown from API */}
              <div className="form-group">
                <label className="form-label">
                  Client Type <span className="required-star">*</span>
                </label>
                {loadingConfig ? (
                  <div className="form-input" style={{ color: "#64748b" }}>
                    Loading Client Types...
                  </div>
                ) : configError ? (
                  <div className="error-text">{configError}</div>
                ) : (
                  <select
                    name="client_type_id"
                    value={formData.client_type_id}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`form-select ${errors.client_type_id ? "is-invalid" : ""}`}
                  >
                    <option value="">Select Client Type</option>
                    {clientTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.client_type_id && (
                  <span className="error-text">{errors.client_type_id}</span>
                )}
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label">
                  Status <span className="required-star">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-select ${errors.status ? "is-invalid" : ""}`}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {errors.status && <span className="error-text">{errors.status}</span>}
              </div>
            </div>
          </div>

          {/* SECTION 3: SERVICES (DYNAMIC MULTI-SELECT CHECKBOX LIST FROM API) */}
          <div className="form-section">
            <h3 className="section-title">Subscribed Services</h3>
            {loadingConfig ? (
              <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Loading available services...</p>
            ) : availableServices.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.875rem" }}>No active services available.</p>
            ) : (
              <div className="services-checkbox-grid">
                {availableServices.map((serviceItem) => {
                  const isSelected = formData.service_ids.includes(serviceItem.id);
                  return (
                    <div
                      key={serviceItem.id}
                      className={`service-checkbox-item ${isSelected ? "selected" : ""}`}
                      onClick={() => handleServiceToggle(serviceItem.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent container click
                        className="checkbox-inline-input"
                      />
                      <span className="service-checkbox-label">{serviceItem.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* FORM ACTIONS FOOTER */}
          <div className="form-actions-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate(isEditMode ? `/clients/${id}` : "/clients")}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-save-client"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isEditMode ? "Updating..." : "Saving..."}</span>
                </>
              ) : (
                <span>{isEditMode ? "Update Client" : "Save Client"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default AddClient;
