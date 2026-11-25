import React from "react";

const STATUS_STYLE_MAP = {
  0: { color: "#64748b", bg: "#f1f5f9" }, // New Record  (Slate)
  10: { color: "#ef4444", bg: "#fef2f2" }, // Not Approved / Pending (Red)
  20: { color: "#f59e0b", bg: "#fffbeb" }, // Amendment / In Progress (Amber)
  30: { color: "#22c55e", bg: "#dcfce7" }, // Approved / Accepted (Green)
  40: { color: "#3b82f6", bg: "#eff6ff" }, // Printed / Rejected (Blue)
  50: { color: "#71717a", bg: "#f4f4f5" }, // Short-Closed / Closed (Zinc)
  60: { color: "#64748B", bg: "#F1F5F9" }, // Cancelled (Dark Red)
  70: { color: "#22c55e", bg: "#f5f3ff" }, // Completed (Purple/Violet)
};

function getStatusStyle(statusId, statusText = "") {
  const id = Number(statusId);

  if (STATUS_STYLE_MAP[id]) {
    return STATUS_STYLE_MAP[id];
  }

  // Text-based fallback
  const text = statusText.toLowerCase();
  if (text.includes("amendment")) return STATUS_STYLE_MAP[20];
  if (text.includes("approved")) return STATUS_STYLE_MAP[30];
  if (text.includes("not approved") || text.includes("pending")) return STATUS_STYLE_MAP[10];
  if (text.includes("short")) return STATUS_STYLE_MAP[50];
  if (text.includes("completed")) return STATUS_STYLE_MAP[70];
  if (text.includes("cancel")) return STATUS_STYLE_MAP[60];

  return STATUS_STYLE_MAP[0]; // Default: grey
}


function getStatusBadgeStyle(statusId, statusText = "") {
  const { color, bg } = getStatusStyle(statusId, statusText);
  return {
    color,
    background: bg,
    borderRadius: 12,
    padding: "2px 12px",
    fontWeight: 600,
    fontSize: 12,
    display: "inline-block",
    border: "none",
    whiteSpace: "nowrap",
  };
}


export default function StatusBadge({ statusId, statusText = "", children }) {
  const label = children ?? statusText ?? "—";
  return (
    <span style={getStatusBadgeStyle(statusId, statusText)}>
      {label}
    </span>
  );
}
