import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Bell, HelpCircle, Menu, FileText, BellOff, ArrowRight, MessageSquare, CheckSquare, X, Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import ClientService from "../../../services/client.service";
import CommunicationService from "../../../services/communication.service";
import NotificationService from "../../../services/notification.service";
import UserMenu from "../UserMenu/UserMenu";
import "./Header.css";

const BLOCKED_SEARCH_ROUTES = ["/communication", "/clients", "/documents", "/settings"];

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  try {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return `${mins}m ago`;
    }
    if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours}h ago`;
    }
    const days = Math.floor(diff / 86400);
    return `${days}d ago`;
  } catch (e) {
    return "";
  }
};

const getInitials = (name) => {
  if (!name) return "CL";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const maskMobile = (mobile) => {
  if (!mobile || typeof mobile !== "string") return "";
  const cleaned = mobile.trim();
  if (cleaned.length <= 4) return "*".repeat(cleaned.length);
  const first2 = cleaned.slice(0, 2);
  const last2 = cleaned.slice(-2);
  return `${first2}******${last2}`;
};

const Header = ({ title = "Dashboard", onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const permissions = user?.permissions || [];

  // Permission Check for Documents
  const canViewDocs =
    permissions.includes("document.view") ||
    permissions.includes("document.verify") ||
    permissions.includes("document.create") ||
    user?.role?.name === "Admin";

  const [pendingDocCount, setPendingDocCount] = useState(0);
  const [commUnreadConvs, setCommUnreadConvs] = useState([]);
  const [commUnreadTotal, setCommUnreadTotal] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifRef = useRef(null);

  // Global Header Client Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  const isSearchBlocked = BLOCKED_SEARCH_ROUTES.includes(location.pathname);

  // Debounce effect on header search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchTerm.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Execute client database search when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setIsSearchLoading(false);
      setSearchError("");
      setShowSearchDropdown(false);
      return;
    }

    let isMounted = true;
    const performSearch = async () => {
      setIsSearchLoading(true);
      setSearchError("");
      setShowSearchDropdown(true);
      try {
        const response = await ClientService.searchClients(debouncedQuery, token);
        if (isMounted) {
          if (response && response.success && response.data) {
            setSearchResults(response.data.clients || []);
          } else {
            setSearchResults([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setSearchError(err.message || "Failed to search clients.");
          setSearchResults([]);
        }
      } finally {
        if (isMounted) {
          setIsSearchLoading(false);
        }
      }
    };

    performSearch();
    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, token]);

  // Click Outside Listener for Header Search Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Pending Documents Count from Backend API
  const fetchPendingDocCount = useCallback(async () => {
    if (!canViewDocs || !token) {
      setPendingDocCount(0);
      return;
    }
    try {
      const res = await ClientService.getAdminDocuments({ status: "PENDING", limit: 1 }, token);
      const count = res?.data?.pagination?.total || 0;
      setPendingDocCount(count);
    } catch (e) {
      // Ignore fetch errors
    }
  }, [canViewDocs, token]);

  // Fetch Communication Unread Conversations from Backend API
  const fetchCommNotifications = useCallback(async () => {
    if (!token) {
      setCommUnreadConvs([]);
      setCommUnreadTotal(0);
      return;
    }
    try {
      const res = await CommunicationService.getConversations(token);
      if (res && res.data && res.data.conversations) {
        const unreadList = res.data.conversations.filter(
          (c) => (c.unread_count || 0) > 0
        );
        const total = unreadList.reduce(
          (acc, c) => acc + Number(c.unread_count || 0),
          0
        );
        setCommUnreadConvs(unreadList);
        setCommUnreadTotal(total);
      }
    } catch (e) {
      // Ignore fetch errors
    }
  }, [token]);

  // Fetch Notifications from Database-Backed Notifications API
  const fetchDbNotifications = useCallback(async () => {
    if (!token || !user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const [listRes, countRes] = await Promise.all([
        NotificationService.getNotifications(token, { limit: 20 }),
        NotificationService.getUnreadCount(token),
      ]);
      if (listRes && listRes.data && Array.isArray(listRes.data.notifications)) {
        setNotifications(listRes.data.notifications);
      }
      if (countRes && countRes.data && countRes.data.unread_count !== undefined) {
        setUnreadCount(Number(countRes.data.unread_count) || 0);
      }
    } catch (e) {
      // Ignore fetch errors
    }
  }, [token, user?.id]);

  // Polling & Location Change Refresher
  useEffect(() => {
    fetchPendingDocCount();
    fetchCommNotifications();
    fetchDbNotifications();

    const interval = setInterval(() => {
      fetchPendingDocCount();
      fetchCommNotifications();
      fetchDbNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingDocCount, fetchCommNotifications, fetchDbNotifications, location.pathname]);

  // Click Outside Listener to Close Notification Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleNotif = () => {
    setNotifDropdownOpen((prev) => !prev);
    if (!notifDropdownOpen) {
      fetchPendingDocCount();
      fetchCommNotifications();
      fetchDbNotifications();
    }
  };

  const handlePendingDocClick = () => {
    setNotifDropdownOpen(false);
    navigate("/documents?status=pending");
  };

  const handleNotificationClick = async (notif) => {
    setNotifDropdownOpen(false);

    // If database notification and unread, mark as read
    if (notif.id && !notif.is_read) {
      try {
        await NotificationService.markAsRead(notif.id, token);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notif.id
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }

    // Dynamic Navigation based on entity_type
    const entityType = String(notif.entity_type || notif.type || "").toUpperCase();
    const entityId = notif.entity_id || notif.task_id || notif.id;

    if (entityType.includes("TASK") || entityType === "TASK") {
      navigate(`/tasks?taskId=${entityId}`);
    } else if (entityType.includes("DOCUMENT") || entityType === "DOCUMENT") {
      navigate("/documents?status=pending");
    } else if (entityType.includes("CLIENT") || entityType === "CLIENT") {
      navigate(`/clients/${entityId}`);
    } else {
      navigate("/tasks");
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    if (unreadCount === 0) return;
    try {
      await NotificationService.markAllAsRead(token);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const totalUnreadCount =
    (canViewDocs ? pendingDocCount : 0) + commUnreadTotal + unreadCount;


  return (
    <header className="header-container">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar menu"
        >
          <Menu size={22} />
        </button>

        {/* Global CRM Search Bar vs Page Title Heading */}
        {!isSearchBlocked ? (
          <div className="header-search" ref={searchContainerRef}>
            <Search size={20} className="header-search-icon" />
            <input
              type="text"
              className="header-search-input"
              placeholder="Search clients by name, PAN or mobile number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (debouncedQuery && searchResults.length > 0) {
                  setShowSearchDropdown(true);
                }
              }}
            />
            {searchTerm && (
              <button
                type="button"
                className="header-search-clear-btn"
                onClick={() => {
                  setSearchTerm("");
                  setDebouncedQuery("");
                  setSearchResults([]);
                  setShowSearchDropdown(false);
                }}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}

            {/* Header Live Search Dropdown Popover */}
            {showSearchDropdown && (
              <div className="header-search-dropdown">
                <div className="header-search-dropdown-header">
                  <span>Client Search Results</span>
                  {searchResults.length > 0 && (
                    <span className="header-search-count-badge">{searchResults.length} found</span>
                  )}
                </div>

                <div className="header-search-dropdown-body">
                  {isSearchLoading ? (
                    <div className="header-search-loading">
                      <Loader2 size={18} className="animate-spin" />
                      <span>Searching database...</span>
                    </div>
                  ) : searchError ? (
                    <div className="header-search-error">
                      <span>{searchError}</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="header-search-empty">
                      <span>No clients found matching "<strong>{debouncedQuery}</strong>"</span>
                    </div>
                  ) : (
                    searchResults.map((client) => (
                      <div
                        key={client.id}
                        className="header-search-item"
                        onClick={() => {
                          setShowSearchDropdown(false);
                          setSearchTerm("");
                          navigate(`/clients/${client.id}`);
                        }}
                      >
                        <div className="header-search-item-left">
                          <div className="header-search-initials">
                            {getInitials(client.name)}
                          </div>
                          <div className="header-search-info">
                            <span className="header-search-name">{client.name}</span>
                            <span className="header-search-meta">
                              {client.pan ? `PAN: ${client.pan}` : ""}
                              {client.pan && client.mobile_no ? " • " : ""}
                              {client.mobile_no ? maskMobile(client.mobile_no) : ""}
                            </span>
                          </div>
                        </div>
                        <ArrowRight size={14} className="header-search-item-arrow" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <h2 className="header-title">
            {location.pathname === "/communication"
              ? "Communicate with People"
              : location.pathname === "/clients"
              ? "Client Management"
              : location.pathname === "/documents"
              ? "Document Verification"
              : location.pathname === "/settings"
              ? "Admin Settings"
              : title}
          </h2>
        )}
      </div>

      <div className="header-right">
        {/* Notifications Icon with Unread Count Badge */}
        <div className="notif-wrapper" ref={notifRef}>
          <button
            type="button"
            className={`header-action-btn ${notifDropdownOpen ? "active" : ""}`}
            onClick={handleToggleNotif}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={18} />
            {totalUnreadCount > 0 && (
              <span className="notification-badge-count">
                {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notifDropdownOpen && (
            <div className="header-notif-dropdown">
              <div className="notif-dropdown-header">
                <div className="notif-dropdown-header-left">
                  <span className="notif-dropdown-title">Notifications</span>
                  {totalUnreadCount > 0 && (
                    <span className="notif-badge-pill">{totalUnreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="btn-mark-all-read"
                    onClick={handleMarkAllAsRead}
                    title="Mark all notifications as read"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notif-dropdown-body">
                {totalUnreadCount > 0 || notifications.length > 0 ? (
                  <>
                    {/* Pending Documents Notification */}
                    {canViewDocs && pendingDocCount > 0 && (
                      <div className="notif-item unread" onClick={handlePendingDocClick}>
                        <div className="notif-item-icon-wrapper pending">
                          <FileText size={18} />
                        </div>
                        <div className="notif-item-content">
                          <div className="notif-item-header">
                            <span className="notif-item-title">
                              {pendingDocCount} {pendingDocCount === 1 ? "Document" : "Documents"} Pending
                              <span className="notif-unread-dot" title="Unread" />
                            </span>
                          </div>
                          <span className="notif-item-desc">
                            Documents require your review.
                          </span>
                        </div>
                        <ArrowRight size={14} className="notif-item-arrow" />
                      </div>
                    )}

                    {/* Database-Backed Notifications (Tasks, Documents, Clients) */}
                    {notifications.map((notif) => {
                      const isCompleted = notif.type === "TASK_COMPLETED" || notif.type === "DOCUMENT_APPROVED";
                      const isRejected = notif.type === "DOCUMENT_REJECTED";
                      const isDoc = notif.entity_type === "DOCUMENT" || notif.type?.includes("DOCUMENT");
                      const iconWrapperClass = isCompleted ? "completed" : isRejected ? "rejected" : "pending";

                      return (
                        <div
                          key={`db-notif-${notif.id}`}
                          className={`notif-item ${notif.is_read ? "read" : "unread"}`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className={`notif-item-icon-wrapper ${iconWrapperClass}`}>
                            {isDoc ? <FileText size={18} /> : <CheckSquare size={18} />}
                          </div>
                          <div className="notif-item-content">
                            <div className="notif-item-header">
                              <span className="notif-item-title">
                                {notif.title || "Notification"}
                                {!notif.is_read && <span className="notif-unread-dot" title="Unread" />}
                              </span>
                              <span className="notif-item-time">{formatTimeAgo(notif.created_at)}</span>
                            </div>
                            <span className="notif-item-desc">{notif.message}</span>
                          </div>
                          <ArrowRight size={14} className="notif-item-arrow" />
                        </div>
                      );
                    })}

                    {/* Unread Communication Notifications */}
                    {commUnreadConvs.map((conv) => (
                      <div
                        key={`comm-notif-${conv.id}`}
                        className="notif-item unread"
                        onClick={() => {
                          setNotifDropdownOpen(false);
                          navigate(`/communication?convId=${conv.id}`);
                        }}
                      >
                        <div className="notif-item-icon-wrapper direct">
                          <MessageSquare size={18} />
                        </div>
                        <div className="notif-item-content">
                          <div className="notif-item-header">
                            <span className="notif-item-title">
                              {conv.unread_count} new message{conv.unread_count > 1 ? "s" : ""} from {conv.name}
                              <span className="notif-unread-dot" title="Unread" />
                            </span>
                            <span className="notif-item-time">{formatTimeAgo(conv.last_message_at)}</span>
                          </div>
                          <span className="notif-item-desc">
                            {conv.last_message || "New message received"}
                          </span>
                        </div>
                        <ArrowRight size={14} className="notif-item-arrow" />
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="notif-empty-state">
                    <BellOff size={22} className="notif-empty-icon" />
                    <span>No new notifications</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Help Icon */}
        <button
          type="button"
          className="header-action-btn"
          aria-label="Help"
          title="Help & Support"
        >
          <HelpCircle size={18} />
        </button>

        {/* User Profile Menu */}
        <UserMenu />
      </div>
    </header>
  );
};

export default Header;
