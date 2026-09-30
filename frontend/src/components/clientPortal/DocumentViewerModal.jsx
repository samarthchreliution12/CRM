import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
} from "lucide-react";
import ClientPortalService from "../../services/clientPortal.service";
import "./DocumentViewerModal.css";

const DocumentViewerModal = ({ document, onClose }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [mimeType, setMimeType] = useState("");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let objectUrl = null;

    const loadDocument = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch decrypted blob through ClientPortalService
        const docId = document.document_id || document.id;
        const result = await ClientPortalService.getDocumentFile(docId, false);
        objectUrl = URL.createObjectURL(result.blob);
        setFileUrl(objectUrl);
        setMimeType(result.mimeType || result.blob.type || "application/pdf");
        setFileName(result.filename || document.original_file_name || "document.pdf");
      } catch (err) {
        console.error("Error loading document preview:", err);
        setError(err.message || "Failed to load document preview. Please try downloading directly.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [document]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const docId = document.document_id || document.id;
      const result = await ClientPortalService.getDocumentFile(docId, true);
      const downloadUrl = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = result.filename || fileName || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (err) {
      console.error("Download failed:", err);
      alert(err.message || "Failed to download document.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return <span className="viewer-status-badge approved"><CheckCircle2 size={13} /> Verified & Approved</span>;
      case "UNDER_REVIEW":
        return <span className="viewer-status-badge review"><Clock size={13} /> Under Compliance Review</span>;
      case "REJECTED":
        return <span className="viewer-status-badge rejected"><AlertTriangle size={13} /> Rejected</span>;
      case "PENDING":
      default:
        return <span className="viewer-status-badge pending"><Clock size={13} /> Pending Review</span>;
    }
  };

  const isPdf = mimeType.includes("pdf");
  const isImage = mimeType.startsWith("image/");

  return (
    <div className="viewer-modal-backdrop" onClick={onClose}>
      <div className="viewer-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="viewer-modal-header">
          <div className="viewer-header-left">
            <div className="viewer-icon-circle">
              <FileText size={20} />
            </div>
            <div>
              <div className="viewer-title-row">
                <h3 className="viewer-title">{document.document_name}</h3>
                {getStatusBadge(document.status)}
              </div>
              <span className="viewer-filename">
                {document.original_file_name || fileName || "Encrypted Document"}
              </span>
            </div>
          </div>

          <div className="viewer-header-actions">
            <button
              type="button"
              className="viewer-download-btn"
              onClick={handleDownload}
              disabled={isDownloading || isLoading}
              title="Download Document"
            >
              <Download size={15} />
              <span>{isDownloading ? "Downloading..." : "Download"}</span>
            </button>

            <button
              type="button"
              className="viewer-close-btn"
              onClick={onClose}
              aria-label="Close Preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Rejection Note */}
        {document.status === "REJECTED" && document.rejection_reason && (
          <div className="viewer-rejection-callout">
            <AlertTriangle size={16} />
            <span>
              <strong>Rejection Reason:</strong> {document.rejection_reason}
            </span>
          </div>
        )}

        {/* Preview Container */}
        <div className="viewer-content-container">
          {isLoading ? (
            <div className="viewer-loading-state">
              <div className="viewer-spinner" />
              <span>Decrypting and loading document preview...</span>
            </div>
          ) : error ? (
            <div className="viewer-error-state">
              <AlertCircle size={32} />
              <h4>Preview Unavailable</h4>
              <p>{error}</p>
              <button
                type="button"
                className="viewer-download-btn"
                onClick={handleDownload}
              >
                <Download size={14} /> Download File Directly
              </button>
            </div>
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              title={document.document_name}
              className="viewer-pdf-frame"
            />
          ) : isImage ? (
            <div className="viewer-image-wrap">
              <img src={fileUrl} alt={document.document_name} className="viewer-image" />
            </div>
          ) : (
            <div className="viewer-fallback-state">
              <FileText size={48} />
              <p>Preview not supported for this file format.</p>
              <button
                type="button"
                className="viewer-download-btn"
                onClick={handleDownload}
              >
                <Download size={14} /> Download File
              </button>
            </div>
          )}
        </div>

        {/* Footer Security Stamp */}
        <div className="viewer-modal-footer">
          <div className="viewer-security-stamp">
            <Lock size={12} />
            <span>Encrypted transmission via HTTPS • No temporary disk caches</span>
          </div>
          <button type="button" className="viewer-close-footer-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
