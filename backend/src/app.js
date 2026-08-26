const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

dotenv.config();

const authRoutes = require("./routes/auth.routes");
const adminStaffRoutes = require("./routes/adminStaff.routes");
const permissionRoutes = require("./routes/permission.routes");
const rolePermissionRoutes = require("./routes/rolePermission.routes");
const adminClientTypeRoutes = require("./routes/adminClientType.routes");
const adminClientServiceRoutes = require("./routes/adminClientService.routes");
const clientRoutes = require("./routes/client.routes");
const clientTypeRoutes = require("./routes/clientType.routes");
const clientServiceRoutes = require("./routes/clientService.routes");
const whatsappRoutes = require("./routes/whatsapp.routes");
const documentRoutes = require("./routes/document.routes");
const adminDocumentRoutes = require("./routes/adminDocument.routes");
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

// Admin Management Routes
app.use("/api/admin/staff", adminStaffRoutes);
app.use("/api/admin/permissions", permissionRoutes);
app.use("/api/admin/roles", rolePermissionRoutes);
app.use("/api/admin/client-types", adminClientTypeRoutes);
app.use("/api/admin/client-services", adminClientServiceRoutes);
app.use("/api/admin/documents", adminDocumentRoutes);

// Client Module Routes
app.use("/api/clients", clientRoutes);
app.use("/api/client-types", clientTypeRoutes);
app.use("/api/client-services", clientServiceRoutes);
app.use("/api/clients/:clientId/documents", documentRoutes);

// WhatsApp Module Routes
app.use("/api/whatsapp", whatsappRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;