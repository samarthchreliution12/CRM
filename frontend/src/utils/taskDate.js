// Use calendar dates in local time, avoiding UTC shifts around midnight.
export const formatTaskDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const isPastTaskDate = (date) => date < formatTaskDate();
