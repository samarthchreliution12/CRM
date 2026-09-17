import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import DashboardService from "../../services/dashboard.service";
import TaskService from "../../services/task.service";
import { PhoneCall, ArrowRight, Calendar, User, UserCheck, AlertCircle, Clock } from "lucide-react";
import "./PendingFollowupsCard.css";

const priorityRank = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const capitalizeWords = (str) => {
  if (!str) return "";
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const getCategoryRank = (dueDateStr) => {
  if (!dueDateStr) return 4;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
  if (diffDays < 0) return 1; // Overdue
  if (diffDays === 0) return 2; // Due Today
  return 3; // Upcoming
};

const formatDueDateTime = (dueDateStr, dueTimeStr) => {
  if (!dueDateStr) return "No Due Date";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  let timeFormatted = "";
  if (dueTimeStr) {
    try {
      const [h, m] = dueTimeStr.split(":");
      const dateObj = new Date();
      dateObj.setHours(parseInt(h, 10), parseInt(m, 10));
      timeFormatted = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch (e) {
      timeFormatted = dueTimeStr;
    }
  }

  let dateLabel = "";
  if (diffDays < 0) {
    const formatted = due.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    dateLabel = `Overdue (${formatted})`;
  } else if (diffDays === 0) {
    dateLabel = "Today";
  } else if (diffDays === 1) {
    dateLabel = "Tomorrow";
  } else {
    dateLabel = due.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  return timeFormatted ? `Due: ${dateLabel}, ${timeFormatted}` : `Due: ${dateLabel}`;
};

const PendingFollowupsCard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const isAdmin = user?.role?.name === "Admin" || user?.role === "Admin" || user?.role_name === "Admin";
  const canViewTasks = isAdmin || permissions.includes("task.view") || permissions.includes("task.read") || permissions.includes("client.view");

  const [followupTasks, setFollowupTasks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPendingFollowups = useCallback(async () => {
    if (!token || !canViewTasks) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      let tasksData = [];
      let total = 0;

      try {
        const response = await DashboardService.getPendingFollowups(token);
        if (response && response.success && response.data) {
          tasksData = response.data.tasks || [];
          total = response.data.total ?? tasksData.length;
        }
      } catch (dashErr) {
        // Fallback to TaskService.getTasks if dashboard specific endpoint is not available
        const res = await TaskService.getTasks({ limit: 100 }, token);
        if (res && res.data) {
          const allTasks = res.data.tasks || (Array.isArray(res.data) ? res.data : []);
          tasksData = allTasks.filter((t) => {
            const hasClient = Boolean(t.related_client_id || t.client || t.related_client);
            const isLead = Boolean(t.related_lead_id || t.lead || t.related_lead);
            const isPendingStatus = t.status === "PENDING" || t.status === "IN_PROGRESS";
            return hasClient && !isLead && isPendingStatus;
          });
          total = tasksData.length;
        }
      }

      // Client-side sorting verification: Overdue -> Today -> Upcoming, then High -> Medium -> Low
      tasksData.sort((a, b) => {
        const catA = getCategoryRank(a.due_date);
        const catB = getCategoryRank(b.due_date);
        if (catA !== catB) return catA - catB;

        const prioA = priorityRank[a.priority?.toUpperCase()] || 0;
        const prioB = priorityRank[b.priority?.toUpperCase()] || 0;
        if (prioA !== prioB) return prioB - prioA;

        if (a.due_date && b.due_date) {
          return new Date(a.due_date) - new Date(b.due_date);
        }
        return 0;
      });

      setTotalCount(total);
      setFollowupTasks(tasksData.slice(0, 5));
    } catch (err) {
      if (err.statusCode === 403) {
        setError("Permission denied: You do not have permission to view pending follow-ups.");
      } else {
        setError("Unable to load pending client follow-ups.");
      }
    } finally {
      setLoading(false);
    }
  }, [token, canViewTasks]);

  useEffect(() => {
    fetchPendingFollowups();
  }, [fetchPendingFollowups]);

  if (!canViewTasks) {
    return null;
  }

  const getClientName = (task) => {
    const c = task.client || task.related_client;
    if (c) {
      return capitalizeWords(c.full_name || c.name || c.business_name || `Client #${c.id}`);
    }
    if (task.related_client_name) return capitalizeWords(task.related_client_name);
    return `Client #${task.related_client_id}`;
  };

  const getClientId = (task) => {
    const c = task.client || task.related_client;
    return c?.id || task.related_client_id;
  };

  const getStaffName = (task) => {
    const staff = task.assigned_user || task.assignedTo || task.assigned_to_user;
    if (staff) {
      return capitalizeWords(staff.full_name || staff.name || staff.email || `Staff #${staff.id}`);
    }
    if (task.assigned_to_name) return capitalizeWords(task.assigned_to_name);
    return "Unassigned";
  };

  return (
    <div className="pending-followups-card">
      {/* Header */}
      <div className="pending-followups-header">
        <div className="pending-followups-title-group">
          <div className="pending-followups-icon-wrapper">
            <PhoneCall size={18} />
          </div>
          <h3 className="pending-followups-title">Clients with Pending Follow-ups</h3>
          {!loading && !error && (
            <span className="pending-followups-count-badge">{totalCount}</span>
          )}
        </div>

        <button
          type="button"
          className="pending-followups-view-all"
          onClick={() => navigate("/tasks")}
        >
          <span>View All</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Body Content */}
      <div className="pending-followups-body">
        {error ? (
          <div className="pending-followups-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : loading ? (
          <div className="pending-followups-skeleton-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="followup-row followup-row-skeleton">
                <div className="skeleton-box" style={{ width: "25%", height: 16 }} />
                <div className="skeleton-box" style={{ width: "35%", height: 16 }} />
                <div className="skeleton-box" style={{ width: "15%", height: 16 }} />
                <div className="skeleton-box" style={{ width: "15%", height: 16 }} />
              </div>
            ))}
          </div>
        ) : followupTasks.length === 0 ? (
          <div className="pending-followups-empty-state">
            <Clock size={32} className="empty-icon" />
            <h4 className="empty-title">No pending client follow-ups</h4>
            <p className="empty-subtitle">All client follow-ups are up to date.</p>
          </div>
        ) : (
          <div className="pending-followups-list">
            {followupTasks.map((task) => {
              const clientId = getClientId(task);
              const clientName = getClientName(task);
              const staffName = getStaffName(task);
              const dueFormatted = formatDueDateTime(task.due_date, task.due_time);
              const isOverdue = dueFormatted.includes("Overdue");
              const isToday = dueFormatted.includes("Today");

              let dueBadgeClass = "due-normal";
              if (isOverdue) dueBadgeClass = "due-overdue";
              else if (isToday) dueBadgeClass = "due-today";

              const priorityUpper = (task.priority || "MEDIUM").toUpperCase();
              let priorityClass = "priority-medium";
              if (priorityUpper === "HIGH") priorityClass = "priority-high";
              else if (priorityUpper === "LOW") priorityClass = "priority-low";

              const statusUpper = (task.status || "PENDING").toUpperCase();
              let statusClass = "status-pending";
              if (statusUpper === "IN_PROGRESS") statusClass = "status-in-progress";

              return (
                <div key={task.id} className="followup-row">
                  {/* Column 1: Client Name */}
                  <div className="followup-col followup-client-col">
                    <UserCheck size={14} className="col-icon client-icon" />
                    <button
                      type="button"
                      className="client-link-btn"
                      onClick={() => clientId && navigate(`/clients/${clientId}`)}
                      title={`View ${clientName}'s profile`}
                    >
                      {clientName}
                    </button>
                  </div>

                  {/* Column 2: Task Title */}
                  <div className="followup-col followup-task-col">
                    <button
                      type="button"
                      className="task-title-btn"
                      onClick={() => navigate(`/tasks?taskId=${task.id}`)}
                      title={`View task details`}
                    >
                      {task.title}
                    </button>
                  </div>

                  {/* Column 3: Assigned Staff */}
                  <div className="followup-col followup-staff-col">
                    <User size={13} className="col-icon staff-icon" />
                    <span className="staff-text">Assigned to: {staffName}</span>
                  </div>

                  {/* Column 4: Due Date & Time */}
                  <div className="followup-col followup-due-col">
                    <span className={`due-badge ${dueBadgeClass}`}>
                      <Calendar size={12} />
                      <span>{dueFormatted}</span>
                    </span>
                  </div>

                  {/* Column 5: Priority & Status Badges */}
                  <div className="followup-col followup-badges-col">
                    <span className={`priority-pill ${priorityClass}`}>
                      {priorityUpper}
                    </span>
                    <span className={`status-pill ${statusClass}`}>
                      {statusUpper === "IN_PROGRESS" ? "In Progress" : "Pending"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingFollowupsCard;
