import React from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CalendarMonthView = ({ currentDate, tasks = [], onCellClick, onTaskClick }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month
  const firstDayOfMonth = new Date(year, month, 1);
  // Day of week for 1st of month (0 = Sun, 6 = Sat)
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Start date of grid (previous month padding days)
  const gridStartDate = new Date(year, month, 1 - startingDayOfWeek);

  // Total grid cells (6 rows * 7 days = 42 cells)
  const gridCells = [];
  const curr = new Date(gridStartDate);

  for (let i = 0; i < 42; i++) {
    gridCells.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }

  // Format today string YYYY-MM-DD
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

  // Helper to format date object to YYYY-MM-DD
  const formatDateKey = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Group tasks by due_date
  const tasksByDate = {};
  tasks.forEach((task) => {
    if (task.due_date) {
      const dateKey = String(task.due_date).split("T")[0];
      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = [];
      }
      tasksByDate[dateKey].push(task);
    }
  });

  return (
    <div className="month-view-grid">
      {/* Weekday Headers */}
      {WEEKDAYS.map((day) => (
        <div key={day} className="month-weekday-header">
          {day}
        </div>
      ))}

      {/* Grid Cells */}
      {gridCells.map((cellDate, idx) => {
        const dateStr = formatDateKey(cellDate);
        const isCurrentMonth = cellDate.getMonth() === month;
        const isToday = dateStr === todayStr;
        const cellTasks = tasksByDate[dateStr] || [];

        // Limit displayed tasks to 3 per cell
        const visibleTasks = cellTasks.slice(0, 3);
        const overflowCount = cellTasks.length - 3;

        return (
          <div
            key={idx}
            className={`month-day-cell ${!isCurrentMonth ? "other-month" : ""} ${
              isToday ? "today-cell" : ""
            }`}
            onClick={(e) => {
              // Click cell to create task
              if (onCellClick) {
                onCellClick(dateStr);
              }
            }}
          >
            <div className="month-day-header">
              <span className="month-day-number">{cellDate.getDate()}</span>
            </div>

            <div className="month-day-tasks">
              {visibleTasks.map((task) => (
                <div
                  key={task.id}
                  className={`cal-task-chip priority-${task.priority || "MEDIUM"} status-${
                    task.status || "PENDING"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTaskClick) onTaskClick(task);
                  }}
                  title={`${task.due_time ? task.due_time + " - " : ""}${task.title}`}
                >
                  {task.due_time && (
                    <span className="cal-task-time">
                      {task.due_time.substring(0, 5)}
                    </span>
                  )}
                  <span className="cal-task-title">{task.title}</span>
                </div>
              ))}

              {overflowCount > 0 && (
                <div
                  className="cal-more-chip"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCellClick) onCellClick(dateStr);
                  }}
                >
                  +{overflowCount} more
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarMonthView;
