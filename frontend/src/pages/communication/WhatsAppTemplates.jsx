import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import {
  MessageSquare,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Send,
  Cake,
  Star,
  Loader2,
  X,
  Smartphone,
  User,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import WhatsAppService from "../../services/whatsapp.service";
import "./WhatsAppTemplates.css";

const WhatsAppTemplates = () => {
  const { token } = useAuth();

  // Data States
  const [templates, setTemplates] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSettingBirthday, setIsSettingBirthday] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Notifications
  const [alert, setAlert] = useState(null);

  // Test Send Modal State
  const [testModalTemplate, setTestModalTemplate] = useState(null);
  const [testFullName, setTestFullName] = useState("");
  const [testMobile, setTestMobile] = useState("");
  const [testVariables, setTestVariables] = useState({});
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState(null);

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  // Fetch Templates and Status
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [settingsRes, templatesRes] = await Promise.allSettled([
        WhatsAppService.getSettings(token),
        WhatsAppService.getTemplates({ limit: 100 }, token),
      ]);

      if (settingsRes.status === "fulfilled" && settingsRes.value?.success) {
        setSettings(settingsRes.value.data);
      }

      if (templatesRes.status === "fulfilled" && templatesRes.value?.success) {
        setTemplates(templatesRes.value.data?.templates || []);
      }
    } catch (err) {
      console.error("Error loading templates:", err);
      showAlert(err.message || "Failed to load WhatsApp templates.", "danger");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync / Refresh Templates Action
  const handleSyncTemplates = async () => {
    setIsSyncing(true);
    setAlert(null);

    try {
      const response = await WhatsAppService.syncTemplates(token);
      if (response && response.success) {
        showAlert(
          response.message || `Successfully synced ${response.synced_count || 0} templates from ChatterPillar.`
        );
        await loadData();
      } else {
        showAlert(response?.message || "Template synchronization failed.", "danger");
      }
    } catch (err) {
      console.error("Template sync error:", err);
      showAlert(
        err.message || "Failed to sync templates. Verify your CP API Key in WhatsApp Settings.",
        "danger"
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Select Active Birthday Template Action
  const handleSelectBirthday = async (template) => {
    if (String(template.status).toUpperCase() !== "APPROVED") {
      showAlert("Only APPROVED templates can be designated as Birthday Template.", "danger");
      return;
    }

    setIsSettingBirthday(template.template_id);
    try {
      const response = await WhatsAppService.selectBirthdayTemplate(template.template_id, token);
      if (response && response.success) {
        showAlert(
          `'${template.template_name}' is now set as the active Birthday Greeting Template!`
        );
        // Refresh local settings state
        setSettings((prev) => ({
          ...prev,
          birthday_template_id: template.template_id,
          birthday_template_data: {
            template_id: template.template_id,
            template_name: template.template_name,
            category: template.category,
            body_content: template.body_content,
          },
        }));
      } else {
        showAlert(response?.message || "Failed to set birthday template.", "danger");
      }
    } catch (err) {
      console.error("Select birthday template error:", err);
      showAlert(err.message || "Failed to select birthday template.", "danger");
    } finally {
      setIsSettingBirthday(null);
    }
  };

  // Open Test Send Modal
  const handleOpenTestModal = (template) => {
    setTestModalTemplate(template);
    setTestFullName("");
    setTestMobile("");
    setTestFeedback(null);

    // Parse required variables from template
    let varsList = [];
    if (template.variables) {
      try {
        varsList =
          typeof template.variables === "string"
            ? JSON.parse(template.variables)
            : template.variables;
      } catch (e) {
        varsList = [];
      }
    }

    if (!Array.isArray(varsList) || varsList.length === 0) {
      // Fallback regex detection on body
      const matches = [];
      const regex = /{{\s*([a-zA-Z0-9_-]+)\s*}}/g;
      let m;
      while ((m = regex.exec(template.body_content || "")) !== null) {
        if (!matches.includes(m[1])) matches.push(m[1]);
      }
      varsList = matches;
    }

    const initialVarObj = {};
    varsList.forEach((vKey) => {
      initialVarObj[vKey] = "";
    });
    setTestVariables(initialVarObj);
  };

  // Close Test Send Modal
  const handleCloseTestModal = () => {
    setTestModalTemplate(null);
    setTestFeedback(null);
    setIsSendingTest(false);
  };

  // Dispatch Test Message
  const handleSendTestSubmit = async (e) => {
    e.preventDefault();
    setTestFeedback(null);

    if (!testFullName.trim()) {
      setTestFeedback({ type: "danger", message: "Recipient Full Name is required." });
      return;
    }

    const cleanMobile = testMobile.trim().replace(/[\s\-()+]/g, "");
    if (!/^[0-9]{10,15}$/.test(cleanMobile)) {
      setTestFeedback({
        type: "danger",
        message: "Please enter a valid 10 to 15 digit mobile number (with country code if international).",
      });
      return;
    }

    setIsSendingTest(true);

    try {
      // Convert variables object into ordered values array
      const bodyValues = Object.values(testVariables).map((v) => String(v || "").trim());

      const payload = {
        template_id: testModalTemplate.template_id,
        mobile: cleanMobile,
        full_name: testFullName.trim(),
        body_variable_values: bodyValues.length > 0 ? bodyValues : undefined,
      };

      const response = await WhatsAppService.sendTestMessage(payload, token);
      if (response && response.success) {
        setTestFeedback({
          type: "success",
          message:
            response.message || "Test WhatsApp template message successfully dispatched to provider!",
        });
      } else {
        setTestFeedback({
          type: "danger",
          message: response?.message || "Failed to send test message.",
        });
      }
    } catch (err) {
      console.error("Test send error:", err);
      setTestFeedback({
        type: "danger",
        message: err.message || "Provider returned an error while sending test message.",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Helper to render body with styled variable chips
  const renderFormattedBody = (bodyText) => {
    if (!bodyText) return "No message content available.";

    const parts = [];
    const regex = /({{\s*[a-zA-Z0-9_-]+\s*}})/g;
    const tokens = bodyText.split(regex);

    tokens.forEach((token, idx) => {
      if (/^{{\s*[a-zA-Z0-9_-]+\s*}}$/.test(token)) {
        parts.push(
          <span key={idx} className="wa-variable-chip">
            {token}
          </span>
        );
      } else {
        parts.push(token);
      }
    });

    return parts;
  };

  // Live preview with values replaced
  const renderLivePreviewBody = (bodyText, varValues, fallbackName) => {
    if (!bodyText) return "";
    let preview = bodyText;

    Object.keys(varValues).forEach((vKey) => {
      const val = varValues[vKey] || (vKey === "1" ? fallbackName || `{{${vKey}}}` : `{{${vKey}}}`);
      const reg = new RegExp(`{{\\s*${vKey}\\s*}}`, "g");
      preview = preview.replace(reg, val);
    });

    return preview;
  };

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchSearch =
        !searchQuery.trim() ||
        tpl.template_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.template_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.body_content?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === "ALL" ||
        tpl.category?.toUpperCase() === selectedCategory.toUpperCase();

      const matchStatus =
        selectedStatus === "ALL" ||
        tpl.status?.toUpperCase() === selectedStatus.toUpperCase();

      return matchSearch && matchCategory && matchStatus;
    });
  }, [templates, searchQuery, selectedCategory, selectedStatus]);

  const isConnected = Boolean(settings?.is_connected);
  const activeBirthdayId = settings?.birthday_template_id;

  return (
    <AppLayout title="WhatsApp Templates">
      <div className="wa-templates-container">
        {/* 1. TOP HEADER & SYNC ACTION */}
        <div className="wa-templates-header">
          <div>
            <h1 className="wa-templates-title">WhatsApp Templates</h1>
            <p className="wa-templates-subtitle">
              Browse, test, and manage ChatterPillar approved message templates.
            </p>
          </div>

          <div className="wa-header-actions">
            <button
              type="button"
              className="wa-btn-primary"
              onClick={handleSyncTemplates}
              disabled={isSyncing}
              title="Fetch latest templates from ChatterPillar"
            >
              {isSyncing ? (
                <>
                  <Loader2 size={16} className="wa-spinner" />
                  <span>Syncing Templates...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  <span>Refresh Templates</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Alert Notification */}
        {alert && (
          <div
            className={`wa-alert-banner ${
              alert.type === "danger" ? "wa-alert-danger" : "wa-alert-success"
            }`}
          >
            {alert.type === "danger" ? (
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            ) : (
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            )}
            <div>{alert.message}</div>
          </div>
        )}

        {/* 2. DISCONNECTED STATE WARNING */}
        {!isConnected && (
          <div className="wa-disconnected-banner">
            <div className="wa-disconnected-info">
              <AlertCircle size={22} style={{ flexShrink: 0 }} />
              <div>
                <strong>WhatsApp is not connected.</strong> Connect your CP API Key in Settings to
                synchronize templates and send test messages.
              </div>
            </div>
            <Link
              to="/communication/whatsapp-settings"
              className="wa-btn-primary"
              style={{
                backgroundColor: "#ea580c",
                fontSize: "0.85rem",
                padding: "0.5rem 1rem",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Configure WhatsApp Settings &rarr;
            </Link>
          </div>
        )}

        {/* 3. ACTIVE BIRTHDAY TEMPLATE BANNER */}
        {settings?.birthday_template_data && (
          <div className="wa-birthday-banner">
            <div className="wa-birthday-banner-left">
              <div className="wa-birthday-icon-badge">
                <Cake size={22} />
              </div>
              <div>
                <h3 className="wa-birthday-banner-title">
                  Active Birthday Greeting Template: {settings.birthday_template_data.template_name}
                </h3>
                <p className="wa-birthday-banner-desc">
                  This template is designated for sending automated client birthday greetings across the CRM.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  backgroundColor: "#ffffff",
                  color: "#854d0e",
                  border: "1px solid #fde047",
                  padding: "0.3rem 0.65rem",
                  borderRadius: "20px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <Star size={14} style={{ fill: "#ca8a04", color: "#ca8a04" }} />
                DESIGNATED BIRTHDAY TEMPLATE
              </span>
            </div>
          </div>
        )}

        {/* 4. SEARCH & FILTER TOOLBAR */}
        <div className="wa-toolbar-card">
          <div className="wa-toolbar-top">
            <div className="wa-search-box">
              <Search size={16} className="wa-search-icon" />
              <input
                type="text"
                className="wa-search-input"
                placeholder="Search templates by name, ID, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
                Showing {filteredTemplates.length} of {templates.length} templates
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.775rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Category:
              </span>
              <div className="wa-filter-tabs">
                {["ALL", "MARKETING", "UTILITY", "AUTHENTICATION"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`wa-filter-tab ${selectedCategory === cat ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.775rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Status:
              </span>
              <div className="wa-filter-tabs">
                {["ALL", "APPROVED", "PENDING", "REJECTED"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`wa-filter-tab ${selectedStatus === st ? "active" : ""}`}
                    onClick={() => setSelectedStatus(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 5. TEMPLATES GRID / CARDS */}
        {isLoading ? (
          <div
            style={{
              padding: "4rem 2rem",
              textAlign: "center",
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              border: "1px solid #e2e2df",
            }}
          >
            <Loader2 size={32} className="wa-spinner" style={{ margin: "0 auto 1rem auto", color: "#9e241d" }} />
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>
              Loading WhatsApp Templates...
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
              Fetching cached templates from CRM database
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div
            style={{
              padding: "4rem 2rem",
              textAlign: "center",
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              border: "1px dashed #cbd5e1",
            }}
          >
            <MessageSquare size={36} style={{ margin: "0 auto 1rem auto", color: "#94a3b8" }} />
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
              {templates.length === 0 ? "No WhatsApp Templates Found" : "No Matching Templates"}
            </div>
            <p style={{ color: "#64748b", fontSize: "0.875rem", maxWidth: "450px", margin: "0.5rem auto 1.25rem auto" }}>
              {templates.length === 0
                ? "Click 'Refresh Templates' to download your approved message templates directly from your ChatterPillar account."
                : "No templates matched your search filters. Try clearing your search query or selecting 'ALL'."}
            </p>

            {templates.length === 0 && (
              <button
                type="button"
                className="wa-btn-primary"
                onClick={handleSyncTemplates}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Loader2 size={16} className="wa-spinner" />
                    <span>Syncing from ChatterPillar...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>Fetch Templates from ChatterPillar</span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="wa-templates-grid">
            {filteredTemplates.map((tpl) => {
              const isBirthday = activeBirthdayId === tpl.template_id;
              const isApproved = String(tpl.status).toUpperCase() === "APPROVED";

              let buttonsList = [];
              if (tpl.buttons) {
                try {
                  buttonsList =
                    typeof tpl.buttons === "string" ? JSON.parse(tpl.buttons) : tpl.buttons;
                } catch (e) {
                  buttonsList = [];
                }
              }

              return (
                <div
                  key={tpl.template_id || tpl.id}
                  className={`wa-tpl-card ${isBirthday ? "active-birthday" : ""}`}
                >
                  {/* Card Header */}
                  <div className="wa-tpl-card-header">
                    <div className="wa-tpl-meta-row">
                      <h4 className="wa-tpl-name">{tpl.template_name}</h4>
                      <div className="wa-tpl-badges">
                        <span
                          className={`wa-pill ${
                            isApproved
                              ? "wa-pill-approved"
                              : tpl.status === "PENDING"
                              ? "wa-pill-pending"
                              : "wa-pill-rejected"
                          }`}
                        >
                          {tpl.status || "APPROVED"}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      <span className="wa-pill wa-pill-category">
                        {tpl.category || "UTILITY"}
                      </span>
                      <span className="wa-pill wa-pill-lang">
                        {tpl.language || "en"}
                      </span>
                      {tpl.variable_count > 0 && (
                        <span
                          className="wa-pill"
                          style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}
                        >
                          {tpl.variable_count} {tpl.variable_count === 1 ? "Variable" : "Variables"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body (Chat Bubble Preview) */}
                  <div className="wa-tpl-card-body">
                    <div className="wa-chat-bubble">
                      {/* Header Content */}
                      {tpl.header_content && (
                        <div className="wa-bubble-header">
                          {tpl.header_content}
                        </div>
                      )}

                      {/* Body Content */}
                      <div className="wa-bubble-text">
                        {renderFormattedBody(tpl.body_content)}
                      </div>

                      {/* Footer Content */}
                      {tpl.footer_content && (
                        <div className="wa-bubble-footer">
                          {tpl.footer_content}
                        </div>
                      )}

                      {/* Button Actions Preview */}
                      {Array.isArray(buttonsList) && buttonsList.length > 0 && (
                        <div className="wa-bubble-buttons">
                          {buttonsList.map((btn, bIdx) => (
                            <div key={bIdx} className="wa-bubble-btn">
                              {btn.text || btn.title || "Button Action"}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="wa-tpl-card-footer">
                    {/* Birthday Template Selection Button */}
                    <button
                      type="button"
                      className={`wa-btn-birthday ${isBirthday ? "active" : ""}`}
                      onClick={() => handleSelectBirthday(tpl)}
                      disabled={!isApproved || isBirthday || isSettingBirthday === tpl.template_id}
                      title={
                        !isApproved
                          ? "Only APPROVED templates can be selected"
                          : isBirthday
                          ? "Currently selected birthday template"
                          : "Set as active birthday greeting template"
                      }
                    >
                      {isSettingBirthday === tpl.template_id ? (
                        <>
                          <Loader2 size={14} className="wa-spinner" />
                          <span>Setting...</span>
                        </>
                      ) : isBirthday ? (
                        <>
                          <Cake size={14} />
                          <span>Active Birthday</span>
                        </>
                      ) : (
                        <>
                          <Cake size={14} />
                          <span>Use for Birthday</span>
                        </>
                      )}
                    </button>

                    {/* Test Send Button */}
                    <button
                      type="button"
                      className="wa-btn-test-send"
                      onClick={() => handleOpenTestModal(tpl)}
                      title="Send test message to your phone"
                    >
                      <Send size={14} />
                      <span>Test Send</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. TEST SEND MODAL */}
      {testModalTemplate && (
        <div className="wa-modal-overlay">
          <div className="wa-modal-card">
            <div className="wa-modal-header">
              <div>
                <h3 className="wa-modal-title">Send Test WhatsApp Message</h3>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Template: <strong>{testModalTemplate.template_name}</strong>
                </span>
              </div>
              <button
                type="button"
                className="wa-modal-close-btn"
                onClick={handleCloseTestModal}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Alerts */}
            {testFeedback && (
              <div
                className={`wa-alert-banner ${
                  testFeedback.type === "danger" ? "wa-alert-danger" : "wa-alert-success"
                }`}
              >
                {testFeedback.type === "danger" ? (
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                ) : (
                  <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                )}
                <div>{testFeedback.message}</div>
              </div>
            )}

            <form onSubmit={handleSendTestSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Recipient Full Name */}
              <div className="wa-form-group">
                <label className="wa-form-label">
                  <User size={14} />
                  <span>Recipient Full Name</span>
                  <span style={{ color: "#9e241d" }}>*</span>
                </label>
                <input
                  type="text"
                  className="wa-form-input"
                  placeholder="e.g. Rahul Sharma"
                  value={testFullName}
                  onChange={(e) => setTestFullName(e.target.value)}
                  required
                />
              </div>

              {/* Recipient WhatsApp Mobile */}
              <div className="wa-form-group">
                <label className="wa-form-label">
                  <Smartphone size={14} />
                  <span>Recipient WhatsApp Mobile</span>
                  <span style={{ color: "#9e241d" }}>*</span>
                </label>
                <input
                  type="text"
                  className="wa-form-input"
                  placeholder="e.g. 9876543210 or 919876543210"
                  value={testMobile}
                  onChange={(e) => setTestMobile(e.target.value)}
                  required
                />
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Enter standard 10-digit mobile number or full E.164 phone number.
                </span>
              </div>

              {/* Dynamic Template Variables */}
              {Object.keys(testVariables).length > 0 && (
                <div className="wa-variables-section">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <SlidersHorizontal size={14} color="#475569" />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
                      Template Variables ({Object.keys(testVariables).length})
                    </span>
                  </div>

                  {Object.keys(testVariables).map((vKey) => (
                    <div key={vKey} className="wa-form-group">
                      <label className="wa-form-label">
                        <span>Value for variable</span>
                        <code style={{ color: "#2563eb", background: "#eff6ff", padding: "0.1rem 0.3rem", borderRadius: "3px" }}>
                          {`{{${vKey}}}`}
                        </code>
                      </label>
                      <input
                        type="text"
                        className="wa-form-input"
                        placeholder={vKey === "1" ? "e.g. Rahul" : `Sample value for {{${vKey}}}`}
                        value={testVariables[vKey]}
                        onChange={(e) =>
                          setTestVariables((prev) => ({
                            ...prev,
                            [vKey]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Live Preview of Rendered Message */}
              <div className="wa-form-group">
                <label className="wa-form-label">
                  <Info size={14} />
                  <span>Live Rendered Preview</span>
                </label>
                <div className="wa-live-preview-box">
                  <div className="wa-chat-bubble">
                    <div className="wa-bubble-text" style={{ fontSize: "0.85rem" }}>
                      {renderLivePreviewBody(
                        testModalTemplate.body_content,
                        testVariables,
                        testFullName
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="wa-btn-secondary"
                  onClick={handleCloseTestModal}
                  disabled={isSendingTest}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="wa-btn-primary"
                  disabled={isSendingTest}
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 size={16} className="wa-spinner" />
                      <span>Sending Test Message...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Send Test Message</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default WhatsAppTemplates;
