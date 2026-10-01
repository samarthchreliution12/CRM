import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Upload,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Layers,
  RefreshCw,
  Eye,
  Shield,
  Check,
} from "lucide-react";
import ClientPortalLayout from "../../components/clientPortal/ClientPortalLayout";
import useClientAuth from "../../hooks/useClientAuth";
import ClientPortalService from "../../services/clientPortal.service";
import UploadDocumentModal from "../../components/clientPortal/UploadDocumentModal";
import DocumentViewerModal from "../../components/clientPortal/DocumentViewerModal";
import SEO from "../../components/SEO";
import "./ClientDashboard.css";

const ClientDashboard = () => {
  const { client } = useClientAuth();

  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Upload Modal State
  const [activeUploadDoc, setActiveUploadDoc] = useState(null);

  // Document Viewer Modal State
  const [viewerDoc, setViewerDoc] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [docsData, profileData] = await Promise.all([
        ClientPortalService.getDocuments().catch((err) => {
          console.warn("Error fetching documents:", err);
          return [];
        }),
        ClientPortalService.getProfile().catch((err) => {
          console.warn("Error fetching profile:", err);
          return null;
        }),
      ]);

      setDocuments(docsData || []);
      if (profileData) {
        setProfile(profileData);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError(err.message || "Failed to load client information.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Display helpers
  const displayClient = profile || client;

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not provided";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatMobile = (num) => {
    if (!num) return "—";
    const clean = String(num).trim();
    return clean.startsWith("+") ? clean : `+91 ${clean}`;
  };

  const getClientTypeName = (type) => {
    if (!type) return "Individual";
    if (typeof type === "object" && type.name) return type.name;
    return String(type);
  };

  // Document counts
  const rejectedDocs = documents.filter((d) => d.status === "REJECTED");

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="doc-badge badge-approved">
            <CheckCircle2 size={13} /> Approved
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="doc-badge badge-review">
            <Clock size={13} /> Under Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="doc-badge badge-rejected">
            <AlertTriangle size={13} /> Rejected
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="doc-badge badge-pending">
            <Clock size={13} /> Pending
          </span>
        );
    }
  };

  return (
    <ClientPortalLayout>
      <SEO title="Client Dashboard - Parshwa Consultancy" noindex={true} />

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="client-toast-notification">
          <Check size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Welcome Section */}
      <div className="client-welcome-banner">
        <div className="welcome-banner-content">
          <div className="welcome-top-meta">
            <span className="client-welcome-badge">CLIENT PORTAL</span>
            {displayClient?.ucc_no && (
              <span className="welcome-ucc">
                UCC: <strong>{displayClient.ucc_no}</strong>
              </span>
            )}
          </div>
          <h1 className="welcome-title">Welcome, {displayClient?.name || "Client"}</h1>
          <p className="welcome-subtitle">
            Manage your profile and complete your pending documents.
          </p>
        </div>

        <div className="welcome-banner-actions">
          <Link to="/client/documents" className="welcome-cta-btn primary">
            <FileText size={16} />
            <span>My Documents</span>
          </Link>
          <Link to="/client/profile" className="welcome-cta-btn secondary">
            <User size={16} />
            <span>My Profile</span>
          </Link>
        </div>
      </div>

      {/* Rejection Alert Banner if any document is rejected */}
      {rejectedDocs.length > 0 && (
        <div className="rejected-alert-banner">
          <div className="alert-left">
            <div className="alert-icon-wrap">
              <AlertTriangle size={22} />
            </div>
            <div>
              <strong>Action Required: {rejectedDocs.length} Document(s) Rejected</strong>
              <p>
                One or more documents require your immediate attention. Please re-upload with clear, readable copies.
              </p>
            </div>
          </div>
          <Link to="/client/documents" className="alert-action-btn">
            Fix Documents Now <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="section-error-msg">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button type="button" onClick={loadDashboardData} className="retry-btn">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* 2. Profile Summary Card */}
      <div className="client-profile-summary-card">
        <div className="summary-card-header">
          <div className="summary-header-left">
            <div className="summary-icon-wrap">
              <User size={18} />
            </div>
            <div>
              <h2 className="summary-card-title">Profile Summary</h2>
              <span className="summary-card-desc">Your registered details on file</span>
            </div>
          </div>
          <Link to="/client/profile" className="summary-header-link">
            <span>View Full Profile</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">
              <User size={14} /> Full Name
            </span>
            <span className="summary-value highlight">{displayClient?.name || "—"}</span>
          </div>

          <div className="summary-item">
            <span className="summary-label">
              <Phone size={14} /> Mobile Number
            </span>
            <span className="summary-value">{formatMobile(displayClient?.mobile_no)}</span>
          </div>

          <div className="summary-item">
            <span className="summary-label">
              <Mail size={14} /> Email
            </span>
            <span className="summary-value">{displayClient?.email || "Not registered"}</span>
          </div>

          <div className="summary-item">
            <span className="summary-label">
              <CreditCard size={14} /> PAN (Tax ID)
            </span>
            <span className="summary-value pan-value">
              <Shield size={12} />
              {displayClient?.pan || displayClient?.masked_pan || "Not linked"}
            </span>
          </div>

          <div className="summary-item">
            <span className="summary-label">
              <Calendar size={14} /> Date of Birth
            </span>
            <span className="summary-value">{formatDate(displayClient?.dob)}</span>
          </div>

          <div className="summary-item">
            <span className="summary-label">
              <Layers size={14} /> Client Type
            </span>
            <span className="summary-value">{getClientTypeName(displayClient?.client_type)}</span>
          </div>

          <div className="summary-item">
            <span className="summary-label">
              <CheckCircle2 size={14} /> Status
            </span>
            <span className="summary-value">
              <span className="summary-status-pill active">
                <CheckCircle2 size={12} />
                {displayClient?.status ? displayClient.status.toUpperCase() : "ACTIVE"}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Pending Documents Section */}
      <div className="client-dashboard-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Pending Documents</h2>
            <p className="section-subtitle">
              Upload required identity and compliance documents for account verification.
            </p>
          </div>
          <Link to="/client/documents" className="section-view-all">
            <span>View All ({documents.length})</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {isLoading ? (
          <div className="dashboard-loading-skeleton">
            <div className="skeleton-bar" />
            <div className="skeleton-bar" />
            <div className="skeleton-bar" />
          </div>
        ) : documents.length === 0 ? (
          <div className="docs-empty-state">
            <FileText size={40} />
            <h3>No pending documents</h3>
            <p>All your required compliance documents are in order.</p>
          </div>
        ) : (
          <div className="checklist-cards-container">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`checklist-card ${doc.status === "REJECTED" ? "rejected-card" : ""}`}
              >
                <div className="checklist-card-main">
                  <div
                    className={`doc-icon-container ${
                      doc.status === "APPROVED"
                        ? "approved"
                        : doc.status === "REJECTED"
                        ? "rejected"
                        : doc.status === "UNDER_REVIEW"
                        ? "review"
                        : "pending"
                    }`}
                  >
                    <FileText size={20} />
                  </div>
                  <div className="doc-meta">
                    <div className="doc-name-row">
                      <span className="doc-title">{doc.document_name}</span>
                      <span className="doc-type-code">{doc.document_type}</span>
                      {doc.required ? (
                        <span className="doc-type-pill required">Required</span>
                      ) : (
                        <span className="doc-type-pill optional">Optional</span>
                      )}
                    </div>
                    <p className="doc-description">{doc.description || "Required for account compliance"}</p>
                    {doc.status === "REJECTED" && doc.rejection_reason && (
                      <div className="rejection-note">
                        <strong>Reason:</strong> {doc.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="checklist-card-actions">
                  <div className="doc-status-col">
                    {getStatusBadge(doc.status)}
                    {doc.uploaded_at && (
                      <span className="doc-date-text">
                        Uploaded{" "}
                        {new Date(doc.uploaded_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  <div className="doc-buttons-col">
                    {doc.can_upload && (
                      <button
                        type="button"
                        className="doc-action-btn upload"
                        onClick={() => setActiveUploadDoc(doc)}
                      >
                        <Upload size={14} />
                        <span>{doc.status === "REJECTED" ? "Re-upload Document" : "Upload Document"}</span>
                      </button>
                    )}

                    {doc.can_download && (
                      <button
                        type="button"
                        className="doc-action-btn view"
                        onClick={() => setViewerDoc(doc)}
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {activeUploadDoc && (
        <UploadDocumentModal
          document={activeUploadDoc}
          onClose={() => setActiveUploadDoc(null)}
          onSuccess={() => {
            showToast(`${activeUploadDoc.document_name} uploaded successfully.`);
            setActiveUploadDoc(null);
            loadDashboardData();
          }}
        />
      )}

      {/* Document Viewer Modal */}
      {viewerDoc && (
        <DocumentViewerModal
          document={viewerDoc}
          onClose={() => setViewerDoc(null)}
        />
      )}
    </ClientPortalLayout>
  );
};

export default ClientDashboard;
