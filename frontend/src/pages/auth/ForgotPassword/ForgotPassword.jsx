import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import AuthLayout from "../../../components/auth/AuthLayout";
import AuthInput from "../../../components/auth/AuthInput";
import AuthService from "../../../services/auth.service";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [successInfo, setSuccessInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (fieldError) setFieldError("");
    if (globalError) setGlobalError("");
  };

  const validateForm = () => {
    if (!email || !email.trim()) {
      setFieldError("Please enter your email address.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFieldError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    setSuccessInfo(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await AuthService.forgotPassword(email.trim());
      if (response && response.success) {
        setSuccessInfo(response.data || { message: response.message });
      } else {
        setGlobalError(response.message || "Failed to send reset link.");
      }
    } catch (err) {
      setGlobalError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-header">
        <h2 className="auth-title">Forgot Password</h2>
        <p className="auth-subtitle">Enter your email address to receive a password reset link.</p>
      </div>

      {globalError && (
        <div className="auth-alert auth-alert-error">
          <AlertCircle size={18} />
          <span>{globalError}</span>
        </div>
      )}

      {successInfo && (
        <div className="auth-alert auth-alert-success">
          <CheckCircle2 size={18} />
          <span>{successInfo.message || "If an account with that email exists, a password reset link has been created."}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Email Address"
          name="email"
          type="email"
          value={email}
          onChange={handleChange}
          placeholder="name@example.com"
          error={fieldError}
          disabled={isSubmitting}
          required
        />

        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div className="auth-footer forgot-password-link-container">
        <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
          <ArrowLeft size={16} />
          <span>Back to Login</span>
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
