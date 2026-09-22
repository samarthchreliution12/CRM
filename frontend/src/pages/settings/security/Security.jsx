import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../../components/layout/AppLayout/AppLayout";
import useAuth from "../../../hooks/useAuth";
import SettingsService from "../../../services/settings.service";
import PasswordInput from "../../../components/auth/PasswordInput";
import OtpInput from "../../../components/common/OtpInput/OtpInput";
import {
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  LogOut,
  UsersRound,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";
import "./Security.css";

const Security = () => {
  const navigate = useNavigate();
  const { user, token, logoutAllDevices, changePassword, updateUserProfile } = useAuth();
  const isAdmin = user?.role?.name === "Admin";

  // MFA State
  const [mfaEnabled, setMfaEnabled] = useState(Boolean(user?.mfa_enabled));
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [mfaStep, setMfaStep] = useState(1);
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [isMfaSubmitting, setIsMfaSubmitting] = useState(false);
  const [mfaError, setMfaError] = useState("");

  // Change Password State
  const [isChangePwdModalOpen, setIsChangePwdModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPwdSubmitting, setIsPwdSubmitting] = useState(false);
  const [pwdError, setPwdError] = useState("");

  // Feedback Notifications
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage("");
    }, 4500);
  };

  // Fetch current user MFA status
  const loadMfaStatus = useCallback(async () => {
    if (!token) return;

    try {
      const mfaRes = await SettingsService.getMfaStatus(token);
      if (mfaRes && mfaRes.success && mfaRes.data) {
        setMfaEnabled(Boolean(mfaRes.data.mfa_enabled));
        updateUserProfile({ mfa_enabled: Boolean(mfaRes.data.mfa_enabled) });
      }
    } catch (err) {
      console.warn("Failed to load MFA status:", err);
    }
  }, [token, updateUserProfile]);

  useEffect(() => {
    loadMfaStatus();
  }, [loadMfaStatus]);

  // Handle MFA Toggle
  const handleMfaToggle = async () => {
    if (mfaEnabled) {
      if (window.confirm("Are you sure you want to disable Multi-Factor Authentication (MFA)?")) {
        try {
          const res = await SettingsService.disableMfa(token);
          if (res && res.success) {
            setMfaEnabled(false);
            updateUserProfile({ mfa_enabled: false });
            showToast("Multi-Factor Authentication disabled.", "success");
          } else {
            showToast(res.message || "Failed to disable MFA.", "error");
          }
        } catch (err) {
          showToast(err.message || "Failed to disable MFA.", "error");
        }
      }
    } else {
      setIsMfaModalOpen(true);
      setMfaStep(1);
      setMfaCode("");
      setMfaError("");
      setIsMfaSubmitting(true);

      try {
        const res = await SettingsService.setupMfa(token);
        if (res && res.success && res.data) {
          setMfaQrCode(res.data.qrCode);
          setMfaSecret(res.data.secret);
        } else {
          setMfaError(res.message || "Failed to initiate MFA setup.");
        }
      } catch (err) {
        setMfaError(err.message || "Failed to initiate MFA setup.");
      } finally {
        setIsMfaSubmitting(false);
      }
    }
  };

  // Confirm MFA Setup (Step 1 -> Step 2 -> Active)
  const handleMfaSetupSubmit = async (e) => {
    e.preventDefault();
    setMfaError("");

    const cleanCode = mfaCode.trim();
    if (!cleanCode || cleanCode.length !== 6 || isNaN(cleanCode)) {
      setMfaError("Please enter a valid 6-digit passcode.");
      return;
    }

    setIsMfaSubmitting(true);
    try {
      if (mfaStep === 1) {
        const res = await SettingsService.verifyStep1(cleanCode, token);
        if (res && res.success) {
          setMfaStep(2);
          setMfaCode("");
        } else {
          setMfaError(res.message || "First code verification failed.");
        }
      } else {
        const res = await SettingsService.activateMfa(cleanCode, token);
        if (res && res.success) {
          setMfaEnabled(true);
          updateUserProfile({ mfa_enabled: true });
          setIsMfaModalOpen(false);
          showToast("Multi-Factor Authentication enabled successfully!", "success");
        } else {
          setMfaError(res.message || "MFA code verification failed.");
        }
      }
    } catch (err) {
      setMfaError(err.message || "MFA verification failed.");
    } finally {
      setIsMfaSubmitting(false);
    }
  };

  // Handle Change Password Submit
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwdError("All password fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.");
      return;
    }

    setIsPwdSubmitting(true);
    try {
      await changePassword(oldPassword, newPassword);
      alert("Password changed successfully. You will now be redirected to the login page.");
      navigate("/login", { replace: true });
    } catch (err) {
      setPwdError(err.message || "Failed to change password. Please verify current password.");
      setIsPwdSubmitting(false);
    }
  };

  // Handle Logout All Devices
  const handleLogoutAllDevices = async () => {
    if (
      window.confirm(
        "Are you sure you want to terminate all active sessions across all devices? You will be logged out immediately."
      )
    ) {
      try {
        await logoutAllDevices();
        navigate("/login", { replace: true });
      } catch (err) {
        showToast(err.message || "Failed to terminate sessions.", "error");
      }
    }
  };

  // Handle Force Logout All Other Users (Admin only)
  const handleForceLogoutAllUsers = async () => {
    if (
      !window.confirm(
        "WARNING: Are you sure you want to force logout ALL other logged-in users? This will terminate all active sessions globally across all devices."
      )
    ) {
      return;
    }

    try {
      const res = await SettingsService.logoutAllUsers(token);
      if (res && res.success) {
        showToast("All other user sessions have been terminated successfully.", "success");
      } else {
        showToast(res.message || "Failed to terminate user sessions.", "error");
      }
    } catch (err) {
      showToast(err.message || "Error contacting server.", "error");
    }
  };

  return (
    <AppLayout title="System & Security">
      <div className="security-page-container">
        {/* Navigation & Header */}
        <div className="security-page-header-row">
          <div className="security-page-title-group">
            <button
              type="button"
              className="btn-back-settings"
              onClick={() => navigate("/settings")}
            >
              <ArrowLeft size={16} />
              <span>Back to Settings</span>
            </button>
            <div className="security-breadcrumb">
              <span>Settings</span> / <span className="current">System & Security</span>
            </div>
            <h2 className="security-page-title">
              {isAdmin ? "System & Security Configurations" : "Account Security & Preferences"}
            </h2>
            <p className="security-page-desc">
              {isAdmin
                ? "Manage authentication security policies, session thresholds, and administrator privileges."
                : "Manage your account authentication preferences and active sessions."}
            </p>
          </div>
        </div>

        {/* Global Toast / Feedback */}
        {toastMessage && (
          <div className={`auth-alert ${toastType === "success" ? "auth-alert-success" : "auth-alert-error"}`}>
            {toastType === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Security Configurations Card */}
        <div className="security-settings-card">
          <div className="security-section-header">
            <div className="security-header-icon">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="security-header-title">Authentication & Access Policies</h3>
              <p className="security-header-desc">
                Configure two-factor authentication, account credentials, and session controls.
              </p>
            </div>
          </div>

          <div className="security-rows-list">
            {/* 1. Multi-Factor Authentication (MFA) */}
            <div className="security-row-item">
              <div className="security-row-info">
                <h4 className="security-row-title">Multi-Factor Authentication (MFA / 2FA)</h4>
                <p className="security-row-desc">
                  Require a 6-digit TOTP code from Google/Microsoft Authenticator app upon signing in.
                </p>
              </div>
              <div className="security-row-action">
                <label className="switch-toggle" title={mfaEnabled ? "Disable MFA" : "Enable MFA"}>
                  <input type="checkbox" checked={mfaEnabled} onChange={handleMfaToggle} />
                  <span className="slider-round" />
                </label>
              </div>
            </div>

            {/* 2. Change Account Password */}
            <div className="security-row-item">
              <div className="security-row-info">
                <h4 className="security-row-title">Change Account Password</h4>
                <p className="security-row-desc">
                  Update your current password to maintain high account security.
                </p>
              </div>
              <div className="security-row-action">
                <button
                  type="button"
                  className="btn-sec-action"
                  onClick={() => {
                    setOldPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPwdError("");
                    setIsChangePwdModalOpen(true);
                  }}
                >
                  <KeyRound size={16} />
                  <span>Change Password</span>
                </button>
              </div>
            </div>

            {/* 3. Logout from All Devices */}
            <div className="security-row-item">
              <div className="security-row-info">
                <h4 className="security-row-title">Logout from All Devices</h4>
                <p className="security-row-desc">
                  Revoke all active tokens and immediately disconnect sessions across all connected systems.
                </p>
              </div>
              <div className="security-row-action">
                <button
                  type="button"
                  className="btn-sec-action btn-sec-danger"
                  onClick={handleLogoutAllDevices}
                >
                  <LogOut size={16} />
                  <span>Logout All Devices</span>
                </button>
              </div>
            </div>

            {/* 4. Terminate All Other User Sessions (Admin only) */}
            {isAdmin && (
              <div className="security-row-item">
                <div className="security-row-info">
                  <h4 className="security-row-title" style={{ color: "#dc2626" }}>
                    Terminate All Other User Sessions
                  </h4>
                  <p className="security-row-desc">
                    Force sign out all other active user accounts globally across the database environment.
                  </p>
                </div>
                <div className="security-row-action">
                  <button
                    type="button"
                    className="btn-sec-action btn-sec-danger"
                    onClick={handleForceLogoutAllUsers}
                  >
                    <UsersRound size={16} />
                    <span>Logout All Users</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MFA SETUP MODAL (2-STEP TOTP) */}
        {isMfaModalOpen && (
          <div className="modal-backdrop" onClick={() => !isMfaSubmitting && setIsMfaModalOpen(false)}>
            <div
              className="modal-content-card"
              style={{ maxWidth: "440px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={20} color="#0284c7" />
                  <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>
                    MFA Device Setup
                  </span>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsMfaModalOpen(false)}
                  disabled={isMfaSubmitting}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleMfaSetupSubmit} style={{ padding: "1.5rem" }}>
                {mfaError && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      padding: "0.75rem 1rem",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{mfaError}</span>
                  </div>
                )}

                {isMfaSubmitting && !mfaQrCode ? (
                  <div style={{ padding: "2rem 0", textAlign: "center" }}>
                    <RefreshCw size={28} className="animate-spin" color="#0284c7" style={{ margin: "0 auto 8px auto" }} />
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>Generating keys...</p>
                  </div>
                ) : (
                  <>
                    {mfaStep === 1 ? (
                      <>
                        <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                          Scan this QR code using Google Authenticator or Microsoft Authenticator, then enter the 6-digit code.
                        </p>

                        {mfaQrCode && (
                          <div
                            style={{
                              background: "#ffffff",
                              padding: "10px",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              margin: "0 auto 1rem auto",
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <img src={mfaQrCode} alt="MFA QR" style={{ width: "160px", height: "160px" }} />
                          </div>
                        )}

                        {mfaSecret && (
                          <div style={{ marginBottom: "1.25rem" }}>
                            <label style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                              Manual Key
                            </label>
                            <code
                              style={{
                                background: "#f8fafc",
                                padding: "6px 12px",
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                fontSize: "0.85rem",
                                color: "#0f172a",
                                wordBreak: "break-all",
                                display: "block",
                                textAlign: "center",
                              }}
                            >
                              {mfaSecret}
                            </code>
                          </div>
                        )}

                        <div style={{ marginBottom: "1.25rem", textAlign: "center" }}>
                          <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1e293b", display: "block", marginBottom: "0.5rem" }}>
                            Enter First 6-Digit Passcode *
                          </label>
                          <OtpInput
                            value={mfaCode}
                            onChange={(val) => {
                              setMfaCode(val);
                              if (mfaError) setMfaError("");
                            }}
                            disabled={isMfaSubmitting}
                            autoFocus
                          />
                        </div>

                        <div className="modal-footer" style={{ padding: 0 }}>
                          <button
                            type="button"
                            className="btn-cancel-profile"
                            onClick={() => setIsMfaModalOpen(false)}
                            disabled={isMfaSubmitting}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn-edit-profile"
                            disabled={isMfaSubmitting || mfaCode.length !== 6}
                          >
                            {isMfaSubmitting ? "Verifying..." : "Next Step"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            color: "#16a34a",
                            padding: "0.75rem 1rem",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            marginBottom: "1rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <CheckCircle2 size={16} />
                          <span><strong>First passcode verified!</strong></span>
                        </div>

                        <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: 1.5, margin: "0 0 1rem 0", textAlign: "center" }}>
                          Now wait for the code to rotate in your Authenticator app (about 30 seconds), then enter the new rotated passcode.
                        </p>

                        <div style={{ marginBottom: "1.25rem", textAlign: "center" }}>
                          <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1e293b", display: "block", marginBottom: "0.5rem" }}>
                            Enter New 6-Digit Passcode *
                          </label>
                          <OtpInput
                            value={mfaCode}
                            onChange={(val) => {
                              setMfaCode(val);
                              if (mfaError) setMfaError("");
                            }}
                            disabled={isMfaSubmitting}
                            autoFocus
                          />
                        </div>

                        <div className="modal-footer" style={{ padding: 0 }}>
                          <button
                            type="button"
                            className="btn-cancel-profile"
                            onClick={() => setMfaStep(1)}
                            disabled={isMfaSubmitting}
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            className="btn-edit-profile"
                            disabled={isMfaSubmitting || mfaCode.length !== 6}
                          >
                            {isMfaSubmitting ? "Activating..." : "Activate MFA"}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </form>
            </div>
          </div>
        )}

        {/* CHANGE PASSWORD MODAL */}
        {isChangePwdModalOpen && (
          <div className="modal-backdrop" onClick={() => !isPwdSubmitting && setIsChangePwdModalOpen(false)}>
            <div
              className="modal-content-card"
              style={{ maxWidth: "460px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <KeyRound size={20} color="#0284c7" />
                  <span style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a" }}>
                    Change Account Password
                  </span>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsChangePwdModalOpen(false)}
                  disabled={isPwdSubmitting}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleChangePasswordSubmit}>
                <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {pwdError && (
                    <div
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        padding: "0.75rem 1rem",
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>{pwdError}</span>
                    </div>
                  )}

                  <PasswordInput
                    label="Current Password *"
                    name="oldPassword"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    disabled={isPwdSubmitting}
                    required
                  />

                  <PasswordInput
                    label="New Password *"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    disabled={isPwdSubmitting}
                    required
                  />

                  <PasswordInput
                    label="Confirm New Password *"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    disabled={isPwdSubmitting}
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-cancel-profile"
                    onClick={() => setIsChangePwdModalOpen(false)}
                    disabled={isPwdSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-edit-profile"
                    disabled={isPwdSubmitting}
                  >
                    {isPwdSubmitting ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Security;
