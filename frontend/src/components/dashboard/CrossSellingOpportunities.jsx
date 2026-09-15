import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import DashboardService from "../../services/dashboard.service";
import { ArrowRight, TrendingUp, PieChart, AlertCircle } from "lucide-react";
import "./CrossSellingOpportunities.css";

const CrossSellingOpportunities = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const isAdmin = user?.role?.name === "Admin" || user?.role === "Admin" || user?.role_name === "Admin";
  const canViewClients = isAdmin || permissions.includes("client.view") || permissions.includes("client.read");

  const [stats, setStats] = useState({
    equityWithoutMutualFund: { count: 0 },
    mutualFundWithoutEquity: { count: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCrossSellingData = useCallback(async () => {
    if (!token || !canViewClients) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await DashboardService.getCrossSelling(token);
      if (response && response.success && response.data) {
        setStats({
          equityWithoutMutualFund: {
            count: response.data.equityWithoutMutualFund?.count || 0,
          },
          mutualFundWithoutEquity: {
            count: response.data.mutualFundWithoutEquity?.count || 0,
          },
        });
      }
    } catch (err) {
      if (err.statusCode === 403) {
        setError("Permission denied: You do not have permission to view cross-selling statistics.");
      } else {
        setError("Unable to load cross-selling opportunities.");
      }
    } finally {
      setLoading(false);
    }
  }, [token, canViewClients]);

  useEffect(() => {
    fetchCrossSellingData();
  }, [fetchCrossSellingData]);

  // If user has no client read permission, do not render cross-selling data
  if (!canViewClients) {
    return null;
  }

  if (error) {
    return (
      <div className="cross-selling-section">
        <div className="cross-selling-error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cross-selling-section">
        <div className="cross-selling-header">
          <div className="cross-selling-title-group">
            <h3 className="cross-selling-title">Cross-Selling Opportunities</h3>
            <p className="cross-selling-subtitle">
              Identify clients who may be suitable for additional services.
            </p>
          </div>
        </div>
        <div className="cross-selling-grid">
          {[1, 2].map((i) => (
            <div key={i} className="cross-selling-card cross-selling-card-skeleton">
              <div className="cross-selling-title-box">
                <div className="skeleton-pulse" style={{ width: 140, height: 16 }} />
                <div className="skeleton-pulse" style={{ width: 200, height: 12, marginTop: 4 }} />
              </div>
              <div className="skeleton-pulse" style={{ width: 60, height: 28, margin: "8px 0" }} />
              <div className="skeleton-pulse" style={{ width: 90, height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isTotalZero =
    stats.equityWithoutMutualFund.count === 0 &&
    stats.mutualFundWithoutEquity.count === 0;

  return (
    <div className="cross-selling-section">
      {/* Header Section */}
      <div className="cross-selling-header">
        <div className="cross-selling-title-group">
          <h3 className="cross-selling-title">Cross-Selling Opportunities</h3>
          <p className="cross-selling-subtitle">
            Identify clients who may be suitable for additional services.
          </p>
        </div>

        <button
          type="button"
          className="cross-selling-view-all"
          onClick={() => navigate("/clients")}
        >
          <span>View All</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {isTotalZero ? (
        <div className="cross-selling-empty">
          <p>No cross-selling opportunities found.</p>
        </div>
      ) : (
        <div className="cross-selling-grid">
          {/* Card 1: Equity -> Mutual Fund */}
          <div className="cross-selling-card">
            <div className="cross-selling-card-header">
              <div className="cross-selling-title-box">
                <h4 className="cross-selling-card-title">
                  <TrendingUp size={16} className="cross-selling-icon" />
                  <span>Equity → Mutual Fund</span>
                </h4>
                <p className="cross-selling-card-desc">
                  Clients having Equity but no Mutual Fund
                </p>
              </div>
            </div>

            <div className="cross-selling-metric">
              <span className="cross-selling-count">
                {stats.equityWithoutMutualFund.count}
              </span>
              <span className="cross-selling-label">POTENTIAL CLIENTS</span>
            </div>

            <button
              type="button"
              className="cross-selling-action-link"
              onClick={() => navigate("/clients?cross_sell=equity_without_mf")}
            >
              <span>View Clients</span>
              <ArrowRight size={14} className="arrow-icon" />
            </button>
          </div>

          {/* Card 2: Mutual Fund -> Equity */}
          <div className="cross-selling-card">
            <div className="cross-selling-card-header">
              <div className="cross-selling-title-box">
                <h4 className="cross-selling-card-title">
                  <PieChart size={16} className="cross-selling-icon" />
                  <span>Mutual Fund → Equity</span>
                </h4>
                <p className="cross-selling-card-desc">
                  Clients having Mutual Fund but no Equity
                </p>
              </div>
            </div>

            <div className="cross-selling-metric">
              <span className="cross-selling-count">
                {stats.mutualFundWithoutEquity.count}
              </span>
              <span className="cross-selling-label">POTENTIAL CLIENTS</span>
            </div>

            <button
              type="button"
              className="cross-selling-action-link"
              onClick={() => navigate("/clients?cross_sell=mf_without_equity")}
            >
              <span>View Clients</span>
              <ArrowRight size={14} className="arrow-icon" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossSellingOpportunities;
