import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import ClientService from "../../services/client.service";
import useAuth from "../../hooks/useAuth";
import DocumentReviewDrawer from "./DocumentReviewDrawer";
import DocumentUploadModal from "./DocumentUploadModal";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import "./Documents.css";

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

const Documents = () => {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const permissions = user?.permissions || [];

  // Permission Checks
  const canCreate = permissions.includes("document.create") || user?.role?.name === "Admin";
  const canUpdate = permissions.includes("document.update") || permissions.includes("document.edit") || user?.role?.name === "Admin";
  const canVerify = permissions.includes("document.verify") || user?.role?.name === "Admin";
  const canDelete = permissions.includes("document.delete") || user?.role?.name === "Admin";

  // Check URL query parameters for initial status (e.g. /documents?status=pending)
  const initialStatusParam = searchParams.get("status");
  const initialStatus = initialStatusParam && initialStatusParam.toLowerCase() === "pending" ? "pending" : "all";

  // Data & State Management
  const [documentsList, setDocumentsList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [summaryCounts, setSummaryCounts] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Drawers State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [targetReplaceDoc, setTargetReplaceDoc] = useState(null); // Non-null when in replace mode
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDocs, setClientDocs] = useState([]);

  // Automatically update status filter if URL search parameters change
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam && statusParam.toLowerCase() === "pending") {
      setStatusFilter("pending");
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Fetch Summary KPI Counts
  const fetchSummaryCounts = useCallback(async () => {
    try {
      const [allRes, pendingRes, verifiedRes, rejectedRes] = await Promise.all([
        ClientService.getAdminDocuments({ limit: 1 }, token),
        ClientService.getAdminDocuments({ status: "PENDING", limit: 1 }, token),
        ClientService.getAdminDocuments({ status: "VERIFIED", limit: 1 }, token),
        ClientService.getAdminDocuments({ status: "REJECTED", limit: 1 }, token),
      ]);

      setSummaryCounts({
        total: allRes?.data?.pagination?.total || 0,
        pending: pendingRes?.data?.pagination?.total || 0,
        verified: verifiedRes?.data?.pagination?.total || 0,
        rejected: rejectedRes?.data?.pagination?.total || 0,
      });
    } catch (e) {
      console.error("Failed to load summary counts:", e);
    }
  }, [token]);

  // Fetch Admin Documents List from Real Backend API
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await ClientService.getAdminDocuments(
        {
          search,
          status: statusFilter,
          document_type: typeFilter,
          page: currentPage,
          limit: 10,
        },
        token
      );

      setDocumentsList(res?.data?.documents || []);
      setPagination(res?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      fetchSummaryCounts();
    } catch (err) {
      if (err.statusCode === 403) {
        setError("You do not have permission to view document management.");
      } else {
        setError(err.message || "Failed to load document submissions.");
      }
      setDocumentsList([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, currentPage, token, fetchSummaryCounts]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle Review Click (Opens Right-Side Review Drawer)
  const handleOpenReview = async (docItem) => {
    try {
      const clientObj = {
        id: docItem.client_id,
        name: docItem.client_name,
        ucc_no: docItem.client_ucc || `CL-${docItem.client_id}`,
      };
      setSelectedClient(clientObj);

      // Fetch fresh documents for this client
      const res = await ClientService.getClientDocuments(docItem.client_id, token);
      const docs = res?.data?.documents || [];
      setClientDocs(docs);
      setIsDrawerOpen(true);
    } catch (err) {
      console.error("Failed to open review drawer:", err);
    }
  };

  // Handle Open Replace Document Modal
  const handleOpenReplace = (docItem) => {
    setTargetReplaceDoc(docItem);
    setIsUploadOpen(true);
  };

  const handleRefreshAll = () => {
    fetchDocuments();
    if (selectedClient) {
      ClientService.getClientDocuments(selectedClient.id, token)
        .then((res) => setClientDocs(res?.data?.documents || []))
        .catch(() => {});
    }
  };

  const getDocDisplayName = (doc) => {
    if (String(doc.document_type).toUpperCase() === "OTHER" && doc.document_name) {
      return doc.document_name;
    }
    return doc.document_type;
  };

  const startIndex = (pagination.page - 1) * pagination.limit;

  return (
    <AppLayout title="Document Management">
      <div className="doc-container">
        {/* Header Title, Subtitle & Action Button */}
        <div className="doc-header-row">
          <div>
            <h2 className="doc-title">Document Management</h2>
            <p className="doc-desc">
              Review and manage client document submissions.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              className="btn-add-doc"
              onClick={() => {
                setTargetReplaceDoc(null);
                setIsUploadOpen(true);
              }}
            >
              <Plus size={18} />
              <span>Upload Document</span>
            </button>
          )}
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="banner-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Top Summary KPI Cards */}
        <div className="doc-kpi-grid">
          <div
            className={`doc-kpi-card ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
          >
            <div className="doc-kpi-icon-wrapper total">
              <FileText size={22} />
            </div>
            <div className="doc-kpi-content">
              <span className="doc-kpi-value">{summaryCounts.total}</span>
              <span className="doc-kpi-label">Total Documents</span>
            </div>
          </div>

          <div
            className={`doc-kpi-card ${statusFilter === "pending" ? "active" : ""}`}
            onClick={() => {
              setStatusFilter("pending");
              setCurrentPage(1);
            }}
          >
            <div className="doc-kpi-icon-wrapper pending">
              <Clock size={22} />
            </div>
            <div className="doc-kpi-content">
              <span className="doc-kpi-value">{summaryCounts.pending}</span>
              <span className="doc-kpi-label">Pending Verification</span>
            </div>
          </div>

          <div
            className={`doc-kpi-card ${statusFilter === "verified" ? "active" : ""}`}
            onClick={() => {
              setStatusFilter("verified");
              setCurrentPage(1);
            }}
          >
            <div className="doc-kpi-icon-wrapper verified">
              <CheckCircle2 size={22} />
            </div>
            <div className="doc-kpi-content">
              <span className="doc-kpi-value">{summaryCounts.verified}</span>
              <span className="doc-kpi-label">Verified</span>
            </div>
          </div>

          <div
            className={`doc-kpi-card ${statusFilter === "rejected" ? "active" : ""}`}
            onClick={() => {
              setStatusFilter("rejected");
              setCurrentPage(1);
            }}
          >
            <div className="doc-kpi-icon-wrapper rejected">
              <XCircle size={22} />
            </div>
            <div className="doc-kpi-content">
              <span className="doc-kpi-value">{summaryCounts.rejected}</span>
              <span className="doc-kpi-label">Rejected</span>
            </div>
          </div>
        </div>

        {/* Controls Bar: Search & Filters */}
        <div className="doc-controls-bar">
          <div className="doc-search-box">
            <Search size={18} className="doc-search-icon" />
            <input
              type="text"
              placeholder="Search by client name, document type or UCC..."
              className="doc-search-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="doc-filter-group">
            {/* Status Filter */}
            <select
              className="doc-filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Document Type Filter */}
            <select
              className="doc-filter-select"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Document Types</option>
              <option value="AADHAAR">Aadhaar Card</option>
              <option value="PAN">PAN Card</option>
              <option value="SIGNATURE">Signature</option>
              <option value="CHEQUE">Cheque</option>
              <option value="PHOTO">Photo</option>
              <option value="OTHER">Other</option>
            </select>

            {/* Refresh Button */}
            <button
              type="button"
              className="btn-filter-refresh"
              title="Refresh Documents"
              onClick={fetchDocuments}
            >
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Document List Table */}
        <div className="doc-table-card">
          <div className="doc-table-wrapper">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>CLIENT NAME</th>
                  <th>CLIENT ID / UCC</th>
                  <th>DOCUMENT</th>
                  <th>TYPE</th>
                  <th>UPLOAD DATE</th>
                  <th>UPLOADED BY</th>
                  <th>STATUS</th>
                  <th style={{ width: "160px" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "30px" }}>
                      <div className="flex-center-gap" style={{ justifyContent: "center" }}>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Loading document submissions...</span>
                      </div>
                    </td>
                  </tr>
                ) : documentsList.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                      {statusFilter === "pending"
                        ? "No documents pending verification."
                        : search || typeFilter !== "all"
                        ? "No documents match your search or filters."
                        : "No documents found."}
                    </td>
                  </tr>
                ) : (
                  documentsList.map((doc) => {
                    const statusClass = (doc.status || "PENDING").toLowerCase();
                    return (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: 600, color: "#0f172a" }}>
                          {doc.client_name}
                        </td>
                        <td>{doc.client_ucc || `CL-${doc.client_id}`}</td>
                        <td style={{ fontWeight: 700, color: "#0f172a" }}>
                          {getDocDisplayName(doc)}
                        </td>
                        <td style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                          {doc.document_type}
                        </td>
                        <td>{formatDate(doc.created_at)}</td>
                        <td>{doc.uploaded_by_name || `User #${doc.uploaded_by}`}</td>
                        <td>
                          <span className={`status-badge ${statusClass}`}>
                            {doc.status || "PENDING"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn-review-doc"
                              onClick={() => handleOpenReview(doc)}
                            >
                              <Eye size={14} />
                              <span>Review</span>
                            </button>

                            {canUpdate && (
                              <button
                                type="button"
                                className="btn-review-doc"
                                style={{ backgroundColor: "#f1f5f9", color: "#334155", borderColor: "#cbd5e1" }}
                                title="Replace Document"
                                onClick={() => handleOpenReplace(doc)}
                              >
                                <RefreshCw size={14} />
                                <span>Replace</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {!loading && documentsList.length > 0 && (
            <div className="doc-pagination-bar">
              <span className="pagination-text">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + pagination.limit, pagination.total)} of{" "}
                {pagination.total} documents
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="btn-pagination"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <span className="pagination-text" style={{ fontWeight: 600 }}>
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="btn-pagination"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))
                  }
                  disabled={currentPage >= pagination.totalPages}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upload / Replace Document Modal */}
        <DocumentUploadModal
          isOpen={isUploadOpen}
          onClose={() => {
            setIsUploadOpen(false);
            setTargetReplaceDoc(null);
          }}
          targetDocument={targetReplaceDoc}
          onSuccess={handleRefreshAll}
        />

        {/* Right-Side Review Drawer Modal */}
        <DocumentReviewDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          client={selectedClient}
          documents={clientDocs}
          canVerify={canVerify}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onOpenReplace={handleOpenReplace}
          onRefresh={handleRefreshAll}
        />
      </div>
    </AppLayout>
  );
};

export default Documents;
