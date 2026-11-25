import React, { useRef } from "react";

export default function CopyButton({
  text,
  size = "sm",
  tooltip = "Copy",
  onCopy, // optional callback
  style = {},
}) {
  const timerRef = useRef(null);

  const handleCopy = async () => {
    if (!text || !navigator?.clipboard?.writeText) return;

    try {
      await navigator.clipboard.writeText(text);

      if (onCopy) onCopy(text);

      // Optionally show temporary title change (optional)
      const originalTitle = tooltip;
      const btn = timerRef.current;

      if (btn) {
        btn.setAttribute("title", "Copied!");
        setTimeout(() => {
          btn.setAttribute("title", originalTitle);
        }, 1200);
      }
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={timerRef}
        type="button"
        className={`btn btn-outline-secondary btn-${size}`}
        style={{
          padding: "1px 6px",
          marginLeft: "4px",
          ...style,
        }}
        onClick={handleCopy}
        title={tooltip}  // KEEP NATIVE TOOLTIP
      >
        C
      </button>
    </div>
  );
}
