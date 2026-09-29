import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import {
  MessageSquare,
  Phone,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Unlink,
  Info,
  ShieldCheck,
  Loader2,
  Cake,
  ExternalLink,
  Save,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import WhatsAppService from "../../services/whatsapp.service";
import "./WhatsAppSettings.css";

const WhatsAppSettings = () => {
  const { token } = useAuth();

  // Settings State from Backend
  const [settings, setSettings] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // UI / Action Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Notifications & Modals
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;

  // Fetch Settings from Backend
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await WhatsAppService.getSettings(token);
      if (response && response.success && response.data) {
        setSettings(response.data);
        setMobileInput(response.data.whatsapp_mobile || "");
        // If an API key is configured, show the masked key in the input
        if (response.data.cp_api_key) {
          setApiKeyInput(response.data.cp_api_key);
        } else {
          setApiKeyInput("");
        }
      }
    } catch (err) {
      console.error("Failed to load WhatsApp settings:", err);
      setErrorMessage(err.message || "Failed to load WhatsApp configuration.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Connect / Save WhatsApp Credentials
  const handleSaveAndConnect = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!apiKeyInput.trim()) {
      setErrorMessage("ChatterPillar API Key is required.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        cp_api_key: apiKeyInput.trim(),
        whatsapp_mobile: mobileInput.trim() || null,
      };

      // Save credentials first
      const saveRes = settings?.id
        ? await WhatsAppService.updateSettings(payload, token)
        : await WhatsAppService.createSettings(payload, token);

      if (!saveRes || !saveRes.success) {
        throw new Error(saveRes?.message || "Failed to save WhatsApp settings.");
      }

      // Automatically run connection verification
      try {
        const testRes = await WhatsAppService.testConnection(token);
        if (testRes && testRes.success) {
          setSuccessMessage(
            testRes.message || "WhatsApp Business account connected and verified successfully."
          );
        } else {
          setSuccessMessage(
            "Settings saved. Connection test returned: " + (testRes?.message || "Verify your API key.")
          );
        }
      } catch (testErr) {
        setSuccessMessage(
          "Settings saved successfully. Note: Connection verification returned: " +
            (testErr.message || "Please check your credentials.")
        );
      }

      await loadSettings();
    } catch (err) {
      console.error("Error saving WhatsApp settings:", err);
      setErrorMessage(err.message || "Failed to save WhatsApp configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  // Test Connection Action
  const handleTestConnection = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsTesting(true);

    try {
      const response = await WhatsAppService.testConnection(token);
      if (response && response.success) {
        setSuccessMessage(
          response.message || "WhatsApp connection test successful! Business account is active."
        );
        await loadSettings();
      } else {
        setErrorMessage(response?.message || "WhatsApp connection test failed.");
      }
    } catch (err) {
      console.error("WhatsApp test connection error:", err);
      setErrorMessage(err.message || "WhatsApp connection test failed with provider.");
      await loadSettings();
    } finally {
      setIsTesting(false);
    }
  };

  // Disconnect Action
  const handleConfirmDisconnect = async () => {
    setIsDisconnecting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await WhatsAppService.disconnect(token);
      if (response && response.success) {
        setSuccessMessage("WhatsApp Business account has been disconnected.");
        setShowDisconnectModal(false);
        await loadSettings();
      } else {
        setErrorMessage(response?.message || "Failed to disconnect WhatsApp.");
      }
    } catch (err) {
      console.error("WhatsApp disconnect error:", err);
      setErrorMessage(err.message || "Failed to disconnect WhatsApp.");
    } finally {
      setIsDisconnecting(false);
      setShowDisconnectModal(false);
    }
  };

  // Copy Webhook URL
  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const isConnected = Boolean(settings?.is_connected);
  const birthdayTemplate = settings?.birthday_template_data;

  return (
    <AppLayout title="WhatsApp Settings">
      <div className="wa-settings-container">
        {/* 1. PAGE HEADER */}
        <div className="wa-settings-header">
          <h1 className="wa-settings-title">WhatsApp Settings</h1>
          <p className="wa-settings-subtitle">
            Configure and manage the official ChatterPillar WhatsApp Business connection used by the CRM.
          </p>
        </div>

        {/* Global Notifications Banners */}
        {errorMessage && (
          <div className="wa-alert-banner wa-alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong>Connection Notice:</strong> {errorMessage}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="wa-alert-banner wa-alert-success">
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>{successMessage}</div>
          </div>
        )}

        {/* 2. WHATSAPP CONNECTION CARD */}
        <div className="wa-settings-card">
          <div className="wa-card-header">
            <div className="wa-card-title-group">
              <div className="wa-card-icon">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="wa-card-title">WhatsApp Connection</h2>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Official ChatterPillar Cloud API
                </span>
              </div>
            </div>

            {/* Connection Status Badge */}
            <div
              className={`wa-status-badge ${
                isConnected ? "connected" : "not-connected"
              }`}
            >
              <span className="wa-status-dot" />
              <span>{isConnected ? "Connected & Active" : "Not Connected"}</span>
            </div>
          </div>

          {isLoading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
              <Loader2 size={24} className="wa-spinner" style={{ margin: "0 auto 0.5rem auto" }} />
              <div>Loading WhatsApp settings...</div>
            </div>
          ) : (
            <form onSubmit={handleSaveAndConnect} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* CP API Key Field */}
              <div className="wa-field-group">
                <label className="wa-field-label">
                  <span>ChatterPillar (CP) API Key</span>
                  <span className="wa-field-required">*</span>
                </label>

                <div className="wa-input-wrapper">
                  <input
                    type={showApiKey ? "text" : "password"}
                    className="wa-input"
                    placeholder="Enter your CP-API-KEY from ChatterPillar portal"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="wa-btn-toggle-pw"
                    onClick={() => setShowApiKey(!showApiKey)}
                    title={showApiKey ? "Hide API Key" : "Show API Key"}
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Your API key is encrypted using AES-256 before storage and never exposed in plaintext.
                </span>
              </div>

              {/* WhatsApp Mobile Number Field */}
              <div className="wa-field-group">
                <label className="wa-field-label">
                  <span>WhatsApp Business Phone Number</span>
                </label>
                <div className="wa-input-wrapper">
                  <input
                    type="text"
                    className="wa-input"
                    placeholder="e.g. +91 1234567890"
                    value={mobileInput}
                    onChange={(e) => setMobileInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Verified Account Banner */}
              {isConnected && settings?.whatsapp_mobile && (
                <div className="wa-number-display-box">
                  <div className="wa-number-info">
                    <div className="wa-phone-icon">
                      <Phone size={16} />
                    </div>
                    <div>
                      <div className="wa-number-text">
                        {settings.whatsapp_mobile}
                      </div>
                      <div className="wa-number-subtext">
                        {settings.whatsapp_account_id
                          ? `Account ID: ${settings.whatsapp_account_id}`
                          : "Verified Business Number"}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.8rem",
                      color: "#166534",
                      fontWeight: 600,
                    }}
                  >
                    <ShieldCheck size={16} />
                    Verified
                  </span>
                </div>
              )}

              {/* Card Actions */}
              <div className="wa-card-actions">
                <button
                  type="submit"
                  className="wa-btn-primary"
                  disabled={isSaving || isTesting}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="wa-spinner" />
                      <span>Saving & Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{isConnected ? "Update & Reconnect" : "Connect WhatsApp"}</span>
                    </>
                  )}
                </button>

                {isConnected && (
                  <>
                    <button
                      type="button"
                      className="wa-btn-secondary"
                      onClick={handleTestConnection}
                      disabled={isTesting || isSaving}
                    >
                      {isTesting ? (
                        <>
                          <Loader2 size={16} className="wa-spinner" />
                          <span>Testing Connection...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          <span>Test Connection</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="wa-btn-danger"
                      onClick={() => setShowDisconnectModal(true)}
                      disabled={isDisconnecting}
                    >
                      <Unlink size={16} />
                      <span>Disconnect</span>
                    </button>
                  </>
                )}
              </div>
            </form>
          )}
        </div>

        {/* 3. BIRTHDAY TEMPLATE CARD */}
        <div className="wa-settings-card">
          <div className="wa-card-header">
            <div className="wa-card-title-group">
              <div className="wa-card-icon" style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>
                <Cake size={20} />
              </div>
              <div>
                <h2 className="wa-card-title">Birthday Greetings Template</h2>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Selected template used for client birthday wishes
                </span>
              </div>
            </div>

            <Link
              to="/communication/whatsapp-templates"
              className="wa-btn-secondary"
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", textDecoration: "none" }}
            >
              <ExternalLink size={14} />
              <span>Browse Templates</span>
            </Link>
          </div>

          {birthdayTemplate ? (
            <div
              style={{
                backgroundColor: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "8px",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "#92400e", fontSize: "0.95rem" }}>
                  {birthdayTemplate.template_name}
                </strong>
                <span
                  style={{
                    fontSize: "0.75rem",
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                >
                  ACTIVE BIRTHDAY TEMPLATE
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: "#78350f",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {birthdayTemplate.body_content || "No body content preview available."}
              </p>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px dashed #cbd5e1",
                borderRadius: "8px",
                padding: "1.25rem",
                textAlign: "center",
                color: "#64748b",
                fontSize: "0.875rem",
              }}
            >
              <Cake size={24} style={{ margin: "0 auto 0.5rem auto", color: "#94a3b8" }} />
              <div>No Birthday Greeting Template selected yet.</div>
              <Link
                to="/communication/whatsapp-templates"
                style={{
                  color: "#9e241d",
                  fontWeight: 600,
                  display: "inline-block",
                  marginTop: "0.5rem",
                  textDecoration: "underline",
                }}
              >
                Choose an approved template from WhatsApp Templates &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* 4. WEBHOOK SECTION */}
        <div className="wa-settings-card">
          <div className="wa-card-title-group">
            <div className="wa-card-icon">
              <Copy size={20} />
            </div>
            <div>
              <h2 className="wa-card-title">Webhook Configuration</h2>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                ChatterPillar delivery and incoming status notifications
              </span>
            </div>
          </div>

          <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
            Configure this Webhook URL in your ChatterPillar portal to receive real-time message delivery receipts and status updates in the CRM.
          </p>

          <div className="wa-webhook-box">
            <input
              type="text"
              className="wa-webhook-input"
              value={webhookUrl}
              readOnly
            />
            <button
              type="button"
              className={`wa-btn-copy ${copiedWebhook ? "copied" : ""}`}
              onClick={handleCopyWebhook}
            >
              {copiedWebhook ? (
                <>
                  <Check size={16} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy URL</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Disconnect Confirmation Dialog */}
      {showDisconnectModal && (
        <div className="wa-modal-overlay">
          <div className="wa-modal-card">
            <div className="wa-modal-header">
              <div className="wa-modal-icon">
                <Unlink size={20} />
              </div>
              <h3 className="wa-modal-title">Disconnect WhatsApp?</h3>
            </div>

            <p className="wa-modal-body">
              Are you sure you want to disconnect WhatsApp Business? Outgoing WhatsApp communications and automated templates will be paused until reconnected.
            </p>

            <div className="wa-modal-actions">
              <button
                type="button"
                className="wa-btn-secondary"
                onClick={() => setShowDisconnectModal(false)}
                disabled={isDisconnecting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="wa-btn-primary"
                style={{ backgroundColor: "#dc2626" }}
                onClick={handleConfirmDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 size={16} className="wa-spinner" />
                    <span>Disconnecting...</span>
                  </>
                ) : (
                  <span>Confirm Disconnect</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default WhatsAppSettings;
