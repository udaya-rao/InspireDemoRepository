import React from "react";

const SessionExpiredModal = ({ open, onSignInAgain }) => {
  if (!open) return null;

  return (
    <div className="session-expired-modal">
      <div className="session-expired-box">
        {/* Clock Icon */}
        <div className="session-expired-icon">🕒</div>

        {/* Title */}
        <h2 className="session-expired-title">Session Expired</h2>

        {/* Message */}
        <p className="session-expired-message">
          Your session has expired for security reasons. Please sign in again to continue using the app.
        </p>

        {/* Action Button */}
        <button className="session-expired-btn" onClick={onSignInAgain}>
          Sign In Again
        </button>
      </div>

      {/* Component-scoped styles */}
      <style>{`
        /* Overlay */
        .session-expired-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Box wrapper */
        .session-expired-box {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.15);
          min-width: 280px;
          max-width: 90vw;
          text-align: center;
          padding: 32px 16px;
          box-sizing: border-box;
        }

        /* Larger screens */
        @media (min-width: 600px) {
          .session-expired-box {
            min-width: 400px;
            max-width: 480px;
            padding: 32px 48px;
          }
        }

        /* Icon */
        .session-expired-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        /* Title */
        .session-expired-title {
          margin: 0 0 12px;
        }

        /* Message */
        .session-expired-message {
          margin: 0;
          color: #444;
        }

        /* Button */
        .session-expired-btn {
          margin-top: 20px;
          padding: 12px 32px;
          font-size: 18px;
          border: none;
          cursor: pointer;
          border-radius: 6px;
          color: #000;
          background: rgb(254, 230, 196);
          transition: background 0.2s ease;
        }

        .session-expired-btn:hover {
          background: rgb(254, 230, 196);
        }
      `}</style>
    </div>
  );
};

export default SessionExpiredModal;
