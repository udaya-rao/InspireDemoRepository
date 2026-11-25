import React, { useState, useEffect, useCallback } from "react";
import { RiseLoader } from "react-spinners";

const Loader = ({
  color = "#374151",
  size = 15,
  loading = true,
  backgroundColor = "rgba(255, 255, 255, 0)",
  zIndex = 9999,
  ...rest
}) => {
  
  // Maintain responsive loader size (auto-adjust on small screens)
  const [loaderSize, setLoaderSize] = useState(() =>
    window.innerWidth < 600 ? 8 : size
  );

  // Resize handler (memoized so it doesn't recreate on every render)
  const handleResize = useCallback(() => {
    setLoaderSize(window.innerWidth < 600 ? 8 : size);
  }, [size]);

  useEffect(() => {
    // Initialize loader size on mount
    handleResize();

    // Update size on window resize
    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  if (!loading) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0, // shorthand for top/left/right/bottom = 0
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor,
        backdropFilter: "blur(2px)",
        zIndex,
        width: "100%",
        height: "100%",
      }}
    >
      {/* Loader Component */}
      <RiseLoader color={color} size={loaderSize} loading={loading} {...rest} />
    </div>
  );
};

export default Loader;
