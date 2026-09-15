import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import TaskService from "../../services/task.service";
import StaffService from "../../services/staff.service";
import ClientService from "../../services/client.service";
import LeadService from "../../services/lead.service";
import useAuth from "../../hooks/useAuth";

import CalendarMonthView from "./components/CalendarMonthView";
import CalendarWeekView from "./components/CalendarWeekView";
import CalendarDayView from "./components/CalendarDayView";
import CalendarAgendaMobile from "./components/CalendarAgendaMobile";

import TaskDetailsModal from "../../components/tasks/TaskDetailsModal";
import TaskFormModal from "../../components/tasks/TaskFormModal";

import "./Calendar.css";

const Calendar = () => {
  const { token, user } = useAuth();
  const isAdmin = user?.role?.name === "Admin";
  const permissions = user?.permissions || [];

  // Permission Checks
  const canCreate = isAdmin || permissions.includes("task.create");
  const canEdit =
    isAdmin || permissions.includes("task.update") || permissions.includes("task.edit");
  const canDelete = isAdmin || permissions.includes("task.delete");

  // State Management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month"); // 'month' | 'week' | 'day'
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignedToFilter, setAssignedToFilter] = useState("all");

  const [tasks, setTasks] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [createInitialDueDate, setCreateInitialDueDate] = useState("");
  const [createInitialDueTime, setCreateInitialDueTime] = useState("");

  // Helper for toasts
  const triggerToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Compute visible date range (start_date, end_date) for API fetch
  const getDateRangeForView = useCallback((date, view) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    let startDate, endDate;

    if (view === "month") {
      const firstDay = new Date(year, month, 1);
      const startPadding = firstDay.getDay();
      startDate = new Date(year, month, 1 - startPadding);

      // 42 days grid
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 41);
    } else if (view === "week") {
      const dayOfWeek = date.getDay();
      startDate = new Date(date);
      startDate.setDate(date.getDate() - dayOfWeek);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      // Day view
      startDate = new Date(date);
      endDate = new Date(date);
    }

    const formatYMD = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    return {
      start_date: formatYMD(startDate),
      end_date: formatYMD(endDate),
    };
  }, []);

  // Fetch Tasks for visible range
  const fetchCalendarTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { start_date, end_date } = getDateRangeForView(currentDate, currentView);

      const params = {
        start_date,
        end_date,
        limit: 200, // Load tasks in date window
      };

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (assignedToFilter !== "all") {
        params.assigned_to = assignedToFilter;
      }

      const res = await TaskService.getTasks(params, token);
      if (res?.data?.tasks) {
        setTasks(res.data.tasks);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Error loading calendar tasks:", err);
      setError(err.message || "Failed to load calendar tasks.");
    } finally {
      setLoading(false);
    }
  }, [token, currentDate, currentView, statusFilter, assignedToFilter, getDateRangeForView]);

  // Load Reference Data (Staff, Clients, Leads) for form & filters
  useEffect(() => {
    let isMounted = true;
    const fetchReferenceData = async () => {
      try {
        const [staffRes, clientsRes, leadsRes] = await Promise.all([
          StaffService.getStaffUsers({ limit: 100 }, token).catch(() => null),
          ClientService.getClients({ limit: 100 }, token).catch(() => null),
          LeadService.getLeads({ limit: 100 }, token).catch(() => null),
        ]);

        if (isMounted) {
          if (staffRes?.data?.staff) setStaffUsers(staffRes.data.staff);
          if (clientsRes?.data?.clients) setClients(clientsRes.data.clients);
          if (leadsRes?.data?.leads) setLeads(leadsRes.data.leads);
        }
      } catch (err) {
        // non-blocking
      }
    };

    fetchReferenceData();
    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    fetchCalendarTasks();
  }, [fetchCalendarTasks]);

  // Navigation Handlers
  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (currentView === "month") {
      nextDate.setMonth(nextDate.getMonth() - 1);
    } else if (currentView === "week") {
      nextDate.setDate(nextDate.getDate() - 7);
    } else {
      nextDate.setDate(nextDate.getDate() - 1);
    }
    setCurrentDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (currentView === "month") {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (currentView === "week") {
      nextDate.setDate(nextDate.getDate() + 7);
    } else {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    setCurrentDate(nextDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Header Title Formatting
  const formatCurrentLabel = () => {
    if (currentView === "month") {
      return currentDate.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      });
    } else if (currentView === "week") {
      const dayOfWeek = currentDate.getDay();
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const startStr = start.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const endStr = end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      return `${startStr} - ${endStr}`;
    } else {
      return currentDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  // Cell Click Handler (Create Task with pre-filled date/time)
  const handleCellClick = (dateStr, timeStr = "") => {
    if (!canCreate) {
      triggerToast("You do not have permission to create tasks.", "error");
      return;
    }
    setEditingTask(null);
    setCreateInitialDueDate(dateStr);
    setCreateInitialDueTime(timeStr || "10:00");
    setIsFormOpen(true);
  };

  // Task Card Click Handler (View Details)
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  // Quick Status Complete Handler
  const handleQuickStatusChange = async (taskId, newStatus) => {
    if (!canEdit) {
      triggerToast("You do not have permission to edit tasks.", "error");
      return;
    }
    try {
      await TaskService.updateTaskStatus(taskId, newStatus, token);
      triggerToast("Task marked as completed.", "success");
      fetchCalendarTasks();
    } catch (err) {
      triggerToast(err.message || "Failed to update task status.", "error");
    }
  };

  // Edit Task Handler
  const handleEditTask = (task) => {
    if (!canEdit) {
      triggerToast("You do not have permission to edit tasks.", "error");
      return;
    }
    setEditingTask(task);
    setCreateInitialDueDate("");
    setCreateInitialDueTime("");
    setIsFormOpen(true);
  };

  // Create Task button handler
  const handleOpenCreateModal = () => {
    if (!canCreate) {
      triggerToast("You do not have permission to create tasks.", "error");
      return;
    }
    setEditingTask(null);
    const todayYMD = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
    setCreateInitialDueDate(todayYMD);
    setCreateInitialDueTime("10:00");
    setIsFormOpen(true);
  };

  return (
    <AppLayout>
      <div className="calendar-page-container">
        {/* Permission / Status Toast */}
        {toast && (
          <div
            className={`toast-notification ${toast.type}`}
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              zIndex: 9999,
              padding: "0.75rem 1.25rem",
              borderRadius: "8px",
              backgroundColor: toast.type === "success" ? "#FAF3F2" : "#FEF2F2",
              border: `1px solid ${toast.type === "success" ? "#9E241D" : "#EF4444"}`,
              color: toast.type === "success" ? "#9E241D" : "#991B1B",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              fontWeight: 600,
              fontSize: "0.875rem",
              animation: "fadeInSlideDown 0.3s ease-out",
            }}
          >
            {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Calendar Header Card */}
        <div className="calendar-header-card">
          <div className="calendar-header-top">
            <div className="calendar-header-title-group">
              <h1>
                <CalendarIcon size={24} color="var(--primary, #9E241D)" />
                Calendar
              </h1>
              <p>Manage and view your scheduled tasks.</p>
            </div>

            <div className="calendar-header-actions">
              {canCreate && (
                <button
                  type="button"
                  className="btn-add-task"
                  onClick={handleOpenCreateModal}
                >
                  <Plus size={16} />
                  <span>Create Task</span>
                </button>
              )}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="calendar-controls-bar">
            {/* Prev / Today / Next */}
            <div className="calendar-nav-group">
              <button type="button" className="btn-cal-nav" onClick={handlePrev}>
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>

              <button type="button" className="btn-cal-nav btn-cal-today" onClick={handleToday}>
                Today
              </button>

              <button type="button" className="btn-cal-nav" onClick={handleNext}>
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Current View Label */}
            <div className="calendar-current-label">{formatCurrentLabel()}</div>

            {/* View Selector Tabs */}
            <div className="calendar-view-selector">
              <button
                type="button"
                className={`btn-view-tab ${currentView === "month" ? "active" : ""}`}
                onClick={() => setCurrentView("month")}
              >
                Month
              </button>
              <button
                type="button"
                className={`btn-view-tab ${currentView === "week" ? "active" : ""}`}
                onClick={() => setCurrentView("week")}
              >
                Week
              </button>
              <button
                type="button"
                className={`btn-view-tab ${currentView === "day" ? "active" : ""}`}
                onClick={() => setCurrentView("day")}
              >
                Day
              </button>
              <button
                type="button"
                className={`btn-view-tab ${currentView === "agenda" ? "active" : ""}`}
                onClick={() => setCurrentView("agenda")}
              >
                Agenda
              </button>
            </div>

            {/* Filters */}
            <div className="calendar-filters-group">
              {/* Status Filter */}
              <select
                className="cal-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Status: All</option>
                <option value="PENDING">Status: Pending</option>
                <option value="COMPLETED">Status: Completed</option>
              </select>

              {/* Staff Assigned Filter */}
              <select
                className="cal-filter-select"
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
              >
                <option value="all">Assigned To: All</option>
                {staffUsers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    Assigned: {staff.full_name || staff.name || staff.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: "0.875rem 1.25rem",
              backgroundColor: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              color: "#991B1B",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Calendar View Card */}
        <div className="calendar-view-card">
          {loading ? (
            <div
              style={{
                padding: "4rem 2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
                color: "var(--text-secondary, #596067)",
              }}
            >
              <Loader2 size={32} className="animate-spin" color="var(--primary, #9E241D)" />
              <span>Loading scheduled tasks...</span>
            </div>
          ) : (
            <>
              {currentView === "month" && (
                <CalendarMonthView
                  currentDate={currentDate}
                  tasks={tasks}
                  onCellClick={handleCellClick}
                  onTaskClick={handleTaskClick}
                />
              )}

              {currentView === "week" && (
                <CalendarWeekView
                  currentDate={currentDate}
                  tasks={tasks}
                  onCellClick={handleCellClick}
                  onTaskClick={handleTaskClick}
                />
              )}

              {currentView === "day" && (
                <CalendarDayView
                  currentDate={currentDate}
                  tasks={tasks}
                  onCellClick={handleCellClick}
                  onTaskClick={handleTaskClick}
                  onStatusChange={handleQuickStatusChange}
                  canEdit={canEdit}
                  canCreate={canCreate}
                />
              )}

              {currentView === "agenda" && (
                <CalendarAgendaMobile
                  tasks={tasks}
                  onTaskClick={handleTaskClick}
                  onStatusChange={handleQuickStatusChange}
                  canEdit={canEdit}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Reused Task Details Modal */}
      {isDetailsOpen && selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedTask(null);
          }}
          onEdit={(t) => {
            setIsDetailsOpen(false);
            handleEditTask(t);
          }}
          onStatusChange={handleQuickStatusChange}
        />
      )}

      {/* Reused Task Form Modal */}
      {isFormOpen && (
        <TaskFormModal
          taskToEdit={editingTask}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTask(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingTask(null);
            triggerToast(
              editingTask ? "Task updated successfully." : "Task created successfully.",
              "success"
            );
            fetchCalendarTasks();
          }}
          clients={clients}
          leads={leads}
          staffUsers={staffUsers}
          initialDueDate={createInitialDueDate}
          initialDueTime={createInitialDueTime}
        />
      )}
    </AppLayout>
  );
};

export default Calendar;
