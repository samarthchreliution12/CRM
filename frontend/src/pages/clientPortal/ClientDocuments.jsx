import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Upload,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Check,
} from "lucide-react";
import ClientPortalLayout from "../../components/clientPortal/ClientPortalLayout";
import ClientPortalService from "../../services/clientPortal.service";
import UploadDocumentModal from "../../components/clientPortal/UploadDocumentModal";
import DocumentViewerModal from "../../components/clientPortal/DocumentViewerModal";
import SEO from "../../components/SEO";
import "./ClientDocuments.css";

const ClientDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [activeUploadDoc, setActiveUploadDoc] = useState(null);
  const [activeViewerDoc, setActiveViewerDoc] = useState(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ClientPortalService.getDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error("Error loading client documents:", err);
      setError(err.message || "Failed to retrieve documents list.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Counts
  const counts = {
    ALL: documents.length,
    PENDING: documents.filter((d) => d.status === "PENDING").length,
    UNDER_REVIEW: documents.filter((d) => d.status === "UNDER_REVIEW").length,
    APPROVED: documents.filter((d) => d.status === "APPROVED").length,
    REJECTED: documents.filter((d) => d.status === "REJECTED").length,
  };

  // Filtered list
  const filteredDocuments = documents.filter((doc) => {
    if (activeTab !== "ALL" && doc.status !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = doc.document_name?.toLowerCase().includes(q);
      const matchType = doc.document_type?.toLowerCase().includes(q);
      const matchDesc = doc.description?.toLowerCase().includes(q);
      return matchName || matchType || matchDesc;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return <span className="doc-page-badge approved"><CheckCircle2 size={13} /> Verified & Approved</span>;
      case "UNDER_REVIEW":
        return <span className="doc-page-badge review"><Clock size={13} /> Under Review</span>;
      case "REJECTED":
        return <span className="doc-page-badge rejected"><AlertTriangle size={13} /> Rejected</span>;
      case "PENDING":
      default:
        return <span className="doc-page-badge pending"><Clock size={13} /> Pending Upload</span>;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleDownload = async (doc) => {
    try {
      const docId = doc.document_id || doc.id;
      const result = await ClientPortalService.getDocumentFile(docId, true);
      const downloadUrl = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = result.filename || doc.original_file_name || `${doc.document_type}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (err) {
      alert(err.message || "Failed to download document.");
    }
  };

  return (
    <ClientPortalLayout>
      <SEO title="My Documents - Client Portal" noindex={true} />

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="client-toast-notification">
          <Check size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="client-docs-header">
        <div>
          <h1 className="docs-page-title">My Documents</h1>
          <p className="docs-page-subtitle">
            Upload and view your KYC, tax identification, and account compliance documents.
          </p>
        </div>

        <button
          type="button"
          className="docs-refresh-btn"
          onClick={fetchDocuments}
          disabled={isLoading}
          title="Refresh documents list"
        >
          <RefreshCw size={15} className={isLoading ? "rotating-icon" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="docs-error-banner">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button type="button" onClick={fetchDocuments} className="docs-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="docs-controls-bar">
        <div className="docs-filter-tabs">
          <button
            type="button"
            className={`filter-tab ${activeTab === "ALL" ? "active" : ""}`}
            onClick={() => setActiveTab("ALL")}
          >
            All <span className="tab-count">{counts.ALL}</span>
          </button>

          <button
            type="button"
            className={`filter-tab ${activeTab === "PENDING" ? "active" : ""}`}
            onClick={() => setActiveTab("PENDING")}
          >
            Pending <span className="tab-count warning">{counts.PENDING}</span>
          </button>

          <button
            type="button"
            className={`filter-tab ${activeTab === "UNDER_REVIEW" ? "active" : ""}`}
            onClick={() => setActiveTab("UNDER_REVIEW")}
          >
            Under Review <span className="tab-count info">{counts.UNDER_REVIEW}</span>
          </button>

          <button
            type="button"
            className={`filter-tab ${activeTab === "APPROVED" ? "active" : ""}`}
            onClick={() => setActiveTab("APPROVED")}
          >
            Approved <span className="tab-count success">{counts.APPROVED}</span>
          </button>

          {counts.REJECTED > 0 && (
            <button
              type="button"
              className={`filter-tab ${activeTab === "REJECTED" ? "active" : ""}`}
              onClick={() => setActiveTab("REJECTED")}
            >
              Rejected <span className="tab-count danger">{counts.REJECTED}</span>
            </button>
          )}
        </div>

        <div className="docs-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="docs-search-input"
            placeholder="Search by document name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Document Cards List */}
      {isLoading ? (
        <div className="docs-loading-skeleton">
          <div className="skeleton-doc-card" />
          <div className="skeleton-doc-card" />
          <div className="skeleton-doc-card" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="docs-empty-state">
          <FileText size={48} />
          <h3>No documents found</h3>
          <p>
            {searchQuery
              ? `No document matches "${searchQuery}". Try a different search term.`
              : "No documents available in this category."}
          </p>
        </div>
      ) : (
        <div className="docs-cards-list">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className={`doc-item-card ${doc.status === "REJECTED" ? "border-rejected" : ""}`}
            >
              <div className="doc-item-left">
                <div
                  className={`doc-type-icon-box ${
                    doc.status === "APPROVED"
                      ? "approved"
                      : doc.status === "REJECTED"
                      ? "rejected"
                      : doc.status === "UNDER_REVIEW"
                      ? "review"
                      : "pending"
                  }`}
                >
                  <FileText size={22} />
                </div>

                <div className="doc-item-details">
                  <div className="doc-header-row">
                    <h3 className="doc-item-title">{doc.document_name}</h3>
                    {doc.required ? (
                      <span className="doc-pill mandatory">Required</span>
                    ) : (
                      <span className="doc-pill optional">Optional</span>
                    )}
                    {getStatusBadge(doc.status)}
                  </div>

                  <p className="doc-item-desc">{doc.description}</p>

                  {/* Rejection Alert */}
                  {doc.status === "REJECTED" && doc.rejection_reason && (
                    <div className="doc-rejection-box">
                      <div className="rejection-box-header">
                        <AlertTriangle size={15} />
                        <strong>Verification Issue:</strong>
                      </div>
                      <p className="rejection-box-reason">{doc.rejection_reason}</p>
                      <span className="rejection-box-hint">
                        Please upload an updated and clearly legible document to resolve this.
                      </span>
                    </div>
                  )}

                  {/* Uploaded File Meta Details */}
                  {doc.uploaded_at && (
                    <div className="doc-file-meta-row">
                      <span className="file-meta-item">
                        File: <strong>{doc.original_file_name || `${doc.document_type}.pdf`}</strong>
                      </span>
                      {doc.file_size && (
                        <span className="file-meta-item">
                          Size: {formatFileSize(doc.file_size)}
                        </span>
                      )}
                      <span className="file-meta-item">
                        Uploaded on{" "}
                        {new Date(doc.uploaded_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="doc-item-actions">
                {doc.can_upload && (
                  <button
                    type="button"
                    className={`doc-btn-primary ${doc.status === "REJECTED" ? "reupload" : ""}`}
                    onClick={() => setActiveUploadDoc(doc)}
                  >
                    <Upload size={15} />
                    <span>{doc.status === "REJECTED" ? "Re-upload Document" : "Upload Document"}</span>
                  </button>
                )}

                {doc.can_download && (
                  <div className="doc-secondary-actions">
                    <button
                      type="button"
                      className="doc-btn-secondary"
                      onClick={() => setActiveViewerDoc(doc)}
                      title="Preview Document"
                    >
                      <Eye size={15} />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      className="doc-btn-secondary icon-only"
                      onClick={() => handleDownload(doc)}
                      title="Download Encrypted Document"
                    >
                      <Download size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      {activeUploadDoc && (
        <UploadDocumentModal
          document={activeUploadDoc}
          onClose={() => setActiveUploadDoc(null)}
          onSuccess={() => {
            showToast(`${activeUploadDoc.document_name} uploaded successfully.`);
            setActiveUploadDoc(null);
            fetchDocuments();
          }}
        />
      )}

      {/* Document Preview & Download Modal */}
      {activeViewerDoc && (
        <DocumentViewerModal
          document={activeViewerDoc}
          onClose={() => setActiveViewerDoc(null)}
        />
      )}
    </ClientPortalLayout>
  );
};

export default ClientDocuments;
