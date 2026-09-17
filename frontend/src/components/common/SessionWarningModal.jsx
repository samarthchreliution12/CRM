import React from "react";
import { AlertTriangle, Clock, LogOut, RefreshCw } from "lucide-react";
import "./SessionWarningModal.css";

const SessionWarningModal = ({ isOpen, remainingSeconds, onStayLoggedIn, onLogout }) => {
  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div className="session-modal-overlay">
      <div className="session-modal-card">
        <div className="session-modal-header">
          <div className="session-modal-icon-wrapper">
            <AlertTriangle size={24} color="#d97706" />
          </div>
          <div>
            <h3 className="session-modal-title">Session Expiring Soon</h3>
            <p className="session-modal-subtitle">You have been inactive for a while.</p>
          </div>
        </div>

        <div className="session-modal-body">
          <p className="session-modal-text">
            Your session is about to expire due to inactivity. You will be automatically logged out in:
          </p>
          <div className="session-countdown-badge">
            <Clock size={18} />
            <span>{formattedTime}</span>
          </div>
        </div>

        <div className="session-modal-footer">
          <button type="button" className="btn-session-logout" onClick={onLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>

          <button type="button" className="btn-session-stay" onClick={onStayLoggedIn}>
            <RefreshCw size={16} />
            <span>Stay Logged In</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningModal;
