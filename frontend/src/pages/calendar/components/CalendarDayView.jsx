import React from "react";
import { Clock, User, UserCheck, Users, CheckCircle2, Calendar as CalendarIcon, Plus } from "lucide-react";
import TaskStatusBadge from "../../../components/tasks/TaskStatusBadge";
import TaskPriorityBadge from "../../../components/tasks/TaskPriorityBadge";

const CalendarDayView = ({
  currentDate,
  tasks = [],
  onCellClick,
  onTaskClick,
  onStatusChange,
  canEdit = true,
  canCreate = true,
}) => {
  const formatDateKey = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const currentDateStr = formatDateKey(currentDate);

  // Filter tasks for selected day
  const dayTasks = tasks
    .filter((t) => t.due_date && String(t.due_date).split("T")[0] === currentDateStr)
    .sort((a, b) => {
      if (!a.due_time) return 1;
      if (!b.due_time) return -1;
      return a.due_time.localeCompare(b.due_time);
    });

  const formattedDayTitle = currentDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="day-view-card-list">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "0.75rem",
          borderBottom: "1px solid var(--border, #E2E2DF)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CalendarIcon size={18} color="var(--primary, #9E241D)" />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary, #25282A)", margin: 0 }}>
            {formattedDayTitle}
          </h2>
        </div>

        {canCreate && (
          <button
            type="button"
            className="btn-cal-nav btn-cal-today"
            onClick={() => onCellClick && onCellClick(currentDateStr, "10:00")}
          >
            <Plus size={14} />
            <span>Add Task for Day</span>
          </button>
        )}
      </div>

      {dayTasks.length === 0 ? (
        <div
          style={{
            padding: "3rem 1.5rem",
            textAlign: "center",
            color: "var(--text-muted, #858B90)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <CalendarIcon size={40} color="#D0D0CB" />
          <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 500 }}>
            No tasks scheduled for {formattedDayTitle}.
          </p>
          {canCreate && (
            <button
              type="button"
              className="btn-cal-nav"
              onClick={() => onCellClick && onCellClick(currentDateStr, "10:00")}
              style={{ marginTop: "0.5rem" }}
            >
              <Plus size={14} />
              <span>Schedule a Task</span>
            </button>
          )}
        </div>
      ) : (
        dayTasks.map((task) => {
          const clientObj = task.client || task.related_client;
          const leadObj = task.lead || task.related_lead;
          const isCompleted = task.status === "COMPLETED";

          return (
            <div
              key={task.id}
              className="day-task-card"
              style={{
                borderLeftColor:
                  task.priority === "HIGH"
                    ? "#d97706"
                    : task.priority === "LOW"
                    ? "#2563eb"
                    : "var(--primary, #9E241D)",
              }}
              onClick={() => onTaskClick && onTaskClick(task)}
            >
              <div className="day-task-left">
                <div className="day-task-time-badge">
                  <Clock size={14} color="var(--primary, #9E241D)" />
                  <span>{task.due_time ? task.due_time.substring(0, 5) : "All Day"}</span>
                </div>

                <div className="day-task-main">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h3 className="day-task-title">{task.title}</h3>
                    <TaskStatusBadge status={task.status} />
                    <TaskPriorityBadge priority={task.priority} />
                  </div>

                  {task.description && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.85rem",
                        color: "var(--text-secondary, #596067)",
                        lineHeight: 1.4,
                      }}
                    >
                      {task.description}
                    </p>
                  )}

                  <div className="day-task-meta">
                    {task.assigned_to_user && (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <User size={13} />
                        <span>
                          {task.assigned_to_user.full_name ||
                            task.assigned_to_user.name ||
                            task.assigned_to_user.email}
                        </span>
                      </span>
                    )}

                    {clientObj && (
                      <span className="related-badge client-badge">
                        <UserCheck size={12} />
                        <span>
                          {clientObj.full_name || clientObj.name || clientObj.business_name}
                        </span>
                      </span>
                    )}

                    {leadObj && (
                      <span className="related-badge lead-badge">
                        <Users size={12} />
                        <span>
                          {leadObj.full_name || leadObj.name || leadObj.company_name}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {canEdit && !isCompleted && onStatusChange && (
                <button
                  type="button"
                  className="btn-cal-nav"
                  style={{
                    backgroundColor: "#f0fdf4",
                    color: "#16a34a",
                    borderColor: "#bbf7d0",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, "COMPLETED");
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>Complete</span>
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default CalendarDayView;
