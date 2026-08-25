import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";
import "./AppLayout.css";

const AppLayout = ({ children, title = "Dashboard" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout-container">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? "active" : ""}`}
        onClick={closeSidebar}
      />

      <Header title={title} onToggleSidebar={toggleSidebar} />

      <main className="app-main-content">{children}</main>
    </div>
  );
};

export default AppLayout;
