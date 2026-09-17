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
const communicationRoutes = require("./routes/communication.routes");
const groupRoutes = require("./routes/group.routes");
const adminAuditLogRoutes = require("./routes/adminAuditLog.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const sitemapRoutes = require("./routes/sitemap.routes");
const helmet = require("helmet");
const errorHandler = require("./middleware/error.middleware");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false, // Disable default CSP to allow React app styles & inline assets during development
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

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
      if (!origin) return callback(null, true);
      
      const cleanOrigin = origin.replace(/\/$/, "");
      const isAllowed =
        allowedOrigins.some((o) => o && o.replace(/\/$/, "") === cleanOrigin) ||
        /\.vercel\.app$/.test(cleanOrigin) ||
        cleanOrigin.includes("localhost") ||
        cleanOrigin.includes("127.0.0.1");

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Dynamic XML Sitemap Endpoint
app.use("/", sitemapRoutes);

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CRM API is running",
  });
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// Group Management Routes
app.use("/api/roles/groups", groupRoutes);
app.use("/api/admin/roles/groups", groupRoutes);

// Staff & Admin Management Routes
app.use("/api/staff", adminStaffRoutes);
app.use("/api/admin/staff", adminStaffRoutes);
app.use("/api/admin/permissions", permissionRoutes);
app.use("/api/admin/roles", rolePermissionRoutes);
app.use("/api/admin/client-types", adminClientTypeRoutes);
app.use("/api/admin/client-services", adminClientServiceRoutes);
app.use("/api/admin/documents", adminDocumentRoutes);
app.use("/api/admin/audit-logs", adminAuditLogRoutes);

// Client Module Routes
app.use("/api/clients", clientRoutes);
app.use("/api/client-types", clientTypeRoutes);
app.use("/api/client-services", clientServiceRoutes);
app.use("/api/clients/:clientId/documents", documentRoutes);

// WhatsApp Module Routes
app.use("/api/whatsapp", whatsappRoutes);

// Leads Module Routes
const leadRoutes = require("./routes/lead.routes");
app.use("/api/leads", leadRoutes);

// Internal Communication Routes
app.use("/api/communication", communicationRoutes);

// Dashboard Routes
app.use("/api/dashboard", dashboardRoutes);

// Tasks Module Routes
const taskRoutes = require("./routes/task.routes");
app.use("/api/tasks", taskRoutes);
app.use("/api/task", taskRoutes);

// Static file serving for pre-rendered frontend public pages & assets
const fs = require("fs");
const path = require("path");
const frontendBuildPath = path.join(__dirname, "../../frontend/build");

if (fs.existsSync(frontendBuildPath)) {
  // 1. Intercept GET HTML page requests and serve exact SSG pre-rendered index.html files
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api/")) return next();

    const ext = path.extname(req.path);
    // If request has non-HTML asset extension (.js, .css, .png, etc.), defer to express.static
    if (ext && ext !== ".html") return next();

    const cleanPath = req.path.replace(/\/$/, "");
    const possibleHtmlFile = cleanPath === ""
      ? path.join(frontendBuildPath, "index.html")
      : path.join(frontendBuildPath, cleanPath, "index.html");

    if (fs.existsSync(possibleHtmlFile) && fs.statSync(possibleHtmlFile).isFile()) {
      return res.sendFile(possibleHtmlFile);
    }

    // SPA fallback for dynamic CRM routes
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });

  // 2. Serve static assets (.js, .css, images, fonts)
  app.use(express.static(frontendBuildPath));
}

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;