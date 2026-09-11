import React from "react";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import ClientOverviewStats from "../../components/dashboard/ClientOverviewStats";
import UpcomingBirthdaysCard from "../../components/dashboard/UpcomingBirthdaysCard";
import ClientSearchWidget from "../../components/dashboard/ClientSearchWidget";
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

          {/* Right Column: Client Search Widget & Welcome Card */}
          <div className="dashboard-right-column">
            <ClientSearchWidget />

          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
