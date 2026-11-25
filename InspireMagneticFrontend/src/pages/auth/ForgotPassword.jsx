import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../../assets/logo/inspire-magnetics-logo.png";
import Notification from "../../components/Notification";
import Background from "../../assets/background-img.png";

import { forgotPasswordApi } from "../../services/auth";
import { RequestPasswordResetIcon } from "../../assets/logo/AuthIcons";
import "../../style/auth.css";

// ---- helpers --------------------------------------------------------

function useTimedNotice(notification, setNotification, ms = 3000) {
  useEffect(() => {
    if (!notification?.text) return;
    const timer = setTimeout(() => setNotification(null), ms);
    return () => clearTimeout(timer);
  }, [notification, setNotification, ms]);
}

function parseForgotResponse(data) {
  const status = data?.Status;
  const body =
    data?.data?.FORGOT_PASSWORD_RESPONSE?.[0] ??
    data?.FORGOT_PASSWORD_RESPONSE?.[0] ??
    data;
  return { status, loginID: body?.LoginID, message: body?.Message };
}

// ---- Component ------------------------------------------------------

export default function ForgotPassword() {
  const [loginID, setLoginID] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [cardHovered, setCardHovered] = useState(false);

  const navigate = useNavigate();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useTimedNotice(notification, setNotification, 3000);

  const setInfo = (text) => setNotification({ type: "info", text });
  const setErr = (text) => setNotification({ type: "error", text });

  // --- Submit ---------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = loginID.trim();

    if (!trimmed) {
      setErr("Enter the Login ID.");
      return;
    }

    setLoading(true);

    try {
      const resp = await forgotPasswordApi(trimmed);
      const { status, loginID: resultLoginID, message } = parseForgotResponse(resp?.data);

      if (resultLoginID === "0" || status === "Error") {
        setErr(message || "Failed to send the reset password request.");
        return;
      }

      setInfo(message || "Password reset link sent successfully.");

      setTimeout(() => {
        if (mountedRef.current) {
          navigate("/", { replace: true });
        }
      }, 1200);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Network error. Please try again.";
      setErr(msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // ---- UI ------------------------------------------------------------

  return (
    <div className="auth-page-root">
      <Notification
        type={notification?.type ?? "info"}
        message={notification?.text ?? ""}
        onClose={() => setNotification(null)}
        duration={3000}
      />

      {/* Background Image */}
      <img className="auth-bg-img" src={Background} alt="background" />
      <div className="auth-bg-overlay" />

      <div className="container-tight py-4 auth-content-wrapper">
        <div
          className={`card card-md auth-card ${cardHovered ? "auth-card--hover" : ""}`}
          onMouseEnter={() => setCardHovered(true)}
          onMouseLeave={() => setCardHovered(false)}
        >
          <div className="card-body">
            <div className="text-center mb-3">
              <img src={Logo} alt="logo" className="auth-logo" />
            </div>

            <h2 className="h2 text-center mb-4 auth-text-light">
              Reset Your Password
            </h2>

            <form autoComplete="off" onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label auth-text-light">Login ID</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Your Login ID"
                  value={loginID}
                  onChange={(e) => setLoginID(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-footer">
                <button
                  type="submit"
                  className="btn btn-primary custom-im-button w-100"
                  disabled={loading || !loginID.trim()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {loading ? (
                    "Please Wait..."
                  ) : (
                    <>
                      <span>Request Password Reset Link</span>
                      <RequestPasswordResetIcon />
                    </>
                  )}
                </button>

                <div className="mt-3 text-center">
                  <Link to="/" tabIndex={-1} className="auth-link-light">
                    Back to login
                  </Link>
                </div>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
