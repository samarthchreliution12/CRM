import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, X, Search, Users, ShieldAlert, Maximize2 } from "lucide-react";
import "./InternalChat.css";

const InternalChat = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Do NOT render floating chat widget on the Communication page itself
  if (location.pathname === "/communication") {
    return null;
  }

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const closeChat = () => {
    setIsOpen(false);
    setShowSearch(false);
    setSearchQuery("");
  };

  const handleFullscreenClick = () => {
    closeChat();
    navigate("/communication");
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
              <h3 className="chat-panel-title">Internal Chat</h3>
              <div className="chat-team-online-badge">
                <span className="online-dot" />
                <span>Team Online</span>
              </div>
            </div>

            <div className="chat-header-actions">
              <button
                type="button"
                className="chat-action-btn"
                onClick={() => setShowSearch((prev) => !prev)}
                title="Search Team Conversations"
              >
                <Search size={16} />
              </button>

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

          {/* Search Bar (Collapsible) */}
          {showSearch && (
            <div className="chat-search-bar">
              <Search size={15} className="chat-search-icon" />
              <input
                type="text"
                placeholder="Search team members..."
                className="chat-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {/* Panel Body / Clean Empty State */}
          <div className="chat-panel-body">
            <div className="chat-empty-state">
              <div className="chat-empty-icon-wrapper">
                <Users size={32} />
              </div>
              <h4 className="chat-empty-title">No conversations yet</h4>
              <p className="chat-empty-subtitle">
                Start a conversation with your team members to collaborate seamlessly.
              </p>
              <div className="chat-empty-badge">
                <ShieldAlert size={13} />
                <span>Encrypted Team Communication</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternalChat;
