import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import {
  Cake,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  User,
  Search,
  X,
  Check,
  SlidersHorizontal,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import WhatsAppService from "../../services/whatsapp.service";
import ClientService from "../../services/client.service";
import "./WhatsAppConfiguration.css";

const WhatsAppConfiguration = () => {
  const { token } = useAuth();

  // Settings & Templates Data
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [clientTypes, setClientTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Global Alert
  const [alert, setAlert] = useState(null);

  // Section 1: Automated Templates State
  const [selectedBirthdayId, setSelectedBirthdayId] = useState("");
  const [selectedOtpId, setSelectedOtpId] = useState("");
  const [isSavingBirthday, setIsSavingBirthday] = useState(false);
  const [isSavingOtp, setIsSavingOtp] = useState(false);

  // Section 2: Manual WhatsApp Sending State
  const [manualTemplateId, setManualTemplateId] = useState("");
  const [sendToType, setSendToType] = useState("ALL"); // 'ALL' | 'CLIENT_TYPE' | 'SELECTED'
  const [selectedClientTypeId, setSelectedClientTypeId] = useState("");
  const [selectedClients, setSelectedClients] = useState([]); // Array of { id, name, mobile_no }
  const [variableMappings, setVariableMappings] = useState({}); // { '1': '{{client_name}}', '2': 'Custom text' }

  // Recipient Count & Client Search
  const [recipientCount, setRecipientCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState([]);
  const [isSearchingClients, setIsSearchingClients] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchDropdownRef = useRef(null);

  // Modals State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSendingManual, setIsSendingManual] = useState(false);
  const [sendResults, setSendResults] = useState(null);

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  // Helper to safely extract template body text
  const getTemplateBody = useCallback((tpl) => {
    if (!tpl) return "";
    if (tpl.body_content && tpl.body_content.trim()) return tpl.body_content;
    if (tpl.body_text && tpl.body_text.trim()) return tpl.body_text;
    if (tpl.raw_data) {
      try {
        const raw = typeof tpl.raw_data === "string" ? JSON.parse(tpl.raw_data) : tpl.raw_data;
        if (raw?.body_text && raw.body_text.trim()) return raw.body_text;
        if (raw?.body_content && raw.body_content.trim()) return raw.body_content;
        if (raw?.body && raw.body.trim()) return raw.body;
      } catch (e) {
        // ignore
      }
    }
    return "";
  }, []);

  // Parse template variables array
  const getTemplateVariables = useCallback((tpl) => {
    if (!tpl) return [];
    let varsList = [];
    if (tpl.variables) {
      try {
        varsList = typeof tpl.variables === "string" ? JSON.parse(tpl.variables) : tpl.variables;
      } catch (e) {
        varsList = [];
      }
    }
    if (!Array.isArray(varsList) || varsList.length === 0) {
      const body = getTemplateBody(tpl);
      const matches = [];
      const regex = /{{\s*([a-zA-Z0-9_-]+)\s*}}/g;
      let m;
      while ((m = regex.exec(body || "")) !== null) {
        if (!matches.includes(m[1])) matches.push(m[1]);
      }
      varsList = matches;
    }
    varsList.sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return String(a).localeCompare(String(b));
    });
    return varsList;
  }, [getTemplateBody]);

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [settingsRes, templatesRes, clientTypesRes] = await Promise.allSettled([
        WhatsAppService.getSettings(token),
        WhatsAppService.getTemplates({ limit: 100 }, token),
        ClientService.getClientTypes(token),
      ]);

      if (settingsRes.status === "fulfilled" && settingsRes.value?.success) {
        const sData = settingsRes.value.data;
        setSettings(sData);
        if (sData.birthday_template_id) {
          setSelectedBirthdayId(sData.birthday_template_id);
        }
        if (sData.otp_template_id) {
          setSelectedOtpId(sData.otp_template_id);
        }
      }

      if (templatesRes.status === "fulfilled" && templatesRes.value?.success) {
        setTemplates(templatesRes.value.data?.templates || []);
      }

      if (clientTypesRes.status === "fulfilled" && clientTypesRes.value?.success) {
        setClientTypes(clientTypesRes.value.data || []);
      }
    } catch (err) {
      console.error("Error loading configuration data:", err);
      showAlert(err.message || "Failed to load WhatsApp configuration.", "danger");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Approved templates list
  const approvedTemplates = useMemo(() => {
    return templates.filter((tpl) => String(tpl.status).toUpperCase() === "APPROVED");
  }, [templates]);

  // OTP templates filtered list (Strictly AUTHENTICATION category or name contains otp)
  const otpTemplates = useMemo(() => {
    return approvedTemplates.filter(
      (tpl) =>
        String(tpl.category).toUpperCase() === "AUTHENTICATION" ||
        String(tpl.template_name).toLowerCase().includes("otp") ||
        String(tpl.template_name).toLowerCase().includes("auth")
    );
  }, [approvedTemplates]);

  // Currently selected automated templates objects
  const selectedBirthdayTemplate = useMemo(() => {
    return approvedTemplates.find((tpl) => tpl.template_id === selectedBirthdayId) || null;
  }, [approvedTemplates, selectedBirthdayId]);

  const selectedOtpTemplate = useMemo(() => {
    return approvedTemplates.find((tpl) => tpl.template_id === selectedOtpId) || null;
  }, [approvedTemplates, selectedOtpId]);

  // Currently selected manual send template
  const manualTemplate = useMemo(() => {
    return approvedTemplates.find((tpl) => tpl.template_id === manualTemplateId) || null;
  }, [approvedTemplates, manualTemplateId]);

  // Auto-initialize variable mappings when manual template changes
  useEffect(() => {
    if (!manualTemplate) {
      setVariableMappings({});
      return;
    }
    const varKeys = getTemplateVariables(manualTemplate);
    const initialMap = {};
    varKeys.forEach((key, index) => {
      // Default first variable to {{client_name}}
      if (index === 0 || key === "1" || String(key).toLowerCase() === "name") {
        initialMap[key] = "{{client_name}}";
      } else {
        initialMap[key] = "";
      }
    });
    setVariableMappings(initialMap);
  }, [manualTemplate, getTemplateVariables]);

  // Update Recipient Count dynamically
  useEffect(() => {
    let isCancelled = false;

    const fetchCount = async () => {
      setIsLoadingCount(true);
      try {
        const clientIds = selectedClients.map((c) => c.id);
        const res = await WhatsAppService.getManualRecipientsCount(
          {
            sendToType,
            clientTypeId: selectedClientTypeId || null,
            clientIds,
          },
          token
        );
        if (!isCancelled && res?.success) {
          setRecipientCount(res.data?.count || 0);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error fetching recipient count:", err);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingCount(false);
        }
      }
    };

    fetchCount();

    return () => {
      isCancelled = true;
    };
  }, [sendToType, selectedClientTypeId, selectedClients, token]);

  // Search clients for Selected Clients mode
  useEffect(() => {
    if (!clientSearchQuery.trim()) {
      setClientSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingClients(true);
      try {
        const res = await ClientService.getClients(
          {
            search: clientSearchQuery.trim(),
            status: "active",
            limit: 20,
          },
          token
        );
        if (res?.success) {
          const list = res.data?.clients || res.data || [];
          setClientSearchResults(Array.isArray(list) ? list : []);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error("Error searching clients:", err);
      } finally {
        setIsSearchingClients(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [clientSearchQuery, token]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save Birthday Template Handler
  const handleSaveBirthday = async () => {
    if (!selectedBirthdayId) {
      showAlert("Please select a template for Birthday Greetings.", "danger");
      return;
    }

    setIsSavingBirthday(true);
    try {
      const res = await WhatsAppService.selectBirthdayTemplate(selectedBirthdayId, token);
      if (res?.success) {
        showAlert(
          res.message || "Active Birthday Greeting template updated successfully!"
        );
        setSettings((prev) => ({
          ...prev,
          birthday_template_id: selectedBirthdayId,
          birthday_template_data: selectedBirthdayTemplate,
        }));
      } else {
        showAlert(res?.message || "Failed to update birthday template.", "danger");
      }
    } catch (err) {
      console.error("Save birthday error:", err);
      showAlert(err.message || "Failed to save birthday template.", "danger");
    } finally {
      setIsSavingBirthday(false);
    }
  };

  // Save Client Login OTP Template Handler
  const handleSaveOtp = async () => {
    if (!selectedOtpId) {
      showAlert("Please select a template for Client Login OTP.", "danger");
      return;
    }

    setIsSavingOtp(true);
    try {
      const res = await WhatsAppService.selectOtpTemplate(selectedOtpId, token);
      if (res?.success) {
        showAlert(
          res.message || "Active Client Portal OTP template updated successfully!"
        );
        setSettings((prev) => ({
          ...prev,
          otp_template_id: selectedOtpId,
          otp_template_data: selectedOtpTemplate,
        }));
      } else {
        showAlert(res?.message || "Failed to update OTP template.", "danger");
      }
    } catch (err) {
      console.error("Save OTP error:", err);
      showAlert(err.message || "Failed to save OTP template.", "danger");
    } finally {
      setIsSavingOtp(false);
    }
  };

  // Handle Client Selection / De-selection
  const handleSelectClient = (client) => {
    if (!selectedClients.some((c) => c.id === client.id)) {
      setSelectedClients((prev) => [...prev, client]);
    }
    setClientSearchQuery("");
    setShowSearchDropdown(false);
  };

  const handleRemoveClient = (clientId) => {
    setSelectedClients((prev) => prev.filter((c) => c.id !== clientId));
  };

  // Render chat bubble text with substituted variables or placeholder chips
  const renderBubblePreview = (bodyContent, varMap = {}, isSample = true) => {
    if (!bodyContent) return "";
    const parts = [];
    const regex = /{{\s*([a-zA-Z0-9_-]+)\s*}}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(bodyContent)) !== null) {
      if (match.index > lastIndex) {
        parts.push(bodyContent.substring(lastIndex, match.index));
      }
      const vKey = match[1];
      const mappedVal = varMap[vKey];

      if (mappedVal === "{{client_name}}") {
        parts.push(
          <span key={match.index} className="wa-chip-var" title="Dynamic Client Name">
            {isSample ? "Ram Sharma" : "[Client Name]"}
          </span>
        );
      } else if (mappedVal === "{{client_mobile}}") {
        parts.push(
          <span key={match.index} className="wa-chip-var" title="Dynamic Mobile">
            {isSample ? "+91 9876543210" : "[Client Mobile]"}
          </span>
        );
      } else if (mappedVal && mappedVal.trim()) {
        parts.push(
          <span key={match.index} className="wa-chip-var" style={{ color: "#166534", backgroundColor: "#dcfce7", borderColor: "#86efac" }}>
            {mappedVal}
          </span>
        );
      } else {
        parts.push(
          <span key={match.index} className="wa-chip-var">
            {`{{${vKey}}}`}
          </span>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < bodyContent.length) {
      parts.push(bodyContent.substring(lastIndex));
    }

    return parts;
  };

  // Manual Broadcast Execution
  const handleExecuteSend = async () => {
    setIsSendingManual(true);
    try {
      const clientIds = selectedClients.map((c) => c.id);
      const res = await WhatsAppService.sendManualTemplateMessage(
        {
          template_id: manualTemplateId,
          send_to_type: sendToType,
          client_type_id: selectedClientTypeId ? parseInt(selectedClientTypeId, 10) : null,
          client_ids: clientIds,
          variable_mappings: variableMappings,
        },
        token
      );

      if (res?.success) {
        setShowConfirmModal(false);
        setSendResults(res.data || res);
        showAlert(res.message || "WhatsApp message broadcast completed!");
      } else {
        showAlert(res?.message || "Broadcast failed.", "danger");
      }
    } catch (err) {
      console.error("Execute manual send error:", err);
      showAlert(err.message || "Failed to dispatch WhatsApp messages.", "danger");
    } finally {
      setIsSendingManual(false);
    }
  };

  const isConnected = Boolean(settings?.is_connected);

  return (
    <AppLayout title="WhatsApp Configuration">
      <div className="wa-config-container">
        {/* Top Header */}
        <div className="wa-config-header">
          <div>
            <h1 className="wa-config-title">WhatsApp Configuration</h1>
            <p className="wa-config-subtitle">
              Assign automated WhatsApp templates for CRM workflows and broadcast messages to clients.
            </p>
          </div>
          <div>
            <Link
              to="/communication/whatsapp-templates"
              className="wa-btn-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" }}
            >
              <span>View Template Library</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Global Alert Notification */}
        {alert && (
          <div
            className={`wa-alert-banner ${
              alert.type === "danger" ? "wa-alert-danger" : "wa-alert-success"
            }`}
            style={{
              padding: "0.85rem 1.25rem",
              borderRadius: "8px",
              backgroundColor: alert.type === "danger" ? "#fee2e2" : "#dcfce7",
              color: alert.type === "danger" ? "#991b1b" : "#166534",
              border: `1px solid ${alert.type === "danger" ? "#fecaca" : "#bbf7d0"}`,
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              fontSize: "0.9rem",
            }}
          >
            {alert.type === "danger" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <div>{alert.message}</div>
          </div>
        )}

        {/* Disconnected Warning */}
        {!isConnected && (
          <div className="wa-config-disconnected">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <AlertCircle size={22} style={{ flexShrink: 0 }} />
              <div>
                <strong>WhatsApp is not connected.</strong> Connect your ChatterPillar API credentials in WhatsApp Settings to enable automated and manual WhatsApp sending.
              </div>
            </div>
            <Link
              to="/communication/whatsapp-settings"
              className="wa-btn-save"
              style={{ textDecoration: "none", whiteSpace: "nowrap" }}
            >
              Configure Settings &rarr;
            </Link>
          </div>
        )}

        {/* SECTION 1 — Automated Templates */}
        <div className="wa-section-card">
          <div className="wa-section-header">
            <h2 className="wa-section-title">
              <SlidersHorizontal size={20} style={{ color: "#9e241d" }} />
              <span>Automated Templates</span>
            </h2>
            <p className="wa-section-desc">
              Configure templates used automatically by CRM background workflows and client security authentications.
            </p>
          </div>

          <div className="wa-automated-grid">
            {/* Card 1: Birthday Greeting */}
            <div className="wa-auto-card">
              <div className="wa-auto-card-top">
                <div className="wa-auto-card-meta">
                  <div className="wa-auto-icon-badge wa-auto-icon-birthday">
                    <Cake size={20} />
                  </div>
                  <div>
                    <h3 className="wa-auto-card-title">Birthday Greeting</h3>
                    <p className="wa-auto-card-desc">
                      Template used for automatically sending birthday greetings to clients on their date of birth.
                    </p>
                  </div>
                </div>
                {settings?.birthday_template_id && (
                  <span className="wa-status-badge active">
                    <Check size={12} />
                    Active in CRM
                  </span>
                )}
              </div>

              <div className="wa-form-group">
                <label className="wa-form-label">
                  <span>Selected Template</span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Approved only</span>
                </label>
                <select
                  className="wa-select-control"
                  value={selectedBirthdayId}
                  onChange={(e) => setSelectedBirthdayId(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">-- Select Birthday Template --</option>
                  {approvedTemplates.map((tpl) => (
                    <option key={tpl.template_id} value={tpl.template_id}>
                      {tpl.template_name} ({tpl.category || "UTILITY"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Preview */}
              {selectedBirthdayTemplate && (
                <div className="wa-preview-box">
                  <div className="wa-preview-box-header">
                    <span>Template Preview</span>
                    <span style={{ color: "#9e241d" }}>
                      {selectedBirthdayTemplate.language || "en"}
                    </span>
                  </div>
                  <div className="wa-bubble-preview">
                    {renderBubblePreview(getTemplateBody(selectedBirthdayTemplate), {
                      1: "{{client_name}}",
                    })}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
                    Variables: <span className="wa-chip-var">{"{{1}}"}</span> = Client Full Name,{" "}
                    <span className="wa-chip-var">{"{{2}}"}</span> = Age (if applicable).
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="wa-btn-save"
                  onClick={handleSaveBirthday}
                  disabled={
                    isSavingBirthday ||
                    !selectedBirthdayId ||
                    selectedBirthdayId === settings?.birthday_template_id
                  }
                >
                  {isSavingBirthday ? (
                    <>
                      <Loader2 size={14} className="wa-spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Birthday Template</span>
                  )}
                </button>
              </div>
            </div>

            {/* Card 2: Client Login OTP */}
            <div className="wa-auto-card">
              <div className="wa-auto-card-top">
                <div className="wa-auto-card-meta">
                  <div className="wa-auto-icon-badge wa-auto-icon-otp">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="wa-auto-card-title">Client Login OTP</h3>
                    <p className="wa-auto-card-desc">
                      Authentication template used when clients request WhatsApp OTP login in the Client Portal.
                    </p>
                  </div>
                </div>
                {settings?.otp_template_id && (
                  <span className="wa-status-badge active">
                    <Check size={12} />
                    Active in CRM
                  </span>
                )}
              </div>

              <div className="wa-form-group">
                <label className="wa-form-label">
                  <span>Selected Template</span>
                  <span style={{ fontSize: "0.75rem", color: "#2563eb" }}>
                    Authentication Category
                  </span>
                </label>
                <select
                  className="wa-select-control"
                  value={selectedOtpId}
                  onChange={(e) => setSelectedOtpId(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">-- Select Authentication Template --</option>
                  {otpTemplates.map((tpl) => (
                    <option key={tpl.template_id} value={tpl.template_id}>
                      {tpl.template_name} ({tpl.category})
                    </option>
                  ))}
                </select>
                {otpTemplates.length === 0 && (
                  <div style={{ fontSize: "0.775rem", color: "#b45309", marginTop: "0.25rem" }}>
                    No AUTHENTICATION category templates found. Please create and approve an Authentication template in Meta/ChatterPillar, then click "Refresh Templates" in WhatsApp Templates.
                  </div>
                )}
              </div>

              {/* Template Preview */}
              {selectedOtpTemplate && (
                <div className="wa-preview-box">
                  <div className="wa-preview-box-header">
                    <span>OTP Template Preview</span>
                    <span style={{ color: "#2563eb" }}>
                      {selectedOtpTemplate.language || "en"}
                    </span>
                  </div>
                  <div className="wa-bubble-preview">
                    {renderBubblePreview(getTemplateBody(selectedOtpTemplate), {
                      1: "123456",
                    })}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
                    Variable: <span className="wa-chip-var">{"{{1}}"}</span> = 6-digit WhatsApp OTP verification code.
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="wa-btn-save"
                  onClick={handleSaveOtp}
                  disabled={
                    isSavingOtp ||
                    !selectedOtpId ||
                    selectedOtpId === settings?.otp_template_id
                  }
                >
                  {isSavingOtp ? (
                    <>
                      <Loader2 size={14} className="wa-spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save OTP Template</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 — Manual WhatsApp Sending */}
        <div className="wa-section-card">
          <div className="wa-section-header">
            <h2 className="wa-section-title">
              <Send size={20} style={{ color: "#16a34a" }} />
              <span>Send WhatsApp Message</span>
            </h2>
            <p className="wa-section-desc">
              Broadcast an approved WhatsApp message template directly to targeted client groups or selected individuals.
            </p>
          </div>

          <div className="wa-manual-layout">
            {/* Form Column */}
            <div className="wa-manual-form">
              {/* 1. Template Selector */}
              <div className="wa-form-group">
                <label className="wa-form-label">
                  <span>1. Select Message Template</span>
                  {manualTemplate && (
                    <span style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 700 }}>
                      {manualTemplate.category} &bull; {manualTemplate.language || "en"}
                    </span>
                  )}
                </label>
                <select
                  className="wa-select-control"
                  value={manualTemplateId}
                  onChange={(e) => setManualTemplateId(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">-- Choose Approved Template --</option>
                  {approvedTemplates.map((tpl) => (
                    <option key={tpl.template_id} value={tpl.template_id}>
                      {tpl.template_name} ({tpl.category || "UTILITY"})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Recipient Selector */}
              <div className="wa-form-group">
                <label className="wa-form-label">
                  <span>2. Select Recipients ("Send To")</span>
                  <div className="wa-count-badge">
                    {isLoadingCount ? (
                      <Loader2 size={13} className="wa-spinner" />
                    ) : (
                      <Users size={13} />
                    )}
                    <span>
                      {isLoadingCount
                        ? "Calculating..."
                        : `${recipientCount} Eligible ${recipientCount === 1 ? "Recipient" : "Recipients"}`}
                    </span>
                  </div>
                </label>

                {/* Recipient Mode Tabs */}
                <div className="wa-recipient-tabs">
                  <button
                    type="button"
                    className={`wa-recipient-tab ${sendToType === "ALL" ? "active" : ""}`}
                    onClick={() => setSendToType("ALL")}
                  >
                    <Users size={14} />
                    <span>All Clients</span>
                  </button>
                  <button
                    type="button"
                    className={`wa-recipient-tab ${sendToType === "CLIENT_TYPE" ? "active" : ""}`}
                    onClick={() => setSendToType("CLIENT_TYPE")}
                  >
                    <Layers size={14} />
                    <span>By Client Type</span>
                  </button>
                  <button
                    type="button"
                    className={`wa-recipient-tab ${sendToType === "SELECTED" ? "active" : ""}`}
                    onClick={() => setSendToType("SELECTED")}
                  >
                    <User size={14} />
                    <span>Selected Clients</span>
                  </button>
                </div>

                {/* Mode Sub-controls */}
                {sendToType === "CLIENT_TYPE" && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <select
                      className="wa-select-control"
                      value={selectedClientTypeId}
                      onChange={(e) => setSelectedClientTypeId(e.target.value)}
                    >
                      <option value="">-- Choose Client Type --</option>
                      {clientTypes.map((ct) => (
                        <option key={ct.id} value={ct.id}>
                          {ct.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {sendToType === "SELECTED" && (
                  <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {/* Search Input */}
                    <div className="wa-search-client-box" ref={searchDropdownRef}>
                      <div style={{ position: "relative" }}>
                        <Search
                          size={15}
                          style={{
                            position: "absolute",
                            left: "0.75rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#94a3b8",
                          }}
                        />
                        <input
                          type="text"
                          className="wa-input-control"
                          style={{ paddingLeft: "2.25rem" }}
                          placeholder="Search active clients by Name, Mobile, PAN, UCC..."
                          value={clientSearchQuery}
                          onChange={(e) => setClientSearchQuery(e.target.value)}
                          onFocus={() => {
                            if (clientSearchResults.length > 0) setShowSearchDropdown(true);
                          }}
                        />
                        {isSearchingClients && (
                          <Loader2
                            size={14}
                            className="wa-spinner"
                            style={{
                              position: "absolute",
                              right: "0.75rem",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "#94a3b8",
                            }}
                          />
                        )}
                      </div>

                      {/* Dropdown Search Results */}
                      {showSearchDropdown && clientSearchResults.length > 0 && (
                        <div className="wa-search-client-results">
                          {clientSearchResults.map((cl) => {
                            const isAlreadySelected = selectedClients.some((c) => c.id === cl.id);
                            return (
                              <div
                                key={cl.id}
                                className={`wa-search-result-item ${isAlreadySelected ? "selected" : ""}`}
                                onClick={() => {
                                  if (!isAlreadySelected) handleSelectClient(cl);
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1e293b" }}>
                                    {cl.name}
                                  </div>
                                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                    {cl.mobile_no || cl.whatsapp_no || "No Mobile"} &bull; PAN: {cl.pan_no || "N/A"}
                                  </div>
                                </div>
                                <div>
                                  {isAlreadySelected ? (
                                    <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 700 }}>
                                      Selected
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 600 }}>
                                      + Add
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Selected Clients Chips */}
                    {selectedClients.length > 0 && (
                      <div className="wa-selected-chips-container">
                        {selectedClients.map((client) => (
                          <span key={client.id} className="wa-client-chip">
                            <span>{client.name}</span>
                            <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                              ({client.mobile_no || client.whatsapp_no || ""})
                            </span>
                            <button
                              type="button"
                              className="wa-chip-remove"
                              onClick={() => handleRemoveClient(client.id)}
                              title="Remove client"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Variables Configuration Table */}
              {manualTemplate && getTemplateVariables(manualTemplate).length > 0 && (
                <div className="wa-form-group">
                  <label className="wa-form-label">
                    <span>3. Configure Template Variables</span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      Dynamic per-client or custom text
                    </span>
                  </label>

                  <table className="wa-vars-table">
                    <thead>
                      <tr>
                        <th style={{ width: "25%" }}>Variable</th>
                        <th>Mapped Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getTemplateVariables(manualTemplate).map((vKey) => {
                        const currentVal = variableMappings[vKey] || "";
                        const isDynamicName = currentVal === "{{client_name}}";
                        const isDynamicMobile = currentVal === "{{client_mobile}}";
                        const isCustom = !isDynamicName && !isDynamicMobile;

                        return (
                          <tr key={vKey}>
                            <td>
                              <span className="wa-chip-var">{`{{${vKey}}}`}</span>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                <select
                                  className="wa-select-control"
                                  style={{ width: "auto", minWidth: "180px", flex: 1 }}
                                  value={
                                    isDynamicName
                                      ? "{{client_name}}"
                                      : isDynamicMobile
                                      ? "{{client_mobile}}"
                                      : "CUSTOM"
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setVariableMappings((prev) => ({
                                      ...prev,
                                      [vKey]: val === "CUSTOM" ? "" : val,
                                    }));
                                  }}
                                >
                                  <option value="{{client_name}}">Client Full Name (Dynamic)</option>
                                  <option value="{{client_mobile}}">Client Mobile Number (Dynamic)</option>
                                  <option value="CUSTOM">Custom Text Input</option>
                                </select>

                                {isCustom && (
                                  <input
                                    type="text"
                                    className="wa-input-control"
                                    style={{ flex: 1, minWidth: "150px" }}
                                    placeholder={`Enter value for {{${vKey}}}...`}
                                    value={currentVal}
                                    onChange={(e) => {
                                      const text = e.target.value;
                                      setVariableMappings((prev) => ({
                                        ...prev,
                                        [vKey]: text,
                                      }));
                                    }}
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Broadcast Send Button */}
              <div style={{ marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="wa-btn-broadcast"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!manualTemplateId || recipientCount === 0 || isLoadingCount}
                >
                  <Send size={16} />
                  <span>Review & Send WhatsApp Message</span>
                </button>
              </div>
            </div>

            {/* Live Preview Column */}
            <div className="wa-manual-preview-col">
              <div className="wa-form-label">
                <span>Rendered Message Sample Preview</span>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Live preview</span>
              </div>

              <div
                style={{
                  backgroundColor: "#f0f2f5",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {manualTemplate ? (
                  <div className="wa-chat-bubble">
                    {manualTemplate.header_content && (
                      <div className="wa-bubble-header">{manualTemplate.header_content}</div>
                    )}
                    <div className="wa-bubble-text">
                      {renderBubblePreview(
                        getTemplateBody(manualTemplate),
                        variableMappings,
                        true
                      )}
                    </div>
                    {manualTemplate.footer_content && (
                      <div className="wa-bubble-footer">{manualTemplate.footer_content}</div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2.5rem 1rem",
                      color: "#94a3b8",
                      fontSize: "0.875rem",
                    }}
                  >
                    Select an approved WhatsApp template to preview the rendered message bubble here.
                  </div>
                )}
              </div>

              {manualTemplate && (
                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "0.85rem 1rem",
                    fontSize: "0.8rem",
                    color: "#64748b",
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "0.25rem" }}>
                    WhatsApp Broadcast Information
                  </div>
                  <div>&bull; Recipient Filter: <strong>{sendToType === "ALL" ? "All Active Clients" : sendToType === "CLIENT_TYPE" ? "Specific Client Type" : "Manually Selected"}</strong></div>
                  <div>&bull; Target Recipient Count: <strong>{recipientCount} clients</strong></div>
                  <div>&bull; Delivery Channel: <strong>ChatterPillar WhatsApp Cloud API</strong></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* REVIEW & CONFIRMATION MODAL */}
        {showConfirmModal && manualTemplate && (
          <div className="wa-modal-overlay">
            <div className="wa-modal-card">
              <div className="wa-modal-header">
                <h3 className="wa-modal-title">
                  <Send size={18} style={{ color: "#16a34a" }} />
                  <span>Confirm WhatsApp Broadcast</span>
                </h3>
                <button
                  type="button"
                  className="wa-modal-close-btn"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSendingManual}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="wa-modal-body">
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "0.85rem 1rem",
                    color: "#991b1b",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.6rem",
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>Important Safety Confirmation:</strong> WhatsApp messages are dispatched directly to clients' mobile devices and cannot be recalled or edited once sent.
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                    <strong>Template:</strong> {manualTemplate.template_name} ({manualTemplate.category})
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                    <strong>Target Audience:</strong>{" "}
                    {sendToType === "ALL"
                      ? "All Active Clients"
                      : sendToType === "CLIENT_TYPE"
                      ? "Selected Client Type"
                      : `${selectedClients.length} Manually Selected Clients`}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#166534", fontWeight: 700 }}>
                    <strong>Total Recipients:</strong> {recipientCount} active clients with valid mobile numbers
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                    Sample Message Preview:
                  </div>
                  <div className="wa-bubble-preview" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    {renderBubblePreview(
                      getTemplateBody(manualTemplate),
                      variableMappings,
                      true
                    )}
                  </div>
                </div>
              </div>

              <div className="wa-modal-footer">
                <button
                  type="button"
                  className="wa-btn-secondary"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSendingManual}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="wa-btn-broadcast"
                  onClick={handleExecuteSend}
                  disabled={isSendingManual}
                >
                  {isSendingManual ? (
                    <>
                      <Loader2 size={16} className="wa-spinner" />
                      <span>Sending Messages...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Confirm & Send to {recipientCount} Clients</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS SUMMARY MODAL */}
        {sendResults && (
          <div className="wa-modal-overlay">
            <div className="wa-modal-card">
              <div className="wa-modal-header">
                <h3 className="wa-modal-title">
                  <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
                  <span>Broadcast Results Summary</span>
                </h3>
                <button
                  type="button"
                  className="wa-modal-close-btn"
                  onClick={() => setSendResults(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="wa-modal-body">
                {/* Stats */}
                <div className="wa-stats-grid">
                  <div className="wa-stat-card total">
                    <span className="wa-stat-number">{sendResults.total || 0}</span>
                    <span className="wa-stat-label">Total Target</span>
                  </div>
                  <div className="wa-stat-card sent">
                    <span className="wa-stat-number">{sendResults.sent || 0}</span>
                    <span className="wa-stat-label">Delivered</span>
                  </div>
                  <div className="wa-stat-card failed">
                    <span className="wa-stat-number">{sendResults.failed || 0}</span>
                    <span className="wa-stat-label">Failed</span>
                  </div>
                </div>

                {/* Failures list if any */}
                {Array.isArray(sendResults.failures) && sendResults.failures.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#991b1b" }}>
                      Failures ({sendResults.failures.length}):
                    </div>
                    <div
                      style={{
                        maxHeight: "180px",
                        overflowY: "auto",
                        border: "1px solid #fee2e2",
                        borderRadius: "6px",
                      }}
                    >
                      <table className="wa-vars-table">
                        <thead>
                          <tr>
                            <th>Client</th>
                            <th>Mobile</th>
                            <th>Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sendResults.failures.map((f, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{f.client_name}</td>
                              <td>{f.mobile}</td>
                              <td style={{ color: "#b91c1c", fontSize: "0.775rem" }}>
                                {f.reason}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="wa-modal-footer">
                <button
                  type="button"
                  className="wa-btn-save"
                  style={{ backgroundColor: "#1e293b" }}
                  onClick={() => setSendResults(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default WhatsAppConfiguration;
