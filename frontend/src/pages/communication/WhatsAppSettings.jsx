import React, { useState } from "react";
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
} from "lucide-react";
import "./WhatsAppSettings.css";

const WhatsAppSettings = () => {
  // Local UI State for Interactive Previewing
  const [connectionStatus, setConnectionStatus] = useState("not_connected"); // 'not_connected' | 'connecting' | 'connected'
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Single WhatsApp Business Number (as per CRM business rules)
  const singleWhatsAppNumber = "+91 8888888888";
  const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;

  // Handler: Connect WhatsApp
  const handleConnect = (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!apiKey.trim()) {
      setErrorMessage("CP API Key is required to connect to ChatterPillar.");
      return;
    }

    setIsConnecting(true);
    setConnectionStatus("connecting");

    // Simulate backend connection validation delay
    setTimeout(() => {
      setIsConnecting(false);
      setConnectionStatus("connected");
      setSuccessMessage("WhatsApp Business account connected successfully via ChatterPillar.");
      setTimeout(() => setSuccessMessage(""), 4000);
    }, 1500);
  };

  // Handler: Test Connection
  const handleTestConnection = () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsTesting(true);

    setTimeout(() => {
      setIsTesting(false);
      setSuccessMessage("WhatsApp connection test successful! Status: Active (Latency: 118ms)");
      setTimeout(() => setSuccessMessage(""), 4000);
    }, 1200);
  };

  // Handler: Disconnect Confirmation
  const handleConfirmDisconnect = () => {
    setShowDisconnectModal(false);
    setConnectionStatus("not_connected");
    setApiKey("");
    setErrorMessage("");
    setSuccessMessage("WhatsApp Business account disconnected.");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Handler: Copy Webhook URL
  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const isConnected = connectionStatus === "connected";

  return (
    <AppLayout title="WhatsApp Settings">
      <div className="wa-settings-container">
        {/* 1. PAGE HEADER */}
        <div className="wa-settings-header">
          <h1 className="wa-settings-title">WhatsApp Settings</h1>
          <p className="wa-settings-subtitle">
            Configure and manage the WhatsApp connection used by the CRM.
          </p>
        </div>

        {/* Global Notifications Banners */}
        {errorMessage && (
          <div className="wa-alert-banner wa-alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong>Connection Error:</strong> {errorMessage}
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
              <h2 className="wa-card-title">WhatsApp Connection</h2>
            </div>

            {/* Connection Status Badge */}
            <div
              className={`wa-status-badge ${
                isConnected ? "connected" : "not-connected"
              }`}
            >
              <span className="wa-status-dot" />
              <span>{isConnected ? "Connected" : "Not Connected"}</span>
            </div>
          </div>

          {/* Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* CP API Key Field */}
            <div className="wa-field-group">
              <label className="wa-field-label">
                <span>CP API Key</span>
                <span className="wa-field-required">*</span>
              </label>

              <div className="wa-input-wrapper">
                <input
                  type={showApiKey ? "text" : "password"}
                  className="wa-input"
                  placeholder="Enter CP API Key"
                  value={
                    isConnected && !showApiKey
                      ? "••••••••••••••••••••••••••••••••"
                      : apiKey
                  }
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isConnected}
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
            </div>

            {/* WhatsApp Number Field */}
            <div className="wa-field-group">
              <label className="wa-field-label">WhatsApp Number</label>
              <div className="wa-number-display-box">
                <div className="wa-number-info">
                  <div className="wa-phone-icon">
                    <Phone size={16} />
                  </div>
                  <div>
                    <div className="wa-number-text">
                      {isConnected ? singleWhatsAppNumber : "Not connected"}
                    </div>
                    <div className="wa-number-subtext">
                      Single WhatsApp Business Number
                    </div>
                  </div>
                </div>

                {isConnected && (
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
                )}
              </div>
            </div>
          </div>

          {/* Card Actions */}
          <div className="wa-card-actions">
            {!isConnected ? (
              <button
                type="button"
                className="wa-btn-primary"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 size={16} className="wa-spinner" />
                    <span>Connecting WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Connect WhatsApp</span>
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="wa-btn-secondary"
                  onClick={handleTestConnection}
                  disabled={isTesting}
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
                >
                  <Unlink size={16} />
                  <span>Disconnect</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3. WEBHOOK SECTION */}
        <div className="wa-settings-card">
          <div className="wa-card-title-group">
            <div className="wa-card-icon">
              <Copy size={20} />
            </div>
            <h2 className="wa-card-title">Webhook Configuration</h2>
          </div>

          <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
            Webhook URL used by ChatterPillar to send WhatsApp message status updates and incoming messages to the CRM.
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

        {/* 4. CONNECTION INFORMATION */}
        <div className="wa-settings-card">
          <div className="wa-card-title-group">
            <div className="wa-card-icon">
              <Info size={20} />
            </div>
            <h2 className="wa-card-title">WhatsApp Integration</h2>
          </div>

          <div className="wa-info-grid">
            <div className="wa-info-item">
              <span className="wa-info-label">Provider</span>
              <span className="wa-info-value">ChatterPillar</span>
            </div>

            <div className="wa-info-item">
              <span className="wa-info-label">Platform</span>
              <span className="wa-info-value">WhatsApp Cloud</span>
            </div>

            <div className="wa-info-item">
              <span className="wa-info-label">Account</span>
              <span className="wa-info-value">Single WhatsApp Business Number</span>
            </div>
          </div>

          {/* <div className="wa-info-notice">
            <Info size={18} style={{ flexShrink: 0 }} />
            <span>
              Parshwa Consultancy CRM connects to a single unified WhatsApp Business number via ChatterPillar. All outgoing communications and status webhooks are handled through this configured account.
            </span>
          </div> */}
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
              Are you sure you want to disconnect the WhatsApp Business number (
              <strong>{singleWhatsAppNumber}</strong>)? WhatsApp messaging and status updates will be paused until reconnected.
            </p>

            <div className="wa-modal-actions">
              <button
                type="button"
                className="wa-btn-secondary"
                onClick={() => setShowDisconnectModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="wa-btn-primary"
                style={{ backgroundColor: "#dc2626" }}
                onClick={handleConfirmDisconnect}
              >
                Confirm Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default WhatsAppSettings;
