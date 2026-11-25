import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import SidebarLayout from "./components/SidebarLayout";
import TabManager from "./components/TabManager";
import Auth from "./pages/auth/Auth";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import { useEffect, useState } from "react";
import ToastProvider from "./components/ToastProvider";
import SessionExpiredModal from "./components/SessionExpiredModal";
import pages from "./config/pagesConfig.jsx";
import InternetStatus from "./components/InternetStatus";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

//hidden menus
import SecurityMaster from "./pages/securitymaster/SecurityMaster.jsx";
import PermissionRoute from "./permissions/PermissionRoute";
import NotFound from "./components/Notfoundpage/NotFound";


// Shared protected app layout that keeps TabManager mounted once
function ProtectedAppLayout() {
  return (
    <div className="page" style={{ display: "flex", minHeight: "100vh" }}>
      <SidebarLayout />
      <div
        className="page-wrapper"
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Main content fills the space between navbar (inside TabManager) and any footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          <TabManager pages={pages} />
        </div>
      </div>
      {/* Render nested route elements invisibly to trigger permission gates without affecting layout */}
      <div style={{ display: "none" }}>
        <Outlet />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Helper rendered inside BrowserRouter to safely use useLocation
function SessionModalGate({ open, onSignInAgain }) {
  const location = useLocation();
  const path = String(location.pathname || "/");
  const isAuthRoute = path === "/" || path.startsWith("/login");
  return (
    <SessionExpiredModal
      open={open && !isAuthRoute}
      onSignInAgain={onSignInAgain}
    />
  );
}

// Helper to check local token expiry at app start / timer
const isSessionExpiredFromStorage = () => {
  const now = Date.now();

  const accessStr = localStorage.getItem("token_expiry_date_time");
  const refreshStr = localStorage.getItem("refresh_token_expiry_date_time");

  let isAccessExpired = false;
  let isRefreshExpired = false;

  if (accessStr) {
    const t = Date.parse(accessStr);
    if (!Number.isNaN(t) && now > t) {
      isAccessExpired = true;
    }
  }

  if (refreshStr) {
    const t = Date.parse(refreshStr);
    if (!Number.isNaN(t) && now > t) {
      isRefreshExpired = true;
    }
  }

  // Treat session as expired when BOTH access and refresh are expired
  return isAccessExpired && isRefreshExpired;
};

function App() {
  const [sessionExpired, setSessionExpired] = useState(false);
  const [costingModalOpen, setCostingModalOpen] = useState(false);

  // Listen for global event to open Costing Variable Setting modal
  useEffect(() => {
    const handler = () => setCostingModalOpen(true);
    window.addEventListener("openCostingVariableSettingModal", handler);
    return () =>
      window.removeEventListener("openCostingVariableSettingModal", handler);
  }, []);

  // On first load only: check expiry based on stored timestamps
  useEffect(() => {
    if (isSessionExpiredFromStorage()) {
      setSessionExpired(true);
    }
  }, []);

  // 🔁 GLOBAL TIMER: check session expiry every 5000 ms, independent of navigation/refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isSessionExpiredFromStorage()) {
        // Reuse the same global mechanism as axiosSetup / others
        window.dispatchEvent(new Event("sessionExpired"));
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // React to global sessionExpired / sessionRestored events from axiosSetup & login
  useEffect(() => {
    const handleSessionExpired = () => {
      setSessionExpired(true);
      // microtask no-op to match your previous style
      Promise.resolve().then(() => { });
    };

    const handleSessionRestored = () => {
      const accessExpiryStr = localStorage.getItem("token_expiry_date_time");
      const refreshExpiryStr = localStorage.getItem(
        "refresh_token_expiry_date_time"
      );
      const hasToken = !!localStorage.getItem("accessToken");
      const now = new Date();

      const hasValidAccess = accessExpiryStr && now < new Date(accessExpiryStr);
      const hasValidRefresh =
        !refreshExpiryStr || now < new Date(refreshExpiryStr);

      // Only consider session "restored" if we still have a token and both windows are valid
      if (hasToken && hasValidAccess && hasValidRefresh) {
        setSessionExpired(false);
      }
    };

    window.addEventListener("sessionExpired", handleSessionExpired);
    window.addEventListener("sessionRestored", handleSessionRestored);

    return () => {
      window.removeEventListener("sessionExpired", handleSessionExpired);
      window.removeEventListener("sessionRestored", handleSessionRestored);
    };
  }, []);

  const handleSignInAgain = () => {
    // Remove authentication-related items
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("token_expiry_date_time");
      localStorage.removeItem("refresh_token_expiry_date_time");
      localStorage.removeItem("user");
      // NOTE: we do NOT touch rememberedLoginID so the login ID can still be pre-filled if you want
    } catch (e) {
      void e;
    }

    // Redirect to login page
    window.location.href = "/login";
  };

  return (
    <ToastProvider>
      <InternetStatus />
      <ToastContainer position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />


          {/** Keep TabManager mounted once via a shared protected layout */}
          <Route
            element={
              <ProtectedRoute>
                <ProtectedAppLayout />
              </ProtectedRoute>
            }
          >
            {/** Open-access (after auth) routes */}
            <Route path="/print-label" element={<div />} />
            <Route path="/dashboard" element={<div />} />
            <Route path="/app/*" element={<div />} />
            <Route
              path="/inspectionmaster"
              element={
                <PermissionRoute path="/inspectionmaster">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/workorder"
              element={
                <PermissionRoute path="/workorder">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/jobcard"
              element={
                <PermissionRoute path="/jobcard">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/dailyjob"
              element={
                <PermissionRoute path="/dailyjob">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/dailyjobdata/:id?"
              element={
                <PermissionRoute path="/dailyjobdata">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/wo-jobcards/:id?"
              element={
                <PermissionRoute path="/jobcard">
                  <div />
                </PermissionRoute>
              }
            />

            <Route
              path="/grn/work-order"
              element={
                <PermissionRoute path="/grn/work-order">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/grn/purchase"
              element={
                <PermissionRoute path="/grn/purchase">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/grn/quality"
              element={
                <PermissionRoute path="/grn/quality">
                  <div />
                </PermissionRoute>
              }
            />

            {/* ── Stores ────────────────────────────────────────── */}
            <Route
              path="/stores/stock-addition"
              element={
                <PermissionRoute path="/stores/stock-addition">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/stores/stock-deduction"
              element={
                <PermissionRoute path="/stores/stock-deduction">
                  <div />
                </PermissionRoute>
              }
            />
            <Route path="/stores/stock-transfer" element={<div />} />
            <Route
              path="/stores/stock-adjustment"
              element={
                <PermissionRoute path="/stores/stock-adjustment">
                  <div />
                </PermissionRoute>
              }
            />
            <Route path="/stores/transaction-history" element={<div />} />
            <Route path="/stores/current-stock" element={<div />} />

            {/* <Route
              path="/grn/inspection-result/:id?"
              element={
                <PermissionRoute path="/grn/inspection-result">
                  <div />
                </PermissionRoute>
              }
            /> */}

            {/** Permission-gated routes */}
            <Route
              path="/companyinformation"
              element={
                <PermissionRoute path="/companyinformation">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <PermissionRoute path="/employees">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/change-employee-password"
              element={
                <PermissionRoute path="/change-employee-password">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/gstmaster"
              element={
                <PermissionRoute path="/gstmaster">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/hsnmaster"
              element={
                <PermissionRoute path="/hsnmaster">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/fginventorymaster"
              element={
                <PermissionRoute path="/fginventorymaster">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/inventorymaster"
              element={
                <PermissionRoute path="/inventorymaster">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/suppliermaster"
              element={
                <PermissionRoute path="/suppliermaster">
                  <div />
                </PermissionRoute>
              }
            />
              <Route
              path="/supplieritem"
              element={
                <PermissionRoute path="/supplieritem">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/customermaster"
              element={
                <PermissionRoute path="/customermaster">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/purchase-order"
              element={
                <PermissionRoute path="/purchase-order">
                  <div />
                </PermissionRoute>
              }
            />
            <Route path="/quotation" element={<PermissionRoute path="/quotation"><div /></PermissionRoute>} />
            <Route path="/order" element={<PermissionRoute path="/order"><div /></PermissionRoute>} />
            <Route path="/delivery-notes" element={<PermissionRoute path="/delivery-notes"><div /></PermissionRoute>} />
            <Route
              path="/variable-setting"
              element={
                <PermissionRoute path="/variable-setting">
                  <div />
                </PermissionRoute>
              }
            />
            <Route
              path="/security-master"
              element={
                <PermissionRoute path="/security-master" permission={90}>
                  <div />
                </PermissionRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* SINGLE global place where session modal is rendered */}
        <SessionModalGate
          open={sessionExpired}
          onSignInAgain={handleSignInAgain}
        />
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
