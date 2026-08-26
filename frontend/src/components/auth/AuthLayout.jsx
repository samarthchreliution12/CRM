import React from "react";
import "./AuthLayout.css";

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-container">
      {/* Left Dark Branding Section */}
      <div className="auth-branding-panel">
        <div className="auth-logo">
          {/* <div className="auth-logo-icon">logo</div> */}
          <span>Company name</span>
        </div>

        <div className="auth-branding-content">
          <h1 className="auth-headline">
            Manage Your<br />Clients Smarter
          </h1>
          <p className="auth-description">
            The unified platform to manage clients, leads, follow-ups, and communication. Streamline your team's workflow and grow your revenue effortlessly.
          </p>
        </div>
      </div>

      {/* Right Form Card Section */}
      <div className="auth-form-panel">
        <div className="auth-card">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
