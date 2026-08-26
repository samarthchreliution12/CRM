import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import ClientService from "../../services/client.service";
import useAuth from "../../hooks/useAuth";
import {
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import "./Clients.css";

const getInitials = (name) => {
  if (!name) return "CL";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Mask mobile number to show only first 2 and last 2 digits.
 * Example: "123456789" -> "98******10"
 */
const maskMobile = (mobile) => {
  if (!mobile || typeof mobile !== "string") return "";
  const cleaned = mobile.trim();
  if (cleaned.length <= 4) return "*".repeat(cleaned.length);
  const first2 = cleaned.slice(0, 2);
  const last2 = cleaned.slice(-2);
  return `${first2}******${last2}`;
};

/**
 * Mask email to show first character + asterisks + @domain.
 * Example: "rahulpatel@gmail.com" -> "r******@gmail.com"
 */
const maskEmail = (email) => {
  if (!email || typeof email !== "string" || !email.includes("@")) return email || "";
  const parts = email.trim().split("@");
  const username = parts[0];
  const domain = parts.slice(1).join("@");
  if (username.length <= 1) return `${username}******@${domain}`;
  const firstChar = username[0];
  return `${firstChar}******@${domain}`;
};

const Clients = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Data & State
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reveal Contact State (Row/Client scoped state: { [clientId]: boolean })
  const [revealedClients, setRevealedClients] = useState({});

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Client Types dropdown options from DB
  const [clientTypes, setClientTypes] = useState([]);

  // Fetch Client Types for filter dropdown
  useEffect(() => {
    let isMounted = true;
    const fetchTypes = async () => {
      try {
        const res = await ClientService.getClientTypes(token);
        if (isMounted && res && res.data && res.data.client_types) {
          setClientTypes(res.data.client_types);
        }
      } catch (err) {
        // Non-blocking for types dropdown
      }
    };

    fetchTypes();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Fetch Clients from Database via API
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim(),
        status: statusFilter !== "all" ? statusFilter : "",
        client_type_id: typeFilter !== "all" ? typeFilter : "",
      };

      const res = await ClientService.getClients(params, token);

      if (res && res.data) {
        setClients(res.data.clients || []);
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
        setError("You do not have permission to view clients.");
      } else {
        setError(err.message || "Failed to fetch clients from database.");
      }
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.page, pagination.limit, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Search input handler with page reset
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Status filter handler with page reset
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Client Type filter handler with page reset
  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Pagination navigation
  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  // Toggle reveal contact state for a specific client without triggering row click
  const toggleRevealContact = (e, clientId) => {
    e.stopPropagation();
    setRevealedClients((prev) => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
  };

  // Calculate summary statistics
  const totalCount = pagination.total;
  const activeCount = clients.filter((c) => c.status === "active").length;
  const inactiveCount = clients.filter((c) => c.status === "inactive").length;

  const startRecord = totalCount > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endRecord = Math.min(pagination.page * pagination.limit, totalCount);

  return (
    <AppLayout title="Clients">
      <div className="clients-container">
        {/* Page Header */}
        <div className="clients-page-header">
          <div className="clients-page-title-group">
            <h2 className="clients-page-title">Clients Directory</h2>
            <p className="clients-page-desc">
              Manage your client relationships and household groups.
            </p>
          </div>
          <button
            type="button"
            className="btn-add-client"
            onClick={() => navigate("/clients/add")}
          >
            <Plus size={16} />
            <span>Add Client</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="banner-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="clients-summary-grid">
          <div className="clients-summary-card">
            <div className="clients-summary-card-header">
              <span className="clients-summary-label">TOTAL CLIENTS</span>
            </div>
            <div className="clients-summary-value">{totalCount}</div>
          </div>

          <div className="clients-summary-card">
            <div className="clients-summary-card-header">
              <span className="clients-summary-label">ACTIVE</span>
            </div>
            <div className="clients-summary-value">{activeCount}</div>
          </div>

          <div className="clients-summary-card">
            <div className="clients-summary-card-header">
              <span className="clients-summary-label">INACTIVE</span>
            </div>
            <div className="clients-summary-value">{inactiveCount}</div>
          </div>

          <div className="clients-summary-card highlight-card">
            <div className="clients-summary-card-header">
              <span className="clients-summary-label">NEW THIS MONTH</span>
            </div>
            <div className="clients-summary-value">{totalCount > 0 ? totalCount : 0}</div>
            <span className="clients-summary-subtext">Real-time DB records</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="clients-controls-bar">
          <div className="clients-search-box">
            <Search size={18} className="clients-search-icon" />
            <input
              type="text"
              placeholder="Search by Name, Business Name, UCC, Mobile, Email, or PAN..."
              className="clients-search-input"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="clients-filter-group">
            {/* Dynamic Client Type Filter */}
            <select
              className="clients-filter-select"
              value={typeFilter}
              onChange={handleTypeChange}
            >
              <option value="all">All Types</option>
              {clientTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="clients-filter-select"
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <option value="all">Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              type="button"
              className="btn-filter-icon"
              title="Refresh Client List"
              onClick={fetchClients}
            >
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Client Table Card */}
        <div className="clients-table-card">
          <div className="clients-table-wrapper">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>CLIENT</th>
                  <th>UCC / CLIENT ID</th>
                  <th>TYPE</th>
                  <th>CONTACT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="empty-state-cell">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Loading clients from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state-cell">
                      {search || statusFilter !== "all" || typeFilter !== "all"
                        ? "No clients match your search or filters."
                        : "No clients found."}
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => {
                    const isRevealed = Boolean(revealedClients[client.id]);

                    return (
                      <tr
                        key={client.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        <td>
                          <div className="client-info-cell">
                            <div className="client-avatar">
                              {getInitials(client.name)}
                            </div>
                            <div className="client-details-text">
                              <span className="client-name">{client.name}</span>
                              {client.business_name && (
                                <span className="client-pan" style={{ color: "#3b82f6", fontWeight: 600 }}>
                                  {client.business_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="client-id-badge">{client.ucc_no}</span>
                        </td>
                        <td>
                          {typeof client.client_type === "object" && client.client_type !== null
                            ? client.client_type.name || "Standard"
                            : typeof client.client_type === "string"
                            ? client.client_type
                            : client.client_type_name || "Standard"}
                        </td>
                        <td>
                          <div className="contact-cell">
                            {client.mobile_no && (
                              <div className="contact-item-row">
                                <span className="contact-phone">
                                  {isRevealed ? client.mobile_no : maskMobile(client.mobile_no)}
                                </span>
                                <button
                                  type="button"
                                  className="btn-eye-toggle"
                                  onClick={(e) => toggleRevealContact(e, client.id)}
                                  title={isRevealed ? "Mask contact info" : "Reveal contact info"}
                                  aria-label={isRevealed ? "Mask contact info" : "Reveal contact info"}
                                >
                                  {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                              </div>
                            )}
                            {client.email && (
                              <div className="contact-item-row">
                                <span className="contact-email">
                                  {isRevealed ? client.email : maskEmail(client.email)}
                                </span>
                                {!client.mobile_no && (
                                  <button
                                    type="button"
                                    className="btn-eye-toggle"
                                    onClick={(e) => toggleRevealContact(e, client.id)}
                                    title={isRevealed ? "Mask contact info" : "Reveal contact info"}
                                    aria-label={isRevealed ? "Mask contact info" : "Reveal contact info"}
                                  >
                                    {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${client.status ? client.status.toLowerCase() : "active"}`}
                          >
                            <span className="status-dot">
                              {client.status === "active" ? "●" : "○"}
                            </span>
                            <span style={{ textTransform: "capitalize" }}>
                              {client.status || "active"}
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer Bar */}
          {!loading && totalCount > 0 && (
            <div className="clients-pagination-bar">
              <span className="pagination-text">
                Showing {startRecord} to {endRecord} of {totalCount} clients
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="btn-pagination"
                  onClick={handlePrevPage}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <span className="pagination-page-indicator">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="btn-pagination"
                  onClick={handleNextPage}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Clients;
