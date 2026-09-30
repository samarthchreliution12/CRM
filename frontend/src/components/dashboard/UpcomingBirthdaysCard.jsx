import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import DashboardService from "../../services/dashboard.service";
import WhatsAppService from "../../services/whatsapp.service";
import {
  Cake,
  Gift,
  Calendar,
  ArrowRight,
  Search,
  X,
  Loader2,
  AlertCircle,
  PartyPopper,
  MessageCircle,
  Check,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Send,
} from "lucide-react";
import "./UpcomingBirthdaysCard.css";

const getInitials = (name) => {
  if (!name) return "CL";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const capitalizeWords = (str) => {
  if (!str) return "";
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const UpcomingBirthdaysCard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");

  // Confirmation Modal States
  const [confirmModalClient, setConfirmModalClient] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [isSendingWish, setIsSendingWish] = useState(false);
  const [sendFeedback, setSendFeedback] = useState(null);

  const fetchBirthdays = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await DashboardService.getUpcomingBirthdays(token);
      if (response && response.success && response.data) {
        setBirthdays(response.data.birthdays || []);
      } else {
        setBirthdays([]);
      }
    } catch (err) {
      if (err.statusCode === 403) {
        setError("Permission denied: You do not have permission to view client birthdays.");
      } else {
        setError(err.message || "Failed to load upcoming birthdays.");
      }
      setBirthdays([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBirthdays();
  }, [fetchBirthdays]);

  const handleClientClick = (clientId) => {
    if (clientId) {
      navigate(`/clients/${clientId}`);
    }
  };

  const handleViewAllClick = () => {
    setIsModalOpen(true);
  };

  // Open Birthday Confirmation Modal
  const handleOpenBirthdayModal = async (client, e) => {
    if (e) e.stopPropagation();
    setConfirmModalClient(client);
    setPreviewData(null);
    setPreviewError("");
    setSendFeedback(null);
    setPreviewLoading(true);

    try {
      const response = await WhatsAppService.getBirthdayPreview(client.id, token);
      if (response && response.success && response.data) {
        setPreviewData(response.data);
      } else {
        setPreviewError(response?.message || "Failed to load birthday template preview.");
      }
    } catch (err) {
      console.error("Failed to load birthday preview:", err);
      setPreviewError(err.message || "Failed to load birthday template preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCloseBirthdayModal = () => {
    setConfirmModalClient(null);
    setPreviewData(null);
    setPreviewError("");
    setSendFeedback(null);
    setIsSendingWish(false);
  };

  // Execute Manual Send of Birthday Wish
  const handleSendBirthdayWish = async () => {
    if (!confirmModalClient || isSendingWish) return;
    setIsSendingWish(true);
    setSendFeedback(null);

    try {
      const response = await WhatsAppService.sendBirthdayWish(confirmModalClient.id, token);
      if (response && response.success) {
        setSendFeedback({
          type: "success",
          message: response.message || `Birthday wish successfully sent to ${confirmModalClient.name}!`,
        });

        // Update local birthdays list to mark as sent
        setBirthdays((prev) =>
          prev.map((b) =>
            b.id === confirmModalClient.id
              ? { ...b, birthday_wish_sent: true, birthday_wish_sent_at: new Date().toISOString() }
              : b
          )
        );
      } else {
        setSendFeedback({
          type: "danger",
          message: response?.message || "Failed to send birthday greeting.",
        });
      }
    } catch (err) {
      console.error("Birthday wish send error:", err);
      setSendFeedback({
        type: "danger",
        message: err.message || "Failed to deliver WhatsApp message via provider.",
      });
    } finally {
      setIsSendingWish(false);
    }
  };

  const previewItems = birthdays.slice(0, 4);

  const filteredModalBirthdays = birthdays.filter((item) =>
    item.name.toLowerCase().includes(modalSearch.toLowerCase())
  );

  return (
    <div className="birthdays-card">
      {/* Card Header */}
      <div className="birthdays-card-header">
        <div className="birthdays-card-title-group">
          <div className="birthdays-header-icon">
            <Cake size={18} />
          </div>
          <h3 className="birthdays-card-title">Upcoming Birthdays</h3>
          {!loading && !error && (
            <span className="birthdays-card-count-badge">{birthdays.length}</span>
          )}
        </div>

        {birthdays.length > 0 && (
          <button
            className="birthdays-view-all-btn"
            onClick={handleViewAllClick}
            type="button"
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Card Body / States */}
      {loading ? (
        <div className="birthdays-loading-state">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading birthdays...</span>
        </div>
      ) : error ? (
        <div className="birthdays-error-state">
          <AlertCircle size={18} color="#ef4444" />
          <span>{error}</span>
        </div>
      ) : birthdays.length === 0 ? (
        <div className="birthdays-empty-state">
          <div className="birthdays-empty-icon">
            <Calendar size={24} />
          </div>
          <h4 className="birthdays-empty-title">No upcoming birthdays</h4>
          <p className="birthdays-empty-desc">
            All client birthdays are up to date.
          </p>
        </div>
      ) : (
        <div className="birthdays-list">
          {previewItems.map((item) => {
            const isToday = item.days_until_birthday === 0;
            const isTomorrow = item.days_until_birthday === 1;

            let badgeClass = "upcoming";
            if (isToday) badgeClass = "today";
            else if (isTomorrow) badgeClass = "tomorrow";

            return (
              <div
                key={item.id}
                className="birthday-item"
                onClick={() => handleClientClick(item.id)}
                title={`View ${capitalizeWords(item.name)}'s profile`}
              >
                <div className="birthday-item-left">
                  <div className={`birthday-avatar ${isToday ? "today" : ""}`}>
                    {getInitials(item.name)}
                  </div>
                  <div className="birthday-info">
                    <h4 className="birthday-name">{capitalizeWords(item.name)}</h4>
                    <p className="birthday-age">
                      {item.age !== null ? `${item.age} years` : "Age N/A"}
                    </p>
                  </div>
                </div>

                <div className="birthday-item-right">
                  {/* If Birthday is Today: Render Send Birthday Wish or Wish Sent Badge */}
                  {isToday && (
                    item.birthday_wish_sent ? (
                      <span
                        className="birthday-wish-sent-badge"
                        title="Birthday greeting already sent for this calendar year"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Check size={12} />
                        <span>Wish Sent</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="birthday-wish-btn"
                        onClick={(e) => handleOpenBirthdayModal(item, e)}
                        title="Send Birthday Wish via WhatsApp"
                      >
                        <MessageCircle size={13} />
                        <span>Send Wish</span>
                      </button>
                    )
                  )}

                  <span className={`birthday-badge ${badgeClass}`}>
                    {item.relative_label}
                  </span>
                  {isToday ? (
                    <PartyPopper size={15} className="birthday-icon" />
                  ) : (
                    <Gift size={15} className="birthday-icon" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View All Modal */}
      {isModalOpen && (
        <div
          className="birthdays-modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="birthdays-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="birthdays-modal-header">
              <h3 className="birthdays-modal-title">
                <Cake size={20} color="#9E241D" />
                Upcoming Birthdays ({birthdays.length})
              </h3>
              <button
                className="birthdays-modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="birthdays-modal-body">
              <div className="birthdays-modal-search">
                <Search size={16} className="birthdays-modal-search-icon" />
                <input
                  type="text"
                  placeholder="Search client by name..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                />
              </div>

              <div className="birthdays-modal-list">
                {filteredModalBirthdays.length === 0 ? (
                  <div className="birthdays-empty-state">
                    <p className="birthdays-empty-desc">No matching clients found.</p>
                  </div>
                ) : (
                  filteredModalBirthdays.map((item) => {
                    const isToday = item.days_until_birthday === 0;
                    const isTomorrow = item.days_until_birthday === 1;

                    let badgeClass = "upcoming";
                    if (isToday) badgeClass = "today";
                    else if (isTomorrow) badgeClass = "tomorrow";

                    return (
                      <div
                        key={item.id}
                        className="birthday-item"
                        onClick={() => {
                          setIsModalOpen(false);
                          handleClientClick(item.id);
                        }}
                      >
                        <div className="birthday-item-left">
                          <div className={`birthday-avatar ${isToday ? "today" : ""}`}>
                            {getInitials(item.name)}
                          </div>
                          <div className="birthday-info">
                            <h4 className="birthday-name">{capitalizeWords(item.name)}</h4>
                            <p className="birthday-age">
                              {item.age !== null ? `${item.age} years old` : "Age N/A"} • DOB: {item.dob}
                            </p>
                          </div>
                        </div>

                        <div className="birthday-item-right">
                          {isToday && (
                            item.birthday_wish_sent ? (
                              <span
                                className="birthday-wish-sent-badge"
                                title="Birthday greeting already sent for this calendar year"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Check size={12} />
                                <span>Wish Sent</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="birthday-wish-btn"
                                onClick={(e) => handleOpenBirthdayModal(item, e)}
                                title="Send Birthday Wish via WhatsApp"
                              >
                                <MessageCircle size={13} />
                                <span>Send Wish</span>
                              </button>
                            )
                          )}

                          <span className={`birthday-badge ${badgeClass}`}>
                            {item.relative_label}
                          </span>
                          {isToday ? (
                            <PartyPopper size={16} className="birthday-icon" />
                          ) : (
                            <Gift size={16} className="birthday-icon" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="birthdays-modal-footer">
              <button
                className="birthdays-modal-btn-secondary"
                onClick={() => setIsModalOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Send Birthday Wish via WhatsApp */}
      {confirmModalClient && (
        <div
          className="birthdays-modal-overlay"
          onClick={handleCloseBirthdayModal}
          style={{ zIndex: 10000 }}
        >
          <div
            className="bday-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bday-confirm-header">
              <div className="bday-confirm-title-group">
                <div className="bday-confirm-icon-box">
                  <Cake size={20} />
                </div>
                <div>
                  <h3 className="bday-confirm-title">Send Birthday Wish</h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Manual WhatsApp Greeting via ChatterPillar
                  </span>
                </div>
              </div>

              <button
                className="birthdays-modal-close-btn"
                onClick={handleCloseBirthdayModal}
                type="button"
                disabled={isSendingWish}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="bday-confirm-body">
              {/* Feedback Alerts */}
              {sendFeedback && (
                <div
                  className={`bday-alert-banner ${
                    sendFeedback.type === "danger" ? "bday-alert-danger" : "bday-alert-success"
                  }`}
                >
                  {sendFeedback.type === "danger" ? (
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  ) : (
                    <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  )}
                  <div>{sendFeedback.message}</div>
                </div>
              )}

              {/* Client Summary Grid */}
              <div className="bday-client-summary">
                <div className="bday-client-field">
                  <span className="bday-field-label">Recipient Client</span>
                  <span className="bday-field-value">{confirmModalClient.name}</span>
                </div>

                <div className="bday-client-field">
                  <span className="bday-field-label">WhatsApp Number</span>
                  <span className="bday-field-value" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Phone size={13} color="#16a34a" />
                    {confirmModalClient.whatsapp_no || confirmModalClient.mobile_no || (
                      <span style={{ color: "#dc2626" }}>Not Provided</span>
                    )}
                  </span>
                </div>

                <div className="bday-client-field">
                  <span className="bday-field-label">Date of Birth</span>
                  <span className="bday-field-value">{confirmModalClient.dob}</span>
                </div>

                <div className="bday-client-field">
                  <span className="bday-field-label">Turning Age</span>
                  <span className="bday-field-value">
                    {confirmModalClient.age !== null ? `${confirmModalClient.age} Years Old` : "N/A"}
                  </span>
                </div>
              </div>

              {/* Preview & Validation Details */}
              {previewLoading ? (
                <div style={{ padding: "2rem 1rem", textAlign: "center", color: "#64748b" }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem auto" }} />
                  <div style={{ fontSize: "0.875rem" }}>Loading Birthday Template & Preview...</div>
                </div>
              ) : previewError ? (
                <div className="bday-alert-banner bday-alert-danger">
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>{previewError}</div>
                </div>
              ) : previewData ? (
                <div className="bday-template-section">
                  <div className="bday-section-label">
                    <span>
                      Template: <strong>{previewData.template?.template_name || "None"}</strong>
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px",
                        fontWeight: 700,
                      }}
                    >
                      {previewData.template?.status || "ACTIVE"}
                    </span>
                  </div>

                  {/* Read-Only WhatsApp Chat Bubble Preview */}
                  <div className="bday-preview-bubble">
                    <div className="bday-chat-bubble">
                      {previewData.template?.header_content && (
                        <div className="bday-bubble-header">
                          {previewData.template.header_content}
                        </div>
                      )}

                      <div className="bday-bubble-body">
                        {previewData.rendered_body || "No message body preview available."}
                      </div>

                      {previewData.template?.footer_content && (
                        <div className="bday-bubble-footer">
                          {previewData.template.footer_content}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Missing Variables Warning */}
                  {previewData.missing_variables && previewData.missing_variables.length > 0 && (
                    <div className="bday-alert-banner bday-alert-warning">
                      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <strong>Missing Template Variables:</strong>
                        <ul style={{ margin: "0.25rem 0 0 1.25rem", padding: 0 }}>
                          {previewData.missing_variables.map((mv, idx) => (
                            <li key={idx}>
                              <code>{`{{${mv.token}}}`}</code> - {mv.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Send Block Reasons */}
                  {!previewData.can_send && previewData.send_block_reasons?.length > 0 && (
                    <div className="bday-alert-banner bday-alert-danger">
                      <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <strong>Cannot Send Greeting:</strong>
                        <ul style={{ margin: "0.25rem 0 0 1.25rem", padding: 0 }}>
                          {previewData.send_block_reasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Modal Footer Actions */}
            <div className="bday-confirm-footer">
              <button
                type="button"
                className="birthdays-modal-btn-secondary"
                onClick={handleCloseBirthdayModal}
                disabled={isSendingWish}
              >
                {sendFeedback?.type === "success" ? "Done" : "Cancel"}
              </button>

              {sendFeedback?.type !== "success" && (
                <button
                  type="button"
                  className="bday-btn-send"
                  onClick={handleSendBirthdayWish}
                  disabled={!previewData?.can_send || isSendingWish || previewLoading}
                  title={
                    !previewData?.can_send
                      ? "Resolve blocking issues above before sending"
                      : "Send manual WhatsApp birthday greeting"
                  }
                >
                  {isSendingWish ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending Birthday Wish...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Send Birthday Wish</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingBirthdaysCard;
