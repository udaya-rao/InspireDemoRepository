import React, { useEffect } from "react";
import { createPortal } from "react-dom";

/** Per-type colors for notification */
const typeStyles = {
  success: {
    background: "#dcfce7",
    color: "#15803d",
    border: "1px solid #86efac",
  },
  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fca5a5",
  },
  info: {
    background: "#dbeafe",
    color: "#1e40af",
    border: "1px solid #93c5fd",
  },
  warning: {
    background: "#fef9c3",
    color: "#b45309",
    border: "1px solid #fde68a",
  },
};

/** SVG icons per type */
const icons = {
  error: (
    <svg
      className="icon me-2"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12" y2="16" />
    </svg>
  ),
  warning: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icon alert-icon icon-2"
    >
      <path d="M12 9v4"></path>
      <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z"></path>
      <path d="M12 16h.01"></path>
    </svg>
  ),
  success: (
    <svg
      className="icon me-2"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  ),
  info: (
    <svg
      className="icon me-2"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="8" />
    </svg>
  ),
};

const actionIcons = {
  confirm: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  ),
  cancel: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

/** Shared overlay style for all dialogs */
const OVERLAY_STYLE = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.25)",
  zIndex: 20000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/** Base dialog card style (can be extended per dialog) */
const DIALOG_BASE_STYLE = {
  background: "#fff",
  borderRadius: 10,
  minWidth: 320,
  maxWidth: "90vw",
  padding: 32,
  boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
  textAlign: "center",
};

/** Shared button row style */
const DIALOG_BUTTON_ROW_STYLE = {
  display: "flex",
  justifyContent: "center",
  gap: 16,
  flexWrap: "wrap",
};

/** Simple wrapper to avoid repeating overlay + base card in each dialog */
function ModalContainer({ open, children, cardStyle }) {
  if (!open) return null;

  return createPortal(
    <div style={OVERLAY_STYLE}>
      <div style={{ ...DIALOG_BASE_STYLE, ...cardStyle }}>{children}</div>
    </div>,
    document.body
  );
}

export default function Notification({
  type = "info",
  message,
  onClose,
  duration = 3000,
}) {
  useEffect(() => {
    if (!duration || duration <= 0) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  if (!message) return null;

  const styleForType = typeStyles[type] ?? typeStyles.info;

  return (
    <div
      style={{
        position: "fixed",
        top: 63,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        minWidth: 240,
        padding: "0px 0px 1px 21px",
        borderRadius: 8,
        boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
        fontWeight: 400,
        fontSize: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
        ...styleForType,
      }}
      role="alert"
    >
      {icons[type] || icons.info}
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: styleForType.color,
          fontSize: 16,
          cursor: "pointer",
          marginLeft: 0,
        }}
        aria-label="Close"
      >
        &times;
      </button>
    </div>
  );
}
export function YesNoDialog({
  open,
  title = "Are you sure?",
  message = "",
  onYes,
  onNo,
  onCancel,
  yesLabel = "Yes",
  noLabel = "No",
  cancelLabel = "Cancel",
}) {
  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.25)",
        zIndex: 20000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          minWidth: 320,
          maxWidth: "90vw",
          padding: 32,
          boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
          textAlign: "center",
        }}
      >
        <h3 style={{ marginBottom: 16 }}>{title}</h3>
        <div style={{ marginBottom: 24 }}>{message}</div>

        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <button
            className="btn btn-primary"
            onClick={onYes}
            style={{ minWidth: 120 }}
          >
            {yesLabel}
          </button>

          <button
            className="btn btn-secondary"
            onClick={onNo}
            style={{ minWidth: 120 }}
          >
            {noLabel}
          </button>
          {onCancel && (
            <button
              className="btn btn-secondary"
              onClick={onCancel}
              style={{ minWidth: 120 }}
            >
              {cancelLabel}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
export function DeleteConfirmDialog({ open,
  title, // (kept for API compatibility, but unused – using fixed title)
  message,
  onConfirm,
  onCancel,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  secondaryLabel,
  onSecondary,
}) {
  if (!open) return null;

  return (
    <ModalContainer open={open}>
      <h3 style={{ marginBottom: 16 }}>{"Confirm Delete"}</h3>
      <div>This action cannot be undone.</div>
      <div style={{ marginBottom: 24 }}>
        Are you sure you want to delete <b>{message}</b>?
      </div>
      <div style={DIALOG_BUTTON_ROW_STYLE}>
        {secondaryLabel && (
          <button
            className="btn btn-secondary"
            onClick={onSecondary}
            style={{ minWidth: 120 }}
          >
            {secondaryLabel}
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={onConfirm}
          style={{
            minWidth: 100,
            backgroundColor: "rgb(122, 75, 120)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {actionIcons.confirm}
          <span>{confirmLabel}</span>
        </button>
        <button
          className="btn btn-secondary"
          onClick={onCancel}
          style={{
            minWidth: 100,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {actionIcons.cancel}
          <span>{cancelLabel}</span>
        </button>
      </div>
    </ModalContainer>
  );
}

// ConfirmDialog component
export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  secondaryLabel,
  onSecondary,
}) {
  if (!open) return null;

  return (
    <ModalContainer open={open}>
      <h3 style={{ marginBottom: 16 }}>{title || "Are you sure?"}</h3>
      <div style={{ marginBottom: 24 }}>{message}</div>
      <div style={DIALOG_BUTTON_ROW_STYLE}>
        {secondaryLabel && (
          <button
            className="btn btn-secondary"
            onClick={onSecondary}
            style={{ minWidth: 120 }}
          >
            {secondaryLabel}
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={onConfirm}
          style={{
            minWidth: 100,
            backgroundColor: "rgb(122, 75, 120)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {actionIcons.confirm}
          <span>{confirmLabel}</span>
        </button>
        <button
          className="btn btn-secondary"
          onClick={onCancel}
          style={{
            minWidth: 100,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {actionIcons.cancel}
          <span>{cancelLabel}</span>
        </button>
      </div>
    </ModalContainer>
  );
}

// --- Your existing Notification and ConfirmDialog code ---
// PopupDialog component (new)
export function PopupDialog({
  open,
  title,
  children,
  onSave,
  onCancel,
  onClose,
  saveLabel = "Save",
  cancelLabel = "Cancel",
}) {
  if (!open) return null;

  return (
    <ModalContainer
      open={open}
      cardStyle={{
        borderRadius: 6,
        minWidth: 400,
        maxWidth: "80vw",
        padding: 20,
        textAlign: "left",
      }}
    >
      {/* Title bar with Close */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0 }}>{title}</h3>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          &times;
        </button>
      </div>

      {/* Content / Form */}
      <div style={{ marginBottom: 20 }}>{children}</div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        {onSave && (
          <button
            className="btn btn-primary"
            onClick={onSave}
            style={{ minWidth: 100 }}
          >
            {saveLabel}
          </button>
        )}
        <button
          className="btn btn-secondary"
          onClick={onCancel}
          style={{ minWidth: 100 }}
        >
          {cancelLabel}
        </button>
      </div>
    </ModalContainer>
  );
}
