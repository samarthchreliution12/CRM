import React, { useState, useEffect } from "react";
import ClientService from "../../services/client.service";
import useAuth from "../../hooks/useAuth";
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import "./DocumentUploadModal.css";

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const DocumentUploadModal = ({
  isOpen,
  onClose,
  initialClient = null,
  targetDocument = null, // If provided, mode is REPLACE
  onSuccess,
}) => {
  const { token } = useAuth();
  const isReplace = Boolean(targetDocument);

  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(
    initialClient ? initialClient.id : targetDocument ? targetDocument.client_id : ""
  );
  const [documentType, setDocumentType] = useState(
    targetDocument ? targetDocument.document_type || "PAN" : "PAN"
  );
  const [documentName, setDocumentName] = useState(
    targetDocument ? targetDocument.document_name || "" : ""
  );
  const [selectedFile, setSelectedFile] = useState(null);

  const [loadingClients, setLoadingClients] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (targetDocument) {
      setSelectedClientId(targetDocument.client_id);
      setDocumentType(targetDocument.document_type || "PAN");
      setDocumentName(targetDocument.document_name || "");
      setSelectedFile(null);
    } else if (initialClient) {
      setSelectedClientId(initialClient.id);
      setDocumentType("PAN");
      setDocumentName("");
      setSelectedFile(null);
    } else {
      async function fetchClientOptions() {
        try {
          setLoadingClients(true);
          const res = await ClientService.getClients({ limit: 100 }, token);
          setClients(res?.data?.clients || []);
        } catch (err) {
          console.error("Failed to load clients list for upload:", err);
        } finally {
          setLoadingClients(false);
        }
      }
      fetchClientOptions();
    }
  }, [isOpen, initialClient, targetDocument, token]);

  if (!isOpen) return null;

  const currentClient =
    initialClient ||
    (targetDocument && { id: targetDocument.client_id, name: targetDocument.client_name, ucc_no: targetDocument.client_ucc }) ||
    clients.find((c) => String(c.id) === String(selectedClientId));

  const isOtherType = String(documentType).toUpperCase() === "OTHER";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMsg("");

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File size exceeds maximum allowed limit of 10MB.");
      return;
    }

    const allowedExts = ["pdf", "jpg", "jpeg", "png"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowedExts.includes(ext)) {
      setErrorMsg("Invalid file type. Allowed formats: PDF, JPG, JPEG, PNG.");
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClientId) {
      setErrorMsg("Please select a client.");
      return;
    }

    if (!documentType) {
      setErrorMsg("Please select a document type.");
      return;
    }

    if (isOtherType && (!documentName || !documentName.trim())) {
      setErrorMsg("Document name is required when document type is Other.");
      return;
    }

    if (!isReplace && !selectedFile) {
      setErrorMsg("Please select a document file to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const formData = new FormData();
      formData.append("document_type", documentType);
      if (isOtherType) {
        formData.append("document_name", documentName.trim());
      }
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      if (isReplace) {
        await ClientService.replaceClientDocument(selectedClientId, targetDocument.id, formData, token);
        setSuccessMsg("Document replaced successfully. It is pending verification.");
      } else {
        await ClientService.uploadClientDocument(selectedClientId, formData, token);
        setSuccessMsg("Document uploaded successfully with status PENDING.");
      }

      setTimeout(() => {
        setIsUploading(false);
        setSuccessMsg("");
        setSelectedFile(null);
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setIsUploading(false);
      setErrorMsg(err.message || "Failed to save document.");
    }
  };

  return (
    <div className="doc-modal-backdrop" onClick={onClose}>
      <div className="doc-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="doc-modal-header">
          <h3 className="doc-modal-title">{isReplace ? "Replace Document" : "Upload Document"}</h3>
          <button type="button" className="btn-close-modal" onClick={onClose} disabled={isUploading}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="doc-modal-body">
            {errorMsg && (
              <div className="banner-error">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="banner-success">
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* If Replace, display current file info banner */}
            {isReplace && targetDocument && (
              <div className="current-doc-banner">
                <div>
                  <span className="current-doc-label">Current Document:</span>
                  <span className="current-doc-title">
                    {targetDocument.document_name || targetDocument.document_type}
                  </span>
                </div>
                <div>
                  <span className="current-doc-label">Current File:</span>
                  <span className="current-doc-file">{targetDocument.original_file_name}</span>
                </div>
              </div>
            )}

            {/* Client Selection */}
            <div className="form-group">
              <label className="form-label">
                Client <span className="required-star">*</span>
              </label>
              {initialClient || isReplace ? (
                <div className="selected-client-card">
                  <span className="client-card-name">{currentClient?.name}</span>
                  <span className="client-card-ucc">
                    UCC: {currentClient?.ucc_no || (currentClient ? `CL-${currentClient.id}` : "")}
                  </span>
                </div>
              ) : (
                <select
                  className="form-input"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  disabled={loadingClients || isUploading}
                  required
                >
                  <option value="">-- Select Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.ucc_no || `CL-${c.id}`})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Document Type Dropdown */}
            <div className="form-group">
              <label className="form-label">
                Document Type <span className="required-star">*</span>
              </label>
              <select
                className="form-input"
                value={documentType}
                onChange={(e) => {
                  setDocumentType(e.target.value);
                  setErrorMsg("");
                }}
                disabled={isUploading}
                required
              >
                <option value="AADHAAR">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="SIGNATURE">Signature</option>
                <option value="CHEQUE">Cheque</option>
                <option value="PHOTO">Photo</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Additional Document Name field for OTHER type */}
            {isOtherType && (
              <div className="form-group">
                <label className="form-label">
                  Document Name <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Property Agreement, Bank Statement, Passport..."
                  value={documentName}
                  onChange={(e) => {
                    setDocumentName(e.target.value);
                    setErrorMsg("");
                  }}
                  disabled={isUploading}
                  required
                />
              </div>
            )}

            {/* File Upload Box */}
            <div className="form-group">
              <label className="form-label">
                {isReplace ? "New File *" : "Upload File *"}
              </label>
              {selectedFile ? (
                <div className="selected-file-card">
                  <FileText size={24} className="file-card-icon" />
                  <div className="file-card-details">
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">
                      {formatBytes(selectedFile.size)} • {selectedFile.type || "Document"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-remove-file"
                    onClick={handleRemoveFile}
                    disabled={isUploading}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="file-drop-zone">
                  <Upload size={28} className="drop-zone-icon" />
                  <span className="drop-zone-title">
                    {isReplace ? "Click to choose new replacement file" : "Click to upload file"}
                  </span>
                  <span className="drop-zone-subtitle">PDF, JPG, JPEG or PNG (Max 10MB)</span>
                  <input
                    type="file"
                    className="file-input-hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="doc-modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={isUploading || (!isReplace && !selectedFile)}
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isReplace ? "Replacing..." : "Uploading..."}</span>
                </>
              ) : isReplace ? (
                "Replace Document"
              ) : (
                "Upload Document"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
