import React from "react";
import { Clock, Calendar as CalendarIcon, User, UserCheck, Users, CheckCircle2 } from "lucide-react";
import TaskStatusBadge from "../../../components/tasks/TaskStatusBadge";
import TaskPriorityBadge from "../../../components/tasks/TaskPriorityBadge";

const CalendarAgendaMobile = ({
  tasks = [],
  onTaskClick,
  onStatusChange,
  canEdit = true,
}) => {
  // Sort all tasks by due_date and due_time
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = a.due_date ? String(a.due_date).split("T")[0] : "";
    const dateB = b.due_date ? String(b.due_date).split("T")[0] : "";
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    const timeA = a.due_time || "";
    const timeB = b.due_time || "";
    return timeA.localeCompare(timeB);
  });

  // Group by due_date
  const grouped = {};
  sortedTasks.forEach((task) => {
    const dateKey = task.due_date ? String(task.due_date).split("T")[0] : "No Date";
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(task);
  });

  const dates = Object.keys(grouped);

  if (dates.length === 0) {
    return (
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
        <CalendarIcon size={36} color="#D0D0CB" />
        <p style={{ margin: 0, fontSize: "0.95rem" }}>No tasks found for this period.</p>
      </div>
    );
  }

  const formatHeaderDate = (dateStr) => {
    if (dateStr === "No Date") return "Unscheduled Tasks";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="agenda-container">
      {dates.map((dateStr) => {
        const dateTasks = grouped[dateStr];

        return (
          <div key={dateStr} className="agenda-day-group">
            <div className="agenda-day-title">
              <CalendarIcon size={15} />
              <span>{formatHeaderDate(dateStr)}</span>
            </div>

            {dateTasks.map((task) => {
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
                      <Clock size={13} color="var(--primary, #9E241D)" />
                      <span>{task.due_time ? task.due_time.substring(0, 5) : "All Day"}</span>
                    </div>

                    <div className="day-task-main">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                        <h4 className="day-task-title" style={{ fontSize: "0.95rem" }}>{task.title}</h4>
                        <TaskStatusBadge status={task.status} />
                        <TaskPriorityBadge priority={task.priority} />
                      </div>

                      <div className="day-task-meta">
                        {task.assigned_to_user && (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <User size={12} />
                            <span>
                              {task.assigned_to_user.full_name ||
                                task.assigned_to_user.name ||
                                task.assigned_to_user.email}
                            </span>
                          </span>
                        )}

                        {clientObj && (
                          <span className="related-badge client-badge">
                            <UserCheck size={11} />
                            <span>
                              {clientObj.full_name || clientObj.name || clientObj.business_name}
                            </span>
                          </span>
                        )}

                        {leadObj && (
                          <span className="related-badge lead-badge">
                            <Users size={11} />
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
                        padding: "0.3rem 0.6rem",
                        fontSize: "0.75rem",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(task.id, "COMPLETED");
                      }}
                    >
                      <CheckCircle2 size={13} />
                      <span>Complete</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default CalendarAgendaMobile;
