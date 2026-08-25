import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import AuthLayout from "../../../components/auth/AuthLayout";
import AuthInput from "../../../components/auth/AuthInput";
import PasswordInput from "../../../components/auth/PasswordInput";
import useAuth from "../../../hooks/useAuth";
import "./Login.css";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: location.state?.registeredEmail || "",
    password: "",
    rememberMe: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.state?.registeredEmail) {
      setFormData((prev) => ({ ...prev, email: location.state.registeredEmail }));
    }
  }, [location.state]);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (globalError) {
      setGlobalError("");
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email || !formData.email.trim()) {
      errors.email = "Please enter your email or mobile number.";
    }

    if (!formData.password || !formData.password.trim()) {
      errors.password = "Please enter your password.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login(formData.email.trim(), formData.password, formData.rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const errorsObj = {};
        err.errors.forEach((item) => {
          if (item.field) errorsObj[item.field] = item.message;
        });
        setFieldErrors(errorsObj);
      } else {
        setGlobalError(err.message || "Invalid email or password.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-header">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to access your CRM</p>
      </div>

      {globalError && (
        <div className="auth-alert auth-alert-error">
          <AlertCircle size={18} />
          <span>{globalError}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Email or Mobile Number"
          name="email"
          type="text"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email or mobile"
          error={fieldErrors.email}
          disabled={isSubmitting}
          required
        />

        <PasswordInput
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          error={fieldErrors.password}
          disabled={isSubmitting}
          required
        />

        <div className="auth-form-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <span>Remember me</span>
          </label>

          <Link to="/forgot-password" className="forgot-password-link">
            Forgot Password?
          </Link>
        </div>

        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="auth-footer">
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </div>
    </AuthLayout>
  );
};

export default Login;
