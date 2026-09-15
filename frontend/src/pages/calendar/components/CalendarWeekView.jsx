import React from "react";

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CalendarWeekView = ({ currentDate, tasks = [], onCellClick, onTaskClick }) => {
  // Compute start of week (Sunday)
  const curr = new Date(currentDate);
  const dayOfWeek = curr.getDay();
  const startOfWeek = new Date(curr);
  startOfWeek.setDate(curr.getDate() - dayOfWeek);

  // 7 days of the week
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDays.push(d);
  }

  // Today date string
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

  const formatDateKey = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Group tasks by date and hour
  // tasksMap[dateStr][hourStr] = [tasks]
  const tasksMap = {};
  const untimedTasksMap = {};

  tasks.forEach((task) => {
    if (!task.due_date) return;
    const dateKey = String(task.due_date).split("T")[0];

    if (task.due_time) {
      const hourKey = task.due_time.substring(0, 2) + ":00";
      if (!tasksMap[dateKey]) tasksMap[dateKey] = {};
      if (!tasksMap[dateKey][hourKey]) tasksMap[dateKey][hourKey] = [];
      tasksMap[dateKey][hourKey].push(task);
    } else {
      if (!untimedTasksMap[dateKey]) untimedTasksMap[dateKey] = [];
      untimedTasksMap[dateKey].push(task);
    }
  });

  return (
    <div className="time-grid-container">
      {/* Header Row */}
      <div className="time-grid-header">
        <div className="time-grid-time-col-header">Time</div>
        {weekDays.map((dayObj, idx) => {
          const dateStr = formatDateKey(dayObj);
          const isToday = dateStr === todayStr;
          return (
            <div
              key={idx}
              className={`time-grid-day-col-header ${isToday ? "is-today" : ""}`}
            >
              <span className="time-grid-day-name">
                {WEEKDAY_NAMES[dayObj.getDay()]}
              </span>
              <span className="time-grid-day-date">{dayObj.getDate()}</span>
            </div>
          );
        })}
      </div>

      {/* Untimed / All Day Row */}
      <div className="time-grid-row" style={{ minHeight: "42px", backgroundColor: "#FAF9F8" }}>
        <div className="time-grid-time-label" style={{ fontSize: "0.7rem" }}>All Day</div>
        {weekDays.map((dayObj, idx) => {
          const dateStr = formatDateKey(dayObj);
          const untimed = untimedTasksMap[dateStr] || [];
          return (
            <div
              key={idx}
              className="time-grid-slot"
              onClick={() => onCellClick && onCellClick(dateStr, "10:00")}
            >
              {untimed.map((task) => (
                <div
                  key={task.id}
                  className={`cal-task-chip priority-${task.priority || "MEDIUM"} status-${
                    task.status || "PENDING"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTaskClick) onTaskClick(task);
                  }}
                >
                  <span className="cal-task-title">{task.title}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Hourly Slots */}
      <div className="time-grid-body">
        {HOURS.map((hour) => (
          <div key={hour} className="time-grid-row">
            <div className="time-grid-time-label">{hour}</div>
            {weekDays.map((dayObj, idx) => {
              const dateStr = formatDateKey(dayObj);
              const hourSlotTasks = tasksMap[dateStr]?.[hour] || [];

              return (
                <div
                  key={idx}
                  className="time-grid-slot"
                  onClick={() => onCellClick && onCellClick(dateStr, hour)}
                >
                  {hourSlotTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`cal-task-chip priority-${task.priority || "MEDIUM"} status-${
                        task.status || "PENDING"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onTaskClick) onTaskClick(task);
                      }}
                      title={`${task.due_time || ""} - ${task.title}`}
                    >
                      {task.due_time && (
                        <span className="cal-task-time">
                          {task.due_time.substring(0, 5)}
                        </span>
                      )}
                      <span className="cal-task-title">{task.title}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarWeekView;
