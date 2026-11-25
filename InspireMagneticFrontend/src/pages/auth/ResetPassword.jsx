import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { parseAndFormatDateTime } from "../../utils/dateUtils";
import { b64Decode } from "../../utils/base64EncodeDecode";
import Logo from "../../assets/logo/inspire-magnetics-logo.png";
import Notification from "../../components/Notification";
import Background from "../../assets/background-img.png";
import { resetPasswordApi } from "../../services/auth";
import PasswordToggleIcon from "../../assets/logo/PasswordToggleIcon.jsx";
import "../../style/auth.css";

//Password Toggle
function PasswordToggle({
  shown,
  onToggle,
  titleShown = "Hide password",
  titleHidden = "Show password",
}) {
  return (
    <button
      type="button"
      className="link-secondary auth-password-toggle-btn"
      title={shown ? titleShown : titleHidden}
      onClick={onToggle}
      aria-label={shown ? titleShown : titleHidden}
    >
      <PasswordToggleIcon visible={shown} />
    </button>
  );
}

// Generic getter for nested API response fields
const getResponseData = (obj, path, def) => {
  try {
    return (
      path
        .split(".")
        .reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj) ?? def
    );
  } catch {
    return def;
  }
};

const parseApiStatus = (data) =>
  (
    getResponseData(data, "Status", "") ||
    getResponseData(data, "status", "") ||
    ""
  ).toString();

const parseApiMessage = (data) =>
  getResponseData(data, "data.RESET_PASSWORD_RESPONSE.0.Message", "") ||
  getResponseData(data, "message", "") ||
  getResponseData(data, "data.message", "") ||
  "";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState(false);

  // unified notification state
  const [notification, setNotification] = useState({
    type: "info",
    message: "",
  }); // type: "info" | "error"

  const [loginID, setLoginID] = useState("");
  const [linkMinutes, setLinkMinutes] = useState(null);
  const [expiryAt, setExpiryAt] = useState(null);
  const [isLinkValid, setIsLinkValid] = useState(null); // null until checked

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  // Prevent browser from auto-filling saved credentials (Login ID / Password)
  const [autoFillLock, setAutoFillLock] = useState(true);
  const unlockAutofill = useCallback(() => setAutoFillLock(false), []);

  // Reset lock whenever link is (re)validated and when component mounts
  useEffect(() => {
    setAutoFillLock(true);
  }, [location.search]);

  // decode & validate query once
  useEffect(() => {
    const search = new URLSearchParams(location.search);

    const encLogin = search.get("LoginID") || "";
    const encMins = search.get("ResetPasswordLinkInMinutes") || "";
    const encExpiry = search.get("PasswordExpiryDateTime") || "";

    const decLogin = (b64Decode(encLogin) || "").trim();
    const decMinsStr = (b64Decode(encMins) || "").trim();
    const decExpiryStr = (b64Decode(encExpiry) || "").trim();

    setLoginID(decLogin);
    setLinkMinutes(decMinsStr ? Number(decMinsStr) : null);

    const { date: expiryDate, text: expiryText } = parseAndFormatDateTime(
      decExpiryStr,
      "dd/MM/yyyy HH:mm:ss"
    );
    setExpiryAt(expiryText);

    if (!decLogin || !expiryDate) {
      setIsLinkValid(false);
      return;
    }

    setIsLinkValid(Date.now() <= expiryDate.getTime());
  }, [location.search]);

  // Auto-dismiss notification after 3s
  useEffect(() => {
    if (!notification.message) return;
    const t = setTimeout(
      () => setNotification({ type: "info", message: "" }),
      3000
    );
    return () => clearTimeout(t);
  }, [notification]);

  const clearFieldError = (name) => {
    if (!name) return;
    setErrors((prev) => {
      if (!prev || !prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validateClient = () => {
    const e = {};
    if (!loginID) e.loginID = "Invalid or missing Login ID.";
    if (!form.newPassword.trim()) e.newPassword = "Enter the new password.";
    if (!form.confirmPassword.trim())
      e.confirmPassword = "Confirm your new password.";
    if (
      form.newPassword.trim() &&
      form.confirmPassword.trim() &&
      form.newPassword !== form.confirmPassword
    ) {
      e.confirmPassword =
        "New Password and Confirm New Password Does Not Match.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();

    if (!isLinkValid) {
      setNotification({
        type: "error",
        message: "Password reset link has expired.",
      });
      return;
    }
    if (!validateClient()) return;

    setBusy(true);
    setErrors({});
    setNotification({ type: "info", message: "" });

    try {
      const resp = await resetPasswordApi({
        loginID,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      const data = resp?.data ?? {};

      // server-side validation errors if any
      const apiValErrs = getResponseData(data, "data.ValidationErrors", null);
      if (Array.isArray(apiValErrs) && apiValErrs.length > 0) {
        const fieldMap = {
          OldPassword: "loginID",
          NewPassword: "newPassword",
          ConfirmPassword: "confirmPassword",
        };
        const fieldErrors = {};
        apiValErrs.forEach((e) => {
          const k = fieldMap[e.Key] || e.Key;
          fieldErrors[k] = e.Message;
        });
        setErrors(fieldErrors);
        return;
      }

      const status = parseApiStatus(data);
      const msg = parseApiMessage(data);

      if (msg) {
        const ok = /^(success|ok)$/i.test(status);
        setNotification({
          type: ok ? "info" : "error",
          message: msg.toString().trim(),
        });
        if (!ok) return;
      }

      if (/^(success|ok)$/i.test(status)) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("token_expiry_date_time");

        setNotification({
          type: "info",
          message: msg || "Password Saved Successfully !!!",
        });

        setTimeout(() => navigate("/", { replace: true }), 1200);
      } else {
        setNotification({
          type: "error",
          message: msg || "Failed to reset password.",
        });
      }
    } catch (err) {
      const msg =
        getResponseData(err, "response.data.message", "") ||
        err?.message ||
        "Network error. Please try again.";
      setNotification({ type: "error", message: msg });
    } finally {
      setBusy(false);
    }
  };

  const expiryInfo = useMemo(
    () => (expiryAt ? expiryAt.toLocaleString() : ""),
    [expiryAt]
  );
  const canShowForm = isLinkValid === true;

  return (
    <div className="auth-page-root">
      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: "info", message: "" })}
        duration={3000}
      />

      {/* Background Image */}
      <img src={Background} alt="" className="auth-bg-img" />

      {/* Overlay */}
      <div className="auth-bg-overlay" />

      {/* Main Content */}
      <div className="container-tight py-4 auth-content-wrapper">
        <div
          className={`card card-md auth-card auth-card--wide ${
            hover ? "auth-card--hover" : ""
          }`}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <div className="card-body">
            <div className="text-center mb-3">
              <img src={Logo} alt="logo" className="auth-logo" />
            </div>

            <h2 className="h2 text-center mb-4 auth-text-light">
              Reset Password
            </h2>

            {isLinkValid === false && (
              <div className="alert alert-danger p-3 auth-alert" role="alert">
                <div className="row g-2 align-items-center">
                  <div className="col-12 col-md-auto fw-bold">
                    Password Reset Link Has Been Expired.
                  </div>

                  {loginID && (
                    <div className="small me-md-3">
                      <span className="opacity-75">Login ID:&nbsp;</span>
                      <span className="fw-semibold">{loginID}</span>
                    </div>
                  )}

                  {expiryAt && (
                    <div className="col-12 col-md-auto small">
                      <span className="opacity-75">Expired at:&nbsp;</span>
                      <span className="fw-semibold">{expiryInfo}</span>
                    </div>
                  )}

                  {typeof linkMinutes === "number" && (
                    <div className="col-12 col-md-auto small">
                      <span className="opacity-75">Link validity:&nbsp;</span>
                      <span className="fw-semibold">{linkMinutes} minutes</span>
                    </div>
                  )}

                  <div className="col-12 col-md text-md-end mt-2 mt-md-0">
                    <Link to="/" className="btn btn-light btn-sm">
                      Back to Login
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {isLinkValid === null && (
              <div className="text-center auth-text-light">
                Validating link…
              </div>
            )}

            {canShowForm && (
              <form autoComplete="off" onSubmit={handleSubmit} noValidate>
                {/* --- Restrict Autofill: browsers fill these instead of the real fields --- */}
                <div
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    top: "-9999px",
                    height: 0,
                    width: 0,
                    overflow: "hidden",
                    opacity: 0,
                    pointerEvents: "none",
                  }}
                  aria-hidden="true"
                >
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    tabIndex={-1}
                  />
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    tabIndex={-1}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label auth-text-light">Login ID</label>
                  <input
                    type="text"
                    className={`form-control auth-disabled-input ${
                      errors.loginID ? "is-invalid" : ""
                    }`}
                    value={loginID}
                    disabled
                    aria-invalid={!!errors.loginID}
                    autoComplete="off"
                  />
                  {errors.loginID && (
                    <div className="invalid-feedback d-block auth-error-text">
                      {errors.loginID}
                    </div>
                  )}
                </div>

                <div className="mb-2 auth-muted-note">
                  {expiryAt && (
                    <>
                      This link is valid until <b>{expiryInfo}</b>
                      {typeof linkMinutes === "number" ? (
                        <> ({linkMinutes} minutes)</>
                      ) : null}
                      .
                    </>
                  )}
                </div>

                {/* New Password */}
                <div className="mb-3">
                  <label className="form-label auth-text-light">
                    New Password
                  </label>
                  <div className="input-group input-group-flat">
                    <input
                      type={show.newPassword ? "text" : "password"}
                      className={`form-control ${
                        errors.newPassword ? "is-invalid" : ""
                      }`}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      required
                      value={form.newPassword}
                      readOnly={autoFillLock}
                      onFocus={() => unlockAutofill()}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((p) => ({ ...p, newPassword: v }));
                        clearFieldError("newPassword");
                      }}
                      aria-invalid={!!errors.newPassword}
                    />
                    <span className="input-group-text">
                      <PasswordToggle
                        shown={show.newPassword}
                        onToggle={() =>
                          setShow((p) => ({
                            ...p,
                            newPassword: !p.newPassword,
                          }))
                        }
                      />
                    </span>
                  </div>
                  {errors.newPassword && (
                    <div className="invalid-feedback d-block auth-error-text">
                      {errors.newPassword}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="mb-3">
                  <label className="form-label auth-text-light">
                    Confirm New Password
                  </label>
                  <div className="input-group input-group-flat">
                    <input
                      type={show.confirmPassword ? "text" : "password"}
                      className={`form-control ${
                        errors.confirmPassword ? "is-invalid" : ""
                      }`}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      required
                      value={form.confirmPassword}
                      readOnly={autoFillLock}
                      onFocus={() => unlockAutofill()}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((p) => ({ ...p, confirmPassword: v }));
                        clearFieldError("confirmPassword");
                      }}
                      aria-invalid={!!errors.confirmPassword}
                    />
                    <span className="input-group-text">
                      <PasswordToggle
                        shown={show.confirmPassword}
                        onToggle={() =>
                          setShow((p) => ({
                            ...p,
                            confirmPassword: !p.confirmPassword,
                          }))
                        }
                      />
                    </span>
                  </div>
                  {errors.confirmPassword && (
                    <div className="invalid-feedback d-block auth-error-text">
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>

                <div className="form-footer">
                  <button
                    type="submit"
                    className="btn btn-primary custom-im-button w-100"
                    disabled={busy}
                  >
                    {busy ? "Please Wait..." : "Set Password"}
                  </button>
                </div>
              </form>
            )}

            {isLinkValid === null && (
              <div className="auth-loading-gap" aria-hidden />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
