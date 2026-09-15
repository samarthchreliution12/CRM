import headerLogo from "../../assets/website/logo/header-logo.png";
import "./AuthLayout.css";

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-container">
      {/* Left Light Financial Branding Section */}
      <div className="auth-branding-panel">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-lines-pattern" />

        <div className="auth-logo">
          <img src={headerLogo} alt="Parshwa Consultancy" className="auth-logo-img" />
        </div>

        <div className="auth-branding-content">
          <div className="auth-brand-badge">PARSHWA CONSULTANCY CRM</div>
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
