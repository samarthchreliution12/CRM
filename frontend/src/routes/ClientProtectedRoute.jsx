import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useClientAuth from "../hooks/useClientAuth";
import SEO from "../components/SEO";

const ClientProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useClientAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F7F7F5",
          color: "#25282A",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid #E2E2DF",
            borderTopColor: "#9E241D",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "12px",
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: "0.95rem", fontWeight: "500", color: "#596067" }}>
          Verifying Client Portal session...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/client/login" state={{ from: location }} replace />;
  }

  return (
    <>
      <SEO title="Client Portal - Parshwa Consultancy" noindex={true} />
      {children}
    </>
  );
};

export default ClientProtectedRoute;
