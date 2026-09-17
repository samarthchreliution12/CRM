import React from "react";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import ClientOverviewStats from "../../components/dashboard/ClientOverviewStats";
import CrossSellingOpportunities from "../../components/dashboard/CrossSellingOpportunities";
import UpcomingBirthdaysCard from "../../components/dashboard/UpcomingBirthdaysCard";
import PendingFollowupsCard from "../../components/dashboard/PendingFollowupsCard";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <AppLayout title="Dashboard">
      <div className="dashboard-container">
        {/* 1. Client Overview Statistics */}
        <ClientOverviewStats />

        {/* 2. Dashboard 2-Column Grid */}
        <div className="dashboard-layout-grid">
          {/* Left Column: Upcoming Birthdays Card */}
          <div className="dashboard-left-column">
            <UpcomingBirthdaysCard />
          </div>

          {/* Right Column: Redesigned Cross-Selling Card */}
          <div className="dashboard-right-column">
            <CrossSellingOpportunities />
          </div>
        </div>

        {/* 3. Clients with Pending Follow-ups */}
        <PendingFollowupsCard />
      </div>
    </AppLayout>
  );
};

export default Dashboard;

