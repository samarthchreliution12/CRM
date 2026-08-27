import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, X, Search, Users, Maximize2, Send, ChevronLeft, User, Hash, Loader2 } from "lucide-react";
import useAuth from "../../../hooks/useAuth";
import CommunicationService from "../../../services/communication.service";
import "./InternalChat.css";

const formatDateLabel = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
};

const InternalChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  const messagesEndRef = useRef(null);

  const isCommunicationPage = location.pathname === "/communication";

  // Fetch Conversations & Staff Users when Widget Opens
  const loadInitialData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [convsRes, staffRes] = await Promise.all([
        CommunicationService.getConversations(token),
        CommunicationService.getStaffUsers(searchQuery, token),
      ]);

      if (convsRes?.data?.conversations) {
        setConversations(convsRes.data.conversations);
      }
      if (staffRes?.data?.staff) {
        setStaffUsers(staffRes.data.staff);
      }
    } catch (err) {
      console.error("Failed to load chat widget data:", err);
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery]);

  // Fetch Messages for Active Conversation in Floating Panel
  const fetchMessages = useCallback(
    async (convId, isSilent = false) => {
      if (!token || !convId) return;
      if (!isSilent) setLoadingMessages(true);
      try {
        const res = await CommunicationService.getMessages(convId, token);
        if (res?.data?.messages) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.error("Failed to load chat messages:", err);
      } finally {
        if (!isSilent) setLoadingMessages(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (isOpen && !isCommunicationPage) {
      loadInitialData();
    }
  }, [isOpen, isCommunicationPage, loadInitialData]);

  // Polling for Active Conversation Messages in Floating Panel
  useEffect(() => {
    if (!isOpen || !activeConv) return;

    fetchMessages(activeConv.id, false);
    const interval = setInterval(() => {
      fetchMessages(activeConv.id, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, activeConv, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Do NOT render floating chat widget on the Communication page itself
  if (isCommunicationPage) {
    return null;
  }

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const closeChat = () => {
    setIsOpen(false);
    setActiveConv(null);
    setSearchQuery("");
  };

  const handleFullscreenClick = () => {
    closeChat();
    navigate("/communication");
  };

  const handleStartDirectChat = async (staffId) => {
    try {
      const res = await CommunicationService.startDirectConversation(staffId, token);
      if (res?.data?.conversation) {
        const conv = res.data.conversation;
        setActiveConv(conv);
        loadInitialData();
      }
    } catch (err) {
      alert(err.message || "Failed to start direct conversation.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!activeConv || !messageInput.trim() || sendingMsg) return;

    const textToSend = messageInput.trim();
    setMessageInput("");
    setSendingMsg(true);

    try {
      const res = await CommunicationService.sendMessage(activeConv.id, textToSend, token);
      if (res?.data?.message) {
        setMessages((prev) => [...prev, res.data.message]);
        loadInitialData();
      }
    } catch (err) {
      alert(err.message || "Failed to send message.");
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div className="internal-chat-widget-root">
      {/* Floating Chat Button */}
      <button
        type="button"
        className={`floating-chat-btn ${isOpen ? "active" : ""}`}
        onClick={toggleChat}
        aria-label="Toggle Internal Chat"
        title="Internal Communication Chat"
      >
        <MessageSquare size={22} className="chat-btn-icon" />
        <span className="chat-btn-pulse" />
      </button>

      {/* Slide-Up Chat Panel */}
      {isOpen && (
        <div className="internal-chat-panel">
          {/* Panel Header */}
          <div className="chat-panel-header">
            <div className="chat-header-title-group">
              {activeConv ? (
                <button
                  type="button"
                  className="chat-back-btn"
                  onClick={() => setActiveConv(null)}
                  title="Back to Chats"
                >
                  <ChevronLeft size={18} />
                </button>
              ) : null}
              <h3 className="chat-panel-title">
                {activeConv ? activeConv.name : "Internal Chat"}
              </h3>
              {!activeConv && (
                <div className="chat-team-online-badge">
                  <span className="online-dot" />
                  <span>Team Online</span>
                </div>
              )}
            </div>

            <div className="chat-header-actions">
              <button
                type="button"
                className="chat-action-btn"
                onClick={handleFullscreenClick}
                title="Open Full Communication Page"
              >
                <Maximize2 size={16} />
              </button>

              <button
                type="button"
                className="chat-action-btn close"
                onClick={closeChat}
                title="Close Chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div className="chat-panel-body">
            {!activeConv ? (
              /* Conversation List & Staff Search View */
              <div className="chat-widget-list-view">
                {/* Search Bar */}
                <div className="chat-search-bar">
                  <div className="chat-search-input-wrapper">
                    <Search size={15} className="chat-search-icon" />
                    <input
                      type="text"
                      placeholder="Search staff or chats..."
                      className="chat-search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="comm-loading-state" style={{ padding: "20px" }}>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="chat-widget-scroll">
                    {/* Active Conversations Section */}
                    {conversations.length > 0 && (
                      <div className="chat-section">
                        <span className="chat-section-label">Recent Chats</span>
                        {conversations
                          .filter((c) => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((c) => (
                            <div
                              key={c.id}
                              className="chat-widget-item"
                              onClick={() => setActiveConv(c)}
                            >
                              <div className="chat-item-avatar">
                                {c.type === "direct" ? <User size={16} /> : <Hash size={16} />}
                              </div>
                              <div className="chat-item-info">
                                <span className="chat-item-name">{c.name}</span>
                                <span className="chat-item-preview">{c.last_message || "No messages yet"}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Staff Members Available for Chat */}
                    <div className="chat-section">
                      <span className="chat-section-label">Start Chat with Staff</span>
                      {staffUsers
                        .filter((st) => !searchQuery || st.name.toLowerCase().includes(searchQuery.toLowerCase()) || st.email.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((st) => (
                          <div
                            key={st.id}
                            className="chat-widget-item"
                            onClick={() => handleStartDirectChat(st.id)}
                          >
                            <div className="chat-item-avatar staff">
                              <User size={16} />
                            </div>
                            <div className="chat-item-info">
                              <span className="chat-item-name">{st.name}</span>
                              <span className="chat-item-preview">{st.role_name} • {st.email}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Active Chat View */
              <div className="chat-widget-thread-view">
                <div className="chat-widget-messages">
                  {loadingMessages ? (
                    <div className="comm-loading-state" style={{ padding: "20px" }}>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Loading messages...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="chat-empty-state" style={{ padding: "20px 10px" }}>
                      <Users size={28} style={{ color: "#cbd5e1" }} />
                      <p style={{ fontSize: "0.775rem", color: "#64748b" }}>
                        Say hello to start the conversation!
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMine = m.sender_id === user?.id || m.is_mine;
                      return (
                        <div key={m.id} className={`chat-widget-msg ${isMine ? "mine" : "other"}`}>
                          {!isMine && <span className="chat-widget-msg-sender">{m.sender_name}</span>}
                          <div className={`chat-widget-bubble ${m.is_deleted ? "deleted" : ""}`}>
                            <span>{m.message}</span>
                            <span className="chat-widget-time">{formatDateLabel(m.created_at)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form className="chat-widget-input-bar" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="chat-widget-input"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="chat-widget-send-btn"
                    disabled={!messageInput.trim() || sendingMsg}
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InternalChat;
