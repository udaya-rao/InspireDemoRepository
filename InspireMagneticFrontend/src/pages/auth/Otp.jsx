// src/pages/auth/OtpScreen.jsx
import React from "react";
import "../../style/auth.css";

const OTP_LENGTH = 6;

export default function Otp({
  otpValue,
  setOtpValue,
  resendMsg,
  onCancel,
  onVerify,
  onResend,
}) {
  const isResendSuccess =
    resendMsg === "A new OTP has been sent to your email.";

  const handleOtpInputChange = (idx, e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    const chars = otpValue.split("");
    chars[idx] = val;
    const nextOtp = chars.join("").slice(0, OTP_LENGTH);
    setOtpValue(nextOtp);

    if (val && idx < OTP_LENGTH - 1) {
      const next = document.getElementById(`otp-input-${idx + 1}`);
      if (next) next.focus();
    }
  };

  return (
    <div>
      <div className="auth-otp-message">
        OTP has been sent to your email. Please enter the code to verify.
      </div>

      <div className="auth-otp-inputs">
        {Array.from({ length: OTP_LENGTH }).map((_, idx) => (
          <input
            key={idx}
            type="text"
            maxLength={1}
            value={otpValue[idx] || ""}
            onChange={(e) => handleOtpInputChange(idx, e)}
            id={`otp-input-${idx}`}
            className="auth-otp-input"
          />
        ))}
      </div>

      <div className="form-footer auth-otp-footer">
        <button
          className="btn btn-secondary auth-otp-btn"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary custom-im-button auth-otp-btn"
          onClick={onVerify}
        >
          Verify
        </button>
      </div>

      <div className="auth-otp-resend">
        It may take a minute to receive your code. Haven&apos;t received it?
        <br />
        <span className="auth-otp-resend-link" onClick={onResend}>
          Resend a new code.
        </span>
        {resendMsg && (
          <div
            className={`auth-otp-resend-msg ${
              isResendSuccess
                ? "auth-otp-resend-msg--success"
                : "auth-otp-resend-msg--error"
            }`}
          >
            {resendMsg}
          </div>
        )}
      </div>
    </div>
  );
}
