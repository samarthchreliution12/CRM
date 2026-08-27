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
  Hash,
  UserCheck,
  X,
  Edit2,
  Trash2,
  Check,
  CheckCheck,
  Loader2,
  User,
  Users,
  UserPlus,
  MoreVertical,
  ChevronDown,
  LogOut,
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

  const [activeTab, setActiveTab] = useState("direct"); // 'direct' | 'channels'
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [messageInput, setMessageInput] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [staffUsers, setStaffUsers] = useState([]);

  // Modals & Popover state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeSearch, setComposeSearch] = useState("");
  const [isChannelOpen, setIsChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  // Channel Members Popover & Add People Modal
  const [isMembersPopoverOpen, setIsMembersPopoverOpen] = useState(false);
  const [isAddPeopleModalOpen, setIsAddPeopleModalOpen] = useState(false);
  const [addPeopleSearch, setAddPeopleSearch] = useState("");
  const [selectedStaffToAdd, setSelectedStaffToAdd] = useState([]);

  // Delete & Leave Channel & Remove Member Modal states
  const [isDeleteChannelModalOpen, setIsDeleteChannelModalOpen] = useState(false);
  const [deletingChannel, setDeletingChannel] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removingMember, setRemovingMember] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leavingChannel, setLeavingChannel] = useState(false);

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
        setConversations(res.data.conversations);
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

  // Fetch Members for Active Conversation
  const fetchConversationMembers = useCallback(
    async (convId) => {
      if (!token || !convId) return;
      try {
        const res = await CommunicationService.getConversationMembers(convId, token);
        if (res && res.data && res.data.members) {
          setMembers(res.data.members);
        } else {
          setMembers([]);
        }
      } catch (err) {
        setMembers([]);
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

  // Handle opening conversation from URL query parameters (e.g. /communication?convId=12&type=direct)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const convIdParam = params.get("convId");
    const typeParam = params.get("type");

    if (convIdParam && conversations.length > 0) {
      const parsedId = parseInt(convIdParam, 10);
      const targetConv = conversations.find((c) => c.id === parsedId);

      if (targetConv) {
        if (targetConv.type === "direct" || targetConv.type === "channel") {
          setActiveTab(targetConv.type);
        } else if (typeParam) {
          setActiveTab(typeParam);
        }
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
    fetchConversationMembers(activeConvId);
    markAsRead(activeConvId);

    const msgInterval = setInterval(() => {
      fetchMessages(activeConvId, true);
    }, 3000);

    return () => clearInterval(msgInterval);
  }, [activeConvId, fetchMessages, fetchConversationMembers, markAsRead]);

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

  // Create Channel Conversation
  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      const res = await CommunicationService.createChannel(newChannelName, token);
      if (res && res.data && res.data.channel) {
        const ch = res.data.channel;
        setIsChannelOpen(false);
        setNewChannelName("");
        await fetchConversations();
        setActiveConvId(ch.id);
      }
    } catch (err) {
      alert(err.message || "Failed to create channel.");
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

  // Add Selected Staff Members to Channel (Persisted in PostgreSQL database)
  const handleAddSelectedStaff = async () => {
    if (selectedStaffToAdd.length === 0 || !activeConvId) return;

    try {
      const res = await CommunicationService.addConversationMembers(
        activeConvId,
        selectedStaffToAdd,
        token
      );

      if (res && res.data && res.data.members) {
        setMembers(res.data.members);
      } else {
        await fetchConversationMembers(activeConvId);
      }
    } catch (err) {
      console.error("Failed to persist members in backend:", err);
      const newStaffMembers = staffUsers
        .filter((st) => selectedStaffToAdd.includes(st.id))
        .map((st) => ({
          user_id: st.id,
          member_id: st.id,
          name: st.name,
          email: st.email,
          role_name: st.role_name || "Staff",
          joined_at: new Date().toISOString(),
        }));

      setMembers((prev) => {
        const existingUserIds = new Set(prev.map((m) => m.user_id || m.id));
        const toAdd = newStaffMembers.filter((m) => !existingUserIds.has(m.user_id));
        return [...prev, ...toAdd];
      });
    } finally {
      setIsAddPeopleModalOpen(false);
      setSelectedStaffToAdd([]);
      setAddPeopleSearch("");
      fetchConversationMembers(activeConvId);
    }
  };

  // Handle Confirm Remove Member from Channel
  const handleConfirmRemoveMember = async () => {
    if (!activeConvId || !memberToRemove || removingMember) return;

    setRemovingMember(true);
    try {
      const res = await CommunicationService.removeConversationMember(activeConvId, memberToRemove.id, token);
      if (res && res.data && res.data.members) {
        setMembers(res.data.members);
      } else {
        fetchConversationMembers(activeConvId);
      }
      setMemberToRemove(null);
    } catch (err) {
      alert(err.message || "Failed to remove member.");
    } finally {
      setRemovingMember(false);
    }
  };

  // Handle Confirm Leave Channel
  const handleConfirmLeaveChannel = async () => {
    if (!activeConvId || leavingChannel) return;

    const channelIdToLeave = activeConvId;
    setLeavingChannel(true);
    try {
      const res = await CommunicationService.leaveChannel(channelIdToLeave, token);
      if (res && res.success) {
        setConversations((prev) => prev.filter((c) => c.id !== channelIdToLeave));
        setActiveConvId(null);
        setMessages([]);
        setMembers([]);
        setIsMembersPopoverOpen(false);
        setIsLeaveModalOpen(false);
      }
    } catch (err) {
      alert(err.message || "Failed to leave channel.");
    } finally {
      setLeavingChannel(false);
    }
  };

  // Handle Delete Channel
  const handleDeleteChannel = async () => {
    if (!activeConvId || !activeConversation || activeConversation.type !== "channel" || deletingChannel) return;

    const channelIdToDelete = activeConvId;
    setDeletingChannel(true);

    try {
      const res = await CommunicationService.deleteChannel(channelIdToDelete, token);
      if (res && res.success) {
        setConversations((prev) => prev.filter((c) => c.id !== channelIdToDelete));
        setActiveConvId(null);
        setMessages([]);
        setMembers([]);
        setIsMembersPopoverOpen(false);
        setIsDeleteChannelModalOpen(false);
      }
    } catch (err) {
      alert(err.message || "Unable to delete the channel. Please try again.");
    } finally {
      setDeletingChannel(false);
    }
  };

  // Filter conversations based on tab (direct vs channels) and search
  const filteredConversations = conversations.filter((c) => {
    const isTabMatch = activeTab === "direct" ? c.type === "direct" : c.type === "channel";
    if (!isTabMatch) return false;
    if (!searchQuery.trim()) return true;
    return c.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const isChannel = activeConversation?.type === "channel";

  // Single Source of Truth: Backend Capability Flags with Safe Fallbacks
  const canManageChannel = isChannel && Boolean(
    activeConversation?.can_manage_channel ??
    (user?.role?.name === "Admin" ||
      activeConversation?.created_by === user?.id ||
      activeConversation?.created_by_user_id === user?.id)
  );

  const canAddMembers = isChannel && Boolean(
    activeConversation?.can_add_members ?? canManageChannel
  );

  const canRemoveMembers = isChannel && Boolean(
    activeConversation?.can_remove_members ?? canManageChannel
  );

  const canDeleteChannel = isChannel && Boolean(
    activeConversation?.can_delete_channel ?? canManageChannel
  );

  const canLeaveChannel = isChannel && Boolean(
    activeConversation?.can_leave_channel ??
    (user?.id !== activeConversation?.created_by &&
      user?.id !== activeConversation?.created_by_user_id)
  );

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
                title={activeTab === "direct" ? "New Direct Chat" : "Create Channel"}
                onClick={() => {
                  if (activeTab === "direct") {
                    setIsComposeOpen(true);
                    fetchStaffUsers("");
                  } else {
                    setIsChannelOpen(true);
                  }
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
                  placeholder="Search communications..."
                  className="chat-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="comm-tabs-nav">
            <button
              type="button"
              className={`comm-tab-btn ${activeTab === "direct" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("direct");
                setIsMembersPopoverOpen(false);
                if (activeConversation && activeConversation.type !== "direct") {
                  setActiveConvId(null);
                }
              }}
            >
              <UserCheck size={14} />
              <span>Direct</span>
            </button>
            <button
              type="button"
              className={`comm-tab-btn ${activeTab === "channels" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("channels");
                setIsMembersPopoverOpen(false);
                if (activeConversation && activeConversation.type !== "channel") {
                  setActiveConvId(null);
                }
              }}
            >
              <Hash size={14} />
              <span>Channels</span>
            </button>
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
                  {activeTab === "direct" ? <MessageSquare size={20} /> : <Hash size={20} />}
                </div>
                <h4 className="comm-empty-title">
                  {activeTab === "direct" ? "No direct conversations yet" : "No channels yet"}
                </h4>
                <p className="comm-empty-desc">
                  {activeTab === "direct"
                    ? "Click '+' to start a message with a staff member."
                    : "Click '+' to create a new team channel."}
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
                        {conv.type === "direct" ? (
                          getInitials(conv.name)
                        ) : (
                          <Hash size={18} />
                        )}
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
                Choose a direct message or team channel from the left panel to collaborate in real-time.
              </p>
              <div className="comm-security-badge">
                <ShieldAlert size={13} />
                <span>Encrypted Team Communication</span>
              </div>
            </div>
          ) : (
            <div className="comm-chat-view-container">
              {/* Chat View Header with Avatar & Name (Members icon & count ONLY for channels) */}
              <div className="comm-chat-header">
                <div className="comm-chat-header-info">
                  <div className="comm-chat-avatar">
                    {activeConversation.type === "direct" ? (
                      getInitials(activeConversation.name)
                    ) : (
                      <Hash size={20} />
                    )}
                  </div>
                  <div className="comm-chat-title-group">
                    <h3 className="comm-chat-title">{activeConversation.name}</h3>

                    {/* Members Count Badge Button - ONLY FOR CHANNELS */}
                    {activeConversation.type === "channel" && (
                      <button
                        type="button"
                        className={`comm-header-members-btn ${isMembersPopoverOpen ? "active" : ""}`}
                        onClick={() => setIsMembersPopoverOpen((prev) => !prev)}
                        title="Manage Channel Members"
                      >
                        <Users size={15} className="comm-members-icon" />
                        <span className="comm-members-count">
                          {members.length > 0 ? members.length : 1} {members.length === 1 ? "member" : "members"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Header Action Menu - ONLY FOR CHANNELS */}
                {activeConversation.type === "channel" && (
                  <div className="comm-chat-header-actions">
                    <button
                      type="button"
                      className={`comm-chat-header-action-btn ${isMembersPopoverOpen ? "active" : ""}`}
                      onClick={() => setIsMembersPopoverOpen((prev) => !prev)}
                      title="Channel Members Options"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Manage Members Popover / Compact Panel - ONLY FOR CHANNELS */}
              {activeConversation.type === "channel" && isMembersPopoverOpen && (
                <div className="comm-members-popover">
                  <div className="comm-popover-header">
                    <div className="comm-popover-title-row">
                      <h4 className="comm-popover-channel-name">{activeConversation.name}</h4>
                      <button
                        type="button"
                        className="btn-popover-close"
                        onClick={() => setIsMembersPopoverOpen(false)}
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <span className="comm-popover-count">
                      {members.length > 0 ? members.length : 1} {members.length === 1 ? "member" : "members"}
                    </span>
                  </div>

                  <div className="comm-popover-section">
                    <span className="comm-popover-section-label">Members</span>
                    <div className="comm-popover-divider" />

                    <div className="comm-popover-members-list">
                      {members.length === 0 ? (
                        <div className="comm-popover-member-item">
                          <div className="comm-member-avatar">{getInitials(activeConversation.name)}</div>
                          <div className="comm-member-info">
                            <span className="comm-member-name">{activeConversation.name}</span>
                          </div>
                          <span className="comm-member-role-tag">Staff</span>
                        </div>
                      ) : (
                        members.map((m) => {
                          const mUserId = m.user_id || m.id;
                          const ownerId = activeConversation.created_by || activeConversation.created_by_user_id;
                          const isMemberOwner = mUserId === ownerId;
                          const canRemoveThisMember = canRemoveMembers && !isMemberOwner;

                          return (
                            <div key={m.user_id || m.member_id || m.id} className="comm-popover-member-item">
                              <div className="comm-member-avatar">{getInitials(m.name)}</div>
                              <div className="comm-member-info">
                                <span className="comm-member-name">{m.name}</span>
                              </div>
                              {isMemberOwner ? (
                                <span className="comm-member-role-tag owner">Owner</span>
                              ) : (
                                <span className="comm-member-role-tag">{m.role_name || "Staff"}</span>
                              )}

                              {canRemoveThisMember && (
                                <button
                                  type="button"
                                  className="btn-remove-member-sm"
                                  title="Remove Member"
                                  onClick={() => setMemberToRemove({ id: mUserId, name: m.name })}
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="comm-popover-footer">
                    {canAddMembers && (
                      <button
                        type="button"
                        className="btn-add-people-popover"
                        onClick={() => {
                          setIsMembersPopoverOpen(false);
                          setIsAddPeopleModalOpen(true);
                          setSelectedStaffToAdd([]);
                          setAddPeopleSearch("");
                          fetchStaffUsers("");
                        }}
                      >
                        <UserPlus size={15} />
                        <span>+ Add People</span>
                      </button>
                    )}

                    {canLeaveChannel && (
                      <button
                        type="button"
                        className="btn-leave-channel-popover"
                        onClick={() => {
                          setIsMembersPopoverOpen(false);
                          setIsLeaveModalOpen(true);
                        }}
                      >
                        <LogOut size={15} />
                        <span>Leave Channel</span>
                      </button>
                    )}

                    {canDeleteChannel && (
                      <button
                        type="button"
                        className="btn-delete-channel-popover"
                        onClick={() => {
                          setIsMembersPopoverOpen(false);
                          setIsDeleteChannelModalOpen(true);
                        }}
                      >
                        <Trash2 size={15} />
                        <span>Delete Channel</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

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

                    // Show sender name ONLY in channel chats for the first message of a consecutive sender group
                    const showSenderName = !isMine && activeConversation?.type === "channel" && !isSameSenderAsPrev;

                    return (
                      <div
                        key={msg.id}
                        className={`comm-msg-row ${isMine ? "mine" : "other"} ${isSameSenderAsPrev ? "grouped" : ""}`}
                      >
                        {showSenderName && (
                          <span className="comm-msg-sender-name">{msg.sender_name}</span>
                        )}

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

        {/* MODAL 1: COMPOSE DIRECT CHAT MODAL */}
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

        {/* MODAL 2: CREATE CHANNEL MODAL */}
        {isChannelOpen && (
          <div className="comm-modal-backdrop" onClick={() => setIsChannelOpen(false)}>
            <div className="comm-modal-card" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
              <div className="comm-modal-header">
                <h3>Create New Channel</h3>
                <button
                  type="button"
                  className="btn-close-comm-modal"
                  onClick={() => setIsChannelOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateChannel}>
                <div className="comm-modal-body">
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label className="form-label" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#0f172a" }}>
                      Channel Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. #general, #announcements"
                      className="form-input"
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none" }}
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="comm-modal-footer">
                  <button
                    type="button"
                    className="btn-cancel"
                    style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "none", cursor: "pointer" }}
                    onClick={() => setIsChannelOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-save"
                    style={{ padding: "8px 16px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                  >
                    Create Channel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: ADD PEOPLE TO CHANNEL MODAL */}
        {isAddPeopleModalOpen && activeConversation && (
          <div className="comm-modal-backdrop" onClick={() => setIsAddPeopleModalOpen(false)}>
            <div className="comm-modal-card" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
              <div className="comm-modal-header">
                <h3>Add people to {activeConversation.name}</h3>
                <button
                  type="button"
                  className="btn-close-comm-modal"
                  onClick={() => setIsAddPeopleModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="comm-modal-body">
                {/* Search Input */}
                <div className="chat-search-bar" style={{ padding: 0, marginBottom: "16px", borderBottom: "none" }}>
                  <div className="chat-search-input-wrapper">
                    <Search size={15} className="chat-search-icon" />
                    <input
                      type="text"
                      placeholder="Search staff..."
                      className="chat-search-input"
                      value={addPeopleSearch}
                      onChange={(e) => setAddPeopleSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Staff List with Checkboxes */}
                <div className="comm-add-people-list">
                  {staffUsers
                    .filter((st) => {
                      if (!addPeopleSearch.trim()) return true;
                      const q = addPeopleSearch.toLowerCase();
                      return (
                        st.name.toLowerCase().includes(q) ||
                        (st.email && st.email.toLowerCase().includes(q))
                      );
                    })
                    .map((st) => {
                      const isAlreadyMember = members.some(
                        (m) => (m.user_id || m.id) === st.id
                      );
                      const isChecked = isAlreadyMember || selectedStaffToAdd.includes(st.id);

                      return (
                        <label
                          key={st.id}
                          className={`comm-add-people-item ${isAlreadyMember ? "already-member" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isAlreadyMember}
                            onChange={() => {
                              if (isAlreadyMember) return;
                              setSelectedStaffToAdd((prev) =>
                                prev.includes(st.id)
                                  ? prev.filter((id) => id !== st.id)
                                  : [...prev, st.id]
                              );
                            }}
                            className="comm-checkbox-input"
                          />
                          <div className="comm-staff-avatar-sm">
                            {getInitials(st.name)}
                          </div>
                          <div className="comm-staff-info-inline">
                            <span className="comm-staff-name-text">{st.name}</span>
                            <span className="comm-staff-email-text">{st.email}</span>
                          </div>
                          <span className="comm-staff-role-badge">{st.role_name || "Staff"}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="comm-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  style={{ padding: "8px 16px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "none", cursor: "pointer", fontSize: "0.8125rem", fontWeight: "600", color: "#475569" }}
                  onClick={() => setIsAddPeopleModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-save"
                  style={{ padding: "8px 16px", background: selectedStaffToAdd.length > 0 ? "#2563eb" : "#94a3b8", color: "#ffffff", border: "none", borderRadius: "8px", cursor: selectedStaffToAdd.length > 0 ? "pointer" : "not-allowed", fontWeight: "600", fontSize: "0.8125rem" }}
                  disabled={selectedStaffToAdd.length === 0}
                  onClick={handleAddSelectedStaff}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: DELETE CHANNEL CONFIRMATION MODAL */}
        {isDeleteChannelModalOpen && activeConversation && activeConversation.type === "channel" && (
          <div
            className="comm-modal-backdrop"
            onClick={() => !deletingChannel && setIsDeleteChannelModalOpen(false)}
          >
            <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="comm-modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Trash2 size={18} color="#dc2626" />
                  <h3>Delete Channel?</h3>
                </div>
                <button
                  type="button"
                  className="btn-close-comm-modal"
                  disabled={deletingChannel}
                  onClick={() => setIsDeleteChannelModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="comm-modal-body">
                <p style={{ fontSize: "0.875rem", color: "#334155", lineHeight: "1.5", margin: 0 }}>
                  Are you sure you want to delete <strong>{activeConversation.name}</strong>? This action cannot be undone and all channel messages will be deleted.
                </p>
              </div>

              <div className="comm-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: deletingChannel ? "not-allowed" : "pointer"
                  }}
                  disabled={deletingChannel}
                  onClick={() => setIsDeleteChannelModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger-submit"
                  disabled={deletingChannel}
                  onClick={handleDeleteChannel}
                >
                  {deletingChannel ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} />
                      <span>Delete Channel</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: REMOVE MEMBER CONFIRMATION MODAL */}
        {memberToRemove && activeConversation && activeConversation.type === "channel" && (
          <div
            className="comm-modal-backdrop"
            onClick={() => !removingMember && setMemberToRemove(null)}
          >
            <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="comm-modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Trash2 size={18} color="#dc2626" />
                  <h3>Remove {memberToRemove.name}?</h3>
                </div>
                <button
                  type="button"
                  className="btn-close-comm-modal"
                  disabled={removingMember}
                  onClick={() => setMemberToRemove(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="comm-modal-body">
                <p style={{ fontSize: "0.875rem", color: "#334155", lineHeight: "1.5", margin: 0 }}>
                  Are you sure you want to remove <strong>{memberToRemove.name}</strong> from the channel?
                </p>
              </div>

              <div className="comm-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: removingMember ? "not-allowed" : "pointer"
                  }}
                  disabled={removingMember}
                  onClick={() => setMemberToRemove(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger-submit"
                  disabled={removingMember}
                  onClick={handleConfirmRemoveMember}
                >
                  {removingMember ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} />
                      <span>Remove Member</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 5: LEAVE CHANNEL CONFIRMATION MODAL */}
        {isLeaveModalOpen && activeConversation && activeConversation.type === "channel" && (
          <div
            className="comm-modal-backdrop"
            onClick={() => !leavingChannel && setIsLeaveModalOpen(false)}
          >
            <div className="comm-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="comm-modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <LogOut size={18} color="#64748b" />
                  <h3>Leave Channel?</h3>
                </div>
                <button
                  type="button"
                  className="btn-close-comm-modal"
                  disabled={leavingChannel}
                  onClick={() => setIsLeaveModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="comm-modal-body">
                <p style={{ fontSize: "0.875rem", color: "#334155", lineHeight: "1.5", margin: 0 }}>
                  Are you sure you want to leave <strong>{activeConversation.name}</strong>?
                </p>
              </div>

              <div className="comm-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: leavingChannel ? "not-allowed" : "pointer"
                  }}
                  disabled={leavingChannel}
                  onClick={() => setIsLeaveModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger-submit"
                  style={{ background: "#475569", borderColor: "#475569" }}
                  disabled={leavingChannel}
                  onClick={handleConfirmLeaveChannel}
                >
                  {leavingChannel ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Leaving...</span>
                    </>
                  ) : (
                    <>
                      <LogOut size={15} />
                      <span>Leave Channel</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Communication;
