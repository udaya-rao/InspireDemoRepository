import React, { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import Logo from "../../assets/logo/inspire-magnetics-logo.png";
import Notification from "../../components/Notification";
import Background from "../../assets/background-img.png";
import useAutoClear from "../../hooks/useAutoClear";
import {
  loginApi,
  verifyOrResendOtpApi,
  changePasswordApi,
} from "../../services/auth";
import { ensureBaseUrl } from "../../utils/url.js";
import ChangePasswordForm from "./ChangePasswordForm";
import Otp from "./Otp";
import PasswordToggleIcon from "../../assets/logo/PasswordToggleIcon.jsx";
import { SignInIcon } from "../../assets/logo/AuthIcons";
import "../../style/auth.css";
// import LoginIcon from "@mui/icons-material/Login";

// --- small helpers ---------------------------------------------------

const isSuccessStatus = (status) => status === "Success" || status === "OK";

const isSuccessFlag = (data) =>
  data &&
  (data?.status?.toLowerCase() === "success" ||
    data?.Status?.toLowerCase() === "success");

export default function Auth() {
  const [loginID, setLoginID] = useState(
    () => localStorage.getItem("rememberedLoginID") || "",
  );
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    () => !!localStorage.getItem("rememberedLoginID"),
  );

  const [otpRequired, setOtpRequired] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [pendingUser, setPendingUser] = useState(null);
  const [resendMsg, setResendMsg] = useState("");

  const [cardHovered, setCardHovered] = useState(false);

  const [showPasswordExpiryDialog, setShowPasswordExpiryDialog] =
    useState(false);
  const [passwordExpiryMessage, setPasswordExpiryMessage] = useState("");
  const [isPasswordExpired, setIsPasswordExpired] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changePasswordErrors, setChangePasswordErrors] = useState({});
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [showChangePasswordFields, setShowChangePasswordFields] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [pendingLoginDetails, setPendingLoginDetails] = useState(null);
  const [pendingLoginSource, setPendingLoginSource] = useState(null);

  // --- generic message helpers --------------------------------------

  const showError = (msg) => {
    if (!msg) return;
    setError(msg);
    setToast(msg);
  };

  // Navigate to dashboard after successful login
  const navigateToDashboard = () => {
    window.location.href = "/dashboard";
  };

  // Check and show password expiry notification
  const checkPasswordExpiry = (userDetails) => {
    const isExpired = userDetails?.is_password_expired?.toUpperCase() === "Y";
    const showNotification =
      userDetails?.is_show_password_expiry_notification?.toUpperCase() === "Y";
    const message = userDetails?.password_expiry_notification_message || "";

    if (showNotification && message) {
      setIsPasswordExpired(isExpired);
      setPasswordExpiryMessage(message);
      setShowPasswordExpiryDialog(true);
      return true; // dialog shown
    }
    return false; // no dialog
  };

  const persistLoginDetails = useCallback(
    (details, { fromOtp = false } = {}) => {
      if (!details?.accessToken) return false;

      localStorage.setItem("accessToken", details.accessToken);
      localStorage.setItem("user", JSON.stringify(details));

      const loginTime = new Date(details.login_date_time);
      const expiryMinutes = details.TokenExpirationInMinutes || 60;
      const expiryTime = new Date(loginTime.getTime() + expiryMinutes * 60000);
      localStorage.setItem("token_expiry_date_time", expiryTime.toISOString());

      const refreshToken = details.refreshToken || null;

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      } else {
        localStorage.removeItem("refreshToken");
      }

      const refreshDays =
        typeof details.RefreshTokenExpiresAt === "number"
          ? details.RefreshTokenExpiresAt
          : null;

      if (refreshDays != null) {
        const refreshExpiryTime = new Date(
          loginTime.getTime() + refreshDays * 24 * 60 * 60_000,
        );
        localStorage.setItem(
          "refresh_token_expiry_date_time",
          refreshExpiryTime.toISOString(),
        );
      } else {
        localStorage.removeItem("refresh_token_expiry_date_time");
      }

      try {
        window.dispatchEvent(new Event("sessionRestored"));
      } catch {
        // ignore
      }

      if (rememberMe) {
        localStorage.setItem("rememberedLoginID", loginID);
      } else {
        localStorage.removeItem("rememberedLoginID");
      }

      const receivedVersion =
        details?.AppVersionNo || details?.appVersion || "";

      if (fromOtp) {
        const savedVersion =
          localStorage.getItem("appVersion") ||
          localStorage.getItem("newVersion") ||
          "";
        if (receivedVersion) {
          localStorage.setItem("appVersion", receivedVersion);
          try {
            localStorage.removeItem("newVersion");
          } catch {
            // ignore
          }
          if (savedVersion && savedVersion !== receivedVersion) {
            window.location.href = "/dashboard";
            return true;
          }
        }
      } else {
        if (receivedVersion) {
          localStorage.setItem("newVersion", receivedVersion);
          const savedVersion =
            localStorage.getItem("appVersion") ||
            localStorage.getItem("newVersion") ||
            "";
          if (savedVersion && savedVersion !== receivedVersion) {
            window.location.href = "/dashboard";
            return true;
          }
        } else {
          localStorage.removeItem("newVersion");
        }
      }

      return false;
    },
    [rememberMe, loginID],
  );

  const processLoginDetails = (details, source = "login") => {
    if (!details || !details.accessToken) return;

    setPendingLoginDetails(details);
    setPendingLoginSource(source);

    const dialogShown = checkPasswordExpiry(details);
    if (!dialogShown) {
      const reloaded = persistLoginDetails(details, {
        fromOtp: source === "otp",
      });

      setPendingLoginDetails(null);
      setPendingLoginSource(null);

      if (!reloaded) {
        navigateToDashboard();
      }
    } else if (dialogShown && source === "login") {
      persistLoginDetails(details, {
        fromOtp: source === "login",
      });

      setPendingLoginDetails(null);
      setPendingLoginSource(null);
    }
  };

  const resolvedLoginIdForChangePassword = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.login_id || loginID || "";
    } catch {
      return loginID || "";
    }
  }, [loginID]);

  // --- auto-dismiss toast / error (via hook) ------------------------

  useAutoClear(toast, setToast, 3000);
  useAutoClear(error, setError, 3000);

  // --- change password field helpers --------------------------------

  const handleChangePasswordFieldChange = (fieldKey, value) => {
    setChangePasswordForm((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
    setChangePasswordErrors((prev) => {
      if (!prev || !prev[fieldKey]) return prev || {};
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const handleToggleChangePasswordVisibility = (fieldKey) => {
    setShowChangePasswordFields((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }));
  };

  const handleBackToLoginFromChangePassword = () => {
    setShowChangePassword(false);
    setChangePasswordForm({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setChangePasswordErrors({});
    setPendingLoginDetails(null);
    setPendingLoginSource(null);
  };

  // --- submit handlers ----------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setToast("");

    try {
      ensureBaseUrl();
    } catch (err) {
      showError(err.message);
      setLoading(false);
      return;
    }

    try {
      let data;
      try {
        const resp = await loginApi(loginID, password);
        data = resp.data;
      } catch (err) {
        const respData = err?.response?.data;
        const msg = respData?.message || err?.message || "Network Error";
        showError(msg);
        return;
      }

      const loginDetails = data?.data?.USER_LOGIN_DETAILS?.[0] || data;

      if (loginDetails && loginDetails.ID === "0") {
        showError(loginDetails.Message || "Login failed");
        return;
      }

      // OTP logic
      if (
        loginDetails?.otp_enable &&
        loginDetails.otp_enable.toLowerCase() === "y"
      ) {
        setOtpRequired(true);
        setPendingUser(loginDetails);
        return;
      }

      // normal login
      if (loginDetails?.accessToken) {
        processLoginDetails(loginDetails, "login");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Network Error";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!otpValue) {
      showError("Please enter the OTP.");
      return;
    }

    try {
      const login_id = pendingUser?.login_id || loginID;
      const accessToken = pendingUser?.accessToken || null;

      const { data } = await verifyOrResendOtpApi({
        loginID: login_id,
        otpNumber: otpValue,
        paramType: "ValidateOTP",
        accessToken,
      });

      if (isSuccessFlag(data)) {
        if (pendingUser?.accessToken) {
          processLoginDetails(pendingUser, "otp");
          setPendingUser(null);
          setOtpRequired(false);
          setOtpValue("");
        }
      } else {
        const otpMsg = data?.data?.VALIDATE_OTP_RESPONSE?.[0]?.Message;
        const validationErrorMsg = data?.data?.ValidationErrors?.[0]?.Message;
        showError(
          otpMsg ||
            validationErrorMsg ||
            data?.message ||
            "Invalid OTP. Please try again.",
        );
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Network Error";
      showError(msg);
    }
  };

  const handleOtpCancel = () => {
    setOtpRequired(false);
    setOtpValue("");
    setPendingUser(null);
  };

  const handleOtpResend = async () => {
    setResendMsg("");
    try {
      const login_id = pendingUser?.login_id || loginID;
      const accessToken = pendingUser?.accessToken || null;

      const { data } = await verifyOrResendOtpApi({
        loginID: login_id,
        otpNumber: "",
        paramType: "ResendOTP",
        accessToken,
      });

      if (isSuccessFlag(data)) {
        setResendMsg("A new OTP has been sent to your email.");
      } else {
        const otpMsg = data?.data?.VALIDATE_OTP_RESPONSE?.[0]?.Message;
        const validationErrorMsg = data?.data?.ValidationErrors?.[0]?.Message;
        setResendMsg(
          otpMsg ||
            validationErrorMsg ||
            data?.message ||
            "Failed to resend OTP.",
        );
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Network Error.";
      setResendMsg(msg);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangePasswordErrors({});
    setChangePasswordLoading(true);
    setError("");
    setToast("");

    let emplAutoId = "";
    try {
      if (pendingLoginDetails?.empl_auto_id) {
        emplAutoId = String(pendingLoginDetails.empl_auto_id);
      } else {
        const user = JSON.parse(localStorage.getItem("user"));
        emplAutoId = String(user?.empl_auto_id || "");
      }
    } catch {
      // ignore
    }

    try {
      const response = await changePasswordApi({
        employeeID: String(emplAutoId),
        oldPassword: changePasswordForm.oldPassword,
        newPassword: changePasswordForm.newPassword,
        confirmPassword: changePasswordForm.confirmPassword,
      });

      const data = response.data;

      // API validation errors
      if (data?.data?.ValidationErrors?.length > 0) {
        const fieldErrors = {};
        data.data.ValidationErrors.forEach((e) => {
          const keyMap = {
            OldPassword: "oldPassword",
            NewPassword: "newPassword",
            ConfirmPassword: "confirmPassword",
          };
          const formKey = keyMap[e.Key] || e.Key;
          fieldErrors[formKey] = e.Message;
        });
        setChangePasswordErrors(fieldErrors);
        setChangePasswordLoading(false);
        return;
      }

      const status = data?.Status;
      const apiMsg =
        data?.data?.CHANGE_PASSWORD_RESPONSE?.[0]?.Message ||
        data?.message ||
        "";

      if (apiMsg) {
        const success = isSuccessStatus(status);
        setToast(apiMsg.trim());
        setError(success ? "" : apiMsg.trim());

        if (!success) {
          setChangePasswordLoading(false);
          return;
        }
      }

      if (isSuccessStatus(status)) {
        // clear auth state and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("token_expiry_date_time");
        setPendingLoginDetails(null);
        setPendingLoginSource(null);
        setShowChangePassword(false);
        setShowPasswordExpiryDialog(false);
        window.location.href = "/";
      } else {
        showError(apiMsg || "Failed to change password");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Network error. Please try again.";
      showError(msg);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // --- JSX ---------------------------------------------------------

  return (
    <div className="auth-page-root">
      <Notification
        type={error ? "error" : "info"}
        message={error || toast}
        onClose={() => {
          setError("");
          setToast("");
        }}
        duration={3000}
      />

      {/* Background Image */}
      <img className="auth-bg-img" src={Background} alt="background" />

      {/* Optional overlay (currently transparent) */}
      <div className="auth-bg-overlay" />

      {/* Main Content */}
      <div className="container-tight py-4 auth-content-wrapper">
        <div
          className={`card card-sm auth-card ${
            cardHovered ? "auth-card--hover" : ""
          }`}
          onMouseEnter={() => setCardHovered(true)}
          onMouseLeave={() => setCardHovered(false)}
        >
          <div
            className={`card-body ${
              showChangePassword ? "auth-change-password-card-body" : ""
            }`}
          >
            {/* Centered Logo */}
            <div className="text-center mb-3">
              <img src={Logo} alt="logo" className="auth-logo" />
            </div>

            <h2 className="h2 text-center mb-4 auth-text-light">
              {showChangePassword ? "Change Password" : "Login to your account"}
            </h2>

            {/* --- Change Password Form --- */}
            {showChangePassword ? (
              <ChangePasswordForm
                loginId={resolvedLoginIdForChangePassword}
                form={changePasswordForm}
                errors={changePasswordErrors}
                fieldVisibility={showChangePasswordFields}
                isPasswordExpired={isPasswordExpired}
                loading={changePasswordLoading}
                onFieldChange={handleChangePasswordFieldChange}
                onToggleVisibility={handleToggleChangePasswordVisibility}
                onBackToLogin={handleBackToLoginFromChangePassword}
                onSubmit={handleChangePasswordSubmit}
              />
            ) : !otpRequired ? (
              /* --- Login Form --- */
              <form autoComplete="off" onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label auth-text-light">Login ID</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Your Login ID"
                    required
                    value={loginID}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLoginID(val);
                      if (rememberMe) {
                        localStorage.setItem("rememberedLoginID", val);
                      }
                    }}
                  />
                </div>

                <div className="mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label
                      htmlFor="password"
                      className="form-label auth-text-light"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="auth-link-light"
                      tabIndex={-1}
                    >
                      I forgot password
                    </Link>
                  </div>
                  <div className="input-group input-group-flat">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="Your password"
                      autoComplete="off"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span className="input-group-text">
                      <button
                        type="button"
                        className="link-secondary auth-password-toggle-btn"
                        title={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((visible) => !visible)}
                      >
                        <PasswordToggleIcon visible={showPassword} />
                      </button>
                    </span>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={rememberMe}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setRememberMe(checked);
                        if (!checked) {
                          localStorage.removeItem("rememberedLoginID");
                        } else if (loginID) {
                          localStorage.setItem("rememberedLoginID", loginID);
                        }
                      }}
                    />
                    <span className="form-check-label auth-remember-text">
                      Remember me on this device
                    </span>
                  </label>
                </div>

                <div className="form-footer">
                  <button
                    type="submit"
                    className="btn btn-primary custom-im-button w-100"
                    disabled={loading}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {loading ? (
                      "Signing in..."
                    ) : (
                      <>
                        <span>Sign in</span>
                        {/* <svg
          fill="#000000"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M20,21V3H13a1,1,0,0,1,0-2h8a1,1,0,0,1,1,1V22a1,1,0,0,1-1,1H13a1,1,0,0,1,0-2ZM2,12a1,1,0,0,0,1,1H14.586l-2.293,2.293a1,1,0,1,0,1.414,1.414l4-4a1,1,0,0,0,0-1.414l-4-4a1,1,0,1,0-1.414,1.414L14.586,11H3A1,1,0,0,0,2,12Z"></path>
        </svg> */}
                        <SignInIcon />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* --- OTP Screen (separate component) --- */
              <Otp
                otpValue={otpValue}
                setOtpValue={setOtpValue}
                resendMsg={resendMsg}
                onCancel={handleOtpCancel}
                onVerify={handleOtpVerify}
                onResend={handleOtpResend}
              />
            )}
          </div>
        </div>
      </div>

      {/* Password Expiry Dialog */}
      {showPasswordExpiryDialog && (
        <div className="auth-dialog-backdrop">
          <div className="auth-dialog">
            <h3 className="auth-dialog-title">Password Expiry Notification</h3>
            <div className="auth-dialog-message">{passwordExpiryMessage}</div>
            <div className="auth-dialog-actions">
              <button
                className="btn btn-primary custom-im-button auth-dialog-btn"
                onClick={() => {
                  setShowPasswordExpiryDialog(false);
                  setShowChangePassword(true);
                }}
              >
                Update
              </button>
              {!isPasswordExpired && (
                <button
                  className="btn btn-secondary auth-dialog-btn"
                  onClick={() => {
                    setShowPasswordExpiryDialog(false);
                    const reloaded = pendingLoginDetails
                      ? persistLoginDetails(pendingLoginDetails, {
                          fromOtp: pendingLoginSource === "otp",
                        })
                      : false;
                    setPendingLoginDetails(null);
                    setPendingLoginSource(null);
                    setShowChangePassword(false);
                    if (!reloaded) {
                      navigateToDashboard();
                    }
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
