import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import LeadService from "../../services/lead.service";
import ClientService from "../../services/client.service";
import StaffService from "../../services/staff.service";
import useAuth from "../../hooks/useAuth";
import LeadFormModal from "./LeadFormModal";
import LeadConvertModal from "./LeadConvertModal";
import LeadDetailsDrawer from "./LeadDetailsDrawer";
import {
  Plus,
  Search,
  RotateCcw,
  UserCheck,
  Briefcase,
  Globe,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  X,
} from "lucide-react";
import "./Leads.css";

const KANBAN_STAGES = [
  { key: "new", title: "New", color: "#2563eb" },
  { key: "contacted", title: "Contacted", color: "#0284c7" },
  { key: "interested", title: "Interested", color: "#7c3aed" },
  { key: "prospect", title: "Prospect", color: "#d97706" },
  { key: "converted", title: "Converted", color: "#16a34a" },
  { key: "lost", title: "Lost", color: "#dc2626" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const formatDateShort = (dateStr) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";

    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  } catch (e) {
    return dateStr;
  }
};

const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    const now = new Date();
    return d < now;
  } catch (e) {
    return false;
  }
};

const Leads = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const permissions = user?.permissions || [];
  const isAdmin = user?.role?.name === "Admin";

  // Permission Checks
  const canView = isAdmin || permissions.includes("lead.read") || permissions.includes("lead.view");
  const canCreate = isAdmin || permissions.includes("lead.create");
  const canUpdate = isAdmin || permissions.includes("lead.update") || permissions.includes("lead.edit");
  const canDelete = isAdmin || permissions.includes("lead.delete");

  // Leads & Data State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Related Dropdown Options
  const [clientTypes, setClientTypes] = useState([]);
  const [services, setServices] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);

  // Drag and Drop State
  const [draggedLead, setDraggedLead] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // Modal / Drawer States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertingLead, setConvertingLead] = useState(null);

  const [selectedLead, setSelectedLead] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    search: "",
    my_leads: false,
    assigned_to: "all",
    service_id: "all",
    client_type_id: "all",
    priority: "all",
  });

  // Fetch Options (Client Types, Services, Staff Users)
  useEffect(() => {
    let isMounted = true;
    const fetchOptions = async () => {
      try {
        const [typesRes, servicesRes, staffRes] = await Promise.all([
          ClientService.getClientTypes(token)
            .catch(() => ClientService.getAdminClientTypes({ limit: 100 }, token))
            .catch(() => null),
          ClientService.getClientServices(token)
            .catch(() => ClientService.getAdminClientServices({ limit: 100 }, token))
            .catch(() => null),
          StaffService.getStaffUsers({ limit: 100 }, token).catch(() => null),
        ]);

        if (isMounted) {
          if (typesRes && typesRes.data) {
            const typesList =
              typesRes.data.client_types ||
              typesRes.data.types ||
              (Array.isArray(typesRes.data) ? typesRes.data : []);
            setClientTypes(typesList);
          }

          if (servicesRes && servicesRes.data) {
            const servicesList =
              servicesRes.data.client_services ||
              servicesRes.data.services ||
              (Array.isArray(servicesRes.data) ? servicesRes.data : []);
            setServices(servicesList);
          }

          if (staffRes && staffRes.data) {
            const staffList =
              staffRes.data.staff ||
              staffRes.data.users ||
              (Array.isArray(staffRes.data) ? staffRes.data : []);
            setStaffUsers(staffList);
          }
        }
      } catch (err) {
        // Silently handle dropdown option fetch errors
      }
    };

    if (token) fetchOptions();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Fetch Leads from Backend API
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await LeadService.getLeads(
        {
          search: filters.search.trim(),
          my_leads: filters.my_leads,
          assigned_to: filters.assigned_to,
          service_id: filters.service_id,
          client_type_id: filters.client_type_id,
          priority: filters.priority,
          limit: 200,
        },
        token
      );

      if (res && res.data && res.data.leads) {
        setLeads(res.data.leads);
      } else {
        setLeads([]);
      }
    } catch (err) {
      if (err.statusCode === 403) {
        setError("You do not have permission to view leads.");
      } else {
        setError(err.message || "Failed to load leads from backend.");
      }
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    if (token && canView) {
      fetchLeads();
    }
  }, [token, canView, fetchLeads]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Filter Handlers
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      my_leads: false,
      assigned_to: "all",
      service_id: "all",
      client_type_id: "all",
      priority: "all",
    });
  };

  const isFilterActive =
    Boolean(filters.search.trim()) ||
    filters.my_leads ||
    filters.assigned_to !== "all" ||
    filters.service_id !== "all" ||
    filters.client_type_id !== "all" ||
    filters.priority !== "all";

  // Drag and Drop Event Handlers
  const handleDragStart = (e, lead) => {
    if (!canUpdate) {
      e.preventDefault();
      return;
    }
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, stageKey) => {
    e.preventDefault();
    if (!canUpdate) return;
    if (dragOverStage !== stageKey) {
      setDragOverStage(stageKey);
    }
  };

  const handleDragLeave = (e, stageKey) => {
    e.preventDefault();
    if (dragOverStage === stageKey) {
      setDragOverStage(null);
    }
  };

  const handleDrop = async (e, targetStageKey) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedLead || !canUpdate) return;

    // Constraint: Direct drag-and-drop into 'converted' is BLOCKED
    if (targetStageKey === "converted") {
      triggerToast("Please use 'Convert to Client' action to convert a lead.");
      setDraggedLead(null);
      return;
    }

    if (draggedLead.status === targetStageKey) {
      setDraggedLead(null);
      return;
    }

    const previousStatus = draggedLead.status;
    const leadId = draggedLead.id;

    // Optimistic UI update
    setLeads((prevLeads) =>
      prevLeads.map((l) => (l.id === leadId ? { ...l, status: targetStageKey } : l))
    );

    try {
      await LeadService.updateLeadStatus(leadId, targetStageKey, token);
      triggerToast(`Lead moved to ${targetStageKey.toUpperCase()}`);
    } catch (err) {
      // Revert status on API failure
      setLeads((prevLeads) =>
        prevLeads.map((l) => (l.id === leadId ? { ...l, status: previousStatus } : l))
      );
      setError(err.message || "Failed to update lead status.");
    } finally {
      setDraggedLead(null);
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      setDeleteError("");

      await LeadService.deleteLead(deleteTarget.id, token);
      setDeleteTarget(null);
      if (selectedLead && selectedLead.id === deleteTarget.id) {
        setSelectedLead(null);
      }
      triggerToast("Lead deleted successfully.");
      fetchLeads();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete lead.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Group leads into stages
  const stageLeadsMap = KANBAN_STAGES.reduce((acc, stage) => {
    acc[stage.key] = leads.filter((l) => (l.status || "new").toLowerCase() === stage.key);
    return acc;
  }, {});

  if (!canView) {
    return (
      <AppLayout title="Leads">
        <div className="banner-error" style={{ margin: "2rem" }}>
          <AlertCircle size={18} />
          <span>You do not have permission to view the Leads module.</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Leads">
      <div className="leads-page-container">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="floating-toast">
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="leads-page-header">
          <div className="leads-title-group">
            <h2 className="leads-page-title">Leads</h2>
            <p className="leads-page-subtitle">
              Manage and track potential clients through the sales pipeline.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              className="btn-add-lead"
              onClick={() => {
                setEditingLead(null);
                setShowFormModal(true);
              }}
            >
              <Plus size={16} />
              <span>Add Lead</span>
            </button>
          )}
        </div>

        {/* Global Error Banners */}
        {error && (
          <div className="banner-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Search & Filters Bar */}
        <div className="leads-controls-card">
          <div className="leads-filters-row">
            {/* Search Input */}
            <div className="leads-search-input-wrapper">
              <Search size={18} className="leads-search-icon" />
              <input
                type="text"
                placeholder="Search leads by name, mobile, email, company..."
                className="leads-search-input"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            {/* My Leads Filter Toggle */}
            <label className="my-leads-toggle-label">
              <input
                type="checkbox"
                className="my-leads-checkbox"
                checked={filters.my_leads}
                onChange={(e) => handleFilterChange("my_leads", e.target.checked)}
              />
              <span>My Leads</span>
            </label>

            {/* Assigned Staff Filter */}
            <div className="filter-item">
              <label className="filter-label">Assigned Staff</label>
              <select
                className="filter-select"
                value={filters.assigned_to}
                onChange={(e) => handleFilterChange("assigned_to", e.target.value)}
              >
                <option value="all">All Staff</option>
                {staffUsers.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Filter */}
            <div className="filter-item">
              <label className="filter-label">Service</label>
              <select
                className="filter-select"
                value={filters.service_id}
                onChange={(e) => handleFilterChange("service_id", e.target.value)}
              >
                <option value="all">All Services</option>
                {services.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Client Type Filter */}
            <div className="filter-item">
              <label className="filter-label">Client Type</label>
              <select
                className="filter-select"
                value={filters.client_type_id}
                onChange={(e) => handleFilterChange("client_type_id", e.target.value)}
              >
                <option value="all">All Types</option>
                {clientTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="filter-item">
              <label className="filter-label">Priority</label>
              <select
                className="filter-select"
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
              >
                <option value="all">All Priorities</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {isFilterActive && (
              <div className="filter-item filter-actions-item">
                <button
                  type="button"
                  className="btn-clear-filters"
                  onClick={handleClearFilters}
                  title="Clear all active filters"
                >
                  <RotateCcw size={14} />
                  <span>Clear Filters</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* KANBAN PIPELINE BOARD */}
        <div className="kanban-board-container">
          {KANBAN_STAGES.map((stage) => {
            const stageLeads = stageLeadsMap[stage.key] || [];
            const isDragOver = dragOverStage === stage.key;

            return (
              <div
                key={stage.key}
                className={`kanban-column ${isDragOver ? "drag-over" : ""}`}
                onDragOver={(e) => handleDragOver(e, stage.key)}
                onDragLeave={(e) => handleDragLeave(e, stage.key)}
                onDrop={(e) => handleDrop(e, stage.key)}
              >
                {/* Column Header */}
                <div className="column-header">
                  <div className="column-title-group">
                    <span className="column-color-indicator" style={{ backgroundColor: stage.color }}></span>
                    <h3 className="column-title">{stage.title}</h3>
                  </div>
                  <span className="column-count-pill">{stageLeads.length}</span>
                </div>

                {/* Column Content */}
                <div className="column-content-wrapper">
                  {loading ? (
                    <div className="column-skeleton-card">
                      <div className="skeleton-line" style={{ width: "60%" }}></div>
                      <div className="skeleton-line" style={{ width: "40%" }}></div>
                    </div>
                  ) : stageLeads.length === 0 ? (
                    <div className="column-empty-state">
                      <span>No leads</span>
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const isConverted = lead.status === "converted" || Boolean(lead.converted_client_id);
                      const followUpDateStr = formatDateShort(lead.next_follow_up_at);
                      const overdue = isOverdue(lead.next_follow_up_at) && !isConverted;

                      return (
                        <div
                          key={lead.id}
                          className={`lead-card ${isConverted ? "card-converted" : ""}`}
                          draggable={canUpdate && !isConverted}
                          onDragStart={(e) => handleDragStart(e, lead)}
                          onClick={() => setSelectedLead(lead)}
                        >
                          {/* Card Top */}
                          <div className="card-top-row">
                            <h4 className="card-lead-name">{lead.name}</h4>
                            <span className={`priority-pill priority-${lead.priority}`}>
                              {(lead.priority || "medium").toUpperCase()}
                            </span>
                          </div>

                          {/* Company / Client Type */}
                          <div className="card-subtitle-row">
                            {lead.company_name && (
                              <span className="card-company-name">{lead.company_name}</span>
                            )}
                            {lead.client_type?.name && (
                              <span className="card-type-chip">{lead.client_type.name}</span>
                            )}
                          </div>

                          {/* Service & Source Tags */}
                          <div className="card-tags-row">
                            {lead.service?.name && (
                              <span className="card-service-tag">
                                <Briefcase size={12} />
                                {lead.service.name}
                              </span>
                            )}
                            {lead.source && (
                              <span className="card-source-tag">
                                <Globe size={12} />
                                {lead.source}
                              </span>
                            )}
                          </div>

                          {/* Card Footer: Staff & Follow-up */}
                          <div className="card-footer-row">
                            <div className="card-staff-group">
                              <span className="staff-avatar-circle">
                                {(lead.assigned_staff?.name || "Unassigned")
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </span>
                              <span className="staff-name-text">
                                {lead.assigned_staff?.name || "Unassigned"}
                              </span>
                            </div>

                            {followUpDateStr && (
                              <div className={`card-followup-badge ${overdue ? "overdue" : ""}`}>
                                <Calendar size={12} />
                                <span>{followUpDateStr}</span>
                              </div>
                            )}
                          </div>

                          {/* Converted Action Bar */}
                          {isConverted ? (
                            <div className="card-converted-bar">
                              <span className="converted-check">Converted ✓</span>
                              {lead.converted_client_id && (
                                <button
                                  type="button"
                                  className="btn-card-view-client"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/clients/${lead.converted_client_id}`);
                                  }}
                                >
                                  <span>View Client</span>
                                  <ExternalLink size={12} />
                                </button>
                              )}
                            </div>
                          ) : (
                            canUpdate && (
                              <div className="card-hover-actions">
                                <button
                                  type="button"
                                  className="btn-card-convert"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConvertingLead(lead);
                                    setShowConvertModal(true);
                                  }}
                                >
                                  <UserCheck size={13} />
                                  <span>Convert</span>
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL 1: ADD / EDIT LEAD */}
        <LeadFormModal
          show={showFormModal}
          editingLead={editingLead}
          onClose={() => {
            setShowFormModal(false);
            setEditingLead(null);
          }}
          onSuccess={(msg) => {
            triggerToast(msg);
            fetchLeads();
          }}
          clientTypes={clientTypes}
          services={services}
          staffUsers={staffUsers}
          token={token}
        />

        {/* MODAL 2: CONVERT TO CLIENT */}
        <LeadConvertModal
          show={showConvertModal}
          lead={convertingLead}
          onClose={() => {
            setShowConvertModal(false);
            setConvertingLead(null);
          }}
          onSuccess={(msg, clientData) => {
            triggerToast(msg);
            fetchLeads();
          }}
          clientTypes={clientTypes}
          token={token}
        />

        {/* DRAWER: LEAD DETAILS */}
        {selectedLead && (
          <LeadDetailsDrawer
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onEdit={(leadToEdit) => {
              setSelectedLead(null);
              setEditingLead(leadToEdit);
              setShowFormModal(true);
            }}
            onConvert={(leadToConvert) => {
              setSelectedLead(null);
              setConvertingLead(leadToConvert);
              setShowConvertModal(true);
            }}
            onDelete={(leadToDelete) => {
              setDeleteTarget(leadToDelete);
              setDeleteError("");
            }}
            onNavigateToClient={(clientId) => {
              setSelectedLead(null);
              navigate(`/clients/${clientId}`);
            }}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}

        {/* MODAL 3: DELETE CONFIRMATION */}
        {deleteTarget && (
          <div className="modal-backdrop">
            <div className="modal-container" style={{ maxWidth: "440px" }}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ color: "#b91c1c" }}>
                  Delete Lead
                </h3>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => {
                    setDeleteTarget(null);
                    setDeleteError("");
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                {deleteError ? (
                  <div className="modal-error-banner" style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca" }}>
                    <AlertCircle size={16} style={{ color: "#b91c1c" }} />
                    <span style={{ color: "#b91c1c", fontWeight: 600 }}>{deleteError}</span>
                  </div>
                ) : (
                  <p style={{ fontSize: "0.9rem", color: "#334155" }}>
                    Are you sure you want to delete lead <strong>{deleteTarget.name}</strong>?
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setDeleteTarget(null);
                    setDeleteError("");
                  }}
                  disabled={isDeleting}
                >
                  {deleteError ? "Close" : "Cancel"}
                </button>
                {!deleteError && (
                  <button
                    type="button"
                    className="btn-confirm-delete"
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Leads;
