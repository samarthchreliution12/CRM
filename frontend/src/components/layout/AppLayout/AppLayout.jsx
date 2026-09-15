import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";
import InternalChat from "../InternalChat/InternalChat";
import "./AppLayout.css";

const AppLayout = ({ children, title = "Dashboard" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("crm_sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("crm_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className={`app-layout-container ${isCollapsed ? "sidebar-is-collapsed" : ""}`}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? "active" : ""}`}
        onClick={closeSidebar}
      />

      <Header title={title} onToggleSidebar={toggleSidebar} />

      <main className="app-main-content">{children}</main>

      {/* Global Internal Communication Chat Widget */}
      <InternalChat />
    </div>
  );
};

export default AppLayout;
