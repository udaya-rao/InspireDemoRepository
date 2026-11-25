import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import RightDrawer from "../../components/RightDrawer";
import { FormField, ReactSelectField } from "../../components/FormElement";
import ValidatedForm from "../../components/ValidatedForm";
import { useToast } from "../../components/useToast";
import PasswordToggleIcon from "../../assets/logo/PasswordToggleIcon.jsx";
import {
  getLoginIDs,
  changeEmployeePassword,
} from "../../services/employeeService";
import "../../style/auth.css";

const isSuccessStatus = (status) => status === "Success" || status === "OK";

// Map API validation errors to form field names
const mapValidationErrors = (validationErrors = []) => {
  const fieldErrors = {};
  const keyMap = {
    LoginID: "loginId",
    NewPassword: "newPassword",
    ConfirmPassword: "confirmPassword",
  };

  validationErrors.forEach((e) => {
    const formKey = keyMap[e.Key] || e.Key;
    fieldErrors[formKey] = e.Message;
  });

  return fieldErrors;
};

// Base validation rules used by ValidatedForm
const validation = {
  loginId: {
    required: true,
    fieldLabel: "Login ID",
    controlType: "dropdown",
  },
  newPassword: {
    required: true,
    fieldLabel: "New Password",
    controlType: "textbox",
  },
  confirmPassword: {
    required: true,
    fieldLabel: "Confirm Password",
    controlType: "textbox",
  },
};

export default function ChangeEmployeePassword({ open = true, onClose }) {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [apiErrors, setApiErrors] = useState({});
  const [loginIDs, setLoginIDs] = useState([]);
  const [show, setShow] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  const [resetKey, setResetKey] = useState(0);
  const validatedFormRef = useRef(null);
  const formValidation = useMemo(() => validation, []);

  const initialValues = useMemo(
    () => ({
      loginId: "",
      newPassword: "",
      confirmPassword: "",
    }),
    []
  );

  // --- Prevent browser from auto-filling saved credentials (Login ID / Password)
  const [autoFillLock, setAutoFillLock] = useState(true);
  const unlockAutofill = useCallback(() => setAutoFillLock(false), []);
  const TAB_KEY = "change-employee-password";

  useEffect(() => {
    if (open) setAutoFillLock(true);
  }, [open, resetKey]);

  // Fallback close handler: use onClose if given, otherwise go back
  const handleClose = useCallback(() => {
    if (typeof onClose === "function") {
      onClose();
      return;
    }
    window.closeTabIfActive?.(TAB_KEY);
  }, [onClose]);

  // Clean up any Bootstrap offcanvas backdrops (prevents dim/blur top bar after refresh)
  useEffect(() => {
    const removeBackdrops = () => {
      const backdrops = document.querySelectorAll(
        ".offcanvas-backdrop.fade.show"
      );

      backdrops.forEach((el) => {
        el.remove();
      });

      // Clean up body state
      document.body.classList.remove(
        "offcanvas-backdrop",
        "modal-open",
        "offcanvas-open"
      );
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };

    removeBackdrops();

    // Run once more in next tick (Bootstrap may inject backdrop async)
    const t = setTimeout(removeBackdrops, 1000);

    return () => clearTimeout(t);
  }, []); // only on mount

  useEffect(() => {
    let isMounted = true;

    const loadLoginIDs = async () => {
      try {
        const loginData = await getLoginIDs();
        if (isMounted) {
          console.log("Login ID API response:", loginData);
          setLoginIDs(loginData);
        }
      } catch (error) {
        if (error?.response?.status === 401) {
          window.dispatchEvent(new Event("sessionExpired"));
        } else {
          console.error("Failed to fetch Login IDs", error);
          if (showToast) showToast("Failed to load Login IDs", "error");
        }
      }
    };

    loadLoginIDs();
    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const LoginOptions = useMemo(
    () =>
      Array.isArray(loginIDs)
        ? loginIDs.map((item) => ({
            value: item.ValueText,
            label: item.DisplayText,
          }))
        : [],
    [loginIDs]
  );

  // Reset error state whenever the drawer is opened
  useEffect(() => {
    if (!open) return;
    setGeneralError("");
    setApiErrors({});
    setShow({
      newPassword: false,
      confirmPassword: false,
    });
  }, [open]);

  const toggleShow = useCallback((field) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const clearFieldError = useCallback((name) => {
    if (!name) return;
    setApiErrors((prev) => {
      if (!prev || !prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  // Called by ValidatedForm after client-side validation passes
  const handleSubmit = useCallback(
    async (values) => {
      setGeneralError("");
      setApiErrors({});
      setLoading(true);

      try {
        const submitValues = {
          ...values,
          loginID: values.loginId, // map to API field
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        };

        const apiResult = await changeEmployeePassword(submitValues);

        const validationErrors = apiResult?.data?.ValidationErrors;
        const changePasswordResponseMessages =
          apiResult?.data?.CHANGE_PASSWORD_RESPONSE;
        const status = apiResult?.Status;

        // Map validation errors to field-specific errors and display inline
        if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
          setApiErrors(mapValidationErrors(validationErrors));
          setLoading(false);
          return;
        }

        let message = "";
        if (changePasswordResponseMessages?.length > 0) {
          message += changePasswordResponseMessages
            .map((e) => e.Message)
            .join(" ");
        }

        if (message) {
          const toastType =
            status === "Success" || status === "OK" ? "success" : "error";
          if (showToast) showToast(message.trim(), toastType);
          if (toastType === "error") return;
        }

        if (isSuccessStatus(status)) {
          // Reset form fields back to initial state
          setResetKey((k) => k + 1);
          setShow({
            newPassword: false,
            confirmPassword: false,
          });
          setApiErrors({});
          setGeneralError("");
        } else {
          showToast("Failed to change password", "error");
        }
      } catch {
        showToast("Network error. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  // Used by drawer save icon & programmatic submit
  const triggerSubmit = useCallback(() => {
    if (validatedFormRef.current) {
      validatedFormRef.current.submitForm();
    }
  }, []);

  const renderPasswordField = (
    label,
    name,
    values,
    errors,
    handleChange,
    handleBlur
  ) => (
    <div className="auth-password-field">
      <FormField
        label={label}
        name={name}
        type={show[name] ? "text" : "password"}
        value={values[name]}
        onChange={handleChange}
        onBlur={handleBlur}
        required
        onFocus={(e) => {
          clearFieldError(e.target.name);
          unlockAutofill();
        }}
        error={errors[name] || apiErrors[name]}
        // Prevent browser autofill
        autoComplete="new-password"
        readOnly={autoFillLock}
      />
      <span
        onClick={() => toggleShow(name)}
        className="auth-toggle-eye"
        tabIndex={0}
        title={show[name] ? "Hide password" : "Show password"}
      >
        <PasswordToggleIcon visible={show[name]} size={22} />
      </span>
    </div>
  );

  return (
    <RightDrawer
      open={open}
      onClose={handleClose}
      title="Change Employee Password"
      width={400}
      onSave={triggerSubmit}
      saving={loading}
      alwaysExpanded={true}
      headerPadding="7px"
      closeButtonStyle={{ marginRight: "13px", marginTop: "1px" }}
      titleStyle={{ marginLeft: "20px" }}
    >
      <div className="auth-drawer-wrapper">
        <ValidatedForm
          key={resetKey}
          ref={validatedFormRef}
          initialValues={initialValues}
          validation={formValidation}
          onSubmit={handleSubmit}
        >
          {({ values, errors, handleChange, handleBlur }) => (
            <>
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
                {/* Intentionally using common autocomplete tokens */}
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

              <ReactSelectField
                label="Login ID"
                name="loginId"
                options={LoginOptions}
                value={values.loginId}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                onFocus={(e) => {
                  clearFieldError(e.target.name);
                  unlockAutofill();
                }}
                placeholder="Select Login ID"
                error={errors.loginId || apiErrors.loginId}
                autoComplete="off"
              />

              {renderPasswordField(
                "Login's New Password :",
                "newPassword",
                values,
                errors,
                handleChange,
                handleBlur
              )}

              {renderPasswordField(
                "Confirm New Password :",
                "confirmPassword",
                values,
                errors,
                handleChange,
                handleBlur
              )}

              {generalError && (
                <div className="text-danger auth-message mt-2">
                  {generalError}
                </div>
              )}
            </>
          )}
        </ValidatedForm>
      </div>
    </RightDrawer>
  );
}
