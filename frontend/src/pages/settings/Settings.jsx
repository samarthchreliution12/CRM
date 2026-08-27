import React from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import useAuth from "../../hooks/useAuth";
import { Users, ArrowRight, FolderCog, ShieldAlert } from "lucide-react";
import "./Settings.css";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const isAdmin = user?.role?.name === "Admin";

  const canViewUsers = isAdmin || permissions.includes("staff.view");
  const canViewConfig = isAdmin || permissions.includes("client_type.view") || permissions.includes("client_service.view");

  return (
    <AppLayout title="Settings">
      <div className="settings-container">
        <div className="settings-page-header">
          <h2 className="settings-page-title">Settings</h2>
          <p className="settings-page-desc">
            Configure system administration parameters, access policies, and CRM settings.
          </p>
        </div>

        <div className="settings-cards-grid">
          {/* 1. User & Access Card */}
          {canViewUsers && (
            <div className="settings-card-item" onClick={() => navigate("/settings/users")}>
              <div className="settings-card-top">
                <div className="settings-card-icon-wrapper">
                  <Users size={24} />
                </div>
                <div className="settings-card-content">
                  <h3 className="settings-card-title">User & Access</h3>
                  <p className="settings-card-description">
                    Manage users, staff access, roles and permissions.
                  </p>
                </div>
              </div>

              <div className="settings-card-footer">
                <button
                  type="button"
                  className="btn-manage-settings"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/settings/users");
                  }}
                >
                  <span>Manage</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 2. Client Configuration Card (Admin Only) */}
          {canViewConfig && (
            <div className="settings-card-item">
              <div className="settings-card-top">
                <div className="settings-card-icon-wrapper" style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}>
                  <FolderCog size={24} />
                </div>
                <div className="settings-card-content">
                  <h3 className="settings-card-title">Client Configuration</h3>
                  <p className="settings-card-description">
                    Manage client types and available client services.
                  </p>
                </div>
              </div>

              <div className="settings-card-options-list" style={{ padding: "0 1.5rem 1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn-config-option"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.625rem 0.875rem",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#0f172a",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate("/settings/client-configuration/types")}
                >
                  <span>1. Client Types</span>
                  <ArrowRight size={14} color="#64748b" />
                </button>
                <button
                  type="button"
                  className="btn-config-option"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.625rem 0.875rem",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#0f172a",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate("/settings/client-configuration/services")}
                >
                  <span>2. Client Services</span>
                  <ArrowRight size={14} color="#64748b" />
                </button>
              </div>
            </div>
          )}

          {/* 3. Audit Logs Card (Admin Only) */}
          {isAdmin && (
            <div className="settings-card-item" onClick={() => navigate("/settings/audit-logs")}>
              <div className="settings-card-top">
                <div className="settings-card-icon-wrapper" style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>
                  <ShieldAlert size={24} />
                </div>
                <div className="settings-card-content">
                  <h3 className="settings-card-title">Audit Logs</h3>
                  <p className="settings-card-description">
                    Track important activities, security events, and data changes.
                  </p>
                </div>
              </div>

              <div className="settings-card-footer">
                <button
                  type="button"
                  className="btn-manage-settings"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/settings/audit-logs");
                  }}
                >
                  <span>View Logs</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
