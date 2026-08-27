import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../../components/layout/AppLayout/AppLayout";
import AuditLogService from "../../../services/auditLog.service";
import StaffService from "../../../services/staff.service";
import useAuth from "../../../hooks/useAuth";
import AuditLogDetailModal from "./AuditLogDetailModal";
import {
  ArrowLeft,
  Search,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Shield,
} from "lucide-react";
import "./AuditLogs.css";

const MODULE_OPTIONS = [
  { value: "all", label: "All Modules" },
  { value: "CLIENTS", label: "Clients" },
  { value: "DOCUMENTS", label: "Documents" },
  { value: "COMMUNICATION", label: "Communication" },
  { value: "USERS", label: "Users" },
  { value: "GROUPS", label: "Groups" },
  { value: "PERMISSIONS", label: "Permissions" },
  { value: "AUTH", label: "Authentication" },
];

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "CREATE", label: "CREATE" },
  { value: "UPDATE", label: "UPDATE" },
  { value: "DELETE", label: "DELETE" },
  { value: "EXPORT", label: "EXPORT" },
  { value: "UPLOAD", label: "UPLOAD" },
  { value: "DOWNLOAD", label: "DOWNLOAD" },
  { value: "APPROVE", label: "APPROVE" },
  { value: "REJECT", label: "REJECT" },
  { value: "LOGIN", label: "LOGIN" },
];

const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return dateStr;
  }
};

const formatModuleLabel = (moduleStr) => {
  if (!moduleStr) return "General";
  const map = {
    CLIENTS: "Clients",
    DOCUMENTS: "Documents",
    COMMUNICATION: "Communication",
    USERS: "Users",
    GROUPS: "Groups",
    PERMISSIONS: "Permissions",
    SETTINGS: "Settings",
    AUTH: "Authentication",
  };
  return map[moduleStr.toUpperCase()] || moduleStr;
};

const AuditLogs = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Users Dropdown Options State
  const [staffUsers, setStaffUsers] = useState([]);

  // Modal State
  const [selectedLog, setSelectedLog] = useState(null);

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Filter State
  const [filters, setFilters] = useState({
    search: "",
    user_id: "",
    module: "all",
    action: "all",
    start_date: "",
    end_date: "",
  });

  // Fetch Staff users for filter dropdown
  useEffect(() => {
    let isMounted = true;
    const fetchStaffList = async () => {
      try {
        const res = await StaffService.getStaffUsers({ limit: 100 }, token);
        if (isMounted && res && res.data && res.data.staff) {
          setStaffUsers(res.data.staff);
        }
      } catch (err) {
        // Silently handle list loading failure for filter dropdown
      }
    };
    if (token) fetchStaffList();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Fetch Audit Logs from Backend API
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await AuditLogService.getAuditLogs(
        {
          search: filters.search.trim(),
          user_id: filters.user_id,
          module: filters.module,
          action: filters.action,
          start_date: filters.start_date,
          end_date: filters.end_date,
          page: pagination.page,
          limit: pagination.limit,
        },
        token
      );

      if (res && res.data) {
        setAuditLogs(res.data.audit_logs || []);
        if (res.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: res.data.pagination.total || 0,
            totalPages: res.data.pagination.totalPages || 1,
          }));
        }
      }
    } catch (err) {
      if (err.statusCode === 403) {
        setError("You do not have permission to view audit logs.");
      } else {
        setError(err.message || "Unable to load audit logs. Please try again.");
      }
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Filter change handlers
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      user_id: "",
      module: "all",
      action: "all",
      start_date: "",
      end_date: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const isFilterActive =
    Boolean(filters.search.trim()) ||
    Boolean(filters.user_id) ||
    filters.module !== "all" ||
    filters.action !== "all" ||
    Boolean(filters.start_date) ||
    Boolean(filters.end_date);

  const startRecord = pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <AppLayout title="Audit Logs">
      <div className="audit-logs-container">
        {/* Navigation & Header */}
        <div className="audit-page-header-row">
          <div className="audit-title-group">
            <button
              type="button"
              className="btn-back-settings"
              onClick={() => navigate("/settings")}
            >
              <ArrowLeft size={16} />
              <span>Back to Settings</span>
            </button>
            <h2 className="audit-page-title">Audit Logs</h2>
            <p className="audit-page-desc">
              Track important activities, security events, and data changes across the CRM.
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="banner-error">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button type="button" className="btn-error-retry" onClick={fetchAuditLogs}>
              Retry
            </button>
          </div>
        )}

        {/* Controls & Filter Bar */}
        

        {/* Audit Logs Table Card */}
        <div className="audit-table-card">
          <div className="audit-table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th style={{ width: "22%" }}>USER</th>
                  <th style={{ width: "12%" }}>ACTION</th>
                  <th style={{ width: "14%" }}>MODULE</th>
                  <th style={{ width: "32%" }}>DETAILS</th>
                  <th style={{ width: "15%" }}>DATE & TIME</th>
                  <th style={{ width: "5%", textAlign: "center" }}>VIEW</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="skeleton-row">
                      <td colSpan="6">
                        <div className="skeleton-line" style={{ width: "95%" }}></div>
                      </td>
                    </tr>
                  ))
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state-cell">
                      <div className="empty-state-wrapper">
                        <Shield size={36} className="empty-state-icon" />
                        <h4 className="empty-state-title">No audit logs found</h4>
                        <p className="empty-state-desc">
                          {isFilterActive
                            ? "No audit records match your active filters. Try clearing or adjusting search filters."
                            : "There are currently no audit logs recorded in the system."}
                        </p>
                        {isFilterActive && (
                          <button
                            type="button"
                            className="btn-clear-filters"
                            onClick={handleClearFilters}
                            style={{ marginTop: "0.75rem" }}
                          >
                            <RotateCcw size={14} />
                            <span>Clear Active Filters</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const initials = log.user?.name
                      ? log.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .substring(0, 2)
                      : "SYS";

                    return (
                      <tr
                        key={log.id}
                        className="audit-row"
                        onClick={() => setSelectedLog(log)}
                        title="Click to view full audit details"
                      >
                        {/* User */}
                        <td>
                          <div className="table-user-cell">
                            <div className="user-avatar-circle">{initials}</div>
                            <div className="user-name-group">
                              <span className="user-name-text">
                                {log.user?.name || "System / Deleted User"}
                              </span>
                              {log.user?.email && (
                                <span className="user-email-text">{log.user.email}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td>
                          <span
                            className={`action-pill action-${(log.action || "general").toLowerCase()}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        {/* Module */}
                        <td>
                          <span className="module-badge">{formatModuleLabel(log.module)}</span>
                        </td>

                        {/* Details */}
                        <td>
                          <span className="details-text" title={log.description}>
                            {log.description || "N/A"}
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td>
                          <span className="date-time-text">{formatDateTime(log.created_at)}</span>
                        </td>

                        {/* Action Trigger */}
                        <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn-view-log-details"
                            title="View log details"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && pagination.total > 0 && (
            <div className="audit-pagination-bar">
              <span className="pagination-text">
                Showing {startRecord} to {endRecord} of {pagination.total} audit logs
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="btn-pagination"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <span className="pagination-indicator">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="btn-pagination"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audit Log Details Modal */}
        {selectedLog && (
          <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        )}
      </div>
    </AppLayout>
  );
};

export default AuditLogs;
