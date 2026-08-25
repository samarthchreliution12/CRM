import React from "react";
import { X, User, Mail, Phone, ShieldCheck, Activity, Clock, Calendar } from "lucide-react";
import "./StaffDetailModal.css";

const StaffDetailModal = ({ isOpen, onClose, staffUser }) => {
  if (!isOpen || !staffUser) return null;

  const isActive = staffUser.status === "active";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Staff Member Details</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">
                <User size={13} /> Full Name
              </span>
              <span className="detail-value">{staffUser.name}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                <Mail size={13} /> Email Address
              </span>
              <span className="detail-value">{staffUser.email}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                <Phone size={13} /> Mobile Number
              </span>
              <span className="detail-value">{staffUser.mobile || "Not Provided"}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                <ShieldCheck size={13} /> System Role
              </span>
              <span className="detail-value">{staffUser.role?.name || "Staff"}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                <Activity size={13} /> Account Status
              </span>
              <span className={isActive ? "badge-status-active" : "badge-status-inactive"}>
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                <Clock size={13} /> Last Login
              </span>
              <span className="detail-value">
                {staffUser.last_login ? new Date(staffUser.last_login).toLocaleString() : "Never Logged In"}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                <Calendar size={13} /> Account Created
              </span>
              <span className="detail-value">
                {staffUser.created_at ? new Date(staffUser.created_at).toLocaleString() : "—"}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                <Calendar size={13} /> Last Updated
              </span>
              <span className="detail-value">
                {staffUser.updated_at ? new Date(staffUser.updated_at).toLocaleString() : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-cancel-profile" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffDetailModal;
