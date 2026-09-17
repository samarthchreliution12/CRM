import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import DashboardService from "../../services/dashboard.service";
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
    </div>
  );
};

export default UpcomingBirthdaysCard;
