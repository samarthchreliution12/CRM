import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import SEO from "../components/SEO";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          color: "#0f172a",
          fontSize: "1rem",
          fontWeight: "600",
        }}
      >
        Loading...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <SEO title="CRM Login & Portal" noindex={true} />
      {children}
    </>
  );
};

export default PublicRoute;
