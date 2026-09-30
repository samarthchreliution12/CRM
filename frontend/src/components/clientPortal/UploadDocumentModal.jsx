import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  File,
  Trash2,
  Lock,
} from "lucide-react";
import ClientPortalService from "../../services/clientPortal.service";
import "./UploadDocumentModal.css";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = [".pdf", ".jpeg", ".jpg", ".png"];

const UploadDocumentModal = ({ document, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFile = (selectedFile) => {
    if (!selectedFile) return "Please choose a file.";

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      return `File size (${formatFileSize(selectedFile.size)}) exceeds the maximum allowed limit of 10MB.`;
    }

    const ext = "." + (selectedFile.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return "Invalid file type. Only PDF, JPG, and PNG files are allowed.";
    }

    return null;
  };

  const handleFileSelection = (selectedFile) => {
    setErrorMessage("");
    const error = validateFile(selectedFile);
    if (error) {
      setErrorMessage(error);
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");

    try {
      // document.id is the requirement ID from GET /api/client-portal/documents
      await ClientPortalService.uploadDocument(document.id, file);
      setSuccessMessage(`${document.document_name} uploaded successfully!`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 900);
    } catch (err) {
      setErrorMessage(err.message || "Failed to upload document. Please try again.");
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="upload-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="upload-modal-header">
          <div className="upload-modal-header-text">
            <h3 className="upload-modal-title">Upload {document.document_name}</h3>
            <p className="upload-modal-subtitle">{document.description || "Upload clear copy for verification"}</p>
          </div>
          <button type="button" className="upload-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Previous Rejection Reason Callout if applicable */}
        {document.status === "REJECTED" && document.rejection_reason && (
          <div className="modal-rejection-callout">
            <AlertCircle size={18} className="rejection-icon" />
            <div>
              <strong>Previous Submission Rejected:</strong>
              <p>{document.rejection_reason}</p>
              <span>Please review and re-upload an updated, high-resolution copy.</span>
            </div>
          </div>
        )}

        {/* Success or Error Banners */}
        {errorMessage && (
          <div className="modal-alert error">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="modal-alert success">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit}>
          {!file ? (
            <div
              className={`dropzone-container ${dragActive ? "drag-active" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                style={{ display: "none" }}
                onChange={handleInputChange}
                disabled={isUploading}
              />
              <div className="dropzone-icon-circle">
                <Upload size={24} />
              </div>
              <strong className="dropzone-prompt">
                Drag & Drop your document here, or <span className="browse-link">Browse files</span>
              </strong>
              <span className="dropzone-limits">Supported formats: PDF, JPG, PNG • Max size: 10MB</span>
            </div>
          ) : (
            <div className="selected-file-card">
              <div className="selected-file-left">
                <div className="file-icon-wrap">
                  {file.type === "application/pdf" ? <FileText size={22} /> : <File size={22} />}
                </div>
                <div className="file-details">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  className="remove-file-btn"
                  onClick={() => setFile(null)}
                  title="Remove selected file"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}

          {/* Security note */}
          <div className="upload-security-note">
            <Lock size={12} />
            <span>Encrypted using AES-256 before disk storage. Transmitted over SSL.</span>
          </div>

          {/* Footer Actions */}
          <div className="upload-modal-footer">
            <button
              type="button"
              className="modal-btn cancel"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn submit"
              disabled={!file || isUploading || !!successMessage}
            >
              {isUploading ? (
                <span className="btn-loading-flex">
                  <span className="modal-spinner" />
                  Encrypting & Uploading...
                </span>
              ) : (
                `Upload ${document.status === "REJECTED" ? "Updated " : ""}Document`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadDocumentModal;
