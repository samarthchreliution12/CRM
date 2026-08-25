import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import ClientService from "../../services/client.service";
import useAuth from "../../hooks/useAuth";
import { ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import "./AddClient.css";

const AVAILABLE_SERVICES = [
  "Demat",
  "Trading",
  "IPO",
  "SLBM",
  "Mutual Fund",
  "Insurance",
  "Physical Shares",
  "IEPF",
];

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
    services: [],
  });

  // Dynamic Options State
  const [clientTypes, setClientTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [typesError, setTypesError] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);

  // Form Submission & Validation State
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Client Types dynamically from GET /api/client-types
  useEffect(() => {
    let isMounted = true;
    const fetchTypes = async () => {
      try {
        setLoadingTypes(true);
        setTypesError("");
        const res = await ClientService.getClientTypes(token);
        if (isMounted && res && res.data && res.data.client_types) {
          setClientTypes(res.data.client_types);
        }
      } catch (err) {
        if (isMounted) {
          setTypesError(err.message || "Failed to load Client Types from server.");
        }
      } finally {
        if (isMounted) {
          setLoadingTypes(false);
        }
      }
    };

    fetchTypes();
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
            services: Array.isArray(c.services) ? c.services : [],
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

      // Synchronization logic: Mobile -> WhatsApp when checkbox is checked
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

    // Clear field-level error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Toggle Services Multi-Select Checkboxes
  const handleServiceToggle = (serviceName) => {
    setFormData((prev) => {
      const exists = prev.services.includes(serviceName);
      const updatedServices = exists
        ? prev.services.filter((s) => s !== serviceName)
        : [...prev.services, serviceName];
      return { ...prev, services: updatedServices };
    });
  };

  // Client-Side Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.ucc_no || !formData.ucc_no.trim()) {
      newErrors.ucc_no = "UCC number is required";
    }

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = "Client Name is required";
    }

    if (!formData.mobile_no || !formData.mobile_no.trim()) {
      newErrors.mobile_no = "Mobile Number is required";
    } else {
      const cleanMobile = formData.mobile_no.trim().replace(/[\s\-()]/g, "");
      if (!/^[0-9]{10,15}$/.test(cleanMobile)) {
        newErrors.mobile_no = "Invalid Mobile Number (must be 10-15 digits)";
      }
    }

    if (formData.whatsapp_no && formData.whatsapp_no.trim()) {
      const cleanWhatsApp = formData.whatsapp_no.trim().replace(/[\s\-()]/g, "");
      if (!/^[0-9]{10,15}$/.test(cleanWhatsApp)) {
        newErrors.whatsapp_no = "Invalid WhatsApp Number (must be 10-15 digits)";
      }
    }

    if (!formData.client_type_id) {
      newErrors.client_type_id = "Client Type is required";
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Invalid email address format";
      }
    }

    if (formData.pan && formData.pan.trim()) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
      if (!panRegex.test(formData.pan.trim())) {
        newErrors.pan = "Invalid PAN format (e.g. ABCDE1234F)";
      }
    }

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
        services: formData.services,
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
                <label className="form-label">WhatsApp Number</label>
                <input
                  type="text"
                  name="whatsapp_no"
                  placeholder="Enter WhatsApp number"
                  value={formData.whatsapp_no}
                  onChange={handleChange}
                  readOnly={formData.same_as_whatsapp}
                  className={`form-input ${errors.whatsapp_no ? "is-invalid" : ""}`}
                />
                {errors.whatsapp_no && (
                  <span className="error-text">{errors.whatsapp_no}</span>
                )}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="client@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? "is-invalid" : ""}`}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              {/* PAN */}
              <div className="form-group">
                <label className="form-label">PAN</label>
                <input
                  type="text"
                  name="pan"
                  placeholder="ABCDE1234F"
                  value={formData.pan}
                  onChange={handleChange}
                  className={`form-input ${errors.pan ? "is-invalid" : ""}`}
                />
                {errors.pan && <span className="error-text">{errors.pan}</span>}
              </div>

              {/* Date of Birth */}
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* Gender */}
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
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
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: CLIENT CLASSIFICATION */}
          <div className="form-section">
            <h3 className="section-title">Client Classification</h3>
            <div className="form-grid-2">
              {/* Dynamic Client Type Dropdown */}
              <div className="form-group">
                <label className="form-label">
                  Client Type <span className="required-star">*</span>
                </label>
                {loadingTypes ? (
                  <div className="form-input" style={{ color: "#64748b" }}>
                    Loading Client Types...
                  </div>
                ) : typesError ? (
                  <div className="error-text">{typesError}</div>
                ) : (
                  <select
                    name="client_type_id"
                    value={formData.client_type_id}
                    onChange={handleChange}
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
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: SERVICES (MULTI-SELECT CHECKBOX LIST) */}
          <div className="form-section">
            <h3 className="section-title">Services</h3>
            <div className="services-checkbox-grid">
              {AVAILABLE_SERVICES.map((service) => {
                const isSelected = formData.services.includes(service);
                return (
                  <div
                    key={service}
                    className={`service-checkbox-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleServiceToggle(service)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by parent div
                      className="checkbox-inline-input"
                    />
                    <span className="service-checkbox-label">{service}</span>
                  </div>
                );
              })}
            </div>
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
