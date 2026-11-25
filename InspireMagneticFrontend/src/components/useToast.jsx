import { useContext } from "react";
import ToastContext from "./ToastContext";

// Hook used by any component that wants to show a toast
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
