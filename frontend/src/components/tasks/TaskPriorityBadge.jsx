import React from "react";

export const TASK_PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const TaskPriorityBadge = ({ priority }) => {
  const cleanPriority = (priority || "MEDIUM").toUpperCase();
  const label = TASK_PRIORITY_LABELS[cleanPriority] || cleanPriority;

  let className = "priority-badge priority-medium";
  if (cleanPriority === "LOW") className = "priority-badge priority-low";
  if (cleanPriority === "HIGH") className = "priority-badge priority-high";

  return <span className={className}>{label}</span>;
};

export default TaskPriorityBadge;
