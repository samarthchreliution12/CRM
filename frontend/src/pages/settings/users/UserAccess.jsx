import React, { useState, useEffect, useCallback } from "react";
import AppLayout from "../../../components/layout/AppLayout/AppLayout";
import useAuth from "../../../hooks/useAuth";
import StaffService from "../../../services/staff.service";
import StaffTable from "../../../components/settings/staff/StaffTable/StaffTable";
import StaffFormModal from "../../../components/settings/staff/StaffFormModal/StaffFormModal";
import StaffDetailModal from "../../../components/settings/staff/StaffDetailModal/StaffDetailModal";
import StaffConfirmModal from "../../../components/settings/staff/StaffConfirmModal/StaffConfirmModal";
import Permissions from "./permissions/Permissions";
import { Plus, Search, Users as UsersIcon, KeyRound, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import "./UserAccess.css";

const UserAccess = () => {
  const { token } = useAuth();

  // Tab State: "users" or "permissions" (Roles tab omitted)
  const [activeTab, setActiveTab] = useState("users");

  const [staffList, setStaffList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingStaff, setViewingStaff] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmType, setConfirmType] = useState("deactivate");
  const [targetStaff, setTargetStaff] = useState(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setGlobalError("");

    try {
      const response = await StaffService.getStaffUsers(
        { search, status: statusFilter, page: pagination.page, limit: pagination.limit },
        token
      );

      if (response && response.success && response.data) {
        setStaffList(response.data.staff || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        setGlobalError(response.message || "Failed to load Staff users.");
      }
    } catch (err) {
      setGlobalError(err.message || "An error occurred while fetching Staff users.");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, pagination.page, pagination.limit, token]);

  useEffect(() => {
    if (activeTab === "users") {
      fetchStaff();
    }
  }, [fetchStaff, activeTab]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Open Handlers
  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setIsFormModalOpen(true);
    setGlobalError("");
    setSuccessMessage("");
  };

  const handleOpenEditModal = (staffUser) => {
    setEditingStaff(staffUser);
    setIsFormModalOpen(true);
    setGlobalError("");
    setSuccessMessage("");
  };

  const handleOpenViewModal = (staffUser) => {
    setViewingStaff(staffUser);
    setIsDetailModalOpen(true);
  };

  const handleOpenToggleStatusModal = (staffUser) => {
    setTargetStaff(staffUser);
    setConfirmType(staffUser.status === "active" ? "deactivate" : "activate");
    setIsConfirmModalOpen(true);
    setGlobalError("");
    setSuccessMessage("");
  };

  const handleOpenDeleteModal = (staffUser) => {
    setTargetStaff(staffUser);
    setConfirmType("delete");
    setIsConfirmModalOpen(true);
    setGlobalError("");
    setSuccessMessage("");
  };

  // Submit Handlers
  const handleFormSubmit = async (formData) => {
    setIsActionSubmitting(true);
    setGlobalError("");
    setSuccessMessage("");

    try {
      if (editingStaff) {
        const response = await StaffService.updateStaffUser(editingStaff.id, formData, token);
        if (response && response.success) {
          setSuccessMessage(`Staff member "${formData.name}" updated successfully.`);
          setIsFormModalOpen(false);
          fetchStaff();
        } else {
          setGlobalError(response.message || "Failed to update Staff member.");
        }
      } else {
        const response = await StaffService.createStaffUser(formData, token);
        if (response && response.success) {
          setSuccessMessage(`Staff member "${formData.name}" created successfully.`);
          setIsFormModalOpen(false);
          fetchStaff();
        } else {
          setGlobalError(response.message || "Failed to create Staff member.");
        }
      }
    } catch (err) {
      setGlobalError(err.message || "An error occurred during save.");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!targetStaff) return;

    setIsActionSubmitting(true);
    setGlobalError("");
    setSuccessMessage("");

    try {
      if (confirmType === "delete") {
        const response = await StaffService.deleteStaffUser(targetStaff.id, token);
        if (response && response.success) {
          setSuccessMessage(`Staff member "${targetStaff.name}" deleted successfully.`);
          setIsConfirmModalOpen(false);
          fetchStaff();
        } else {
          setGlobalError(response.message || "Failed to delete Staff user.");
        }
      } else {
        const nextStatus = confirmType === "activate" ? "active" : "inactive";
        const response = await StaffService.updateStaffStatus(targetStaff.id, nextStatus, token);
        if (response && response.success) {
          setSuccessMessage(`Staff member "${targetStaff.name}" is now ${nextStatus}.`);
          setIsConfirmModalOpen(false);
          fetchStaff();
        } else {
          setGlobalError(response.message || "Failed to update status.");
        }
      }
    } catch (err) {
      setGlobalError(err.message || "An error occurred during operation.");
    } finally {
      setIsActionSubmitting(false);
    }
  };

  return (
    <AppLayout title="User & Access">
      <div className="user-access-container">
        {/* Main Navigation Tabs: Users | Permissions */}
        <div className="main-navigation-tabs">
          <button
            type="button"
            className={`nav-tab-button ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <UsersIcon size={18} />
            <span>Users</span>
          </button>

          <button
            type="button"
            className={`nav-tab-button ${activeTab === "permissions" ? "active" : ""}`}
            onClick={() => setActiveTab("permissions")}
          >
            <KeyRound size={18} />
            <span>Permissions</span>
          </button>
        </div>

        {activeTab === "users" ? (
          /* Users / Staff Management View */
          <>
            {globalError && (
              <div className="auth-alert auth-alert-error">
                <AlertCircle size={18} />
                <span>{globalError}</span>
              </div>
            )}

            {successMessage && (
              <div className="auth-alert auth-alert-success">
                <CheckCircle2 size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="user-access-card">
              {/* Header Section */}
              <div className="user-access-header">
                <div className="user-access-title-group">
                  <h2 className="user-access-title">User & Access</h2>
                  <p className="user-access-subtitle">
                    Manage staff users, their access and account status.
                  </p>
                </div>

                <button type="button" className="btn-add-staff" onClick={handleOpenAddModal}>
                  <Plus size={18} />
                  <span>Add Staff</span>
                </button>
              </div>

              {/* Controls Bar: Search & Status Filters */}
              <div className="controls-bar">
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon-inside" />
                  <input
                    type="text"
                    className="staff-search-input"
                    placeholder="Search staff..."
                    value={search}
                    onChange={handleSearchChange}
                  />
                </div>

                <div className="status-tabs">
                  <button
                    type="button"
                    className={`tab-btn ${statusFilter === "all" ? "active" : ""}`}
                    onClick={() => handleStatusFilterChange("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${statusFilter === "active" ? "active" : ""}`}
                    onClick={() => handleStatusFilterChange("active")}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${statusFilter === "inactive" ? "active" : ""}`}
                    onClick={() => handleStatusFilterChange("inactive")}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              {/* Staff Content State Views */}
              {isLoading ? (
                <div className="staff-loading-container">
                  <RefreshCw size={24} className="animate-spin" color="#0284c7" />
                  <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "#475569" }}>
                    Loading staff users...
                  </span>
                </div>
              ) : staffList.length === 0 ? (
                <div className="staff-empty-container">
                  <div className="placeholder-icon-circle">
                    <UsersIcon size={28} />
                  </div>
                  <h3 className="empty-title">No staff users found</h3>
                  <p className="empty-desc">
                    {search || statusFilter !== "all"
                      ? "No staff members matched your current filter criteria."
                      : "Get started by adding your first Staff user account."}
                  </p>
                  <button type="button" className="btn-add-staff" onClick={handleOpenAddModal}>
                    <Plus size={18} />
                    <span>Add Staff</span>
                  </button>
                </div>
              ) : (
                <StaffTable
                  staffList={staffList}
                  onView={handleOpenViewModal}
                  onEdit={handleOpenEditModal}
                  onToggleStatus={handleOpenToggleStatusModal}
                  onDelete={handleOpenDeleteModal}
                />
              )}
            </div>

            {/* Modals */}
            <StaffFormModal
              isOpen={isFormModalOpen}
              onClose={() => setIsFormModalOpen(false)}
              onSubmit={handleFormSubmit}
              initialData={editingStaff}
              isSubmitting={isActionSubmitting}
            />

            <StaffDetailModal
              isOpen={isDetailModalOpen}
              onClose={() => setIsDetailModalOpen(false)}
              staffUser={viewingStaff}
            />

            <StaffConfirmModal
              isOpen={isConfirmModalOpen}
              onClose={() => setIsConfirmModalOpen(false)}
              onConfirm={handleConfirmSubmit}
              type={confirmType}
              staffUser={targetStaff}
              isSubmitting={isActionSubmitting}
            />
          </>
        ) : (
          /* Permissions Management View */
          <div className="user-access-card">
            <Permissions />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default UserAccess;
