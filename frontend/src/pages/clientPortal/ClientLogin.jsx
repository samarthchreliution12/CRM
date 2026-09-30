import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Phone, ArrowLeft, AlertCircle, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import useClientAuth from "../../hooks/useClientAuth";
import headerLogo from "../../assets/website/logo/header-logo.png";
import SEO from "../../components/SEO";
import "./ClientLogin.css";

const ClientLogin = () => {
  const { login } = useClientAuth();
  const navigate = useNavigate();

  const [mobileNo, setMobileNo] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMobileChange = (e) => {
    const val = e.target.value;
    // Allow digits, spaces, plus sign, and dashes for easy phone typing
    if (/^[0-9+\s-]*$/.test(val)) {
      setMobileNo(val);
      if (errorMessage) setErrorMessage("");
    }
  };

  const validateMobile = (input) => {
    const digits = input.replace(/\D/g, "");
    if (!digits) {
      return "Please enter your registered mobile number.";
    }
    if (digits.length < 10) {
      return "Please enter a valid 10-digit mobile number.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const error = validateMobile(mobileNo);
    if (error) {
      setErrorMessage(error);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(mobileNo.trim(), rememberMe);
      navigate("/client-portal", { replace: true });
    } catch (err) {
      if (err.statusCode === 404 || err.message?.toLowerCase().includes("not found")) {
        setErrorMessage("Client account not found. Please contact our team.");
      } else if (err.statusCode === 403 || err.message?.toLowerCase().includes("inactive")) {
        setErrorMessage("Your client account is inactive. Please contact our support team.");
      } else {
        setErrorMessage(err.message || "Failed to sign in. Please verify your mobile number.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO title="Client Portal Login - Parshwa Consultancy" noindex={true} />
      <div className="client-login-wrapper">
        <div className="client-login-card">
          {/* Logo */}
          <div className="client-login-logo-container">
            <Link to="/" title="Parshwa Consultancy Home">
              <img src={headerLogo} alt="Parshwa Consultancy" className="client-login-logo" />
            </Link>
          </div>

          {/* Badge */}
          <div className="client-login-badge">
            <ShieldCheck size={14} />
            <span>SECURE CLIENT ACCESS</span>
          </div>

          {/* Title & Subtitle */}
          <h1 className="client-login-title">Client Portal</h1>
          <p className="client-login-subtitle">
            Access your account and manage your documents securely.
          </p>

          {/* Error Alert */}
          {errorMessage && (
            <div className="client-login-alert" role="alert">
              <AlertCircle size={18} className="alert-icon" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="client-login-form" onSubmit={handleSubmit} noValidate>
            <div className="client-input-group">
              <label htmlFor="mobile-input" className="client-input-label">
                Registered Mobile Number
              </label>
              <div className="client-phone-input-wrap">
                <span className="client-phone-prefix">+91</span>
                <input
                  id="mobile-input"
                  type="tel"
                  className="client-phone-input"
                  placeholder="98765 00000"
                  value={mobileNo}
                  onChange={handleMobileChange}
                  disabled={isSubmitting}
                  autoComplete="tel"
                  autoFocus
                  required
                />
                <Phone size={18} className="client-input-icon" />
              </div>
              <span className="client-input-help">
                Enter the 10-digit mobile number linked with your portfolio.
              </span>
            </div>

            <div className="client-login-options">
              <label className="client-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span>Remember this device</span>
              </label>
            </div>

            <button type="submit" className="client-login-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="client-btn-loader">
                  <span className="client-spinner" />
                  Verifying Account...
                </span>
              ) : (
                "Continue to Portal"
              )}
            </button>
          </form>

          {/* Security Features Info */}
          <div className="client-login-security-features">
            {/* <div className="security-item">
              <Lock size={13} />
              <span>AES-256 Encrypted</span>
            </div> */}
            <div className="security-item">
              <CheckCircle2 size={13} />
              <span>Instant Verification</span>
            </div>
          </div>

          {/* Back to Staff CRM Login */}
          <div className="client-login-footer">
            <Link to="/crm/login" className="back-to-staff-link">
              <ArrowLeft size={15} />
              <span>Back to Staff / Admin Login</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientLogin;
