import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import SEO from "../components/SEO";

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

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
        Initializing CRM session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Direct URL Protection via Permission Check
  if (requiredPermission) {
    const isAdmin = user?.role?.name === "Admin";
    const permissions = user?.permissions || [];

    const hasPermission = Array.isArray(requiredPermission)
      ? requiredPermission.some((p) => permissions.includes(p))
      : permissions.includes(requiredPermission);

    if (!isAdmin && !hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <>
      <SEO title="CRM Dashboard" noindex={true} />
      {children}
    </>
  );
};

export default ProtectedRoute;
