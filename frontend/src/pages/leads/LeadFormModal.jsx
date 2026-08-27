import React, { useState, useEffect } from "react";
import LeadService from "../../services/lead.service";
import { X, AlertCircle, Loader2, User, Building, Phone, Mail, Calendar, Tag, Briefcase } from "lucide-react";

const SOURCE_OPTIONS = ["Website", "Referral", "Walk-in", "Call", "WhatsApp", "Other"];
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const LeadFormModal = ({
  show,
  editingLead,
  onClose,
  onSuccess,
  clientTypes = [],
  services = [],
  staffUsers = [],
  token,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    mobile_no: "",
    whatsapp_no: "",
    email: "",
    company_name: "",
    client_type_id: "",
    source: "Website",
    service_id: "",
    assigned_to: "",
    priority: "medium",
    next_follow_up_at: "",
    notes: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingLead) {
      setFormData({
        name: editingLead.name || "",
        mobile_no: editingLead.mobile_no || "",
        whatsapp_no: editingLead.whatsapp_no || "",
        email: editingLead.email || "",
        company_name: editingLead.company_name || "",
        client_type_id: editingLead.client_type_id || editingLead.client_type?.id || "",
        source: editingLead.source || "Website",
        service_id: editingLead.service_id || editingLead.service?.id || "",
        assigned_to: editingLead.assigned_to || editingLead.assigned_staff?.id || "",
        priority: editingLead.priority || "medium",
        next_follow_up_at: editingLead.next_follow_up_at
          ? new Date(editingLead.next_follow_up_at).toISOString().slice(0, 16)
          : "",
        notes: editingLead.notes || "",
      });
    } else {
      setFormData({
        name: "",
        mobile_no: "",
        whatsapp_no: "",
        email: "",
        company_name: "",
        client_type_id: clientTypes[0] ? clientTypes[0].id : "",
        source: "Website",
        service_id: services[0] ? services[0].id : "",
        assigned_to: "",
        priority: "medium",
        next_follow_up_at: "",
        notes: "",
      });
    }
    setFieldErrors({});
    setFormError("");
  }, [editingLead, show, clientTypes, services]);

  if (!show) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const errs = {};

    if (!formData.name || !formData.name.trim()) {
      errs.name = "Lead Name is required";
    }

    if (!formData.mobile_no || !formData.mobile_no.trim()) {
      errs.mobile_no = "Mobile Number is required";
    } else {
      const cleanMobile = formData.mobile_no.trim().replace(/[\s\-()]/g, "");
      if (!/^[0-9]{10,15}$/.test(cleanMobile)) {
        errs.mobile_no = "Invalid Mobile Number (10-15 digits required)";
      }
    }

    if (!formData.whatsapp_no || !formData.whatsapp_no.trim()) {
      errs.whatsapp_no = "WhatsApp Number is required";
    } else {
      const cleanWhatsApp = formData.whatsapp_no.trim().replace(/[\s\-()]/g, "");
      if (!/^[0-9]{10,15}$/.test(cleanWhatsApp)) {
        errs.whatsapp_no = "Invalid WhatsApp Number (10-15 digits required)";
      }
    }

    if (!formData.email || !formData.email.trim()) {
      errs.email = "Email Address is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errs.email = "Invalid Email Address format";
      }
    }

    if (!formData.client_type_id) {
      errs.client_type_id = "Client Type is required";
    }

    if (!formData.service_id) {
      errs.service_id = "Interested Service is required";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) {
      setFormError("Please fix the highlighted required fields below.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        mobile_no: formData.mobile_no.trim(),
        whatsapp_no: formData.whatsapp_no.trim(),
        email: formData.email.trim().toLowerCase(),
        company_name: formData.company_name ? formData.company_name.trim() : null,
        client_type_id: parseInt(formData.client_type_id, 10),
        source: formData.source ? formData.source.trim() : null,
        service_id: parseInt(formData.service_id, 10),
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to, 10) : null,
        priority: formData.priority || "medium",
        next_follow_up_at: formData.next_follow_up_at ? new Date(formData.next_follow_up_at).toISOString() : null,
        notes: formData.notes ? formData.notes.trim() : null,
      };

      if (editingLead) {
        await LeadService.updateLead(editingLead.id, payload, token);
      } else {
        await LeadService.createLead(payload, token);
      }

      onSuccess(editingLead ? "Lead updated successfully." : "Lead created successfully.");
      onClose();
    } catch (err) {
      setFormError(err.message || "Failed to save lead details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="lead-form-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="lead-modal-header">
          <h3 className="lead-modal-title">
            {editingLead ? "Edit Lead Information" : "Create New Lead"}
          </h3>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="lead-modal-body">
            {formError && (
              <div className="modal-error-banner">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <div className="form-grid-2col">
              {/* Lead Name * */}
              <div className="form-group col-span-2">
                <label className="form-label">
                  Lead Name <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    className={`form-input ${fieldErrors.name ? "input-error" : ""}`}
                    placeholder="e.g. Rahul Patel"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>
                {fieldErrors.name && <span className="field-error-text">{fieldErrors.name}</span>}
              </div>

              {/* Company Name */}
              <div className="form-group">
                <label className="form-label">Company / Business Name</label>
                <div className="input-with-icon">
                  <Building size={16} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Acme Enterprises"
                    value={formData.company_name}
                    onChange={(e) => handleChange("company_name", e.target.value)}
                  />
                </div>
              </div>

              {/* Email Address * */}
              <div className="form-group">
                <label className="form-label">
                  Email Address <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    className={`form-input ${fieldErrors.email ? "input-error" : ""}`}
                    placeholder="e.g. rahul@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                {fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}
              </div>

              {/* Mobile Number * */}
              <div className="form-group">
                <label className="form-label">
                  Mobile Number <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <Phone size={16} className="input-icon" />
                  <input
                    type="text"
                    className={`form-input ${fieldErrors.mobile_no ? "input-error" : ""}`}
                    placeholder="e.g. 9876543210"
                    value={formData.mobile_no}
                    onChange={(e) => handleChange("mobile_no", e.target.value)}
                  />
                </div>
                {fieldErrors.mobile_no && <span className="field-error-text">{fieldErrors.mobile_no}</span>}
              </div>

              {/* WhatsApp Number * */}
              <div className="form-group">
                <label className="form-label">
                  WhatsApp Number <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <Phone size={16} className="input-icon" style={{ color: "#16a34a" }} />
                  <input
                    type="text"
                    className={`form-input ${fieldErrors.whatsapp_no ? "input-error" : ""}`}
                    placeholder="e.g. 9876543210"
                    value={formData.whatsapp_no}
                    onChange={(e) => handleChange("whatsapp_no", e.target.value)}
                  />
                </div>
                {fieldErrors.whatsapp_no && <span className="field-error-text">{fieldErrors.whatsapp_no}</span>}
              </div>

              {/* Client Type * */}
              <div className="form-group">
                <label className="form-label">
                  Client Type <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <Tag size={16} className="input-icon" />
                  <select
                    className={`form-select ${fieldErrors.client_type_id ? "input-error" : ""}`}
                    value={formData.client_type_id}
                    onChange={(e) => handleChange("client_type_id", e.target.value)}
                  >
                    <option value="">Select Client Type</option>
                    {clientTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.client_type_id && <span className="field-error-text">{fieldErrors.client_type_id}</span>}
              </div>

              {/* Interested Service * */}
              <div className="form-group">
                <label className="form-label">
                  Interested Service <span className="required-star">*</span>
                </label>
                <div className="input-with-icon">
                  <Briefcase size={16} className="input-icon" />
                  <select
                    className={`form-select ${fieldErrors.service_id ? "input-error" : ""}`}
                    value={formData.service_id}
                    onChange={(e) => handleChange("service_id", e.target.value)}
                  >
                    <option value="">Select Service</option>
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.service_id && <span className="field-error-text">{fieldErrors.service_id}</span>}
              </div>

              {/* Lead Source */}
              <div className="form-group">
                <label className="form-label">Lead Source</label>
                <select
                  className="form-select"
                  value={formData.source}
                  onChange={(e) => handleChange("source", e.target.value)}
                >
                  {SOURCE_OPTIONS.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => handleChange("priority", e.target.value)}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assign Staff */}
              <div className="form-group">
                <label className="form-label">Assigned Staff</label>
                <select
                  className="form-select"
                  value={formData.assigned_to}
                  onChange={(e) => handleChange("assigned_to", e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {staffUsers.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Next Follow Up */}
              <div className="form-group">
                <label className="form-label">Next Follow-up Date & Time</label>
                <div className="input-with-icon">
                  <Calendar size={16} className="input-icon" />
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={formData.next_follow_up_at}
                    onChange={(e) => handleChange("next_follow_up_at", e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="form-group col-span-2">
                <label className="form-label">Notes & Remarks</label>
                <textarea
                  className="form-textarea"
                  placeholder="Record client preferences, requirements, or conversation summaries..."
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="lead-modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : editingLead ? (
                "Update Lead"
              ) : (
                "Create Lead"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadFormModal;
