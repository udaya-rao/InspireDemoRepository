import React, { useEffect, useState, useCallback } from "react";
import { Enviroment } from "../utils/url";
import { getAppVersion } from "../utils/userSession";

export default function GlobalMinibar() {
  const [minibarLeft, setMinibarLeft] = useState(0);;
  const appVersion = getAppVersion();

  // Scroll handler: convert vertical wheel scroll into horizontal scroll
  const handleWheel = useCallback((e) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, []);

  useEffect(() => {
    const SIDEBAR_SELECTOR =
      ".sidebar-hover-expand.expanded, .sidebar-hover-expand";

    const getSidebarElement = () =>
      document.querySelector(SIDEBAR_SELECTOR);

    const getSidebarWidth = () => {
      const el = getSidebarElement();
      return el ? el.offsetWidth : 0;
    };

    const measure = () => setMinibarLeft(getSidebarWidth());

    // Initial measure
    measure();

    // Re-measure on window resize
    window.addEventListener("resize", measure);

    // Handle sidebar pin / collapse events
    const pinHandler = () => setTimeout(measure, 0);
    window.addEventListener("sidebarPinStateChanged", pinHandler);

    // ResizeObserver (if supported)
    const sidebarEl = getSidebarElement();
    let resizeObserver = null;

    if (sidebarEl && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(sidebarEl);
    }

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("sidebarPinStateChanged", pinHandler);

      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      {/* Spacer (optional) */}
      {/* <div aria-hidden="true" style={{ height: 36 }} /> */}

      <style>{`
        /* Global minibar scrollbar tweaks */
        #tab-global-minibar {
          scrollbar-width: thin;
        }
        #tab-global-minibar::-webkit-scrollbar {
          height: 3px;
        }
        #tab-global-minibar::-webkit-scrollbar-thumb {
          background: #a5b1c2;
          border-radius: 2px;
        }
        #tab-global-minibar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>

      <div
        id="tab-global-minibar"
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: 0,
          left: minibarLeft,
          right: 0,
          padding: "4px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap",
          background: "#fff",
          pointerEvents: "auto",
          minHeight: "32px",
          borderTop: "1px solid #e5e7eb",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.04)",
        }}
        onWheel={handleWheel}
      >
        <span style={{ color: "#6b7280", fontSize: "13px" }}>
          {Enviroment} <strong>Version</strong> {appVersion}
        </span>
        <span style={{ color: "#6b7280", fontSize: "13px" }}>
          <strong>{new Date().getFullYear()}</strong> Inspire Magnetics
        </span>
      </div>
    </>
  );
}
