import React, { useState } from "react";
import DocumentPreview from "./DocumentPreview";
import ClientService from "../../services/client.service";
import useAuth from "../../hooks/useAuth";
import { X, CheckCircle2, XCircle, Trash2, FileText, Calendar, User, Eye, AlertCircle } from "lucide-react";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
};

const DocumentReviewDrawer = ({
  isOpen,
  onClose,
  client,
  documents = [],
  canVerify = true,
  canUpdate = true,
  canDelete = false,
  onOpenReplace,
  onRefresh,
}) => {
  const { token } = useAuth();
  const [selectedDocId, setSelectedDocId] = useState(null);

  // Dialog & Form States
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen || !client) return null;

  const currentDocs = Array.isArray(documents) ? documents : [];
  const selectedDoc = currentDocs.find((d) => d.id === selectedDocId) || currentDocs[0] || null;

  const handleSelectDocument = (docId) => {
    setSelectedDocId(docId);
    setShowApproveConfirm(false);
    setShowRejectModal(false);
    setShowDeleteConfirm(false);
    setRejectionReason("");
    setErrorMsg("");
    setSuccessMsg("");
  };

  // 1. Handle Approve Document
  const handleConfirmApprove = async () => {
    if (!selectedDoc) return;
    try {
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");

      await ClientService.approveDocument(selectedDoc.id, token);

      setSuccessMsg("Document approved successfully.");
      setShowApproveConfirm(false);

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg("");
        if (onRefresh) onRefresh();
      }, 1000);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.message || "Failed to approve document.");
    }
  };

  // 2. Handle Reject Document
  const handleConfirmReject = async () => {
    if (!selectedDoc) return;
    if (!rejectionReason || !rejectionReason.trim()) {
      setErrorMsg("Please provide a rejection reason.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");

      await ClientService.rejectDocument(selectedDoc.id, rejectionReason.trim(), token);

      setSuccessMsg("Document rejected successfully.");
      setShowRejectModal(false);

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg("");
        setRejectionReason("");
        if (onRefresh) onRefresh();
      }, 1000);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.message || "Failed to reject document.");
    }
  };

  // 3. Handle Delete Document
  const handleConfirmDelete = async () => {
    if (!selectedDoc) return;
    try {
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");

      await ClientService.deleteClientDocument(client.id, selectedDoc.id, token);

      setSuccessMsg("Document deleted successfully.");
      setShowDeleteConfirm(false);

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg("");
        if (onRefresh) onRefresh();
      }, 1000);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.message || "Failed to delete document.");
    }
  };

  const status = selectedDoc?.status || "PENDING";
  const isPending = String(status).toUpperCase() === "PENDING";
  const isVerified = String(status).toUpperCase() === "VERIFIED";
  const isRejected = String(status).toUpperCase() === "REJECTED";

  const getDisplayTitle = (doc) => {
    if (!doc) return "";
    if (String(doc.document_type).toUpperCase() === "OTHER" && doc.document_name) {
      return doc.document_name;
    }
    return doc.document_type;
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <h3 className="drawer-client-name">{client.name}</h3>
            <span className="drawer-client-ucc">UCC: {client.ucc_no || `CL-${client.id}`}</span>
          </div>
          <button type="button" className="btn-close-drawer" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
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

          {/* Submitted Documents Selector */}
          <div className="drawer-doc-selector-card">
            <h4 className="drawer-section-title">Submitted Documents</h4>
            {currentDocs.length === 0 ? (
              <p className="drawer-empty-text">No documents uploaded for this client.</p>
            ) : (
              <div className="drawer-doc-tabs">
                {currentDocs.map((doc) => {
                  const isSelected = selectedDoc && selectedDoc.id === doc.id;
                  const docStatus = (doc.status || "PENDING").toLowerCase();
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      className={`drawer-doc-tab ${isSelected ? "active" : ""}`}
                      onClick={() => handleSelectDocument(doc.id)}
                    >
                      <div className="doc-tab-info">
                        <FileText size={15} className="doc-tab-icon" />
                        <span className="doc-tab-type">{getDisplayTitle(doc)}</span>
                      </div>
                      <span className={`status-badge ${docStatus}`}>
                        {doc.status || "PENDING"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Document Details & Live Preview */}
          {selectedDoc ? (
            <div className="drawer-preview-section">
              <div className="drawer-doc-meta" style={{ justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                  <div className="meta-item">
                    <FileText size={14} />
                    <span>
                      Document: <strong>{getDisplayTitle(selectedDoc)}</strong>
                      {selectedDoc.document_type === "OTHER" && (
                        <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "4px" }}>(Type: Other)</span>
                      )}
                    </span>
                  </div>
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span>Uploaded: <strong>{formatDate(selectedDoc.created_at)}</strong></span>
                  </div>
                  {selectedDoc.uploaded_by && (
                    <div className="meta-item">
                      <User size={14} />
                      <span>Uploaded By: <strong>{selectedDoc.uploaded_by_name || `User #${selectedDoc.uploaded_by}`}</strong></span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {canDelete && (
                    <button
                      type="button"
                      className="btn-action-icon delete"
                      title="Delete Document"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 size={16} style={{ color: "#dc2626" }} />
                    </button>
                  )}
                </div>
              </div>

              {isRejected && selectedDoc.rejection_reason && (
                <div className="rejection-reason-banner">
                  <strong>Rejection Reason:</strong> {selectedDoc.rejection_reason}
                </div>
              )}

              {/* Secure Document Preview Component */}
              <DocumentPreview
                clientId={client.id}
                documentId={selectedDoc.id}
                documentType={selectedDoc.document_type}
                originalFileName={selectedDoc.original_file_name}
                mimeType={selectedDoc.mime_type}
              />
            </div>
          ) : (
            <div className="drawer-empty-preview">
              <Eye size={36} />
              <span>Select a document above to review and preview.</span>
            </div>
          )}
        </div>

        {/* Drawer Action Footer */}
        {selectedDoc && (
          <div className="drawer-footer">
            {showApproveConfirm ? (
              <div className="confirm-box">
                <span>Are you sure you want to approve this document?</span>
                <div className="confirm-btn-row">
                  <button
                    type="button"
                    className="btn-cancel-small"
                    onClick={() => setShowApproveConfirm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-confirm-approve"
                    onClick={handleConfirmApprove}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Approving..." : "Confirm Approve"}
                  </button>
                </div>
              </div>
            ) : showRejectModal ? (
              <div className="reject-reason-box">
                <label className="form-label" style={{ margin: 0 }}>
                  Rejection Reason <span className="required-star">*</span>
                </label>
                <textarea
                  className="form-textarea reject-input"
                  placeholder="Enter rejection reason..."
                  rows="2"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className="reject-action-row">
                  <button
                    type="button"
                    className="btn-cancel-small"
                    onClick={() => setShowRejectModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-confirm-reject"
                    onClick={handleConfirmReject}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Rejecting..." : "Reject Document"}
                  </button>
                </div>
              </div>
            ) : showDeleteConfirm ? (
              <div className="confirm-box danger">
                <span>Are you sure you want to permanently delete this document?</span>
                <div className="confirm-btn-row">
                  <button
                    type="button"
                    className="btn-cancel-small"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-confirm-delete-doc"
                    onClick={handleConfirmDelete}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            ) : isPending ? (
              canVerify ? (
                <div className="approval-btn-group">
                  <button
                    type="button"
                    className="btn-reject-doc"
                    onClick={() => setShowRejectModal(true)}
                    disabled={isSubmitting}
                  >
                    <XCircle size={16} />
                    <span>Reject</span>
                  </button>
                  <button
                    type="button"
                    className="btn-approve-doc"
                    onClick={() => setShowApproveConfirm(true)}
                    disabled={isSubmitting}
                  >
                    <CheckCircle2 size={16} />
                    <span>Approve</span>
                  </button>
                </div>
              ) : (
                <div className="drawer-status-banner pending">
                  <span>Pending verification (Verification permission required)</span>
                </div>
              )
            ) : isVerified ? (
              <div className="drawer-status-banner verified">
                <CheckCircle2 size={18} />
                <span>Document Verified</span>
              </div>
            ) : (
              <div className="drawer-status-banner rejected">
                <XCircle size={18} />
                <span>Document Rejected</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentReviewDrawer;
