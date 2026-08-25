import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import AuthLayout from "../../../components/auth/AuthLayout";
import AuthInput from "../../../components/auth/AuthInput";
import PasswordInput from "../../../components/auth/PasswordInput";
import AuthService from "../../../services/auth.service";
import "./Signup.css";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (globalError) {
      setGlobalError("");
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name || !formData.name.trim()) {
      errors.name = "Please enter your full name.";
    }

    if (!formData.email || !formData.email.trim()) {
      errors.email = "Please enter your email address.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = "Please enter a valid email address.";
      }
    }

    if (!formData.mobile || !formData.mobile.trim()) {
      errors.mobile = "Please enter your 10-digit mobile number.";
    } else {
      const mobileClean = formData.mobile.trim().replace(/[\s\-()]/g, "");
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(mobileClean)) {
        errors.mobile = "Please enter a valid 10-digit mobile number.";
      }
    }

    if (!formData.password || !formData.password.trim()) {
      errors.password = "Please enter a password.";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }

    if (!formData.confirmPassword || !formData.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await AuthService.signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim().replace(/[\s\-()]/g, ""),
        password: formData.password,
        role_id: 3, // Staff role ID
      });

      if (response && response.success) {
        setSuccessMessage("Staff account created successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login", { state: { registeredEmail: formData.email } });
        }, 1500);
      } else {
        setGlobalError(response.message || "Failed to create account.");
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const errorsObj = {};
        err.errors.forEach((item) => {
          if (item.field) errorsObj[item.field] = item.message;
        });
        setFieldErrors(errorsObj);
      } else {
        setGlobalError(err.message || "Signup failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-header">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Create your Staff account</p>
      </div>

      {globalError && (
        <div className="auth-alert auth-alert-error">
          <AlertCircle size={18} />
          <span>{globalError}</span>
        </div>
      )}

      {successMessage && (
        <div className="auth-alert auth-alert-success">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Full Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="John Doe"
          error={fieldErrors.name}
          disabled={isSubmitting}
          required
        />

        <AuthInput
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="name@example.com"
          error={fieldErrors.email}
          disabled={isSubmitting}
          required
        />

        <AuthInput
          label="Mobile Number"
          name="mobile"
          type="tel"
          value={formData.mobile}
          onChange={handleChange}
          placeholder="9876543210 (10 digits)"
          error={fieldErrors.mobile}
          disabled={isSubmitting}
          required
        />

        <PasswordInput
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="At least 6 characters"
          error={fieldErrors.password}
          disabled={isSubmitting}
          required
        />

        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter password"
          error={fieldErrors.confirmPassword}
          disabled={isSubmitting}
          required
        />

        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <div className="auth-footer">
        Already have an account? <Link to="/login">Sign In</Link>
      </div>
    </AuthLayout>
  );
};

export default Signup;
