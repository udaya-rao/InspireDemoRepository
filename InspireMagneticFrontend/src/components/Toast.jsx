import React, { useEffect } from "react";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const backgroundColor =
    type === "error"
      ? "#e74c3c"
      : type === "warning"
      ? "#F5AB23"
      : type === "info"
      ? "#1288BF"
      : "#27ae60";

  // const textColor =
  //   type === "warning"
  //     ? "#b45309"
  //     : type === "info"
  //     ? "#1e40af"
  //     : "#fff";

  const textColor = "#fff";


  return (
    <div
      style={{
        position: "fixed",
        top: 72,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        minWidth: 300,
        background: backgroundColor,
        color: textColor,
        whiteSpace: "pre-line",
        padding: "8px 16px",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        fontWeight: 500,
      }}
      role="alert"
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: textColor,
          fontSize: 18,
          marginLeft: 16,
          cursor: "pointer",
        }}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
} 