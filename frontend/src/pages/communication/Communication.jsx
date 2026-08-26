import React, { useState } from "react";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import {
  MessageSquare,
  Search,
  Plus,
  ShieldAlert,
  Send,
  Hash,
  UserCheck,
} from "lucide-react";
import "./Communication.css";

const Communication = () => {
  const [activeTab, setActiveTab] = useState("direct"); // 'direct' | 'channels'
  const [searchQuery, setSearchQuery] = useState("");

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
                title="New Conversation"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Search Box */}
            <div className="comm-search-box">
              <Search size={14} className="comm-search-icon" />
              <input
                type="text"
                placeholder="Search communications..."
                className="comm-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="comm-tabs-nav">
            <button
              type="button"
              className={`comm-tab-btn ${activeTab === "direct" ? "active" : ""}`}
              onClick={() => setActiveTab("direct")}
            >
              <UserCheck size={14} />
              <span>Direct</span>
            </button>
            <button
              type="button"
              className={`comm-tab-btn ${activeTab === "channels" ? "active" : ""}`}
              onClick={() => setActiveTab("channels")}
            >
              <Hash size={14} />
              <span>Channels</span>
            </button>
          </div>

          {/* Left Panel Empty State */}
          <div className="comm-sidebar-body">
            <div className="comm-list-empty-state">
              <div className="comm-empty-icon-box">
                {activeTab === "direct" ? <MessageSquare size={20} /> : <Hash size={20} />}
              </div>
              <h4 className="comm-empty-title">No conversations yet</h4>
              <p className="comm-empty-desc">
                {activeTab === "direct"
                  ? "Start a conversation with your team to communicate internally."
                  : "No team channels joined yet."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: Main Conversation Area */}
        <div className="comm-main-panel">
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
        </div>
      </div>
    </AppLayout>
  );
};

export default Communication;
