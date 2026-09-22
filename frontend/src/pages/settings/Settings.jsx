import React from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import useAuth from "../../hooks/useAuth";
import {
  Users,
  FolderCog,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import "./Settings.css";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const isAdmin = user?.role?.name === "Admin";

  const canViewUsers = isAdmin || permissions.includes("staff.view");
  const canViewConfig =
    isAdmin || permissions.includes("client_type.view") || permissions.includes("client_service.view");

  return (
    <AppLayout title="Settings">
      <div className="settings-container">
        {/* Header */}
        <div className="settings-page-header">
          <h2 className="settings-page-title">Settings</h2>
          <p className="settings-page-desc">
            Configure system administration parameters, security policies, and access configurations.
          </p>
        </div>

        {/* Overview Cards Grid */}
        <div className="settings-cards-grid">
          {/* 1. User & Access Card */}
          {canViewUsers && (
            <div
              className="settings-card-item"
              onClick={() => navigate("/settings/user-access")}
            >
              <div className="settings-card-top">
                <div
                  className="settings-card-icon-wrapper"
                  style={{ backgroundColor: "#fee2e2", color: "#9E241D" }}
                >
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
                    navigate("/settings/user-access");
                  }}
                >
                  <span>Manage</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 2. Client Configuration Card */}
          {canViewConfig && (
            <div
              className="settings-card-item"
              onClick={() => navigate("/settings/client-configuration")}
            >
              <div className="settings-card-top">
                <div
                  className="settings-card-icon-wrapper"
                  style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}
                >
                  <FolderCog size={24} />
                </div>
                <div className="settings-card-content">
                  <h3 className="settings-card-title">Client Configuration</h3>
                  <p className="settings-card-description">
                    Manage client types and available client services.
                  </p>
                </div>
              </div>

              <div className="settings-card-footer">
                <button
                  type="button"
                  className="btn-manage-settings"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/settings/client-configuration");
                  }}
                >
                  <span>Manage</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 3. Audit Logs Card (Admin Only) */}
          {isAdmin && (
            <div
              className="settings-card-item"
              onClick={() => navigate("/settings/audit-logs")}
            >
              <div className="settings-card-top">
                <div
                  className="settings-card-icon-wrapper"
                  style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
                >
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

          {/* 4. System & Security Card */}
          <div
            className="settings-card-item"
            onClick={() => navigate("/settings/security")}
          >
            <div className="settings-card-top">
              <div
                className="settings-card-icon-wrapper"
                style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}
              >
                <ShieldCheck size={24} />
              </div>
              <div className="settings-card-content">
                <h3 className="settings-card-title">System & Security</h3>
                <p className="settings-card-description">
                  Manage authentication security policies, sessions, and administrator security.
                </p>
              </div>
            </div>

            <div className="settings-card-footer">
              <button
                type="button"
                className="btn-manage-settings"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/settings/security");
                }}
              >
                <span>Manage</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
