import React, { useState, useEffect } from "react";
import LeadService from "../../services/lead.service";
import { X, CheckCircle2, AlertCircle, Loader2, UserCheck, Calendar, CreditCard, Award, Crown, Gem } from "lucide-react";

const LeadConvertModal = ({ show, lead, onClose, onSuccess, token }) => {
  const [dob, setDob] = useState("");
  const [pan, setPan] = useState("");
  const [clientCategory, setClientCategory] = useState("BRONZE");

  const [fieldErrors, setFieldErrors] = useState({});
  const [errorBanner, setErrorBanner] = useState("");
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (lead) {
      setDob("");
      setPan("");
      setClientCategory("BRONZE");
      setFieldErrors({});
      setErrorBanner("");
    }
  }, [lead, show]);

  if (!show || !lead) return null;

  // Validation handler matching AddClient.jsx validation rules
  const validate = () => {
    const errs = {};

    // 1. DOB Validation
    if (!dob || !dob.trim()) {
      errs.dob = "Date of Birth is required";
    } else {
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime())) {
        errs.dob = "Invalid Date of Birth format";
      } else {
        const today = new Date();
        if (dobDate > today) {
          errs.dob = "Date of Birth cannot be in the future";
        }
      }
    }

    // 2. PAN Validation
    if (!pan || !pan.trim()) {
      errs.pan = "PAN Number is required";
    } else {
      const panClean = pan.trim().toUpperCase();
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panClean)) {
        errs.pan = "Invalid PAN format (e.g. ABCDE1234F)";
      }
    }

    // 3. Client Category Validation
    if (!clientCategory) {
      errs.client_category = "Please select a client category";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePanChange = (e) => {
    const val = e.target.value.toUpperCase();
    setPan(val);
    if (fieldErrors.pan) {
      setFieldErrors((prev) => ({ ...prev, pan: "" }));
    }
  };

  const handleDobChange = (e) => {
    setDob(e.target.value);
    if (fieldErrors.dob) {
      setFieldErrors((prev) => ({ ...prev, dob: "" }));
    }
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    setErrorBanner("");

    if (!validate()) return;

    try {
      setConverting(true);

      const payload = {
        dob: dob.trim(),
        pan: pan.trim().toUpperCase(),
        client_category: clientCategory,
      };

      const res = await LeadService.convertLeadToClient(lead.id, payload, token);

      if (res && res.client) {
        onSuccess("Lead converted to client successfully.", res.client, res.lead);
        onClose();
      }
    } catch (err) {
      setErrorBanner(err.message || "Unable to convert the lead. Please try again.");
    } finally {
      setConverting(false);
    }
  };

  const todayISO = new Date().toISOString().split("T")[0];

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: "620px" }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="flex-center-gap" style={{ gap: "0.5rem" }}>
            <UserCheck size={20} color="#16a34a" />
            <h3 className="modal-title">Complete Client Details</h3>
          </div>
          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            disabled={converting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleConvert}>
          <div className="modal-body" style={{ gap: "1rem" }}>
            <p style={{ fontSize: "0.825rem", color: "#64748b", margin: 0 }}>
              Please complete the required information before converting this lead into a client.
            </p>

            {errorBanner && (
              <div className="modal-error-banner">
                <AlertCircle size={16} />
                <span>{errorBanner}</span>
              </div>
            )}

            {/* Read-Only Lead Summary */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "0.875rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
                fontSize: "0.8rem",
              }}
            >
              <div style={{ fontWeight: 700, color: "#475569", marginBottom: "0.2rem", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.04em" }}>
                Lead Information (Read-only)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                <div>
                  <span style={{ color: "#64748b" }}>Name: </span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{lead.name}</span>
                </div>
                {lead.company_name && (
                  <div>
                    <span style={{ color: "#64748b" }}>Company: </span>
                    <span style={{ color: "#0f172a" }}>{lead.company_name}</span>
                  </div>
                )}
                {lead.mobile_no && (
                  <div>
                    <span style={{ color: "#64748b" }}>Mobile: </span>
                    <span style={{ color: "#0f172a" }}>{lead.mobile_no}</span>
                  </div>
                )}
                {lead.email && (
                  <div>
                    <span style={{ color: "#64748b" }}>Email: </span>
                    <span style={{ color: "#0f172a" }}>{lead.email}</span>
                  </div>
                )}
                <div>
                  <span style={{ color: "#64748b" }}>Client Type: </span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>
                    {lead.client_type?.name || lead.client_type_name || "Standard"}
                  </span>
                </div>
                {lead.service?.name && (
                  <div>
                    <span style={{ color: "#64748b" }}>Service: </span>
                    <span style={{ color: "#0f172a" }}>{lead.service.name}</span>
                  </div>
                )}
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "0.25rem 0" }} />

            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.825rem" }}>
              Required Client Information
            </div>

            {/* Date of Birth Field */}
            <div className="form-group">
              <label className="form-label">
                Date of Birth <span className="required-star">*</span>
              </label>
              <div className="input-with-icon">
                <Calendar size={16} className="input-icon" />
                <input
                  type="date"
                  className={`form-input ${fieldErrors.dob ? "input-error" : ""}`}
                  max={todayISO}
                  value={dob}
                  onChange={handleDobChange}
                  disabled={converting}
                />
              </div>
              {fieldErrors.dob && (
                <span className="field-error-text">{fieldErrors.dob}</span>
              )}
            </div>

            {/* PAN Number Field */}
            <div className="form-group">
              <label className="form-label">
                PAN Number <span className="required-star">*</span>
              </label>
              <div className="input-with-icon">
                <CreditCard size={16} className="input-icon" />
                <input
                  type="text"
                  className={`form-input ${fieldErrors.pan ? "input-error" : ""}`}
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                  style={{ textTransform: "uppercase" }}
                  value={pan}
                  onChange={handlePanChange}
                  disabled={converting}
                />
              </div>
              {fieldErrors.pan && (
                <span className="field-error-text">{fieldErrors.pan}</span>
              )}
            </div>

            {/* Client Category (Single-Select Checkboxes) */}
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>
                  Client Category <span className="required-star">*</span>
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 400 }}>(Select one tier)</span>
              </label>
              <div className="category-checkbox-grid">
                {[
                  { value: "BRONZE", label: "Bronze", icon: Award, cls: "cat-bronze" },
                  { value: "SILVER", label: "Silver", icon: Award, cls: "cat-silver" },
                  { value: "GOLD", label: "Gold", icon: Crown, cls: "cat-gold" },
                  { value: "PLATINUM", label: "Platinum", icon: Gem, cls: "cat-platinum" },
                ].map((cat) => {
                  const isSelected = clientCategory === cat.value;
                  const IconComp = cat.icon;
                  return (
                    <label
                      key={cat.value}
                      className={`category-checkbox-card ${cat.cls} ${isSelected ? "selected" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setClientCategory(cat.value);
                        if (fieldErrors.client_category) {
                          setFieldErrors((prev) => ({ ...prev, client_category: "" }));
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        name="client_category"
                        value={cat.value}
                        checked={isSelected}
                        onChange={() => {}}
                        className="category-checkbox-input"
                      />
                      <div className="category-card-inner">
                        <span className="category-card-icon">
                          <IconComp size={16} />
                        </span>
                        <span className="category-card-text">{cat.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
              {fieldErrors.client_category && (
                <span className="field-error-text">{fieldErrors.client_category}</span>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={converting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-save"
              style={{ backgroundColor: "#16a34a" }}
              disabled={converting}
            >
              {converting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Convert to Client</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadConvertModal;
