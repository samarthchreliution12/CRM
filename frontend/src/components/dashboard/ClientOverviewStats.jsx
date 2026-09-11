import React, { useState, useEffect, useCallback } from "react";
import useAuth from "../../hooks/useAuth";
import DashboardService from "../../services/dashboard.service";
import { UserCheck, UserX, CreditCard, Landmark, AlertCircle } from "lucide-react";
import "./ClientOverviewStats.css";

const ClientOverviewStats = () => {
  const { token } = useAuth();

  const [stats, setStats] = useState({
    active_clients_count: 0,
    non_active_clients_count: 0,
    demat_clients_count: 0,
    mutual_fund_clients_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOverview = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await DashboardService.getOverview(token);
      if (response && response.success && response.data) {
        setStats({
          active_clients_count: response.data.active_clients_count || 0,
          non_active_clients_count: response.data.non_active_clients_count || 0,
          demat_clients_count: response.data.demat_clients_count || 0,
          mutual_fund_clients_count: response.data.mutual_fund_clients_count || 0,
        });
      }
    } catch (err) {
      if (err.statusCode === 403) {
        setError("Permission denied: You do not have permission to view client statistics.");
      } else {
        setError("Unable to load client statistics.");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (error) {
    return (
      <div className="overview-error-banner">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="client-overview-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="overview-stat-card stat-card-skeleton">
            <div className="stat-card-header">
              <div className="skeleton-box" style={{ width: 42, height: 42 }} />
              <div className="skeleton-box" style={{ width: 80, height: 14 }} />
            </div>
            <div className="skeleton-box" style={{ width: 60, height: 32, margin: "8px 0" }} />
            <div className="skeleton-box" style={{ width: 100, height: 12 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="client-overview-grid">
      {/* 1. Active Clients */}
      <div className="overview-stat-card">
        <div className="stat-card-header">
          <div className="stat-card-icon active">
            <UserCheck size={22} />
          </div>
          <span className="stat-card-label">Active Clients</span>
        </div>
        <h3 className="stat-card-count">{stats.active_clients_count}</h3>
        <p className="stat-card-subtitle">Currently Active</p>
      </div>

      {/* 2. Non-Active Clients */}
      <div className="overview-stat-card">
        <div className="stat-card-header">
          <div className="stat-card-icon inactive">
            <UserX size={22} />
          </div>
          <span className="stat-card-label">Non-Active Clients</span>
        </div>
        <h3 className="stat-card-count">{stats.non_active_clients_count}</h3>
        <p className="stat-card-subtitle">Inactive</p>
      </div>

      {/* 3. Clients with Demat Accounts */}
      <div className="overview-stat-card">
        <div className="stat-card-header">
          <div className="stat-card-icon demat">
            <CreditCard size={22} />
          </div>
          <span className="stat-card-label">Demat Accounts</span>
        </div>
        <h3 className="stat-card-count">{stats.demat_clients_count}</h3>
        <p className="stat-card-subtitle">Clients with Demat</p>
      </div>

      {/* 4. Clients with Mutual Funds */}
      <div className="overview-stat-card">
        <div className="stat-card-header">
          <div className="stat-card-icon mutual-fund">
            <Landmark size={22} />
          </div>
          <span className="stat-card-label">Mutual Funds</span>
        </div>
        <h3 className="stat-card-count">{stats.mutual_fund_clients_count}</h3>
        <p className="stat-card-subtitle">Clients with Mutual Funds</p>
      </div>
    </div>
  );
};

export default ClientOverviewStats;
