require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5050;

const server = app.listen(PORT, () => {
  console.log(`CRM Backend API running on port ${PORT}`);
});

// Handle unhandled promise rejections gracefully without crashing
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
});

// Handle uncaught exceptions gracefully without crashing
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});