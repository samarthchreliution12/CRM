import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import DashboardService from "../../services/dashboard.service";
import { Store, ArrowRight, Megaphone, AlertCircle } from "lucide-react";
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
    noTermInsurance: { count: 0 },
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
          noTermInsurance: {
            count: response.data.noTermInsurance?.count || 0,
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

  if (!canViewClients) {
    return null;
  }

  return (
    <div className="cross-selling-card-container">
      {/* Header with Store Icon */}
      <div className="cross-selling-card-header">
        <h3 className="cross-selling-card-main-title">Cross-Selling</h3>
        <Store size={22} className="cross-selling-store-icon" />
      </div>

      {/* Body with Stacked Opportunity Boxes */}
      <div className="cross-selling-card-body">
        {error ? (
          <div className="cross-selling-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : loading ? (
          <div className="cross-selling-skeleton-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="cross-selling-item cross-selling-item-skeleton">
                <div className="skeleton-pulse" style={{ width: "60%", height: 18 }} />
                <div className="skeleton-pulse" style={{ width: "85%", height: 14, margin: "8px 0" }} />
                <div className="skeleton-pulse" style={{ width: "40%", height: 16 }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Box 1: Equity, No Mutual Fund */}
            <div className="cross-selling-item">
              <div className="cross-selling-item-top">
                <h4 className="cross-selling-item-title">Equity, No Mutual Fund</h4>
                <span className="cross-selling-pill">{stats.equityWithoutMutualFund.count}</span>
              </div>
              <p className="cross-selling-item-desc">
                Clients with active trading but no SIPs.
              </p>
              <button
                type="button"
                className="cross-selling-link-btn"
                onClick={() => navigate("/clients?cross_sell=equity_without_mf")}
              >
                <span>View Clients</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Box 2: Mutual Fund, No Equity */}
            <div className="cross-selling-item">
              <div className="cross-selling-item-top">
                <h4 className="cross-selling-item-title">Mutual Fund, No Equity</h4>
                <span className="cross-selling-pill">{stats.mutualFundWithoutEquity.count}</span>
              </div>
              <p className="cross-selling-item-desc">
                SIP investors without demat accounts.
              </p>
              <button
                type="button"
                className="cross-selling-link-btn"
                onClick={() => navigate("/clients?cross_sell=mf_without_equity")}
              >
                <span>View Clients</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Box 3: No Term Insurance */}
            <div className="cross-selling-item">
              <div className="cross-selling-item-top">
                <h4 className="cross-selling-item-title">No Term Insurance</h4>
                <span className="cross-selling-pill">{stats.noTermInsurance.count}</span>
              </div>
              <button
                type="button"
                className="cross-selling-link-btn"
                onClick={() => navigate("/clients?cross_sell=no_term_insurance")}
              >
                <span>Run Campaign</span>
                <Megaphone size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CrossSellingOpportunities;
