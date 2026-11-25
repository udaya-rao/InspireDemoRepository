import React, { useEffect, useMemo, useState } from "react";
import AppSplash from "./AppSplash.jsx";

/** 
 * Detect once if this page load was triggered by a full browser refresh.
 * Memoized so it's only computed on first render.
 */
const detectReload = () => {
  try {
    // Modern Navigation Timing API
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    if (nav) return nav.type === "reload";

    // Legacy Navigation API (navigation.type === 1 === RELOAD)
    const legacy = performance.navigation && performance.navigation.type;
    return legacy === 1;
  } catch {
    return false;
  }
};

export default function RefreshOnlySplash({ children }) {
  // Determine whether to show the splash only when browser is refreshed
  const isReload = useMemo(() => detectReload(), []);

  // Local state that controls splash visibility
  const [show, setShow] = useState(isReload);

  useEffect(() => {
    if (!show) return;

    // Minimum splash duration (3 seconds).
    const timer = setTimeout(() => setShow(false), 3000);

    return () => clearTimeout(timer);
  }, [show]);

  return (
    <>
      {children}
      {show && <AppSplash />}
    </>
  );
}
