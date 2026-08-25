import React from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import { Users, ArrowRight } from "lucide-react";
import "./Settings.css";

const Settings = () => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate("/settings/users");
  };

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
          {/* User & Access Card Only */}
          <div className="settings-card-item" onClick={handleCardClick}>
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
                  handleCardClick();
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
