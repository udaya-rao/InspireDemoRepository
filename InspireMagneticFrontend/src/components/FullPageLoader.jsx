import { memo } from "react";
import "./FullPageLoader.css";

function FullPageLoader({
  loading = false,
  message = "Processing...",
  logoSrc,
  background = "rgba(0, 0, 0, 0.5)",
  blur = 3,
}) {
  if (!loading) return null;

  const overlayStyle = {
    backgroundColor: background,
    backdropFilter: `blur(${blur}px)`,
  };

  return (
    <div className="page-loader" style={overlayStyle}>
      <div className="page-loader-content text-center">
        {logoSrc ? (
          <div className="page-loader-logo mb-4">
            <img src={logoSrc} alt="Loading" className="page-animated-logo" />
          </div>
        ) : null}

        <div className="page-loader-dots mb-3">
          <span />
          <span />
          <span />
        </div>

        <div className="page-loader-text">{message}</div>
      </div>
    </div>
  );
}

export default memo(FullPageLoader);
