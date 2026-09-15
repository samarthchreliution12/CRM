import React from "react";
import { Link } from "react-router-dom";
import { X, Calendar, User, Bell, CheckSquare, Edit, UserCheck, Users, CheckCircle2 } from "lucide-react";
import TaskStatusBadge from "./TaskStatusBadge";
import TaskPriorityBadge from "./TaskPriorityBadge";

export const TASK_TYPE_LABELS = {
  CALL: "Call",
  MEETING: "Meeting",
  EMAIL: "Email",
  FOLLOW_UP: "Follow Up",
  DOCUMENTATION: "Documentation",
  OTHER: "Other",
};

export const TASK_REMINDER_LABELS = {
  NONE: "None",
  "15_MIN": "15 Minutes Before",
  "30_MIN": "30 Minutes Before",
  "1_HOUR": "1 Hour Before",
  "1_DAY": "1 Day Before",
};

const TaskDetailsModal = ({ task, isOpen = true, onClose, onEdit, onStatusChange }) => {
  if (!isOpen || !task) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
    } catch (e) {
      return dateStr;
    }
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "N/A";
    try {
      const d = new Date(dateTimeStr);
      if (isNaN(d.getTime())) return dateTimeStr;
      return d.toLocaleString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateTimeStr;
    }
  };

  const clientObj = task.client || task.related_client;
  const leadObj = task.lead || task.related_lead;
  const isCompleted = task.status === "COMPLETED";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: "600px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckSquare size={20} color="var(--primary, #9E241D)" />
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary, #25282A)" }}>
              Task Details
            </h3>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Header Info Card */}
          <div
            style={{
              padding: "1rem 1.25rem",
              backgroundColor: "#FAF9F8",
              borderRadius: "8px",
              border: "1px solid var(--border, #E2E2DF)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary, #25282A)", margin: 0, lineHeight: 1.3 }}>
                {task.title}
              </h2>
              <TaskStatusBadge status={task.status} />
            </div>

            {task.description && (
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary, #596067)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {task.description}
              </p>
            )}
          </div>

          {/* Key Attributes Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {/* Type */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary, #596067)", textTransform: "uppercase" }}>
                Task Type
              </span>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary, #25282A)" }}>
                {TASK_TYPE_LABELS[task.task_type] || task.task_type || "N/A"}
              </span>
            </div>

            {/* Priority */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary, #596067)", textTransform: "uppercase" }}>
                Priority
              </span>
              <div>
                <TaskPriorityBadge priority={task.priority} />
              </div>
            </div>

            {/* Assigned To */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary, #596067)", textTransform: "uppercase" }}>
                Assigned To
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.9rem", fontWeight: 600 }}>
                <User size={15} color="var(--text-muted, #858B90)" />
                <span>
                  {task.assigned_to_user
                    ? task.assigned_to_user.full_name || task.assigned_to_user.name || task.assigned_to_user.email
                    : "Unassigned"}
                </span>
              </div>
            </div>

            {/* Related To */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary, #596067)", textTransform: "uppercase" }}>
                Related To
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.9rem", fontWeight: 600 }}>
                {clientObj ? (
                  clientObj.id ? (
                    <Link
                      to={`/clients/${clientObj.id}`}
                      className="related-badge client-badge"
                      style={{ textDecoration: "none" }}
                      onClick={onClose}
                    >
                      <UserCheck size={13} />
                      <span>{clientObj.full_name || clientObj.name || clientObj.business_name}</span>
                    </Link>
                  ) : (
                    <span className="related-badge client-badge">
                      <UserCheck size={13} />
                      <span>{clientObj.full_name || clientObj.name || clientObj.business_name}</span>
                    </span>
                  )
                ) : leadObj ? (
                  <Link
                    to="/leads"
                    className="related-badge lead-badge"
                    style={{ textDecoration: "none" }}
                    onClick={onClose}
                  >
                    <Users size={13} />
                    <span>{leadObj.full_name || leadObj.name || leadObj.company_name}</span>
                  </Link>
                ) : (
                  <span style={{ color: "var(--text-muted, #858B90)" }}>None</span>
                )}
              </div>
            </div>

            {/* Due Date & Time */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary, #596067)", textTransform: "uppercase" }}>
                Due Date & Time
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.9rem", fontWeight: 600 }}>
                <Calendar size={15} color="var(--text-muted, #858B90)" />
                <span>
                  {formatDate(task.due_date)} {task.due_time ? `@ ${task.due_time}` : ""}
                </span>
              </div>
            </div>

            {/* Reminder */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary, #596067)", textTransform: "uppercase" }}>
                Reminder
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.9rem", fontWeight: 600 }}>
                <Bell size={15} color="var(--text-muted, #858B90)" />
                <span>{TASK_REMINDER_LABELS[task.reminder] || task.reminder || "None"}</span>
              </div>
            </div>
          </div>

          {/* Audit Metadata */}
          <div
            style={{
              marginTop: "0.5rem",
              paddingTop: "0.875rem",
              borderTop: "1px solid var(--border, #E2E2DF)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              fontSize: "0.775rem",
              color: "var(--text-secondary, #596067)",
            }}
          >
            <div>
              <strong>Created By:</strong>{" "}
              {task.creator
                ? task.creator.full_name || task.creator.name || task.creator.email
                : `User #${task.created_by || "System"}`}
            </div>
            <div>
              <strong>Created At:</strong> {formatDateTime(task.created_at)}
            </div>
            {task.completed_at && (
              <div style={{ gridColumn: "span 2", color: "#16a34a", fontWeight: 600 }}>
                <strong>Completed At:</strong> {formatDateTime(task.completed_at)}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {onStatusChange && !isCompleted && (
            <button
              type="button"
              className="btn-status-toggle"
              onClick={() => {
                onStatusChange(task.id, "COMPLETED");
                onClose();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.5rem 1rem",
                fontSize: "0.85rem",
                backgroundColor: "#16a34a",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                cursor: "pointer",
                marginRight: "auto",
              }}
            >
              <CheckCircle2 size={15} />
              <span>Mark Completed</span>
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              className="btn-add-task"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.5rem 1rem",
                fontSize: "0.85rem",
              }}
            >
              <Edit size={14} />
              <span>Edit Task</span>
            </button>
          )}
          <button type="button" className="btn-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
