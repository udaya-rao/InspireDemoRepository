import React, { useState, useCallback, useMemo } from "react";
import Toast from "./Toast";
import ToastContext from "./ToastContext";

// ToastProvider wraps the app and exposes `showToast` via context
export default function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  // Show a toast (message + type)
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // Close/hide the current toast
  const handleClose = useCallback(() => {
    setToast(null);
  }, []);

  // Memoize so consumers don't re-render unnecessarily
  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={handleClose}
        />
      )}
    </ToastContext.Provider>
  );
}
