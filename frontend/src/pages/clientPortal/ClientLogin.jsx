import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Phone,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import useClientAuth from "../../hooks/useClientAuth";
import OtpInput from "../../components/common/OtpInput/OtpInput";
import headerLogo from "../../assets/website/logo/header-logo.png";
import SEO from "../../components/SEO";
import "./ClientLogin.css";

const RESEND_COOLDOWN_SECONDS = 59;

const ClientLogin = () => {
  const { sendOtp, verifyOtp } = useClientAuth();
  const navigate = useNavigate();

  // Screen Step: 'MOBILE' or 'OTP'
  const [step, setStep] = useState("MOBILE");
  const [mobileNo, setMobileNo] = useState("");
  const [countryCode] = useState("+91");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Feedback States
  const [errorMessage, setErrorMessage] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (step === "OTP" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  // Clean numeric phone input
  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 10) {
      setMobileNo(val);
      if (errorMessage) setErrorMessage("");
    }
  };

  const validateMobile = (input) => {
    const digits = input.replace(/\D/g, "");
    if (!digits) {
      return "Please enter your registered 10-digit mobile number.";
    }
    if (digits.length !== 10) {
      return "Mobile number must be exactly 10 digits.";
    }
    if (!/^[6-9]/.test(digits)) {
      return "Please enter a valid mobile number starting with 6, 7, 8, or 9.";
    }
    return null;
  };

  // Step 1: Send OTP handler
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setSuccessToast("");

    const error = validateMobile(mobileNo);
    if (error) {
      setErrorMessage(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await sendOtp(mobileNo.trim());
      const masked = response.masked_mobile || `${countryCode} ******${mobileNo.slice(-4)}`;
      setMaskedMobile(masked);
      setStep("OTP");
      setOtp("");
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setSuccessToast(`Verification code sent to ${masked} on WhatsApp.`);
    } catch (err) {
      if (err.statusCode === 404 || err.message?.toLowerCase().includes("not found")) {
        setErrorMessage("We couldn't verify this mobile number. Please check the number and try again.");
      } else if (err.statusCode === 403 || err.message?.toLowerCase().includes("inactive")) {
        setErrorMessage("Your client account is inactive. Please contact support.");
      } else if (err.statusCode === 429) {
        setErrorMessage(err.message || "Please wait before requesting another code.");
      } else {
        setErrorMessage(
          err.message || "We couldn't verify this mobile number. Please check the number and try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP handler
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage("");
    setSuccessToast("");

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6 || isNaN(cleanOtp)) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp(mobileNo.trim(), cleanOtp, rememberMe);
      navigate("/client/documents", { replace: true });
    } catch (err) {
      if (err.statusCode === 429 || err.message?.toLowerCase().includes("too many")) {
        setErrorMessage("Too many incorrect attempts. Please request a new OTP.");
      } else if (err.message?.toLowerCase().includes("expired")) {
        setErrorMessage("The verification code has expired. Please request a new OTP.");
      } else {
        setErrorMessage(err.message || "Invalid verification code. Please check the code and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (countdown > 0 || isSubmitting) return;
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      await sendOtp(mobileNo.trim());
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setOtp("");
      setSuccessToast("A fresh verification code has been sent to your WhatsApp.");
    } catch (err) {
      setErrorMessage(err.message || "Failed to resend code. Please try again shortly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change Mobile Number handler
  const handleChangeMobile = () => {
    setStep("MOBILE");
    setOtp("");
    setErrorMessage("");
    setSuccessToast("");
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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

          {/* Security Badge */}
          <div className="client-login-badge">
            <ShieldCheck size={14} />
            <span>SECURE CLIENT ACCESS</span>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="client-login-alert" role="alert">
              <AlertCircle size={18} className="alert-icon" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Toast */}
          {successToast && !errorMessage && (
            <div className="client-login-success-toast" role="status">
              <CheckCircle2 size={16} className="toast-icon" />
              <span>{successToast}</span>
            </div>
          )}

          {step === "MOBILE" ? (
            /* STEP 1: Enter Mobile Number */
            <>
              <h1 className="client-login-title">Client Portal</h1>
              <p className="client-login-subtitle">
                Access your profile and securely upload your documents.
              </p>

              <form className="client-login-form" onSubmit={handleSendOtp} noValidate>
                <div className="client-input-group">
                  <label htmlFor="mobile-input" className="client-input-label">
                    Mobile Number
                  </label>
                  <div className="client-phone-input-wrap">
                    <span className="client-phone-prefix">{countryCode}</span>
                    <input
                      id="mobile-input"
                      type="tel"
                      className="client-phone-input"
                      placeholder="98765 43210"
                      value={mobileNo}
                      onChange={handleMobileChange}
                      disabled={isSubmitting}
                      autoComplete="tel-national"
                      autoFocus
                      required
                    />
                    <Phone size={18} className="client-input-icon" />
                  </div>
                  <span className="client-input-help">
                    Enter your registered 10-digit mobile number.
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

                <button
                  type="submit"
                  className="client-login-btn"
                  disabled={isSubmitting || mobileNo.length < 10}
                >
                  {isSubmitting ? (
                    <span className="client-btn-loader">
                      <span className="client-spinner" />
                      Sending Verification Code...
                    </span>
                  ) : (
                    "Continue"
                  )}
                </button>

                <p className="client-whatsapp-note">
                  <MessageSquare size={14} className="whatsapp-note-icon" />
                  <span>Your registered mobile number will be verified through WhatsApp.</span>
                </p>
              </form>
            </>
          ) : (
            /* STEP 2: Verify OTP Screen */
            <>
              <h1 className="client-login-title">Verify Your Mobile Number</h1>
              <p className="client-login-subtitle otp-prompt">
                We've sent a 6-digit verification code to{" "}
                <strong>{maskedMobile || `${countryCode} ******${mobileNo.slice(-4)}`}</strong> on WhatsApp.
              </p>

              <form className="client-login-form" onSubmit={handleVerifyOtp} noValidate>
                <div className="client-otp-section">
                  <label className="client-input-label center-label">
                    Enter 6-Digit WhatsApp Code
                  </label>
                  <OtpInput
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                      if (errorMessage) setErrorMessage("");
                    }}
                    length={6}
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="client-login-btn"
                  disabled={isSubmitting || otp.length !== 6}
                >
                  {isSubmitting ? (
                    <span className="client-btn-loader">
                      <span className="client-spinner" />
                      Verifying Code...
                    </span>
                  ) : (
                    "Verify & Continue"
                  )}
                </button>

                {/* Resend OTP & Countdown */}
                <div className="client-resend-row">
                  {countdown > 0 ? (
                    <span className="resend-countdown-text">
                      Resend OTP in <strong>{formatCountdown(countdown)}</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="resend-otp-btn active"
                      onClick={handleResendOtp}
                      disabled={isSubmitting}
                    >
                      <RefreshCw size={13} className={isSubmitting ? "spinning" : ""} />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>

                {/* Change Mobile Number Option */}
                <div className="client-change-mobile-wrap">
                  <button
                    type="button"
                    className="client-change-mobile-btn"
                    onClick={handleChangeMobile}
                    disabled={isSubmitting}
                  >
                    Change Mobile Number
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Security Features Info */}
          <div className="client-login-security-features">
            <div className="security-item">
              <CheckCircle2 size={13} />
              <span>Instant WhatsApp OTP</span>
            </div>
            <div className="security-item">
              <CheckCircle2 size={13} />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>

          {/* Back to Staff CRM Login */}
          <div className="client-login-footer">
            <Link to="/login" className="back-to-staff-link">
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
