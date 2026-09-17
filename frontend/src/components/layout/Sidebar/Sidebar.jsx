import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronRight,
  UserPlus,
  List,
  CheckSquare,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";
import headerLogo from "../../../assets/website/logo/header-logo.png";
import useAuth from "../../../hooks/useAuth";
import "./Sidebar.css";

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const { user } = useAuth();
  const flyoutWrapperRef = useRef(null);
  const leaveTimerRef = useRef(null);

  const isAdmin = user?.role?.name === "Admin";
  const permissions = user?.permissions || [];

  // Dynamic permission checks
  const canAccessClientList =
    isAdmin || permissions.includes("client.view") || permissions.includes("client.read");
  const canAccessAddClient =
    isAdmin || permissions.includes("client.create") || permissions.includes("client.add");
  const canAccessDocuments =
    isAdmin || permissions.includes("document.view") || permissions.includes("document.read");
  const canAccessClientsParent =
    isAdmin || canAccessClientList || canAccessAddClient || canAccessDocuments;
  const canAccessTasks =
    isAdmin || permissions.includes("task.view") || permissions.includes("task.read");
  const canCreateTask =
    isAdmin || permissions.includes("task.create") || permissions.includes("task.add");

  // Check if current route belongs to Clients group
  const isClientGroupActive =
    location.pathname.startsWith("/clients") || location.pathname === "/documents";

  // Check if current route belongs to Tasks group
  const isTaskGroupActive = location.pathname.startsWith("/tasks");

  // Check if current route belongs to Communication group
  const isCommunicationGroupActive = location.pathname.startsWith("/communication");

  const [isClientsExpanded, setIsClientsExpanded] = useState(() => isClientGroupActive);
  const [showClientsFlyout, setShowClientsFlyout] = useState(false);

  const [isTasksExpanded, setIsTasksExpanded] = useState(() => isTaskGroupActive);
  const [showTasksFlyout, setShowTasksFlyout] = useState(false);

  const [isCommunicationExpanded, setIsCommunicationExpanded] = useState(() => isCommunicationGroupActive);
  const [showCommunicationFlyout, setShowCommunicationFlyout] = useState(false);

  const tasksFlyoutWrapperRef = useRef(null);
  const tasksLeaveTimerRef = useRef(null);

  const communicationFlyoutWrapperRef = useRef(null);
  const communicationLeaveTimerRef = useRef(null);

  // Auto-expand Clients menu when navigating to any Client group route
  useEffect(() => {
    if (isClientGroupActive && canAccessClientsParent) {
      setIsClientsExpanded(true);
    }
  }, [location.pathname, isClientGroupActive, canAccessClientsParent]);

  // Auto-expand Tasks menu when navigating to any Task group route
  useEffect(() => {
    if (isTaskGroupActive && canAccessTasks) {
      setIsTasksExpanded(true);
    }
  }, [location.pathname, isTaskGroupActive, canAccessTasks]);

  // Auto-expand Communication menu when navigating to any Communication group route
  useEffect(() => {
    if (isCommunicationGroupActive) {
      setIsCommunicationExpanded(true);
    }
  }, [location.pathname, isCommunicationGroupActive]);

  // Click Outside listener to close flyouts in collapsed mode
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        flyoutWrapperRef.current &&
        !flyoutWrapperRef.current.contains(event.target)
      ) {
        setShowClientsFlyout(false);
      }
      if (
        tasksFlyoutWrapperRef.current &&
        !tasksFlyoutWrapperRef.current.contains(event.target)
      ) {
        setShowTasksFlyout(false);
      }
      if (
        communicationFlyoutWrapperRef.current &&
        !communicationFlyoutWrapperRef.current.contains(event.target)
      ) {
        setShowCommunicationFlyout(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClientsParentClick = (e) => {
    e.preventDefault();
    if (isCollapsed) {
      setShowClientsFlyout((prev) => !prev);
    } else {
      setIsClientsExpanded((prev) => !prev);
    }
  };

  const handleTasksParentClick = (e) => {
    e.preventDefault();
    if (isCollapsed) {
      setShowTasksFlyout((prev) => !prev);
    } else {
      setIsTasksExpanded((prev) => !prev);
    }
  };

  const handleCommunicationParentClick = (e) => {
    e.preventDefault();
    if (isCollapsed) {
      setShowCommunicationFlyout((prev) => !prev);
    } else {
      setIsCommunicationExpanded((prev) => !prev);
    }
  };

  const handleGroupMouseEnter = () => {
    if (isCollapsed) {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
      setShowClientsFlyout(true);
    }
  };

  const handleGroupMouseLeave = () => {
    if (isCollapsed) {
      leaveTimerRef.current = setTimeout(() => {
        setShowClientsFlyout(false);
      }, 300);
    }
  };

  const handleTasksGroupMouseEnter = () => {
    if (isCollapsed) {
      if (tasksLeaveTimerRef.current) {
        clearTimeout(tasksLeaveTimerRef.current);
      }
      setShowTasksFlyout(true);
    }
  };

  const handleTasksGroupMouseLeave = () => {
    if (isCollapsed) {
      tasksLeaveTimerRef.current = setTimeout(() => {
        setShowTasksFlyout(false);
      }, 300);
    }
  };

  const handleCommunicationGroupMouseEnter = () => {
    if (isCollapsed) {
      if (communicationLeaveTimerRef.current) {
        clearTimeout(communicationLeaveTimerRef.current);
      }
      setShowCommunicationFlyout(true);
    }
  };

  const handleCommunicationGroupMouseLeave = () => {
    if (isCollapsed) {
      communicationLeaveTimerRef.current = setTimeout(() => {
        setShowCommunicationFlyout(false);
      }, 300);
    }
  };

  return (
    <aside
      className={`sidebar-container ${isOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""
        }`}
    >
      {/* Top Branding Section (Click Logo to Toggle Sidebar Collapse) */}
      <div
        className="sidebar-branding sidebar-branding-clickable"
        onClick={onToggleCollapse}
        title={isCollapsed ? "Click logo to Expand Sidebar" : "Click logo to Collapse Sidebar"}
        role="button"
        tabIndex={0}
      >
        <div className="sidebar-branding-left">
          <div className="sidebar-logo-wrapper">
            <img
              src={headerLogo}
              alt="Parshwa Consultancy Logo"
              className="sidebar-logo-img"
            />
          </div>
          {!isCollapsed && (
            <div className="sidebar-company-info">
              <span className="sidebar-company-name">Parshwa Consultancy</span>
              <span className="sidebar-company-subtitle">Financial Advisory</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {/* 1. Dashboard */}
        <Link
          to="/dashboard"
          className={`nav-link ${location.pathname === "/dashboard" ? "active" : ""}`}
          onClick={onClose}
          title={isCollapsed ? "Dashboard" : undefined}
          data-tooltip="Dashboard"
        >
          <div className="nav-link-left">
            <LayoutDashboard size={18} className="nav-icon" />
            <span className="nav-label">Dashboard</span>
          </div>
        </Link>

        {/* 2. Clients Parent Menu */}
        {canAccessClientsParent && (
          <div
            className="nav-group-wrapper"
            ref={flyoutWrapperRef}
            onMouseEnter={handleGroupMouseEnter}
            onMouseLeave={handleGroupMouseLeave}
          >
            <button
              type="button"
              className={`nav-link nav-parent-link ${isClientGroupActive ? "active" : ""}`}
              onClick={handleClientsParentClick}
              title={isCollapsed ? "Clients" : undefined}
              data-tooltip={isCollapsed ? "Clients" : undefined}
            >
              <div className="nav-link-left">
                <UserCheck size={18} className="nav-icon" />
                <span className="nav-label">Clients</span>
              </div>
              {!isCollapsed && (
                <span className="nav-chevron">
                  {isClientsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              )}
            </button>

            {/* Expanded Submenu (Desktop / Drawer OPEN state) */}
            {!isCollapsed && isClientsExpanded && (
              <div className="nav-submenu">
                {canAccessClientList && (
                  <Link
                    to="/clients"
                    className={`submenu-link ${location.pathname === "/clients" ||
                        (location.pathname.startsWith("/clients/") && location.pathname !== "/clients/add")
                        ? "active"
                        : ""
                      }`}
                    onClick={onClose}
                  >
                    <List size={14} className="submenu-icon" />
                    <span>Client List</span>
                  </Link>
                )}

                {canAccessAddClient && (
                  <Link
                    to="/clients/add"
                    className={`submenu-link ${location.pathname === "/clients/add" ? "active" : ""
                      }`}
                    onClick={onClose}
                  >
                    <UserPlus size={14} className="submenu-icon" />
                    <span>Add Client</span>
                  </Link>
                )}

                {canAccessDocuments && (
                  <Link
                    to="/documents"
                    className={`submenu-link ${location.pathname === "/documents" ? "active" : ""
                      }`}
                    onClick={onClose}
                  >
                    <FileText size={14} className="submenu-icon" />
                    <span>Documents</span>
                  </Link>
                )}
              </div>
            )}

            {/* Collapsed Sidebar Flyout Popover Menu */}
            {isCollapsed && showClientsFlyout && (
              <div
                className="nav-flyout-menu"
                onMouseEnter={handleGroupMouseEnter}
                onMouseLeave={handleGroupMouseLeave}
              >
                <div className="flyout-header">Clients</div>
                {canAccessClientList && (
                  <Link
                    to="/clients"
                    className={`flyout-link ${location.pathname === "/clients" ||
                        (location.pathname.startsWith("/clients/") && location.pathname !== "/clients/add")
                        ? "active"
                        : ""
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowClientsFlyout(false);
                      onClose();
                    }}
                  >
                    <List size={14} />
                    <span>Client List</span>
                  </Link>
                )}

                {canAccessAddClient && (
                  <Link
                    to="/clients/add"
                    className={`flyout-link ${location.pathname === "/clients/add" ? "active" : ""
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowClientsFlyout(false);
                      onClose();
                    }}
                  >
                    <UserPlus size={14} />
                    <span>Add Client</span>
                  </Link>
                )}

                {canAccessDocuments && (
                  <Link
                    to="/documents"
                    className={`flyout-link ${location.pathname === "/documents" ? "active" : ""
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowClientsFlyout(false);
                      onClose();
                    }}
                  >
                    <FileText size={14} />
                    <span>Documents</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Leads */}
        <Link
          to="/leads"
          className={`nav-link ${location.pathname === "/leads" ? "active" : ""}`}
          onClick={onClose}
          title={isCollapsed ? "Leads" : undefined}
          data-tooltip="Leads"
        >
          <div className="nav-link-left">
            <Users size={18} className="nav-icon" />
            <span className="nav-label">Leads</span>
          </div>
        </Link>

        {/* 5. Tasks Parent Menu */}
        {canAccessTasks && (
          <div
            className="nav-group-wrapper"
            ref={tasksFlyoutWrapperRef}
            onMouseEnter={handleTasksGroupMouseEnter}
            onMouseLeave={handleTasksGroupMouseLeave}
          >
            <button
              type="button"
              className={`nav-link nav-parent-link ${isTaskGroupActive ? "active" : ""}`}
              onClick={handleTasksParentClick}
              title={isCollapsed ? "Tasks" : undefined}
              data-tooltip={isCollapsed ? "Tasks" : undefined}
            >
              <div className="nav-link-left">
                <CheckSquare size={18} className="nav-icon" />
                <span className="nav-label">Tasks</span>
              </div>
              {!isCollapsed && (
                <span className="nav-chevron">
                  {isTasksExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              )}
            </button>

            {/* Expanded Submenu (Desktop / Drawer OPEN state) */}
            {!isCollapsed && isTasksExpanded && (
              <div className="nav-submenu">
                <Link
                  to="/tasks/my"
                  className={`submenu-link ${location.pathname === "/tasks/my" ? "active" : ""}`}
                  onClick={onClose}
                >
                  <CheckSquare size={14} className="submenu-icon" />
                  <span>My Tasks</span>
                </Link>

                <Link
                  to="/tasks"
                  className={`submenu-link ${location.pathname === "/tasks" ? "active" : ""}`}
                  onClick={onClose}
                >
                  <List size={14} className="submenu-icon" />
                  <span>All Tasks</span>
                </Link>

                {canCreateTask && (
                  <Link
                    to="/tasks/create"
                    className={`submenu-link ${location.pathname === "/tasks/create" ? "active" : ""}`}
                    onClick={onClose}
                  >
                    <Plus size={14} className="submenu-icon" />
                    <span>Create Task</span>
                  </Link>
                )}
              </div>
            )}

            {/* Collapsed Sidebar Flyout Popover Menu */}
            {isCollapsed && showTasksFlyout && (
              <div
                className="nav-flyout-menu"
                onMouseEnter={handleTasksGroupMouseEnter}
                onMouseLeave={handleTasksGroupMouseLeave}
              >
                <div className="flyout-header">Tasks</div>
                <Link
                  to="/tasks/my"
                  className={`flyout-link ${location.pathname === "/tasks/my" ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTasksFlyout(false);
                    onClose();
                  }}
                >
                  <CheckSquare size={14} />
                  <span>My Tasks</span>
                </Link>

                <Link
                  to="/tasks"
                  className={`flyout-link ${location.pathname === "/tasks" ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTasksFlyout(false);
                    onClose();
                  }}
                >
                  <List size={14} />
                  <span>All Tasks</span>
                </Link>

                {canCreateTask && (
                  <Link
                    to="/tasks/create"
                    className={`flyout-link ${location.pathname === "/tasks/create" ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTasksFlyout(false);
                      onClose();
                    }}
                  >
                    <Plus size={14} />
                    <span>Create Task</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* 6. Calendar */}
        {canAccessTasks && (
          <Link
            to="/calendar"
            className={`nav-link ${location.pathname === "/calendar" ? "active" : ""
              }`}
            onClick={onClose}
            title={isCollapsed ? "Calendar" : undefined}
            data-tooltip="Calendar"
          >
            <div className="nav-link-left">
              <CalendarIcon size={18} className="nav-icon" />
              <span className="nav-label">Calendar</span>
            </div>
          </Link>
        )}

        {/* 4. Communication Parent Menu */}
        <div
          className="nav-group-wrapper"
          ref={communicationFlyoutWrapperRef}
          onMouseEnter={handleCommunicationGroupMouseEnter}
          onMouseLeave={handleCommunicationGroupMouseLeave}
        >
          <button
            type="button"
            className={`nav-link nav-parent-link ${isCommunicationGroupActive ? "active" : ""}`}
            onClick={handleCommunicationParentClick}
            title={isCollapsed ? "Communication" : undefined}
            data-tooltip={isCollapsed ? "Communication" : undefined}
          >
            <div className="nav-link-left">
              <MessageSquare size={18} className="nav-icon" />
              <span className="nav-label">Communication</span>
            </div>
            {!isCollapsed && (
              <span className="nav-chevron">
                {isCommunicationExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            )}
          </button>

          {/* Expanded Submenu (Desktop / Drawer OPEN state) */}
          {!isCollapsed && isCommunicationExpanded && (
            <div className="nav-submenu">
              <Link
                to="/communication"
                className={`submenu-link ${location.pathname === "/communication" ? "active" : ""}`}
                onClick={onClose}
              >
                <MessageSquare size={14} className="submenu-icon" />
                <span>Internal Communication</span>
              </Link>

              <Link
                to="/communication/whatsapp-templates"
                className={`submenu-link ${location.pathname === "/communication/whatsapp-templates" ? "active" : ""}`}
                onClick={onClose}
              >
                <FileText size={14} className="submenu-icon" />
                <span>WhatsApp Templates</span>
              </Link>

              <Link
                to="/communication/whatsapp-settings"
                className={`submenu-link ${location.pathname === "/communication/whatsapp-settings" ? "active" : ""}`}
                onClick={onClose}
              >
                <Settings size={14} className="submenu-icon" />
                <span>WhatsApp Settings</span>
              </Link>
            </div>
          )}

          {/* Collapsed Sidebar Flyout Popover Menu */}
          {isCollapsed && showCommunicationFlyout && (
            <div
              className="nav-flyout-menu"
              onMouseEnter={handleCommunicationGroupMouseEnter}
              onMouseLeave={handleCommunicationGroupMouseLeave}
            >
              <div className="flyout-header">Communication</div>
              <Link
                to="/communication"
                className={`flyout-link ${location.pathname === "/communication" ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCommunicationFlyout(false);
                  onClose();
                }}
              >
                <MessageSquare size={14} />
                <span>Internal Communication</span>
              </Link>

              <Link
                to="/communication/whatsapp-templates"
                className={`flyout-link ${location.pathname === "/communication/whatsapp-templates" ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCommunicationFlyout(false);
                  onClose();
                }}
              >
                <FileText size={14} />
                <span>WhatsApp Templates</span>
              </Link>

              <Link
                to="/communication/whatsapp-settings"
                className={`flyout-link ${location.pathname === "/communication/whatsapp-settings" ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCommunicationFlyout(false);
                  onClose();
                }}
              >
                <Settings size={14} />
                <span>WhatsApp Settings</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Settings Page - Visible ONLY to Admin users */}
      {isAdmin && (
        <div className="sidebar-footer">
          <Link
            to="/settings"
            className={`nav-link ${location.pathname.startsWith("/settings") ? "active" : ""}`}
            onClick={onClose}
            title={isCollapsed ? "Settings" : undefined}
            data-tooltip="Settings"
          >
            <div className="nav-link-left">
              <Settings size={18} className="nav-icon" />
              <span className="nav-label">Settings</span>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
