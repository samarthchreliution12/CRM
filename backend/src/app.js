const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

dotenv.config();

const authRoutes = require("./routes/auth.routes");
const adminStaffRoutes = require("./routes/adminStaff.routes");
const permissionRoutes = require("./routes/permission.routes");
const rolePermissionRoutes = require("./routes/rolePermission.routes");
const clientRoutes = require("./routes/client.routes");
const clientTypeRoutes = require("./routes/clientType.routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CRM API is running",
  });
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// Admin Staff Management Routes
app.use("/api/admin/staff", adminStaffRoutes);

// Admin Permission & Role-Permission Routes
app.use("/api/admin/permissions", permissionRoutes);
app.use("/api/admin/roles", rolePermissionRoutes);

// Client Module Routes
app.use("/api/clients", clientRoutes);
app.use("/api/client-types", clientTypeRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;