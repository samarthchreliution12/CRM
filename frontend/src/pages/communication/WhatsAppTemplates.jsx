import React from "react";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import "./Communication.css";

const WhatsAppTemplates = () => {
  return (
    <AppLayout title="WhatsApp Templates">
      <div style={{ padding: "1.5rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
            WhatsApp Templates
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Manage WhatsApp message templates.
          </p>
        </div>
        {/* Intentionally blank content area per requirement */}
      </div>
    </AppLayout>
  );
};

export default WhatsAppTemplates;
