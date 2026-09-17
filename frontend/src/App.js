import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext";
import PublicRoute from "./routes/PublicRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

// Website Layout & Pages
import { WebsiteLayout } from "./components/website/layout/WebsiteLayout";
import Home from "./pages/website/Home/Home";
import About from "./pages/website/About/About";
import Services from "./pages/website/Services/Services";
import ServiceDetail from "./pages/website/Services/ServiceDetail";
import Contact from "./pages/website/Contact/Contact";
import NotFound from "./pages/website/NotFound/NotFound";

// CRM Auth Pages
import Login from "./pages/auth/Login/Login";
import Signup from "./pages/auth/Signup/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword/ResetPassword";

// CRM Protected Pages
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/profile/Profile";
import Clients from "./pages/clients/Clients";
import Leads from "./pages/leads/Leads";
import Tasks from "./pages/tasks/Tasks";
import Calendar from "./pages/calendar/Calendar";
import AddClient from "./pages/clients/AddClient";
import ClientDetails from "./pages/clients/ClientDetails";
import Documents from "./pages/documents/Documents";
import Communication from "./pages/communication/Communication";
import WhatsAppTemplates from "./pages/communication/WhatsAppTemplates";
import WhatsAppSettings from "./pages/communication/WhatsAppSettings";
import Settings from "./pages/settings/Settings";
import UserAccess from "./pages/settings/users/UserAccess";
import ClientTypes from "./pages/settings/clientConfiguration/ClientTypes";
import ClientServices from "./pages/settings/clientConfiguration/ClientServices";
import AuditLogs from "./pages/settings/auditLogs/AuditLogs";

import "./styles/global.css";

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          {/* Public Website Routes */}
          <Route
            path="/"
            element={
              <WebsiteLayout>
                <Home />
              </WebsiteLayout>
            }
          />
          <Route
            path="/about"
            element={
              <WebsiteLayout>
                <About />
              </WebsiteLayout>
            }
          />
          <Route
            path="/services"
            element={
              <WebsiteLayout>
                <Services />
              </WebsiteLayout>
            }
          />
          <Route
            path="/services/:slug"
            element={
              <WebsiteLayout>
                <ServiceDetail />
              </WebsiteLayout>
            }
          />
          <Route
            path="/contact"
            element={
              <WebsiteLayout>
                <Contact />
              </WebsiteLayout>
            }
          />

          {/* Public Authentication & CRM Login Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/crm"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/crm/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/admin/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/client/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />

          {/* Protected CRM Application Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads"
            element={
              <ProtectedRoute>
                <Leads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute requiredPermission={["task.view", "task.read"]}>
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/my"
            element={
              <ProtectedRoute requiredPermission={["task.view", "task.read"]}>
                <Tasks isMyTasksMode={true} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/create"
            element={
              <ProtectedRoute requiredPermission={["task.create", "task.add"]}>
                <Tasks autoOpenCreate={true} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute requiredPermission={["task.view", "task.read"]}>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute requiredPermission={["client.view", "client.read"]}>
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/add"
            element={
              <ProtectedRoute requiredPermission={["client.create", "client.add"]}>
                <AddClient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:id"
            element={
              <ProtectedRoute requiredPermission={["client.view", "client.read"]}>
                <ClientDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:id/edit"
            element={
              <ProtectedRoute requiredPermission={["client.edit", "client.create"]}>
                <AddClient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute requiredPermission={["document.view", "document.read"]}>
                <Documents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/communication"
            element={
              <ProtectedRoute>
                <Communication />
              </ProtectedRoute>
            }
          />
          <Route
            path="/communication/whatsapp-templates"
            element={
              <ProtectedRoute>
                <WhatsAppTemplates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/communication/whatsapp-settings"
            element={
              <ProtectedRoute>
                <WhatsAppSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <Settings />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/users"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <UserAccess />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/client-configuration/types"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <ClientTypes />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/client-configuration/services"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <ClientServices />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/audit-logs"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AuditLogs />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          {/* Client Portal Route Shell (Placeholder for future client portal expansion) */}
          <Route
            path="/client/*"
            element={
              <WebsiteLayout>
                <NotFound />
              </WebsiteLayout>
            }
          />

          {/* Website Fallback 404 Route */}
          <Route
            path="*"
            element={
              <WebsiteLayout>
                <NotFound />
              </WebsiteLayout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </HelmetProvider>
  );
}

export default App;
