import React, { useState, useEffect, useCallback } from "react";
import RightDrawer from "../../components/RightDrawer";
import { FormField } from "../../components/FormElement";
import { useToast } from "../../components/useToast";
import { changePasswordApi } from "../../services/auth";
import PasswordToggleIcon from "../../assets/logo/PasswordToggleIcon.jsx";
import "../../style/auth.css";

// --- small helpers ---------------------------------------------------

const isSuccessStatus = (status) =>
  status === "Success" || status === "OK";

const mapValidationErrors = (validationErrors = []) => {
  const fieldErrors = {};
  const keyMap = {
    OldPassword: "oldPassword",
    NewPassword: "newPassword",
    ConfirmPassword: "confirmPassword",
  };

  validationErrors.forEach((e) => {
    const formKey = keyMap[e.Key] || e.Key;
    fieldErrors[formKey] = e.Message;
  });

  return fieldErrors;
};

export default function ChangePassword({ open, onClose }) {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [apiErrors, setApiErrors] = useState({});
  const [show, setShow] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const { showToast } = useToast();

  // Reset form state whenever the drawer is closed or reopened
  useEffect(() => {
    if (!open) return;
    setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setGeneralError("");
    setApiErrors({});
    setShow({
      oldPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
  }, [open]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

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

  const doSubmit = useCallback(async () => {
    setGeneralError("");
    setApiErrors({});
    setLoading(true);

    let emplAutoId = "";
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      emplAutoId = user?.empl_auto_id || "";
    } catch {
      // ignore parse errors
    }

    try {
      const response = await changePasswordApi({
        employeeID: String(emplAutoId),
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword
      });

      const data = response.data;

      // Validation errors from API
      const validationErrors = data?.data?.ValidationErrors || [];
      if (validationErrors.length > 0) {
        setApiErrors(mapValidationErrors(validationErrors));
        return;
      }

      const status = data?.Status;
      const apiMsg =
        data?.data?.CHANGE_PASSWORD_RESPONSE?.[0]?.Message ||
        data?.message ||
        "";

      if (apiMsg && typeof showToast === "function") {
        const toastType = isSuccessStatus(status) ? "success" : "error";
        showToast(apiMsg.trim(), toastType);

        if (!isSuccessStatus(status)) {
          // error path, don't proceed further
          return;
        }
      }

      if (isSuccessStatus(status)) {
        // On success, clear form and close drawer
        setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        if (onClose) onClose();
      } else {
        setGeneralError(apiMsg || "Failed to change password");
      }
    } catch {
      setGeneralError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [form, onClose, showToast]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading) {
      void doSubmit();
    }
  };

  const renderPasswordField = (label, name) => (
    <div className="auth-password-field">
      <FormField
        label={label}
        name={name}
        type={show[name] ? "text" : "password"}
        value={form[name]}
        onChange={handleChange}
        required
        onFocus={(e) => clearFieldError(e.target.name)}
        error={apiErrors[name]}
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
      onClose={onClose}
      title="Change Password"
      width={400}
      onSave={doSubmit}
      saving={loading} // if RightDrawer supports a loading prop
    >
      <div className="auth-drawer-wrapper">
        <form onSubmit={handleSubmit} autoComplete="off">
          {renderPasswordField("Old Password :", "oldPassword")}
          {renderPasswordField("Login's New Password :", "newPassword")}
          {renderPasswordField("Confirm New Password :", "confirmPassword")}

          {generalError && (
            <div className="text-danger auth-message">
              {generalError}
            </div>
          )}
        </form>
      </div>
    </RightDrawer>
  );
}
