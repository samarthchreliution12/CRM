import React from "react";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import useAuth from "../../hooks/useAuth";
import { ShieldCheck, UserCheck, KeyRound } from "lucide-react";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <AppLayout title="Dashboard">
      <div className="dashboard-container">
        <div className="dashboard-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a" }}>Welcome to CRM</h1>
            <span className="dashboard-role-tag">
              <ShieldCheck size={16} />
              Role: {user?.role?.name || "Member"}
            </span>
          </div>

          <p style={{ color: "#64748b", marginBottom: "2rem", lineHeight: "1.5" }}>
            You have successfully authenticated into the CRM backend API. Below is your current session profile and granted permissions.
          </p>

          <div className="dashboard-section-grid">
            {/* User Profile Card */}
            <div className="dashboard-info-card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", marginBottom: "1rem", color: "#0f172a" }}>
                <UserCheck size={18} color="#0284c7" />
                <span>Account Profile</span>
              </div>
              <div style={{ fontSize: "0.9rem", color: "#334155", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div><strong>Name:</strong> {user?.name}</div>
                <div><strong>Email:</strong> {user?.email}</div>
                <div><strong>Status:</strong> <span style={{ color: "#16a34a", fontWeight: "600" }}>{user?.status}</span></div>
                <div><strong>Last Login:</strong> {user?.last_login ? new Date(user.last_login).toLocaleString() : "First Session"}</div>
              </div>
            </div>

            {/* Granted Permissions Card */}
            <div className="dashboard-info-card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", marginBottom: "1rem", color: "#0f172a" }}>
                <KeyRound size={18} color="#0284c7" />
                <span>Granted Permissions</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {user?.permissions && user.permissions.length > 0 ? (
                  user.permissions.map((perm) => (
                    <span key={perm} className="permission-chip">
                      {perm}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>No active permissions assigned.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
