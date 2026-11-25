import React, { useEffect, useRef, useState } from "react";
import Logo from "../assets/logo/inspire-magnetics-logo-1.png";

const SPLASH_DURATION_MS = 2800;

// ---- Static styles (not recreated on every render) ----
const overlayStyle = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(1.5px)",
  zIndex: 10000,
  width: "100%",
  height: "100%",
};

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
};

const logoStyle = {
  height: 100,
  width: 250,
  animation: "splashPulse 1.6s ease-in-out infinite",
  transformOrigin: "center",
};

const barOuterStyle = {
  width: 240,
  height: 8,
  borderRadius: 999,
  background: "rgba(0,0,0,0.08)",
  overflow: "hidden",
  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
};

const barInnerBaseStyle = {
  height: "100%",
  background: "linear-gradient(90deg, #22c55e, #16a34a)",
  boxShadow: "0 0 12px rgba(34,197,94,0.35)",
  transition: "width 80ms linear",
  position: "relative",
};

export default function AppSplash() {
  const [progress, setProgress] = useState(0);
  const frameIdRef = useRef(null);

  useEffect(() => {
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, (elapsed / SPLASH_DURATION_MS) * 100);

      setProgress(pct);

      if (pct < 100) {
        frameIdRef.current = requestAnimationFrame(tick);
      }
    };

    frameIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, []);

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        <img
          src={Logo}
          alt="Inspire Magnetics"
          style={logoStyle}
          draggable="false"
        />

        <div
          style={barOuterStyle}
          aria-label="Application loading"
          role="status"
          aria-live="polite"
        >
          <div
            style={{
              ...barInnerBaseStyle,
              width: `${progress}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
