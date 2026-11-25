import React, { useState, useEffect, useRef } from "react";

const SCROLL_TOLERANCE = 2;

// Shared button style so we don't repeat the same object for top/bottom
const baseButtonStyle = {
  position: "fixed",
  right: 32,
  bottom: 80,
  zIndex: 9999,
  background: "#7a4b78",
  color: "white",
  border: "none",
  borderRadius: "12%",
  width: 40,
  height: 40,
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  padding: "0.3rem",
  outline: "none",
};

export default function ScrollToTopButton({ drawerRef }) {
  const [isScrollable, setIsScrollable] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollableRef = useRef(null);

  useEffect(() => {
    // Helper: resolve the scrollable element (offcanvas-body)
    const resolveScrollable = () => {
      const drawer = drawerRef?.current;
      if (!drawer) return null;

      const offcanvasBody = drawer.querySelector(".offcanvas-body");
      if (!offcanvasBody) return null;

      scrollableRef.current = offcanvasBody;
      return offcanvasBody;
    };

    // Helper: recompute scrollability and button state
    const updateScrollState = () => {
      const content = scrollableRef.current || resolveScrollable();
      if (!content) return;

      const { scrollTop, scrollHeight, clientHeight } = content;

      // Check if scrolling is needed at all
      const scrollable = scrollHeight > clientHeight;
      setIsScrollable(scrollable);
      if (!scrollable) {
        setShowScrollToTop(false);
        return;
      }

      const atTop = scrollTop <= SCROLL_TOLERANCE;
      const atBottom =
        scrollTop + clientHeight >= scrollHeight - SCROLL_TOLERANCE;

      // Logic for showing scroll-to-top button with tolerance:
      //  - When at bottom: show "scroll to top"
      //  - When at top: hide (i.e., show "scroll to bottom")
      //  - When in the middle: keep current state (no change)
      if (atBottom) {
        setShowScrollToTop(true);
      } else if (atTop) {
        setShowScrollToTop(false);
      }
    };

    const drawer = drawerRef?.current;
    if (!drawer) return;

    const content = resolveScrollable();
    if (!content) return;

    // Initial state computation
    updateScrollState();

    // Listen for scroll on the offcanvas body
    content.addEventListener("scroll", updateScrollState, { passive: true });

    // Re-evaluate on window resize
    window.addEventListener("resize", updateScrollState);

    // Observe DOM changes inside drawer to re-evaluate scrollability
    const observer = new MutationObserver(updateScrollState);
    observer.observe(drawer, { childList: true, subtree: true });

    // Cleanup on unmount
    return () => {
      content.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      observer.disconnect();
    };
  }, [drawerRef]);

  // Scroll smoothly to the top of the drawer content
  const handleScrollToTop = () => {
    const content = scrollableRef.current;
    if (content) {
      content.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Scroll smoothly to the bottom of the drawer content
  const handleScrollToBottom = () => {
    const content = scrollableRef.current;
    if (content) {
      content.scrollTo({ top: content.scrollHeight, behavior: "smooth" });
    }
  };

  // If content is not scrollable, no button is needed
  if (!isScrollable) return null;

  return showScrollToTop ? (
    <button
      onClick={handleScrollToTop}
      style={baseButtonStyle}
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      ▲
    </button>
  ) : (
    <button
      onClick={handleScrollToBottom}
      style={baseButtonStyle}
      aria-label="Scroll to bottom"
      title="Scroll to bottom"
    >
      ▼
    </button>
  );
}
