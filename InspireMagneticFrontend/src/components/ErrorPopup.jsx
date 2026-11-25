import React, { useEffect } from "react";

// ---------- Inline style objects (defined once, reused) ----------
const backdropStyle = {
  position: "fixed",
  inset: 0, // shorthand for top:0, right:0, bottom:0, left:0
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  backdropFilter: "blur(2px)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const popupStyle = {
  backgroundColor: "#fff",
  borderRadius: "12px",
  border: "2px solid #dc3545",
  padding: "32px",
  maxWidth: "300px",
  width: "90%",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
  textAlign: "center",
  position: "relative",
};

const iconOuterStyle = {
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  backgroundColor: "rgba(220, 53, 69, 0.1)",
  border: "2px solid #dc3545",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 20px auto",
};

const iconInnerStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "50%",
  backgroundColor: "#dc3545",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontSize: "24px",
  fontWeight: "bold",
};

const titleStyle = {
  color: "#dc3545",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
  fontFamily: "Arial, sans-serif",
};

const messageStyle = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 24px 0",
  fontFamily: "Arial, sans-serif",
};

const ErrorPopup = ({
  isOpen,
  onClose,
  title = "Error!",
  message,
  autoCloseDelay = 3000,
}) => {
  // Auto-close logic
  useEffect(() => {
    if (!isOpen || autoCloseDelay <= 0) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDelay);

    return () => clearTimeout(timer);
  }, [isOpen, onClose, autoCloseDelay]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={backdropStyle}
        onClick={onClose}
        // ARIA attributes to help screen readers
        role="presentation"
      >
        {/* Error Popup */}
        <div
          style={popupStyle}
          onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="error-popup-title"
          aria-describedby="error-popup-message"
        >
          {/* Error Icon */}
          <div style={iconOuterStyle}>
            <div style={iconInnerStyle}>!</div>
          </div>

          {/* Error Title */}
          <h3 id="error-popup-title" style={titleStyle}>
            {title}
          </h3>

          {/* Error Message */}
          <p id="error-popup-message" style={messageStyle}>
            {message}
          </p>

          {/* Close Button */}
        </div>
      </div>
    </>
  );
};

export default ErrorPopup;
