import React from "react";
import { Navigate } from "react-router-dom";
import useClientAuth from "../hooks/useClientAuth";

const ClientPublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useClientAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F7F7F5",
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
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/client/documents" replace />;
  }

  return children;
};

export default ClientPublicRoute;
