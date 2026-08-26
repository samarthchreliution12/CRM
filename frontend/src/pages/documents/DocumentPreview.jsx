import React, { useState, useEffect } from "react";
import ClientService from "../../services/client.service";
import useAuth from "../../hooks/useAuth";
import { Loader2, FileText, AlertCircle, ExternalLink } from "lucide-react";

const DocumentPreview = ({ clientId, documentId, documentType, originalFileName, mimeType }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileContentType, setFileContentType] = useState(mimeType || "application/pdf");

  useEffect(() => {
    let currentObjectUrl = null;
    let isMounted = true;

    async function loadDocumentBlob() {
      if (!clientId || !documentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await ClientService.getDocumentFileBlob(clientId, documentId, token);
        if (!isMounted) return;

        currentObjectUrl = URL.createObjectURL(result.blob);
        setPreviewUrl(currentObjectUrl);
        if (result.contentType) {
          setFileContentType(result.contentType);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load document preview blob:", err);
        setError(err.message || "Failed to load document preview safely.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDocumentBlob();

    return () => {
      isMounted = false;
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, [clientId, documentId, token]);

  if (loading) {
    return (
      <div className="doc-preview-loading">
        <Loader2 size={24} className="animate-spin" />
        <span>Loading secure document preview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doc-preview-error">
        <AlertCircle size={24} className="doc-preview-error-icon" />
        <span className="doc-preview-error-msg">{error}</span>
      </div>
    );
  }

  const isImage = fileContentType.startsWith("image/");
  const isPdf = fileContentType === "application/pdf";

  return (
    <div className="doc-preview-wrapper">
      <div className="doc-preview-meta-bar">
        <div className="doc-preview-filename">
          <FileText size={16} />
          <span>{originalFileName || `${documentType || "Document"} File`}</span>
        </div>

        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-open-external"
            title="Open in new window"
          >
            <ExternalLink size={14} />
            <span>Open Full</span>
          </a>
        )}
      </div>

      <div className="doc-preview-viewport">
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={originalFileName || "Document Preview"} className="doc-preview-image" />
        ) : isPdf && previewUrl ? (
          <iframe
            src={`${previewUrl}#toolbar=0`}
            title={originalFileName || "PDF Document Preview"}
            className="doc-preview-iframe"
          />
        ) : previewUrl ? (
          <iframe
            src={previewUrl}
            title={originalFileName || "Document Preview"}
            className="doc-preview-iframe"
          />
        ) : (
          <div className="doc-preview-fallback">
            <FileText size={32} />
            <span>No preview available for this file type.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentPreview;
