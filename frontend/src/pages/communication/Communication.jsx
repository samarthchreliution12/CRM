import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import useAuth from "../../hooks/useAuth";
import CommunicationService from "../../services/communication.service";
import {
  MessageSquare,
  Search,
  Plus,
  ShieldAlert,
  Send,
  X,
  Edit2,
  Trash2,
  Check,
  CheckCheck,
  Loader2,
  User,
  ChevronDown,
} from "lucide-react";
import "./Communication.css";

const formatDateLabel = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
};

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const Communication = () => {
  const { token, user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [staffUsers, setStaffUsers] = useState([]);

  // Modal state for direct chat compose
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeSearch, setComposeSearch] = useState("");

  // Edit message state
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState("");

  // Loading states
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  // Scroll & Read Status states
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [showNewMessageBadge, setShowNewMessageBadge] = useState(false);

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  // Mark conversation as read
  const markAsRead = useCallback(
    async (convId) => {
      if (!token || !convId) return;
      try {
        await CommunicationService.markConversationAsRead(convId, token);
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
        );
      } catch (err) {
        // Ignore read mark errors silently
      }
    },
    [token]
  );

  // Fetch Conversations List from Backend
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await CommunicationService.getConversations(token);
      if (res && res.data && res.data.conversations) {
        // Only keep direct conversations
        const directOnly = res.data.conversations.filter(
          (c) => c.type === "direct" || !c.type
        );
        setConversations(directOnly);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConvs(false);
    }
  }, [token]);

  // Fetch Staff Users available for Chat
  const fetchStaffUsers = useCallback(
    async (query = "") => {
      if (!token) return;
      try {
        const res = await CommunicationService.getStaffUsers(query, token);
        if (res && res.data && res.data.staff) {
          setStaffUsers(res.data.staff);
        }
      } catch (err) {
        console.error("Failed to load staff users:", err);
      }
    },
    [token]
  );

  // Fetch Messages for Active Conversation
  const fetchMessages = useCallback(
    async (convId, isSilent = false) => {
      if (!token || !convId) return;
      if (!isSilent) setLoadingMessages(true);
      try {
        const res = await CommunicationService.getMessages(convId, token);
        if (res && res.data && res.data.messages) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        if (!isSilent) setLoadingMessages(false);
      }
    },
    [token]
  );

  const location = useLocation();

  // Initial Load & Polling for Real-Time Synchronization
  useEffect(() => {
    fetchConversations();
    fetchStaffUsers();

    const convInterval = setInterval(fetchConversations, 4000);
    return () => clearInterval(convInterval);
  }, [fetchConversations, fetchStaffUsers]);

  // Handle opening conversation from URL query parameters (e.g. /communication?convId=12)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const convIdParam = params.get("convId");

    if (convIdParam && conversations.length > 0) {
      const parsedId = parseInt(convIdParam, 10);
      const targetConv = conversations.find((c) => c.id === parsedId);

      if (targetConv) {
        setActiveConvId(parsedId);
      }
    }
  }, [location.search, conversations]);

  // Active Conversation change & Polling
  useEffect(() => {
    if (!activeConvId) return;

    setIsUserScrolledUp(false);
    setShowNewMessageBadge(false);

    fetchMessages(activeConvId, false);
    markAsRead(activeConvId);

    const msgInterval = setInterval(() => {
      fetchMessages(activeConvId, true);
    }, 3000);

    return () => clearInterval(msgInterval);
  }, [activeConvId, fetchMessages, markAsRead]);

  // Message scroll & read handler
  useEffect(() => {
    if (messages.length === 0) return;

    if (!isUserScrolledUp) {
      setTimeout(() => {
        scrollToBottom(false);
        if (activeConvId) markAsRead(activeConvId);
      }, 50);
    } else {
      setShowNewMessageBadge(true);
    }
  }, [messages, isUserScrolledUp, activeConvId, markAsRead]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;

    setIsUserScrolledUp(!isAtBottom);

    if (isAtBottom) {
      setShowNewMessageBadge(false);
      if (activeConvId) {
        markAsRead(activeConvId);
      }
    }
  };

  // Start Direct Conversation with Staff User
  const handleStartDirectChat = async (staffId) => {
    try {
      const res = await CommunicationService.startDirectConversation(staffId, token);
      if (res && res.data && res.data.conversation) {
        const conv = res.data.conversation;
        setIsComposeOpen(false);
        setComposeSearch("");
        await fetchConversations();
        setActiveConvId(conv.id);
      }
    } catch (err) {
      alert(err.message || "Failed to start direct conversation.");
    }
  };

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!activeConvId || !messageInput.trim() || sendingMsg) return;

    const textToSend = messageInput.trim();
    setMessageInput("");
    setSendingMsg(true);

    try {
      const res = await CommunicationService.sendMessage(activeConvId, textToSend, token);
      if (res && res.data && res.data.message) {
        setMessages((prev) => [...prev, res.data.message]);
        setIsUserScrolledUp(false);
        setShowNewMessageBadge(false);
        setTimeout(() => scrollToBottom(true), 50);
        fetchConversations();
      }
    } catch (err) {
      alert(err.message || "Failed to send message.");
    } finally {
      setSendingMsg(false);
    }
  };

  // Edit Message
  const handleSaveEdit = async (msgId) => {
    if (!editText.trim()) return;
    try {
      const res = await CommunicationService.editMessage(msgId, editText.trim(), token);
      if (res && res.data && res.data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? res.data.message : m))
        );
        setEditingMsgId(null);
        setEditText("");
      }
    } catch (err) {
      alert(err.message || "Failed to edit message.");
    }
  };

  // Soft-Delete Message
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await CommunicationService.deleteMessage(msgId, token);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, message: "This message was deleted", is_deleted: true } : m
        )
      );
      fetchConversations();
    } catch (err) {
      alert(err.message || "Failed to delete message.");
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    return (c.name || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  return (
    <AppLayout title="Communication">
      <div className="comm-workspace-container">
        {/* Left Panel: Conversation List Area */}
        <div className="comm-sidebar-panel">
          {/* Header: Title & New Message Action */}
          <div className="comm-sidebar-header">
            <div className="comm-header-title-row">
              <h3 className="comm-sidebar-title">Messages</h3>
              <button
                type="button"
                className="btn-compose-msg"
                title="New Direct Message"
                onClick={() => {
                  setIsComposeOpen(true);
                  fetchStaffUsers("");
                }}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Search Box */}
            <div className="chat-search-bar" style={{ padding: 0, borderBottom: "none" }}>
              <div className="chat-search-input-wrapper">
                <Search size={14} className="chat-search-icon" />
                <input
                  type="text"
                  placeholder="Search staff messages..."
                  className="chat-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Left Panel Body: Conversation List */}
          <div className="comm-sidebar-body">
            {loadingConvs ? (
              <div className="comm-loading-state">
                <Loader2 size={20} className="animate-spin" />
                <span>Loading chats...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="comm-list-empty-state">
                <div className="comm-empty-icon-box">
                  <MessageSquare size={20} />
                </div>
                <h4 className="comm-empty-title">No conversations yet</h4>
                <p className="comm-empty-desc">
                  Click '+' to start a direct message with a staff member.
                </p>
              </div>
            ) : (
              <div className="comm-conversations-list">
                {filteredConversations.map((conv) => {
                  const isSelected = conv.id === activeConvId;
                  const unreadCount = Number(conv.unread_count || 0);
                  const isUnread = unreadCount > 0 && !isSelected;

                  return (
                    <div
                      key={conv.id}
                      className={`comm-conv-item ${isSelected ? "selected" : ""} ${isUnread ? "has-unread" : ""}`}
                      onClick={() => {
                        setActiveConvId(conv.id);
                        markAsRead(conv.id);
                      }}
                    >
                      <div className="comm-conv-avatar">
                        {getInitials(conv.name)}
                      </div>
                      <div className="comm-conv-info">
                        <div className="comm-conv-top-row">
                          <span className={`comm-conv-name ${isUnread ? "unread" : ""}`}>
                            {conv.name}
                          </span>
                          <span className="comm-conv-time">
                            {formatDateLabel(conv.last_message_at)}
                          </span>
                        </div>
                        <div className="comm-conv-bottom-row">
                          <span className={`comm-conv-preview ${isUnread ? "unread" : ""}`}>
                            {conv.last_message || "No messages yet"}
                          </span>
                          {isUnread && (
                            <span className="comm-unread-badge">● {unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Main Conversation Area */}
        <div className="comm-main-panel">
          {!activeConversation ? (
            <div className="comm-main-empty-state">
              <div className="comm-main-empty-icon-wrapper">
                <Send size={32} />
              </div>
              <h3 className="comm-main-empty-title">Select a conversation to start messaging</h3>
              <p className="comm-main-empty-subtitle">
                Choose a direct message from the left panel to collaborate in real-time.
              </p>
              <div className="comm-security-badge">
                <ShieldAlert size={13} />
                <span>Encrypted Staff Communication</span>
              </div>
            </div>
          ) : (
            <div className="comm-chat-view-container">
              {/* Chat View Header with Avatar & Name */}
              <div className="comm-chat-header">
                <div className="comm-chat-header-info">
                  <div className="comm-chat-avatar">
                    {getInitials(activeConversation.name)}
                  </div>
                  <div className="comm-chat-title-group">
                    <h3 className="comm-chat-title">{activeConversation.name}</h3>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Direct Message</span>
                  </div>
                </div>
              </div>

              {/* Chat Messages Body with Scroll Container */}
              <div
                className="comm-chat-messages-body"
                ref={messagesContainerRef}
                onScroll={handleScroll}
              >
                {loadingMessages ? (
                  <div className="comm-loading-state" style={{ padding: "40px 0" }}>
                    <Loader2 size={24} className="animate-spin" />
                    <span>Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="comm-chat-empty-thread">
                    <MessageSquare size={32} color="#cbd5e1" />
                    <p>No messages in this conversation yet. Send the first message!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = msg.sender_id === user?.id || msg.is_mine;
                    const isEditingThis = editingMsgId === msg.id;

                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                    const isSameSenderAsPrev = prevMsg && prevMsg.sender_id === msg.sender_id;

                    return (
                      <div
                        key={msg.id}
                        className={`comm-msg-row ${isMine ? "mine" : "other"} ${isSameSenderAsPrev ? "grouped" : ""}`}
                      >
                        <div className="comm-msg-bubble-wrapper">
                          {isEditingThis ? (
                            <div className="comm-msg-edit-box">
                              <input
                                type="text"
                                className="comm-msg-edit-input"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="btn-edit-action save"
                                onClick={() => handleSaveEdit(msg.id)}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn-edit-action cancel"
                                onClick={() => setEditingMsgId(null)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className={`comm-msg-bubble ${msg.is_deleted ? "deleted" : ""}`}>
                              <span>{msg.message}</span>
                              <div className="comm-msg-footer">
                                <span className="comm-msg-time">{formatDateLabel(msg.created_at)}</span>
                                {isMine && !msg.is_deleted && (
                                  <span
                                    className={`comm-msg-status ${msg.status === "seen" ? "seen" : "delivered"}`}
                                    title={msg.status === "seen" ? "Seen" : "Delivered"}
                                  >
                                    {msg.status === "seen" ? <CheckCheck size={14} /> : <Check size={14} />}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Message Actions */}
                          {isMine && !msg.is_deleted && !isEditingThis && (
                            <div className="comm-msg-actions">
                              <button
                                type="button"
                                className="btn-msg-action"
                                title="Edit message"
                                onClick={() => {
                                  setEditingMsgId(msg.id);
                                  setEditText(msg.message);
                                }}
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                className="btn-msg-action delete"
                                title="Delete message"
                                onClick={() => handleDeleteMessage(msg.id)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Floating New Messages Indicator Button */}
              {showNewMessageBadge && isUserScrolledUp && (
                <button
                  type="button"
                  className="comm-new-messages-indicator"
                  onClick={() => {
                    setIsUserScrolledUp(false);
                    setShowNewMessageBadge(false);
                    scrollToBottom(true);
                    if (activeConvId) markAsRead(activeConvId);
                  }}
                >
                  <ChevronDown size={14} />
                  <span>New messages</span>
                </button>
              )}

              {/* Chat Input Bar */}
              <form className="comm-chat-input-bar" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder={`Message ${activeConversation.name}...`}
                  className="comm-chat-text-input"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn-send-message"
                  disabled={!messageInput.trim() || sendingMsg}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* MODAL: COMPOSE DIRECT CHAT MODAL */}
        {isComposeOpen && (
          <div className="comm-modal-backdrop" onClick={() => setIsComposeOpen(false)}>
            <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="comm-modal-header">
                <h3>New Direct Message</h3>
                <button
                  type="button"
                  className="btn-close-comm-modal"
                  onClick={() => setIsComposeOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="comm-modal-body">
                <div className="chat-search-bar" style={{ padding: 0, marginBottom: "16px", borderBottom: "none" }}>
                  <div className="chat-search-input-wrapper">
                    <Search size={14} className="chat-search-icon" />
                    <input
                      type="text"
                      placeholder="Search staff members by name or email..."
                      className="chat-search-input"
                      value={composeSearch}
                      onChange={(e) => {
                        setComposeSearch(e.target.value);
                        fetchStaffUsers(e.target.value);
                      }}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="comm-staff-list-modal">
                  {staffUsers.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "0.875rem", textAlign: "center", padding: "20px" }}>
                      No active staff users found.
                    </p>
                  ) : (
                    staffUsers.map((st) => (
                      <div
                        key={st.id}
                        className="comm-staff-item-option"
                        onClick={() => handleStartDirectChat(st.id)}
                      >
                        <div className="comm-staff-avatar">
                          <User size={16} />
                        </div>
                        <div className="comm-staff-info">
                          <span className="comm-staff-name">{st.name}</span>
                          <span className="comm-staff-email">{st.email}</span>
                        </div>
                        <span className="comm-staff-role-badge">{st.role_name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Communication;
