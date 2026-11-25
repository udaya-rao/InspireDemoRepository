import { useCallback, useEffect, useRef } from "react";
import { toast } from "react-toastify";

const SLOW_EFFECTIVE_TYPES = new Set(["slow-2g", "2g"]);
const MIN_DOWNLINK_MBPS = 0.5;

const getConnection = () => {
  if (typeof navigator === "undefined") return null;
  return (
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection ||
    null
  );
};

function InternetStatus() {
  const offlineToastId = useRef(null);
  const slowToastId = useRef(null);
  const connectionRef = useRef(getConnection());

  const showOfflineToast = useCallback(() => {
    if (!offlineToastId.current || !toast.isActive(offlineToastId.current)) {
      offlineToastId.current = toast.error("You are offline.", {
        toastId: "offline-network-toast",
        autoClose: false,
      });
    }
  }, []);

  const hideOfflineToast = useCallback(() => {
    if (offlineToastId.current) {
      toast.dismiss(offlineToastId.current);
      offlineToastId.current = null;
    }
  }, []);

  const showSlowToast = useCallback(() => {
    if (!slowToastId.current || !toast.isActive(slowToastId.current)) {
      slowToastId.current = toast.warning("Slow internet connection detected.", {
        toastId: "slow-network-toast",
        autoClose: false,
      });
    }
  }, []);

  const hideSlowToast = useCallback(() => {
    if (slowToastId.current) {
      toast.dismiss(slowToastId.current);
      slowToastId.current = null;
    }
  }, []);

  const evaluateConnection = useCallback(() => {
    if (!navigator.onLine) {
      hideSlowToast();
      showOfflineToast();
      return;
    }

    hideOfflineToast();

    const connection = connectionRef.current;
    if (!connection) {
      hideSlowToast();
      return;
    }

    const effectiveType = connection.effectiveType || "";
    const downlink = typeof connection.downlink === "number" ? connection.downlink : 10;

    if (SLOW_EFFECTIVE_TYPES.has(effectiveType) || downlink < MIN_DOWNLINK_MBPS) {
      showSlowToast();
    } else {
      hideSlowToast();
    }
  }, [hideOfflineToast, hideSlowToast, showOfflineToast, showSlowToast]);

  useEffect(() => {
    const handleOffline = () => {
      hideSlowToast();
      showOfflineToast();
    };

    const handleOnline = () => {
      hideOfflineToast();
      evaluateConnection();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    const connection = connectionRef.current;
    let cleanupConnection;
    if (connection) {
      const handleConnectionChange = () => {
        evaluateConnection();
      };

      if (typeof connection.addEventListener === "function") {
        connection.addEventListener("change", handleConnectionChange);
        cleanupConnection = () =>
          connection.removeEventListener("change", handleConnectionChange);
      } else if ("onchange" in connection) {
        const previous = connection.onchange;
        connection.onchange = (event) => {
          if (typeof previous === "function") {
            previous.call(connection, event);
          }
          handleConnectionChange();
        };
        cleanupConnection = () => {
          connection.onchange = previous || null;
        };
      }
    }

    evaluateConnection();

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (cleanupConnection) {
        cleanupConnection();
      }
    };
  }, [evaluateConnection, hideOfflineToast, hideSlowToast, showOfflineToast]);

  return null;
}

export default InternetStatus;

