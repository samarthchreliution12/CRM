import React from "react";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <AppLayout title="Dashboard">
      <div className="dashboard-container">
        <div className="dashboard-welcome-card">
          <h2>Welcome to CRM Dashboard</h2>
          <p>
            Select a module from the sidebar navigation to get started with Client Management, Document Verification, and Client Configurations.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
