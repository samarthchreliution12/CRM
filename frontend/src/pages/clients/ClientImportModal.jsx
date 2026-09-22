import React, { useState, useRef } from "react";
import ClientService from "../../services/client.service";
import {
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  Trash2,
  Info,
  AlertTriangle,
} from "lucide-react";

const ClientImportModal = ({ show, onClose, onSuccess, token }) => {
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const [validationResult, setValidationResult] = useState(null);
  const fileInputRef = useRef(null);

  if (!show) return null;

  const handleReset = () => {
    setFile(null);
    setValidationResult(null);
    setGeneralError("");
    setIsValidating(false);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (selectedFile) => {
    setGeneralError("");
    setValidationResult(null);

    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".csv") && selectedFile.type !== "text/csv") {
      setGeneralError("Invalid file type. Please upload a .csv file.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setGeneralError("File size exceeds 5MB limit. Please upload a smaller file.");
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDownloadSampleCSV = () => {
    const sampleHeaders = [
      "name",
      "business_name",
      "mobile_no",
      "whatsapp_no",
      "email",
      "pan",
      "dob",
      "gender",
      "occupation",
      "client_type",
      "services",
      "status",
      "client_status",
      "client_category",
    ];

    const sampleRows = [
      [
        "Rahul Sharma",
        "Rahul Tech",
        "9876543210",
        "9876543210",
        "rahul@example.com",
        "CYZPC1015Q",
        "2003-09-12",
        "Male",
        "Business",
        "Individual",
        "Demat",
        "active",
        "CLIENT",
        "BRONZE",
      ],
      [
        "Ankit Patel",
        "Ankit Enterprises",
        "9876500000",
        "9876500000",
        "ankit@example.com",
        "ABCDE1234F",
        "1995-05-20",
        "Male",
        "Engineer",
        "Individual",
        "Trading|Mutual Fund",
        "active",
        "CLIENT",
        "SILVER",
      ],
    ];

    const csvContent =
      sampleHeaders.join(",") + "\n" + sampleRows.map((r) => r.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sample_clients_import.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleValidate = async () => {
    if (!file) return;
    try {
      setIsValidating(true);
      setGeneralError("");
      const res = await ClientService.validateImportClients(file, token);
      if (res && res.data) {
        setValidationResult(res.data);
      }
    } catch (err) {
      setGeneralError(err.message || "Failed to validate CSV file.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!file) return;
    try {
      setIsImporting(true);
      setGeneralError("");
      const res = await ClientService.importClients(file, token);
      if (res && res.data) {
        const { imported_rows, skipped_rows } = res.data;
        onSuccess(`Import completed successfully. Imported: ${imported_rows}, Skipped: ${skipped_rows}`);
        handleReset();
        onClose();
      }
    } catch (err) {
      setGeneralError(err.message || "Failed to import clients.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadErrorsCSV = () => {
    if (!validationResult || !validationResult.errors || validationResult.errors.length === 0) {
      return;
    }

    const headers = ["Row", "UCC No", "Name", "Error Reason"];
    const rows = validationResult.errors.map((e) => [
      e.row,
      `"${e.ucc_no.replace(/"/g, '""')}"`,
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.error.replace(/"/g, '""')}"`,
    ]);

    const csvContent = headers.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "import_errors.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const summary = validationResult?.summary;

  return (
    <div className="modal-backdrop" onClick={isValidating || isImporting ? undefined : onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: "780px", width: "92%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Import Clients</h3>
            <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0, marginTop: "0.2rem" }}>
              Upload a CSV file to validate and bulk import client records into the CRM.
            </p>
          </div>
          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            disabled={isValidating || isImporting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ gap: "1.25rem", maxHeight: "75vh", overflowY: "auto" }}>
          {generalError && (
            <div className="modal-error-banner">
              <AlertCircle size={16} />
              <span>{generalError}</span>
            </div>
          )}

          {/* Sample CSV & Instructions Bar */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "0.875rem 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Info size={18} color="#2563eb" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "0.825rem", color: "#334155" }}>
                UCC Number is automatically generated from PAN and Date of Birth. Do not include UCC in your CSV file. Required columns: <strong>name, pan, dob, mobile_no, whatsapp_no, email, client_type</strong>.
              </span>
            </div>
            <button
              type="button"
              className="btn-cancel"
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.775rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              onClick={handleDownloadSampleCSV}
            >
              <Download size={14} />
              <span>Sample CSV</span>
            </button>
          </div>

          {/* File Upload Dropzone */}
          {!file && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                border: `2px dashed ${isDragOver ? "#2563eb" : "#cbd5e1"}`,
                backgroundColor: isDragOver ? "#eff6ff" : "#fafafa",
                borderRadius: "10px",
                padding: "2.5rem 1.5rem",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <UploadCloud size={40} color={isDragOver ? "#2563eb" : "#94a3b8"} style={{ marginBottom: "0.75rem" }} />
              <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.95rem" }}>
                Click to upload or drag & drop CSV file
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
                Accepted format: <strong>.csv</strong> (Max size: 5MB)
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: "none" }}
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              />
            </div>
          )}

          {/* Selected File Box */}
          {file && (
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "0.875rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#ffffff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <FileText size={28} color="#2563eb" />
                <div>
                  <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{file.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-cancel"
                style={{ padding: "0.35rem 0.65rem", color: "#dc2626", borderColor: "#fecaca" }}
                onClick={handleReset}
                disabled={isValidating || isImporting}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}

          {/* Validation Summary Metrics */}
          {validationResult && summary && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0.75rem",
              }}
            >
              <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Total Rows</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginTop: "0.2rem" }}>{summary.total_rows}</div>
              </div>

              <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "#166534", textTransform: "uppercase", fontWeight: 700 }}>Valid Rows</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#15803d", marginTop: "0.2rem" }}>{summary.valid_rows}</div>
              </div>

              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "#991b1b", textTransform: "uppercase", fontWeight: 700 }}>Invalid Rows</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#b91c1c", marginTop: "0.2rem" }}>{summary.invalid_rows}</div>
              </div>

              <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "#92400e", textTransform: "uppercase", fontWeight: 700 }}>Duplicate Rows</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#d97706", marginTop: "0.2rem" }}>{summary.duplicate_rows}</div>
              </div>
            </div>
          )}

          {/* Error Table */}
          {validationResult && validationResult.errors && validationResult.errors.length > 0 && (
            <div style={{ border: "1px solid #fecaca", borderRadius: "8px", overflow: "hidden", backgroundColor: "#fff5f5" }}>
              <div style={{ padding: "0.65rem 1rem", backgroundColor: "#fee2e2", borderBottom: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#991b1b", fontWeight: 700, fontSize: "0.8rem" }}>
                  <AlertTriangle size={16} />
                  <span>Validation Error Details ({validationResult.errors.length} Issues Found)</span>
                </div>
                <button
                  type="button"
                  className="btn-cancel"
                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.725rem", backgroundColor: "#ffffff" }}
                  onClick={handleDownloadErrorsCSV}
                >
                  <Download size={12} />
                  <span>Download Error CSV</span>
                </button>
              </div>

              <div style={{ maxHeight: "180px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.775rem" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#fef2f2", textAlign: "left", color: "#7f1d1d" }}>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Row #</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>UCC No</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Name</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Error Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.errors.map((errItem, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #fee2e2" }}>
                        <td style={{ padding: "0.4rem 0.75rem", fontWeight: 600, color: "#991b1b" }}>Line {errItem.row}</td>
                        <td style={{ padding: "0.4rem 0.75rem", color: "#334155" }}>{errItem.ucc_no}</td>
                        <td style={{ padding: "0.4rem 0.75rem", color: "#334155" }}>{errItem.name}</td>
                        <td style={{ padding: "0.4rem 0.75rem", color: "#b91c1c", fontWeight: 500 }}>{errItem.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Valid Rows Preview Table */}
          {validationResult && validationResult.preview && validationResult.preview.length > 0 && (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ padding: "0.5rem 0.875rem", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontWeight: 700, fontSize: "0.775rem", color: "#475569" }}>
                Valid Rows Preview (Showing first {validationResult.preview.length} rows)
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.775rem" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                      <th style={{ padding: "0.4rem 0.65rem" }}>Auto-Generated UCC</th>
                      <th style={{ padding: "0.4rem 0.65rem" }}>Name</th>
                      <th style={{ padding: "0.4rem 0.65rem" }}>PAN</th>
                      <th style={{ padding: "0.4rem 0.65rem" }}>DOB</th>
                      <th style={{ padding: "0.4rem 0.65rem" }}>Mobile</th>
                      <th style={{ padding: "0.4rem 0.65rem" }}>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.preview.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.4rem 0.65rem", fontWeight: 600, color: "#0f172a" }}>{row.ucc_no}</td>
                        <td style={{ padding: "0.4rem 0.65rem", color: "#334155" }}>{row.name}</td>
                        <td style={{ padding: "0.4rem 0.65rem", color: "#334155" }}>{row.pan}</td>
                        <td style={{ padding: "0.4rem 0.65rem", color: "#334155" }}>{row.dob}</td>
                        <td style={{ padding: "0.4rem 0.65rem", color: "#334155" }}>{row.mobile_no || "N/A"}</td>
                        <td style={{ padding: "0.4rem 0.65rem", color: "#334155" }}>{row.email || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer" style={{ gap: "0.75rem" }}>
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={isValidating || isImporting}
          >
            Cancel
          </button>

          {!validationResult ? (
            <button
              type="button"
              className="btn-save"
              onClick={handleValidate}
              disabled={!file || isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Validating CSV...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Validate CSV</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="btn-save"
              style={{ backgroundColor: summary && summary.valid_rows > 0 ? "#16a34a" : "#94a3b8" }}
              onClick={handleExecuteImport}
              disabled={!summary || summary.valid_rows === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Importing Clients...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>Import {summary ? summary.valid_rows : 0} Valid Clients</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientImportModal;
