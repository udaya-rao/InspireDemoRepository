import { useEffect } from "react";

/**
 * Automatically clears a state setter after a timeout
 * @param {*} value The state value you want to auto-clear
 * @param {Function} setter The setter function for the value
 * @param {number} delay Timeout duration in ms (default: 3000)
 */
export default function useAutoClear(value, setter, delay = 3000) {
  useEffect(() => {
    if (!value) return;

    const timer = setTimeout(() => setter(""), delay);

    return () => clearTimeout(timer);
  }, [value, setter, delay]);
}
