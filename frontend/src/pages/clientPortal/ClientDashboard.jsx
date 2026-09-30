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
  RefreshCw,
  Eye,
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

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Upload Modal State
  const [activeUploadDoc, setActiveUploadDoc] = useState(null);

  // Document Viewer Modal State
  const [viewerDoc, setViewerDoc] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const docs = await ClientPortalService.getDocuments();
      setDocuments(docs || []);
    } catch (err) {
      console.error("Error loading documents:", err);
      setError(err.message || "Failed to load document status.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Document stats calculation
  const requiredCount = documents.filter((d) => d.required).length;
  const pendingCount = documents.filter((d) => d.status === "PENDING").length;
  const underReviewCount = documents.filter((d) => d.status === "UNDER_REVIEW").length;
  const approvedCount = documents.filter((d) => d.status === "APPROVED").length;
  const rejectedDocs = documents.filter((d) => d.status === "REJECTED");

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return <span className="doc-badge badge-approved"><CheckCircle2 size={13} /> Approved</span>;
      case "UNDER_REVIEW":
        return <span className="doc-badge badge-review"><Clock size={13} /> Under Review</span>;
      case "REJECTED":
        return <span className="doc-badge badge-rejected"><AlertTriangle size={13} /> Rejected</span>;
      case "PENDING":
      default:
        return <span className="doc-badge badge-pending"><Clock size={13} /> Pending Upload</span>;
    }
  };

  return (
    <ClientPortalLayout>
      <SEO title="Client Dashboard - Parshwa Consultancy" noindex={true} />

      {/* Welcome Banner */}
      <div className="client-welcome-banner">
        <div className="welcome-banner-content">
          <div className="welcome-top-meta">
            <span className="client-welcome-badge">INVESTOR PORTAL</span>
            {client?.ucc_no && <span className="welcome-ucc">UCC: <strong>{client.ucc_no}</strong></span>}
          </div>
          <h1 className="welcome-title">Welcome, {client?.name || "Client"}</h1>
          <p className="welcome-subtitle">
            Manage your profile and submit your required documents securely.
          </p>
        </div>

        <div className="welcome-banner-actions">
          <Link to="/client-portal/documents" className="welcome-cta-btn primary">
            <FileText size={16} />
            <span>Manage Documents</span>
          </Link>
          <Link to="/client-portal/profile" className="welcome-cta-btn secondary">
            <User size={16} />
            <span>View Profile</span>
          </Link>
        </div>
      </div>

      {/* Rejected Documents Immediate Alert */}
      {rejectedDocs.length > 0 && (
        <div className="rejected-alert-banner">
          <div className="alert-left">
            <div className="alert-icon-wrap">
              <AlertTriangle size={22} />
            </div>
            <div>
              <strong>Action Required: {rejectedDocs.length} Document(s) Rejected</strong>
              <p>
                One or more documents require your immediate attention. Please re-upload with clear copies.
              </p>
            </div>
          </div>
          <Link to="/client-portal/documents" className="alert-action-btn">
            Fix Documents Now <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="client-stats-grid">
        <div className="client-stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Required</span>
            <div className="stat-icon-wrap neutral">
              <FileText size={18} />
            </div>
          </div>
          <div className="stat-number">{isLoading ? "..." : requiredCount}</div>
          <span className="stat-subtext">Mandatory portfolio documents</span>
        </div>

        <div className="client-stat-card">
          <div className="stat-header">
            <span className="stat-label">Pending Uploads</span>
            <div className="stat-icon-wrap warning">
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-number warning">{isLoading ? "..." : pendingCount}</div>
          <span className="stat-subtext">Waiting for your submission</span>
        </div>

        <div className="client-stat-card">
          <div className="stat-header">
            <span className="stat-label">Under Review</span>
            <div className="stat-icon-wrap info">
              <RefreshCw size={18} />
            </div>
          </div>
          <div className="stat-number info">{isLoading ? "..." : underReviewCount}</div>
          <span className="stat-subtext">Being verified by staff</span>
        </div>

        <div className="client-stat-card">
          <div className="stat-header">
            <span className="stat-label">Verified & Approved</span>
            <div className="stat-icon-wrap success">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-number success">{isLoading ? "..." : approvedCount}</div>
          <span className="stat-subtext">Active on your account</span>
        </div>
      </div>

      {/* Main Checklist Section */}
      <div className="client-dashboard-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Your Documents Checklist</h2>
            <p className="section-subtitle">
              Upload all required identity, tax, and address proof documents for compliance.
            </p>
          </div>
          <Link to="/client-portal/documents" className="section-view-all">
            <span>View All</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {error && (
          <div className="section-error-msg">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button type="button" onClick={fetchDocuments} className="retry-btn">Retry</button>
          </div>
        )}

        {isLoading ? (
          <div className="dashboard-loading-skeleton">
            <div className="skeleton-bar" />
            <div className="skeleton-bar" />
            <div className="skeleton-bar" />
          </div>
        ) : (
          <div className="checklist-cards-container">
            {documents.slice(0, 5).map((doc) => (
              <div key={doc.id} className="checklist-card">
                <div className="checklist-card-main">
                  <div className="doc-icon-container">
                    <FileText size={20} />
                  </div>
                  <div className="doc-meta">
                    <div className="doc-name-row">
                      <span className="doc-title">{doc.document_name}</span>
                      {doc.required ? (
                        <span className="doc-type-pill required">Required</span>
                      ) : (
                        <span className="doc-type-pill optional">Optional</span>
                      )}
                    </div>
                    <p className="doc-description">{doc.description}</p>
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
                        Uploaded {new Date(doc.uploaded_at).toLocaleDateString("en-IN", {
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
                        <span>{doc.status === "REJECTED" ? "Re-upload" : "Upload"}</span>
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

      {/* Upload Modal */}
      {activeUploadDoc && (
        <UploadDocumentModal
          document={activeUploadDoc}
          onClose={() => setActiveUploadDoc(null)}
          onSuccess={() => {
            setActiveUploadDoc(null);
            fetchDocuments();
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
