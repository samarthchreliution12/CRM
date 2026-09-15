import React from "react";

export const TASK_STATUS_LABELS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const TaskStatusBadge = ({ status }) => {
  const cleanStatus = (status || "PENDING").toUpperCase();
  const label = TASK_STATUS_LABELS[cleanStatus] || cleanStatus;

  let className = "status-badge status-pending";
  if (cleanStatus === "IN_PROGRESS") className = "status-badge status-in-progress";
  if (cleanStatus === "COMPLETED") className = "status-badge status-active status-completed";
  if (cleanStatus === "CANCELLED") className = "status-badge status-inactive status-cancelled";

  return <span className={className}>{label}</span>;
};

export default TaskStatusBadge;
