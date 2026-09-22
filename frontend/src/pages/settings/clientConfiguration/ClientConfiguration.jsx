import React from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../../components/layout/AppLayout/AppLayout";
import useAuth from "../../../hooks/useAuth";
import {
  ArrowLeft,
  ArrowRight,
  Tags,
  Briefcase,
} from "lucide-react";
import "./ClientConfiguration.css";

const ClientConfiguration = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  const isAdmin = user?.role?.name === "Admin";

  const canViewTypes = isAdmin || permissions.includes("client_type.view");
  const canViewServices = isAdmin || permissions.includes("client_service.view");

  return (
    <AppLayout title="Client Configuration">
      <div className="client-config-hub-container">
        {/* Navigation & Header */}
        <div className="client-config-hub-header">
          <div className="client-config-hub-title-group">
            <button
              type="button"
              className="btn-back-settings"
              onClick={() => navigate("/settings")}
            >
              <ArrowLeft size={16} />
              <span>Back to Settings</span>
            </button>
            <div className="client-config-breadcrumb">
              <span>Settings</span> / <span className="current">Client Configuration</span>
            </div>
            <h2 className="client-config-hub-title">Client Configuration</h2>
            <p className="client-config-hub-desc">
              Manage client categorization types and available services across the CRM.
            </p>
          </div>
        </div>

        {/* Configuration Hub Cards Grid */}
        <div className="client-config-hub-grid">
          {/* 1. Client Types */}
          {canViewTypes && (
            <div
              className="client-config-hub-card"
              onClick={() => navigate("/settings/client-configuration/client-types")}
            >
              <div className="config-hub-card-top">
                <div className="config-hub-icon-wrapper" style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}>
                  <Tags size={24} />
                </div>
                <div className="config-hub-card-content">
                  <h3 className="config-hub-card-title">Client Types</h3>
                  <p className="config-hub-card-description">
                    Manage available client types used throughout the CRM.
                  </p>
                </div>
              </div>

              <div className="config-hub-card-footer">
                <button
                  type="button"
                  className="btn-manage-config"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/settings/client-configuration/client-types");
                  }}
                >
                  <span>Manage</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 2. Client Services */}
          {canViewServices && (
            <div
              className="client-config-hub-card"
              onClick={() => navigate("/settings/client-configuration/client-services")}
            >
              <div className="config-hub-card-top">
                <div className="config-hub-icon-wrapper" style={{ backgroundColor: "#ecfdf5", color: "#059669" }}>
                  <Briefcase size={24} />
                </div>
                <div className="config-hub-card-content">
                  <h3 className="config-hub-card-title">Client Services</h3>
                  <p className="config-hub-card-description">
                    Manage services available to be assigned to clients.
                  </p>
                </div>
              </div>

              <div className="config-hub-card-footer">
                <button
                  type="button"
                  className="btn-manage-config"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/settings/client-configuration/client-services");
                  }}
                >
                  <span>Manage</span>
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

export default ClientConfiguration;
