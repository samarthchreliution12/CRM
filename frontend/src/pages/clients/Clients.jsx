import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import ClientService from "../../services/client.service";
import ClientImportModal from "./ClientImportModal";
import useAuth from "../../hooks/useAuth";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ChevronDown,
  Download,
  Upload,
  X,
  CheckCircle2,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Award,
  Crown,
  Gem,
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

const renderCategoryBadge = (categoryStr) => {
  if (!categoryStr) return <span className="text-muted-dash">-</span>;
  const clean = categoryStr.toString().trim().toUpperCase();

  switch (clean) {
    case "BRONZE":
      return (
        <span className="category-badge cat-bronze">
          <Award size={13} className="cat-icon" />
          <span>Bronze</span>
        </span>
      );
    case "SILVER":
      return (
        <span className="category-badge cat-silver">
          <Award size={13} className="cat-icon" />
          <span>Silver</span>
        </span>
      );
    case "GOLD":
      return (
        <span className="category-badge cat-gold">
          <Crown size={13} className="cat-icon" />
          <span>Gold</span>
        </span>
      );
    case "PLATINUM":
      return (
        <span className="category-badge cat-platinum">
          <Gem size={13} className="cat-icon" />
          <span>Platinum</span>
        </span>
      );
    default:
      return (
        <span className="category-badge cat-bronze">
          <Award size={13} className="cat-icon" />
          <span>{clean}</span>
        </span>
      );
  }
};

const Clients = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const crossSellParam = searchParams.get("cross_sell") || "";
  const { token, user } = useAuth();

  // Role & Permission Checks
  const isAdmin = user?.role?.name === "Admin" || user?.role === "Admin" || user?.role_name === "Admin";
  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const canEdit = isAdmin || userPermissions.includes("client.edit") || userPermissions.includes("client.update");
  const canDelete = isAdmin || userPermissions.includes("client.delete");

  // Floating Toast Notification State
  const [toastError, setToastError] = useState("");
  const triggerPermissionToast = (msg) => {
    setToastError(msg);
    setTimeout(() => {
      setToastError("");
    }, 4000);
  };

  // Data & State
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Category Change Modal State
  const [targetCategoryClient, setTargetCategoryClient] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("BRONZE");
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");


  // Import / Export Dropdown & Selection State
  const [isImpExpOpen, setIsImpExpOpen] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const dropdownRef = useRef(null);

  // Actions Dropdown & Delete Confirmation Modal State
  const [openActionsMenuId, setOpenActionsMenuId] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState("all"); // 'all' | 'filtered' | 'selected'
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  // Reveal Contact State (Row/Client scoped state: { [clientId]: boolean })
  const [revealedClients, setRevealedClients] = useState({});

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    active: 0,
    inactive: 0,
  });

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  // Client Types & Services dropdown options from DB
  const [clientTypes, setClientTypes] = useState([]);
  const [clientServices, setClientServices] = useState([]);

  // Click Outside listener to close Import / Export and Actions dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsImpExpOpen(false);
      }
      if (!event.target.closest(".actions-dropdown-wrapper")) {
        setOpenActionsMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Fetch Client Services for filter dropdown
  useEffect(() => {
    let isMounted = true;
    const fetchServices = async () => {
      try {
        const res = await ClientService.getClientServices(token);
        if (isMounted && res && res.data && res.data.client_services) {
          setClientServices(res.data.client_services);
        }
      } catch (err) {
        // Non-blocking for services dropdown
      }
    };

    fetchServices();
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
        service_id: serviceFilter !== "all" ? serviceFilter : "",
        cross_sell: crossSellParam,
      };

      const res = await ClientService.getClients(params, token);

      if (res && res.data) {
        setClients(res.data.clients || []);
        if (res.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: res.data.pagination.total || 0,
            totalPages: res.data.pagination.totalPages || 1,
            active: res.data.pagination.active ?? 0,
            inactive: res.data.pagination.inactive ?? 0,
          }));
        }
      }
    } catch (err) {
      if (err.statusCode === 403) {
        setError("You do not have permission to view clients. Contact Your administrator.");
      } else {
        setError(err.message || "Failed to fetch clients from database.");
      }
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.page, pagination.limit, search, statusFilter, typeFilter, serviceFilter, crossSellParam]);

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

  // Service filter handler with page reset
  const handleServiceChange = (e) => {
    setServiceFilter(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Clear/Reset all filters handler
  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setServiceFilter("all");
    if (crossSellParam) {
      searchParams.delete("cross_sell");
      setSearchParams(searchParams);
    }
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

  // Table Checkbox Selection handlers
  const isAllSelected =
    clients.length > 0 && clients.every((c) => selectedClientIds.includes(c.id));

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    if (checked) {
      const pageIds = clients.map((c) => c.id);
      setSelectedClientIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = clients.map((c) => c.id);
      setSelectedClientIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleToggleSelect = (e, clientId) => {
    e.stopPropagation();
    setSelectedClientIds((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Import / Export UI Handlers
  const handleImportClick = () => {
    setIsImpExpOpen(false);
    setIsImportModalOpen(true);
  };

  const handleOpenExportModal = () => {
    setIsImpExpOpen(false);
    setExportError("");
    setExportScope(selectedClientIds.length > 0 ? "selected" : "all");
    setIsExportModalOpen(true);
  };

  const handleCloseExportModal = () => {
    if (isExporting) return;
    setIsExportModalOpen(false);
    setExportError("");
  };

  const handlePerformExport = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      setExportError("");

      let payload = {
        client_ids: [],
        filters: {},
        format: "csv",
      };

      if (exportScope === "selected") {
        payload.client_ids = selectedClientIds;
      } else if (exportScope === "filtered") {
        payload.filters = {
          search: search.trim(),
          status: statusFilter !== "all" ? statusFilter : "",
          client_type_id: typeFilter !== "all" ? typeFilter : "",
          service_id: serviceFilter !== "all" ? serviceFilter : "",
        };
      }

      const { blob, filename } = await ClientService.exportClients(payload, token);

      // Trigger browser file download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(blobUrl);

      // Success UX behavior
      setIsExportModalOpen(false);
      setSuccessMessage("Clients exported successfully.");
      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
    } catch (err) {
      if (err.statusCode === 403) {
        setExportError("You do not have permission to export clients.");
      } else if (err.statusCode === 404) {
        setExportError("No clients found to export.");
      } else {
        setExportError(err.message || "Unable to export clients. Please try again.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Save Client Category Handler
  const handleSaveCategory = async () => {
    if (!targetCategoryClient) return;
    if (!canEdit) {
      triggerPermissionToast("You do not have permission to edit clients.");
      setTargetCategoryClient(null);
      return;
    }

    try {
      setIsSavingCategory(true);
      setCategoryError("");

      await ClientService.updateClientCategory(targetCategoryClient.id, selectedCategory, token);

      setClients((prev) =>
        prev.map((c) => (c.id === targetCategoryClient.id ? { ...c, client_category: selectedCategory } : c))
      );

      const catCap = selectedCategory.charAt(0) + selectedCategory.slice(1).toLowerCase();
      setSuccessMessage(`Category for client "${targetCategoryClient.name}" updated to ${catCap} successfully.`);
      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);

      setTargetCategoryClient(null);
    } catch (err) {
      setCategoryError(err.message || "Failed to update client category.");
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Toggle Client Active / Inactive Status
  const handleToggleStatus = async (clientItem) => {

    const newStatus = clientItem.status === "inactive" ? "active" : "inactive";
    try {
      await ClientService.updateClientStatus(clientItem.id, newStatus, token);
      setClients((prev) =>
        prev.map((c) => (c.id === clientItem.id ? { ...c, status: newStatus } : c))
      );
      setSuccessMessage(`Client "${clientItem.name}" status updated to ${newStatus}.`);
      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
    } catch (err) {
      setError(err.message || "Failed to update client status.");
      setTimeout(() => {
        setError("");
      }, 4000);
    }
  };

  // Confirm Client Deletion Handler
  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete) return;
    if (!canDelete) {
      setClientToDelete(null);
      triggerPermissionToast("You do not have permission to delete clients.");
      return;
    }
    try {
      setIsDeleting(true);
      await ClientService.deleteClient(clientToDelete.id, token);
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      setSelectedClientIds((prev) => prev.filter((id) => id !== clientToDelete.id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
      fetchClients();
      setSuccessMessage(`Client "${clientToDelete.name}" deleted successfully.`);
      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
      setClientToDelete(null);
    } catch (err) {
      setClientToDelete(null);
      if (err.statusCode === 403 || (err.message && err.message.toLowerCase().includes("permission"))) {
        triggerPermissionToast("You do not have permission to delete clients.");
      } else {
        setError(err.message || "Failed to delete client.");
        setTimeout(() => {
          setError("");
        }, 4000);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate summary statistics
  const totalCount = pagination.total;
  const activeCount = pagination.active ?? 0;
  const inactiveCount = pagination.inactive ?? 0;

  const startRecord = totalCount > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endRecord = Math.min(pagination.page * pagination.limit, totalCount);

  return (
    <AppLayout title="Clients">
      <div className="clients-container">
        {/* Top Header Actions Section */}
        <div className="clients-page-header">
          <div className="clients-page-title-group">
            <h2 className="clients-page-title">Clients Directory</h2>
            <p className="clients-page-desc">
              Manage your client relationships and household groups.
            </p>
          </div>

          <div className="clients-header-actions">
            {/* Import / Export Dropdown */}
            <div className="import-export-dropdown-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className={`btn-import-export ${isImpExpOpen ? "active" : ""}`}
                onClick={() => setIsImpExpOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={isImpExpOpen}
              >
                <span>Import / Export</span>
                <ChevronDown size={14} className={`dropdown-chevron ${isImpExpOpen ? "open" : ""}`} />
              </button>

              {isImpExpOpen && (
                <div className="import-export-menu">
                  <button
                    type="button"
                    className="dropdown-menu-item"
                    onClick={handleImportClick}
                  >
                    <Upload size={14} className="menu-icon import-icon" />
                    <span>Import Data</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-menu-item"
                    onClick={handleOpenExportModal}
                  >
                    <Download size={14} className="menu-icon export-icon" />
                    <span>Export Data</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Permission Denied Floating Toast */}
        {toastError && (
          <div className="permission-toast danger-toast">
            <AlertCircle size={18} />
            <span>{toastError}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="banner-success">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

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

        {/* Cross-Selling Active Filter Banner */}
        {crossSellParam && (
          <div className="cross-sell-active-banner">
            <div className="cross-sell-banner-left">
              <Filter size={16} />
              <span>
                Cross-Selling Filter:{" "}
                <strong>
                  {crossSellParam === "equity_without_mf"
                    ? "Equity → Mutual Fund (Clients with Equity but no Mutual Fund)"
                    : crossSellParam === "mf_without_equity"
                    ? "Mutual Fund → Equity (Clients with Mutual Fund but no Equity)"
                    : crossSellParam}
                </strong>
              </span>
            </div>
            <button
              type="button"
              className="btn-clear-cross-sell"
              onClick={() => {
                searchParams.delete("cross_sell");
                setSearchParams(searchParams);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <X size={14} />
              <span>Clear Filter</span>
            </button>
          </div>
        )}

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

            {/* Dynamic Service Filter */}
            <select
              className="clients-filter-select"
              value={serviceFilter}
              onChange={handleServiceChange}
            >
              <option value="all">All Services</option>
              {clientServices.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name}
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

            {(search || statusFilter !== "all" || typeFilter !== "all" || serviceFilter !== "all") && (
              <button
                type="button"
                className="btn-filter-icon"
                title="Reset All Filters"
                onClick={handleResetFilters}
                style={{ backgroundColor: "#f3f4f6", color: "#ef4444" }}
              >
                <X size={16} />
              </button>
            )}

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
                  <th style={{ width: "40px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      className="client-select-checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      title="Select all clients on this page"
                      aria-label="Select all clients on this page"
                    />
                  </th>
                  <th>CLIENT</th>
                  <th>UCC / CLIENT ID</th>
                  <th>TYPE</th>
                  {/* <th>CLIENT STATUS</th> */}
                  <th>CATEGORY</th>
                  <th>CONTACT</th>
                  <th>STATUS</th>
                  <th style={{ width: "80px", textAlign: "center" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="empty-state-cell">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Loading clients from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-state-cell">
                      {search || statusFilter !== "all" || typeFilter !== "all"
                        ? "No clients match your search or filters."
                        : "No clients found."}
                    </td>
                  </tr>
                ) : (
                  clients.map((client, index) => {
                    const isRevealed = Boolean(revealedClients[client.id]);
                    const isSelected = selectedClientIds.includes(client.id);

                    return (
                      <tr
                        key={client.id}
                        className={isSelected ? "row-selected" : ""}
                      >
                        <td
                          style={{ width: "40px", textAlign: "center" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="client-select-checkbox"
                            checked={isSelected}
                            onChange={(e) => handleToggleSelect(e, client.id)}
                            aria-label={`Select ${client.name}`}
                          />
                        </td>
                        <td>
                          <div className="client-info-cell">
                            <div className="client-avatar">
                              {getInitials(client.name)}
                            </div>
                            <div className="client-details-text">
                              <span className="client-name">{client.name}</span>
                              {client.business_name && (
                                <span className="client-business">
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
                        {/* <td>
                          <span className={`client-status-badge ${(client.client_status || "CLIENT").toLowerCase()}`}>
                            {client.client_status === "NON_CLIENT" ? "Non-Client" : "Client"}
                          </span>
                        </td> */}
                        <td>
                          {renderCategoryBadge(client.client_category)}
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
                            className={`status-badge ${client.status ? client.status.toLowerCase() : "active"}`}
                          >
                            <span className="status-dot">
                              {client.status === "inactive" ? "○" : "●"}
                            </span>
                            <span style={{ textTransform: "capitalize" }}>
                              {client.status || "active"}
                            </span>
                          </span>
                        </td>
                        <td style={{ width: "80px", textAlign: "center", position: "relative" }} onClick={(e) => e.stopPropagation()}>
                          <div className="actions-dropdown-wrapper">
                            <button
                              type="button"
                              className={`btn-actions-trigger ${openActionsMenuId === client.id ? "active" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionsMenuId((prev) => (prev === client.id ? null : client.id));
                              }}
                              aria-haspopup="true"
                              aria-expanded={openActionsMenuId === client.id}
                              title="Actions"
                              aria-label={`Actions for ${client.name}`}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openActionsMenuId === client.id && (
                              <div className={`actions-dropdown-menu ${index >= clients.length - 2 && clients.length > 2 ? "drop-up" : ""}`}>
                                <button
                                  type="button"
                                  className="actions-menu-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionsMenuId(null);
                                    navigate(`/clients/${client.id}`);
                                  }}
                                >
                                  <Eye size={14} className="menu-action-icon" />
                                  <span>View</span>
                                </button>

                                <button
                                  type="button"
                                  className="actions-menu-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionsMenuId(null);
                                    if (!canEdit) {
                                      triggerPermissionToast("You do not have permission to edit clients.");
                                      return;
                                    }
                                    navigate(`/clients/${client.id}/edit`);
                                  }}
                                >
                                  <Edit size={14} className="menu-action-icon" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  className="actions-menu-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionsMenuId(null);
                                    if (!canEdit) {
                                      triggerPermissionToast("You do not have permission to edit clients.");
                                      return;
                                    }
                                    setCategoryError("");
                                    setTargetCategoryClient(client);
                                    setSelectedCategory((client.client_category || "BRONZE").toUpperCase());
                                  }}
                                >
                                  <Award size={14} className="menu-action-icon" />
                                  <span>Change Category</span>
                                </button>

                                <button
                                  type="button"
                                  className="actions-menu-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionsMenuId(null);
                                    handleToggleStatus(client);
                                  }}
                                >
                                  {client.status === "inactive" ? (
                                    <>
                                      <UserCheck size={14} className="menu-action-icon status-active-icon" />
                                      <span>Activate Client</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserX size={14} className="menu-action-icon status-inactive-icon" />
                                      <span>Deactivate Client</span>
                                    </>
                                  )}
                                </button>


                                <button
                                  type="button"
                                  className="actions-menu-item delete-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenActionsMenuId(null);
                                    if (!canDelete) {
                                      triggerPermissionToast("You do not have permission to delete clients.");
                                      return;
                                    }
                                    setClientToDelete(client);
                                  }}
                                >
                                  <Trash2 size={14} className="menu-action-icon delete-icon" />
                                  <span>Delete Client</span>
                                </button>
                              </div>
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

      {/* Export Clients Modal */}
      {isExportModalOpen && (
        <div className="modal-backdrop">
          <div className="export-modal-card">
            <div className="export-modal-header">
              <div className="export-modal-header-text">
                <h3 className="export-modal-title">Export Clients</h3>
                <p className="export-modal-desc">
                  Choose which client data you want to export.
                </p>
              </div>
              <button
                type="button"
                className="btn-export-modal-close"
                onClick={handleCloseExportModal}
                disabled={isExporting}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="export-modal-body">
              {exportError && (
                <div className="banner-error" style={{ marginBottom: "1.25rem" }}>
                  <AlertCircle size={16} />
                  <span>{exportError}</span>
                </div>
              )}

              <div className="export-option-group">
                <label className="export-label">Select Export Scope</label>
                <div className="export-radio-list">
                  <label className={`export-radio-item ${exportScope === "all" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="exportScope"
                      value="all"
                      checked={exportScope === "all"}
                      onChange={() => setExportScope("all")}
                      disabled={isExporting}
                    />
                    <div className="export-radio-label-text">
                      <span className="radio-main-text">All Clients</span>
                      <span className="radio-sub-text">Export all client records accessible in the system.</span>
                    </div>
                  </label>

                  <label className={`export-radio-item ${exportScope === "filtered" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="exportScope"
                      value="filtered"
                      checked={exportScope === "filtered"}
                      onChange={() => setExportScope("filtered")}
                      disabled={isExporting}
                    />
                    <div className="export-radio-label-text">
                      <span className="radio-main-text">Current Filtered Clients</span>
                      <span className="radio-sub-text">
                        Export clients matching active filters ({search ? `Search: "${search}"` : "Active page filters"}).
                      </span>
                    </div>
                  </label>

                  <label
                    className={`export-radio-item ${exportScope === "selected" ? "selected" : ""} ${
                      selectedClientIds.length === 0 ? "disabled" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportScope"
                      value="selected"
                      checked={exportScope === "selected"}
                      onChange={() => setExportScope("selected")}
                      disabled={selectedClientIds.length === 0 || isExporting}
                    />
                    <div className="export-radio-label-text">
                      <span className="radio-main-text">
                        Selected Clients ({selectedClientIds.length})
                      </span>
                      <span className="radio-sub-text">
                        {selectedClientIds.length > 0
                          ? `Export only the ${selectedClientIds.length} checked client(s).`
                          : "No clients checked in table."}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="export-option-group" style={{ marginTop: "1.25rem" }}>
                <label className="export-label">Export Format</label>
                <div className="export-format-card">
                  <span className="format-dot">●</span>
                  <span className="format-name">CSV</span>
                  <span className="format-note">(Comma-Separated Values)</span>
                </div>
              </div>
            </div>

            <div className="export-modal-footer">
              <button
                type="button"
                className="btn-export-cancel"
                onClick={handleCloseExportModal}
                disabled={isExporting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-export-submit"
                onClick={handlePerformExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Export Clients</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Import Modal */}
      <ClientImportModal
        show={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          setTimeout(() => setSuccessMessage(""), 5000);
          fetchClients();
        }}
        token={token}
      />

      {/* Delete Client Confirmation Modal */}
      {clientToDelete && (
        <div className="modal-backdrop">
          <div className="delete-modal-card">
            <div className="delete-modal-header">
              <h3 className="delete-modal-title">Delete Client?</h3>
              <button
                type="button"
                className="btn-export-modal-close"
                onClick={() => setClientToDelete(null)}
                disabled={isDeleting}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="delete-modal-body">
              <p className="delete-modal-text">
                Are you sure you want to delete <strong>{clientToDelete.name}</strong>?
              </p>
              <p className="delete-modal-warning">This action cannot be undone.</p>
            </div>

            <div className="delete-modal-footer">
              <button
                type="button"
                className="btn-export-cancel"
                onClick={() => setClientToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-delete-confirm"
                onClick={handleConfirmDeleteClient}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Client</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Change Client Category Modal */}
      {targetCategoryClient && (
        <div className="modal-backdrop">
          <div className="category-modal-card">
            <div className="category-modal-header">
              <div className="category-modal-header-text">
                <h3 className="category-modal-title">Change Client Category</h3>
                <p className="category-modal-desc">
                  Select a new service tier category for this client.
                </p>
              </div>
              <button
                type="button"
                className="btn-export-modal-close"
                onClick={() => setTargetCategoryClient(null)}
                disabled={isSavingCategory}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="category-modal-body">
              {categoryError && (
                <div className="banner-error" style={{ marginBottom: "1rem" }}>
                  <AlertCircle size={16} />
                  <span>{categoryError}</span>
                </div>
              )}

              <div className="category-client-summary">
                <div className="summary-field">
                  <span className="summary-label">Client</span>
                  <span className="summary-value-name">{targetCategoryClient.name}</span>
                </div>
                <div className="summary-field">
                  <span className="summary-label">Current Category</span>
                  <div style={{ marginTop: "0.25rem" }}>
                    {renderCategoryBadge(targetCategoryClient.client_category)}
                  </div>
                </div>
              </div>

              <div className="category-option-group">
                <label className="export-label">New Category</label>
                <div className="category-radio-list">
                  {[
                    { value: "BRONZE", label: "Bronze", desc: "Standard entry-level client tier" },
                    { value: "SILVER", label: "Silver", desc: "Preferred active client tier" },
                    { value: "GOLD", label: "Gold", desc: "High-value premium client tier" },
                    { value: "PLATINUM", label: "Platinum", desc: "Exclusive top-tier VIP client category" },
                  ].map((cat) => (
                    <label
                      key={cat.value}
                      className={`category-radio-item ${selectedCategory === cat.value ? "selected" : ""}`}
                      onClick={() => setSelectedCategory(cat.value)}
                    >
                      <input
                        type="radio"
                        name="clientCategoryChoice"
                        value={cat.value}
                        checked={selectedCategory === cat.value}
                        onChange={() => setSelectedCategory(cat.value)}
                        disabled={isSavingCategory}
                      />
                      <div className="category-radio-content">
                        <div className="category-radio-header">
                          {renderCategoryBadge(cat.value)}
                        </div>
                        <span className="category-radio-desc">{cat.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="category-modal-footer">
              <button
                type="button"
                className="btn-export-cancel"
                onClick={() => setTargetCategoryClient(null)}
                disabled={isSavingCategory}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-export-submit"
                onClick={handleSaveCategory}
                disabled={isSavingCategory}
              >
                {isSavingCategory ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Save Changes...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Clients;

