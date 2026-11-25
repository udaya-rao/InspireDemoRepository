import React from "react";
import "../../style/dashboard.css";

const Dashboard = () => {
  React.useEffect(() => {
    const newVersion = localStorage.getItem("newVersion");
    const oldVersion = localStorage.getItem("AppVersion");
    if (newVersion && newVersion !== oldVersion) {
      // Promote new version and clear the flag, then reload once
      try {
        localStorage.setItem("AppVersion", newVersion);
        localStorage.removeItem("newVersion");
      } catch { /* noop */ }
      window.location.reload();
    }
    else {
      localStorage.removeItem("newVersion");
    }
  }, []);
  return (
    <div className="dashboard-root">
      {/* Main content area (right of sidebar) */}
      <div className="dashboard-main">
        {/* Place your dashboard widgets/content here */}
      </div>
    </div>
  );
};

export default Dashboard;