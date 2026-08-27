import React from "react";
import {
  X,
  User,
  Phone,
  Mail,
  Building,
  Tag,
  Briefcase,
  Globe,
  Calendar,
  Clock,
  FileText,
  UserCheck,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return dateStr;
  }
};

const LeadDetailsDrawer = ({
  lead,
  onClose,
  onEdit,
  onConvert,
  onDelete,
  onNavigateToClient,
  canUpdate = false,
  canDelete = false,
}) => {
  if (!lead) return null;

  const isConverted = lead.status === "converted" || Boolean(lead.converted_client_id);
  const convertedClientId = lead.converted_client_id || lead.converted_client?.id;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="lead-drawer-card" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <div className="drawer-user-avatar">
              {lead.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <h3 className="drawer-lead-name">{lead.name}</h3>
              <span className={`status-pill status-${lead.status}`}>
                {lead.status.toUpperCase()}
              </span>
            </div>
          </div>
          <button type="button" className="btn-close-drawer" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {/* Action Bar */}
          <div className="drawer-actions-bar">
            {isConverted ? (
              <div className="converted-info-box">
                <span className="converted-check-tag">Converted ✓</span>
                {convertedClientId && (
                  <button
                    type="button"
                    className="btn-view-client-link"
                    onClick={() => onNavigateToClient(convertedClientId)}
                  >
                    <ExternalLink size={14} />
                    <span>View Client Profile</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="unconverted-actions-row">
                {canUpdate && (
                  <button
                    type="button"
                    className="btn-drawer-convert"
                    onClick={() => onConvert(lead)}
                  >
                    <UserCheck size={15} />
                    <span>Convert to Client</span>
                  </button>
                )}
                {canUpdate && (
                  <button
                    type="button"
                    className="btn-drawer-edit"
                    onClick={() => onEdit(lead)}
                  >
                    <Edit2 size={15} />
                    <span>Edit</span>
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    className="btn-drawer-delete"
                    onClick={() => onDelete(lead)}
                  >
                    <Trash2 size={15} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Lead Information Grid */}
          <div className="drawer-info-grid">
            {/* Contact Details */}
            <div className="drawer-section-card">
              <h4 className="drawer-section-title">Contact & Organization</h4>
              <div className="info-kv-list">
                <div className="info-kv-row">
                  <User size={15} className="info-kv-icon" />
                  <span className="info-kv-label">Full Name:</span>
                  <span className="info-kv-val bold">{lead.name}</span>
                </div>
                {lead.company_name && (
                  <div className="info-kv-row">
                    <Building size={15} className="info-kv-icon" />
                    <span className="info-kv-label">Company:</span>
                    <span className="info-kv-val">{lead.company_name}</span>
                  </div>
                )}
                {lead.mobile_no && (
                  <div className="info-kv-row">
                    <Phone size={15} className="info-kv-icon" />
                    <span className="info-kv-label">Mobile:</span>
                    <span className="info-kv-val">{lead.mobile_no}</span>
                  </div>
                )}
                {lead.whatsapp_no && (
                  <div className="info-kv-row">
                    <Phone size={15} className="info-kv-icon" style={{ color: "#16a34a" }} />
                    <span className="info-kv-label">WhatsApp:</span>
                    <span className="info-kv-val">{lead.whatsapp_no}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="info-kv-row">
                    <Mail size={15} className="info-kv-icon" />
                    <span className="info-kv-label">Email:</span>
                    <span className="info-kv-val">{lead.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sales Pipeline Classification */}
            <div className="drawer-section-card">
              <h4 className="drawer-section-title">Sales Classification</h4>
              <div className="info-kv-list">
                <div className="info-kv-row">
                  <Tag size={15} className="info-kv-icon" />
                  <span className="info-kv-label">Client Type:</span>
                  <span className="info-kv-val">{lead.client_type?.name || "N/A"}</span>
                </div>
                <div className="info-kv-row">
                  <Briefcase size={15} className="info-kv-icon" />
                  <span className="info-kv-label">Interested Service:</span>
                  <span className="info-kv-val highlight">{lead.service?.name || "N/A"}</span>
                </div>
                <div className="info-kv-row">
                  <Globe size={15} className="info-kv-icon" />
                  <span className="info-kv-label">Source:</span>
                  <span className="info-kv-val">{lead.source || "N/A"}</span>
                </div>
                <div className="info-kv-row">
                  <ShieldAlert size={15} className="info-kv-icon" />
                  <span className="info-kv-label">Priority:</span>
                  <span className={`priority-pill priority-${lead.priority}`}>
                    {(lead.priority || "medium").toUpperCase()}
                  </span>
                </div>
                <div className="info-kv-row">
                  <User size={15} className="info-kv-icon" />
                  <span className="info-kv-label">Assigned Staff:</span>
                  <span className="info-kv-val">
                    {lead.assigned_staff?.name || "Unassigned"}
                  </span>
                </div>
              </div>
            </div>

            {/* Follow-up & Dates */}
            <div className="drawer-section-card">
              <h4 className="drawer-section-title">Activity & Timestamps</h4>
              <div className="info-kv-list">
                <div className="info-kv-row">
                  <Calendar size={15} className="info-kv-icon" />
                  <span className="info-kv-label">Next Follow-up:</span>
                  <span className="info-kv-val">{formatDateTime(lead.next_follow_up_at)}</span>
                </div>
                <div className="info-kv-row">
                  <Clock size={15} className="info-kv-icon" />
                  <span className="info-kv-label">Last Contacted:</span>
                  <span className="info-kv-val">{formatDateTime(lead.last_contacted_at)}</span>
                </div>
                <div className="info-kv-row">
                  <Clock size={15} className="info-kv-icon" />
                  <span className="info-kv-label">Created At:</span>
                  <span className="info-kv-val">{formatDateTime(lead.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="drawer-section-card">
              <h4 className="drawer-section-title">
                <FileText size={15} /> Notes & Remarks
              </h4>
              <p className="drawer-notes-text">
                {lead.notes || "No notes recorded for this lead."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          <button type="button" className="btn-close-modal" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailsDrawer;
