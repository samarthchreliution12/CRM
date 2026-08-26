import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../../components/layout/AppLayout/AppLayout";
import ClientService from "../../../services/client.service";
import useAuth from "../../../hooks/useAuth";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import "./ClientServices.css";

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

const ClientServices = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const permissions = user?.permissions || [];

  const canCreate = permissions.includes("client_service.create") || user?.role?.name === "Admin";
  const canEdit = permissions.includes("client_service.edit") || user?.role?.name === "Admin";
  const canDelete = permissions.includes("client_service.delete") || user?.role?.name === "Admin";

  // Data & Loading States
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Filter & Search State
  const [search, setSearch] = useState("");

  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", status: "active" });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Client Services from Backend API
  const fetchClientServices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await ClientService.getAdminClientServices(
        {
          search: search.trim(),
          status: "all",
          page: pagination.page,
          limit: pagination.limit,
        },
        token
      );

      if (res && res.data) {
        setServices(res.data.client_services || []);
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
        setError("You do not have permission to access client services management.");
      } else {
        setError(err.message || "Failed to load client services.");
      }
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchClientServices();
  }, [fetchClientServices]);

  // Handlers
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleOpenAddModal = () => {
    setEditingService(null);
    setFormData({ name: "", description: "", status: "active" });
    setFormError("");
    setShowFormModal(true);
  };

  const handleOpenEditModal = (serviceItem) => {
    setEditingService(serviceItem);
    setFormData({
      name: serviceItem.name || "",
      description: serviceItem.description || "",
      status: "active",
    });
    setFormError("");
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      setFormError("Service name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      const payload = {
        name: formData.name.trim(),
        description: formData.description ? formData.description.trim() : null,
        status: "active",
      };

      if (editingService) {
        await ClientService.updateClientService(editingService.id, payload, token);
        setSuccessMessage("Client service updated successfully.");
      } else {
        await ClientService.createClientService(payload, token);
        setSuccessMessage("Client service created successfully.");
      }

      setShowFormModal(false);
      fetchClientServices();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setFormError(err.message || "Failed to save client service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      setDeleteError("");

      await ClientService.deleteClientService(deleteTarget.id, token);
      setDeleteTarget(null);
      setSuccessMessage("Client service deleted successfully.");
      fetchClientServices();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      if (err.statusCode === 409) {
        setDeleteError("This service is currently assigned to clients and cannot be deleted.");
      } else {
        setDeleteError(err.message || "Failed to delete client service.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const startRecord = pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <AppLayout title="Client Services">
      <div className="client-config-container">
        {/* Navigation & Header */}
        <div className="client-config-header-row">
          <div className="client-config-title-group">
            <button
              type="button"
              className="btn-back-settings"
              onClick={() => navigate("/settings")}
            >
              <ArrowLeft size={16} />
              <span>Back to Settings</span>
            </button>
            <h2 className="client-config-title">Client Services</h2>
            <p className="client-config-desc">
              Manage the services available to be assigned to clients.
            </p>
          </div>

          {canCreate && (
            <button type="button" className="btn-add-config" onClick={handleOpenAddModal}>
              <Plus size={16} />
              <span>Add Service</span>
            </button>
          )}
        </div>

        {/* Global Success / Error Banners */}
        {successMessage && (
          <div className="banner-success">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="banner-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Controls Bar: Search & Refresh */}
        <div className="client-config-controls-bar">
          <div className="config-search-box" style={{ width: "100%", maxWidth: "560px" }}>
            <Search size={18} className="config-search-icon" />
            <input
              type="text"
              placeholder="Search Services by name or description..."
              className="config-search-input"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="config-filter-group">
            <button
              type="button"
              className="btn-filter-refresh"
              title="Refresh Client Services"
              onClick={fetchClientServices}
            >
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Client Services Table Card */}
        <div className="client-config-table-card">
          <div className="config-table-wrapper">
            <table className="config-table">
              <thead>
                <tr>
                  <th>SERVICE NAME</th>
                  <th>DESCRIPTION</th>
                  <th>CREATED AT</th>
                  {(canEdit || canDelete) && <th style={{ width: "100px" }}>ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="empty-state-cell">
                      <div className="flex-center-gap">
                        <Loader2 size={18} className="animate-spin" />
                        <span>Loading client services...</span>
                      </div>
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-state-cell">
                      No client services found.
                    </td>
                  </tr>
                ) : (
                  services.map((serviceItem) => (
                    <tr key={serviceItem.id}>
                      <td style={{ fontWeight: 700 }}>{serviceItem.name}</td>
                      <td>{serviceItem.description || "N/A"}</td>
                      <td>{formatDate(serviceItem.created_at)}</td>
                      {(canEdit || canDelete) && (
                        <td>
                          <div className="table-actions-cell">
                            {canEdit && (
                              <button
                                type="button"
                                className="btn-action-icon edit"
                                title="Edit Service"
                                onClick={() => handleOpenEditModal(serviceItem)}
                              >
                                <Edit2 size={15} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                className="btn-action-icon delete"
                                title="Delete Service"
                                onClick={() => {
                                  setDeleteTarget(serviceItem);
                                  setDeleteError("");
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && pagination.total > 0 && (
            <div className="config-pagination-bar">
              <span className="pagination-text">
                Showing {startRecord} to {endRecord} of {pagination.total} services
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

        {/* MODAL 1: ADD / EDIT SERVICE */}
        {showFormModal && (
          <div className="modal-backdrop">
            <div className="modal-container" style={{ maxWidth: "480px" }}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingService ? "Edit Service" : "Add Service"}
                </h3>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setShowFormModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="modal-body">
                  {formError && (
                    <div className="modal-error-banner">
                      <AlertCircle size={16} />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">
                      Service Name <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Demat, Trading, Mutual Fund"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Brief description of this service..."
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowFormModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-save" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : editingService ? "Update Service" : "Create Service"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: DELETE CONFIRMATION */}
        {deleteTarget && (
          <div className="modal-backdrop">
            <div className="modal-container" style={{ maxWidth: "440px" }}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ color: "#b91c1c" }}>
                  Delete Service
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
                    Are you sure you want to delete service <strong>{deleteTarget.name}</strong>?
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

export default ClientServices;
