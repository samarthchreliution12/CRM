import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import TaskService from "../../services/task.service";
import ClientService from "../../services/client.service";
import LeadService from "../../services/lead.service";
import StaffService from "../../services/staff.service";
import useAuth from "../../hooks/useAuth";

import TaskStatusBadge from "../../components/tasks/TaskStatusBadge";
import TaskPriorityBadge from "../../components/tasks/TaskPriorityBadge";
import TaskFormModal from "../../components/tasks/TaskFormModal";
import TaskDetailsModal from "../../components/tasks/TaskDetailsModal";
import TaskDeleteModal from "../../components/tasks/TaskDeleteModal";

import {
  Plus,
  Search,
  RotateCcw,
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  UserCheck,
  Users,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Bell,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  User,
} from "lucide-react";
import "./Tasks.css";

const TASK_TYPE_OPTIONS = [
  { value: "CALL", label: "Call" },
  { value: "MEETING", label: "Meeting" },
  { value: "EMAIL", label: "Email" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "DOCUMENTATION", label: "Documentation" },
  { value: "OTHER", label: "Other" },
];

const TASK_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const TASK_PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return dateStr;
  }
};

const isOverdueTask = (due_date, status) => {
  if (!due_date || status === "COMPLETED" || status === "CANCELLED") return false;
  return new Date(due_date) < new Date();
};

const Tasks = ({ isMyTasksMode = false, autoOpenCreate = false }) => {
  const { token, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isMyTasks = isMyTasksMode || location.pathname === "/tasks/my";
  const isCreateRoute = autoOpenCreate || location.pathname === "/tasks/create";

  // Role & Permission Checks
  const isAdmin = user?.role?.name === "Admin" || user?.role === "Admin" || user?.role_name === "Admin";
  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];

  const canCreate = isAdmin || userPermissions.includes("task.create") || userPermissions.includes("task.add");
  const canEdit = isAdmin || userPermissions.includes("task.edit") || userPermissions.includes("task.update");
  const canDelete = isAdmin || userPermissions.includes("task.delete");

  // Floating Toast Notification State
  const [toastError, setToastError] = useState("");
  const triggerPermissionToast = (msg) => {
    setToastError(msg);
    setTimeout(() => {
      setToastError("");
    }, 4000);
  };

  // Main Data & State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Dropdown reference data
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Filters State: Only Status Filter is exposed in simplified UI (All, Pending, Completed)
  const [statusFilter, setStatusFilter] = useState("all");

  // Stats Counters State (kept for backend model/API compatibility)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    overdue: 0,
    completed: 0,
  });

  // Modals & Menu States
  const [openActionsMenuId, setOpenActionsMenuId] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Click Outside listener for 3-dot actions menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".actions-dropdown-wrapper")) {
        setOpenActionsMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Reference Data (Clients, Leads, Staff) for modals and table badges
  useEffect(() => {
    let isMounted = true;
    const fetchReferenceData = async () => {
      try {
        const [clientsRes, leadsRes, staffRes] = await Promise.all([
          ClientService.getClients({ limit: 100 }, token).catch(() => null),
          LeadService.getLeads({ limit: 100 }, token).catch(() => null),
          StaffService.getStaffUsers({ limit: 100 }, token).catch(() => null),
        ]);

        if (!isMounted) return;

        const extractList = (res, key) => {
          if (!res) return [];
          if (Array.isArray(res)) return res;
          if (res.data) {
            if (Array.isArray(res.data)) return res.data;
            if (res.data[key] && Array.isArray(res.data[key])) return res.data[key];
            if (res.data.data && Array.isArray(res.data.data)) return res.data.data;
          }
          if (res[key] && Array.isArray(res[key])) return res[key];
          return [];
        };

        const cList = extractList(clientsRes, "clients");
        const lList = extractList(leadsRes, "leads");
        const sList = extractList(staffRes, "staff");

        if (cList.length > 0) setClients(cList);
        if (lList.length > 0) setLeads(lList);
        if (sList.length > 0) setStaffUsers(sList);
      } catch (err) {
        console.error("Error fetching reference options:", err);
      }
    };

    fetchReferenceData();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Fetch Tasks List from API
  const fetchTasks = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError("");
      try {
        const params = {
          page,
          limit: pagination.limit,
        };

        if (isMyTasks && user?.id) {
          params.assigned_to = user.id;
        }

        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        const res = await TaskService.getTasks(params, token);
        if (res && res.data) {
          const tasksData = res.data.tasks || (Array.isArray(res.data) ? res.data : []);
          const pagData = res.data.pagination || {
            page: 1,
            limit: 10,
            total: tasksData.length,
            totalPages: Math.ceil(tasksData.length / 10) || 1,
          };

          setTasks(tasksData);
          setPagination(pagData);

          // Summary Stats Calculation (preserved for backend/API compatibility)
          const totalCount = pagData.total || tasksData.length;
          const pendingCount = tasksData.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length;
          const completedCount = tasksData.filter((t) => t.status === "COMPLETED").length;
          const overdueCount = tasksData.filter((t) => isOverdueTask(t.due_date, t.status)).length;

          setStats({
            total: totalCount,
            pending: pendingCount,
            overdue: overdueCount,
            completed: completedCount,
          });
        }
      } catch (err) {
        console.error("Error loading tasks:", err);
        setError(err.message || "Failed to load tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [token, pagination.limit, statusFilter, isMyTasks, user?.id]
  );

  const [searchParams] = useSearchParams();
  const targetTaskIdParam = searchParams.get("taskId");

  useEffect(() => {
    fetchTasks(pagination.page);
  }, [fetchTasks, pagination.page]);

  // Handle auto-opening Task Creation Modal when navigated to /tasks/create
  useEffect(() => {
    if (isCreateRoute) {
      if (canCreate) {
        setEditingTask(null);
        setShowFormModal(true);
      } else {
        triggerPermissionToast("You do not have permission to create tasks.");
      }
    }
  }, [isCreateRoute, canCreate]);

  // Handle taskId URL query parameter (e.g., from notification click)
  useEffect(() => {
    if (targetTaskIdParam && token) {
      const targetId = parseInt(targetTaskIdParam, 10);
      if (!isNaN(targetId)) {
        // Find in loaded tasks first or fetch by ID
        const existingInList = tasks.find((t) => t.id === targetId);
        if (existingInList) {
          setSelectedTask(existingInList);
        } else {
          TaskService.getTaskById(targetId, token)
            .then((res) => {
              if (res?.data?.task) {
                setSelectedTask(res.data.task);
              }
            })
            .catch(() => null);
        }
      }
    }
  }, [targetTaskIdParam, tasks, token]);


  // Reset Filters Handler
  // Reset Status Filter Handler
  const handleResetFilters = () => {
    setStatusFilter("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Quick Status Update Handler
  const handleQuickStatusChange = async (taskId, newStatus) => {
    if (!canEdit) {
      triggerPermissionToast("You do not have permission to edit tasks.");
      return;
    }
    try {
      await TaskService.updateTaskStatus(taskId, newStatus, token);
      setSuccessMessage("Task status updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchTasks(pagination.page);
    } catch (err) {
      setError(err.message || "Failed to update task status.");
    }
  };

  // Delete Task Handler
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    if (!canDelete) {
      triggerPermissionToast("You do not have permission to delete tasks.");
      setTaskToDelete(null);
      return;
    }

    setIsDeleting(true);
    setDeleteError("");
    try {
      await TaskService.deleteTask(taskToDelete.id, token);
      setSuccessMessage(`Task "${taskToDelete.title}" deleted successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
      setTaskToDelete(null);
      fetchTasks(pagination.page);
    } catch (err) {
      setDeleteError(err.message || "Failed to delete task.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Edit Modal with Permission Check
  const handleOpenEdit = (task) => {
    setOpenActionsMenuId(null);
    if (!canEdit) {
      triggerPermissionToast("You do not have permission to edit tasks.");
      return;
    }
    setEditingTask(task);
    setShowFormModal(true);
  };

  // Open Delete Modal with Permission Check
  const handleOpenDelete = (task) => {
    setOpenActionsMenuId(null);
    if (!canDelete) {
      triggerPermissionToast("You do not have permission to delete tasks.");
      return;
    }
    setTaskToDelete(task);
  };

  // Open Create Form Modal with Permission Check
  const handleOpenCreate = () => {
    if (!canCreate) {
      triggerPermissionToast("You do not have permission to create tasks.");
      return;
    }
    setEditingTask(null);
    setShowFormModal(true);
  };

  return (
    <AppLayout title={isMyTasks ? "My Tasks" : "All Tasks"}>
      {/* Floating Permission Error Toast */}
      {toastError && (
        <div className="tasks-toast-error">
          <AlertCircle size={18} />
          <span>{toastError}</span>
          <button
            type="button"
            className="tasks-toast-close"
            onClick={() => setToastError("")}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="tasks-page-container">
        {/* SECTION 1: Page Header */}
        <div className="tasks-page-header">
          <div className="tasks-title-group">
            <h1 className="tasks-page-title">{isMyTasks ? "My Tasks" : "All Tasks"}</h1>
            <p className="tasks-page-subtitle">
              {isMyTasks ? "Tasks assigned to you." : "Manage all CRM tasks."}
            </p>
          </div>

          <div className="tasks-header-actions">
            {canCreate && (
              <button
                type="button"
                className="btn-add-task"
                onClick={handleOpenCreate}
              >
                <Plus size={16} />
                <span>Create Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Messages Banners */}
        {error && (
          <div className="tasks-alert tasks-alert-danger">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button
              type="button"
              className="tasks-alert-close"
              onClick={() => setError("")}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="tasks-alert tasks-alert-success">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* SECTION 2: Summary Statistic Cards - Temporarily commented out per requirement */}
        {/*
        <div className="tasks-summary-grid">
          <div className="tasks-summary-card">
            <div className="tasks-summary-card-header">
              <span className="tasks-summary-label">Total Tasks</span>
              <CheckSquare size={16} className="summary-icon icon-total" />
            </div>
            <span className="tasks-summary-value">{stats.total}</span>
          </div>

          <div className="tasks-summary-card">
            <div className="tasks-summary-card-header">
              <span className="tasks-summary-label">Pending / In Progress</span>
              <Clock size={16} className="summary-icon icon-pending" />
            </div>
            <span className="tasks-summary-value">{stats.pending}</span>
          </div>

          <div className="tasks-summary-card highlight-overdue">
            <div className="tasks-summary-card-header">
              <span className="tasks-summary-label">Overdue</span>
              <AlertTriangle size={16} className="summary-icon icon-overdue" />
            </div>
            <span className="tasks-summary-value">{stats.overdue}</span>
          </div>

          <div className="tasks-summary-card">
            <div className="tasks-summary-card-header">
              <span className="tasks-summary-label">Completed</span>
              <CheckCircle2 size={16} className="summary-icon icon-completed" />
            </div>
            <span className="tasks-summary-value">{stats.completed}</span>
          </div>
        </div>
        */}

        {/* SECTION 3: Simplified Status Filter Toolbar */}
        <div className="tasks-controls-card">
          <div className="tasks-filter-row">
            <div className="tasks-filter-group" style={{ maxWidth: "220px" }}>
              <label className="tasks-filter-label">Status</label>
              <select
                className="tasks-filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <option value="all">All</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 4: Tasks Directory Table */}
        <div className="tasks-table-card">
          {loading ? (
            <div className="tasks-table-loading">
              <div className="spinner"></div>
              <p>Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="tasks-table-empty">
              <CheckSquare size={48} className="empty-icon" />
              <h3>No tasks found</h3>
              <p>No tasks match the selected status filter.</p>
              {statusFilter !== "all" && (
                <button
                  type="button"
                  className="btn-reset-filters"
                  style={{ marginTop: "1rem" }}
                  onClick={handleResetFilters}
                >
                  <span>Show All Tasks</span>
                </button>
              )}
            </div>
          ) : (
            <div className="tasks-table-wrapper">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Type</th>
                    <th>Related To</th>
                    <th>Assigned To</th>
                    <th>Priority</th>
                    <th>Due Date & Time</th>
                    <th>Status</th>
                    <th>Reminder</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => {
                    const overdue = isOverdueTask(t.due_date, t.status);
                    return (
                      <tr key={t.id} className={overdue ? "row-overdue" : ""}>
                        {/* Task Title & snippet */}
                        <td>
                          <div className="task-title-cell">
                            <span
                              className="task-title-text"
                              onClick={() => setSelectedTask(t)}
                              title="Click to view details"
                            >
                              {t.title}
                            </span>
                            {t.description && (
                              <span className="task-desc-snippet">
                                {t.description.length > 55
                                  ? `${t.description.substring(0, 55)}...`
                                  : t.description}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Task Type */}
                        <td>
                          <span className={`task-type-pill type-${(t.task_type || "OTHER").toLowerCase()}`}>
                            {t.task_type || "OTHER"}
                          </span>
                        </td>

                        {/* Related To (Client / Lead) */}
                        <td>
                          {(() => {
                            const clientObj =
                              t.client ||
                              t.related_client ||
                              (t.related_client_id
                                ? clients.find((c) => parseInt(c.id, 10) === parseInt(t.related_client_id, 10))
                                : null);
                            const leadObj =
                              t.lead ||
                              t.related_lead ||
                              (t.related_lead_id
                                ? leads.find((l) => parseInt(l.id, 10) === parseInt(t.related_lead_id, 10))
                                : null);

                            if (clientObj) {
                              const clientName =
                                clientObj.full_name ||
                                clientObj.name ||
                                clientObj.business_name ||
                                `Client #${clientObj.id}`;
                              return (
                                <span className="related-badge client-badge">
                                  <UserCheck size={12} />
                                  <span>{clientName}</span>
                                </span>
                              );
                            }

                            if (leadObj) {
                              const leadName =
                                leadObj.full_name ||
                                leadObj.name ||
                                leadObj.company_name ||
                                `Lead #${leadObj.id}`;
                              return (
                                <span className="related-badge lead-badge">
                                  <Users size={12} />
                                  <span>{leadName}</span>
                                </span>
                              );
                            }

                            return <span className="text-muted">-</span>;
                          })()}
                        </td>

                        {/* Assigned To */}
                        <td>
                          {(() => {
                            const assigned = t.assigned_user || t.assignedTo || t.assigned_to_user;
                            const staffName = assigned
                              ? assigned.name || assigned.full_name || assigned.email || `Staff #${assigned.id}`
                              : null;
                            return staffName ? (
                              <div className="assignee-cell">
                                <User size={14} className="assignee-icon" />
                                <span>{staffName}</span>
                              </div>
                            ) : (
                              <span className="text-muted">Unassigned</span>
                            );
                          })()}
                        </td>

                        {/* Priority */}
                        <td>
                          <TaskPriorityBadge priority={t.priority} />
                        </td>

                        {/* Due Date & Time */}
                        <td>
                          <div className={`due-date-cell ${overdue ? "overdue" : ""}`}>
                            <Calendar size={13} />
                            <span>{formatDateTime(t.due_date)}</span>
                            {overdue && (
                              <span className="overdue-tag" title="Overdue task!">
                                Overdue
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status + Dropdown for quick update */}
                        <td>
                          <div className="status-select-wrapper">
                            <TaskStatusBadge status={t.status} />
                            {canEdit && (
                              <select
                                className="status-quick-select"
                                value={t.status}
                                onChange={(e) => handleQuickStatusChange(t.id, e.target.value)}
                                title="Click to change status"
                              >
                                {TASK_STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>

                        {/* Reminder */}
                        <td>
                          {t.reminder_datetime ? (
                            <span className="reminder-pill" title={`Reminder: ${formatDateTime(t.reminder_datetime)}`}>
                              <Bell size={12} />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>

                        {/* Actions 3-Dot Menu */}
                        <td style={{ textAlign: "right" }}>
                          <div className="actions-dropdown-wrapper">
                            <button
                              type="button"
                              className="btn-action-trigger"
                              onClick={() => setOpenActionsMenuId(openActionsMenuId === t.id ? null : t.id)}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openActionsMenuId === t.id && (
                              <div className="actions-menu">
                                <button
                                  type="button"
                                  className="action-item"
                                  onClick={() => {
                                    setOpenActionsMenuId(null);
                                    setSelectedTask(t);
                                  }}
                                >
                                  <Eye size={14} />
                                  <span>View</span>
                                </button>

                                <button
                                  type="button"
                                  className="action-item"
                                  onClick={() => handleOpenEdit(t)}
                                >
                                  <Edit size={14} />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  className="action-item action-item-danger"
                                  onClick={() => handleOpenDelete(t)}
                                >
                                  <Trash2 size={14} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* SECTION 5: Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="tasks-pagination">
              <span className="pagination-info">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tasks
              </span>

              <div className="pagination-buttons">
                <button
                  type="button"
                  className="btn-page"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                <span className="page-current">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  className="btn-page"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal (Create / Edit) */}
      {showFormModal && (
        <TaskFormModal
          task={editingTask}
          clients={clients}
          leads={leads}
          staffUsers={staffUsers}
          onClose={() => {
            setShowFormModal(false);
            setEditingTask(null);
            if (isCreateRoute) {
              navigate("/tasks");
            }
          }}
          onSuccess={() => {
            setShowFormModal(false);
            setEditingTask(null);
            setSuccessMessage(editingTask ? "Task updated successfully!" : "Task created successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
            if (isCreateRoute) {
              navigate("/tasks");
            } else {
              fetchTasks(pagination.page);
            }
          }}
        />
      )}

      {/* Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={(taskToEdit) => handleOpenEdit(taskToEdit)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <TaskDeleteModal
          task={taskToDelete}
          onClose={() => {
            setTaskToDelete(null);
            setDeleteError("");
          }}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          error={deleteError}
        />
      )}
    </AppLayout>
  );
};

export default Tasks;
