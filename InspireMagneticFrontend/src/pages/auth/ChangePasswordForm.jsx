// src/pages/auth/ChangePasswordForm.jsx
import React from "react";
import PasswordToggleIcon from "../../assets/logo/PasswordToggleIcon.jsx";
import "../../style/auth.css";

function ChangePasswordField({
  fieldKey,
  labelText,
  placeholder,
  value,
  errorMsg,
  isVisible,
  onChange,
  onToggleVisibility,
}) {
  return (
    <div className="mb-3">
      <label className="form-label auth-text-light">
        {labelText}
      </label>
      <div className="input-group input-group-flat">
        <input
          type={isVisible ? "text" : "password"}
          className={`form-control ${errorMsg ? "is-invalid" : ""}`}
          placeholder={placeholder}
          autoComplete="off"
          required
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
        />
        <span className="input-group-text">
          <button
            type="button"
            className="link-secondary auth-password-toggle-btn"
            title={isVisible ? "Hide password" : "Show password"}
            onClick={() => onToggleVisibility(fieldKey)}
          >
            <PasswordToggleIcon visible={isVisible} />
          </button>
        </span>
      </div>
      {errorMsg && (
        <div className="invalid-feedback d-block auth-error-text">
          {errorMsg}
        </div>
      )}
    </div>
  );
}

export default function ChangePasswordForm({
  loginId,
  form,
  errors,
  fieldVisibility,
  isPasswordExpired,
  loading,
  onFieldChange,
  onToggleVisibility,
  onBackToLogin,
  onSubmit,
}) {
  return (
    <form autoComplete="off" onSubmit={onSubmit}>
      <div className="mb-3">
        <label className="form-label auth-text-light">
          Login ID
        </label>
        <input
          type="text"
          className="form-control auth-disabled-input"
          value={loginId}
          disabled
        />
      </div>

      <ChangePasswordField
        fieldKey="oldPassword"
        labelText="Old Password"
        placeholder="Enter old password"
        value={form.oldPassword}
        errorMsg={errors.oldPassword}
        isVisible={fieldVisibility.oldPassword}
        onChange={onFieldChange}
        onToggleVisibility={onToggleVisibility}
      />

      <ChangePasswordField
        fieldKey="newPassword"
        labelText="New Password"
        placeholder="Enter new password"
        value={form.newPassword}
        errorMsg={errors.newPassword}
        isVisible={fieldVisibility.newPassword}
        onChange={onFieldChange}
        onToggleVisibility={onToggleVisibility}
      />

      <ChangePasswordField
        fieldKey="confirmPassword"
        labelText="Confirm New Password"
        placeholder="Confirm new password"
        value={form.confirmPassword}
        errorMsg={errors.confirmPassword}
        isVisible={fieldVisibility.confirmPassword}
        onChange={onFieldChange}
        onToggleVisibility={onToggleVisibility}
      />

      {!isPasswordExpired && (
        <div
          className="mb-3 text-center auth-no-margin-bottom"
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onBackToLogin();
            }}
            className="auth-link-light"
          >
            Back to login
          </a>
        </div>
      )}

      <div className="form-footer">
        <button
          type="submit"
          className="btn btn-primary custom-im-button w-100"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </form>
  );
}
