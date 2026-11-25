import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  allocateTop,
  bringToFront as bringFrontGlobal,
  isTop,
} from "./zIndexManager";
import ScrollToTopButton from "./ScrollToTopButton";
import { ConfirmDialog } from "./Notification";
import "../style/common.css"

// Utility to parse width prop (percentage or pixel value) to pixels
function parseWidthToPixels(width) {
  if (typeof width === "number") return width;

  if (typeof width === "string") {
    if (width.endsWith("%")) {
      return window.innerWidth * (parseFloat(width) / 100);
    }
    if (width.endsWith("px")) {
      return parseFloat(width);
    }
  }

  // Default fallback
  return 500;
}

// Move these above the component so they are available for useState initializers
const getSidebarElement = () =>
  typeof document !== "undefined"
    ? document.querySelector(
      ".sidebar-hover-expand.expanded, .sidebar-hover-expand"
    )
    : null;

const getSidebarWidth = () => {
  const sidebar = getSidebarElement();
  return sidebar ? sidebar.offsetWidth : 240;
};

// Helper: full/expanded drawer width (minus sidebar), clamped to min 320px
const getExpandedDrawerWidth = () =>
  Math.max(320, window.innerWidth - getSidebarWidth());

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 600
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

/**
 * Hard cleanup only for Bootstrap offcanvas backdrops.
 * We DO NOT touch body classes / overflow here to avoid
 * interfering with the splash screen or other overlays.
 */
function cleanupOffcanvasArtifacts() {
  if (typeof document === "undefined") return;
  try {
    document
      .querySelectorAll(".offcanvas-backdrop")
      .forEach((el) => el.remove());
  } catch {
    /* no-op */
  }
}

export default function RightDrawer({
  open,
  onClose,
  title,
  children,
  width = "65%",
  onSave,
  showEdit,
  onEdit,
  disableEdit,
  onDisableEdit,
  enableCloseConfirm = true,
  closeConfirmScope = "edit",
  isCreate = false,
  isDirty,
  closeConfirmTitle = "Unsaved Changes",
  closeConfirmMessage = "You have unsaved changes. Choose an option below.",
  onSaveDraft,
  onDiscardDraft,
  disableTabCloseConfirm = false,
  newRowFocusKey,
  autoFocusSelector,
  autoFocusDelay = 0,
  tabKey,
  alwaysExpanded = false,
  headerPadding,
  closeButtonStyle,
  titleStyle,
  saveButtonDisabled = false,
}) {
  const isMobile = useIsMobile();

  // Handle saveButtonDisabled as function or boolean
  const isSaveDisabled = typeof saveButtonDisabled === 'function'
    ? saveButtonDisabled()
    : saveButtonDisabled;

  const [drawerWidth, setDrawerWidth] = useState(() =>
    getExpandedDrawerWidth()
  );
  const [isResizing, setIsResizing] = useState(false);

  // NOTE: `isCollapsed` naming is inverted:
  // - true   => expanded (full width minus sidebar)
  // - false  => collapsed (original width)
  const [isCollapsed, setIsCollapsed] = useState(true); // Start expanded

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [stackZ, setStackZ] = useState(1050);

  const drawerRef = useRef(null);
  const idRef = useRef(Symbol("RightDrawer"));
  const originalWidthRef = useRef(parseWidthToPixels(width));

  // ---------------------------------------------------------------------------
  // ONE-TIME GLOBAL CLEANUP on mount (covers hard refresh case)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const t = setTimeout(() => {
      cleanupOffcanvasArtifacts();
    }, 100);
    return () => clearTimeout(t);
  }, []);

  // ---------------------------------------------------------------------------
  // Cleanup of any stray Bootstrap offcanvas backdrops,
  // but ONLY when this drawer is actually open as well.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      cleanupOffcanvasArtifacts();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  // Decide if close confirmation should be shown
  const shouldShowCloseConfirm = useCallback(() => {
    if (!enableCloseConfirm) return false;

    const dirty = !!isDirty; // require explicit isDirty when provided
    if (!dirty) return false;

    if (closeConfirmScope === "always") return true;
    if (closeConfirmScope === "create" && isCreate) return true;
    if (closeConfirmScope === "edit" && !isCreate) return true;

    return false;
  }, [enableCloseConfirm, isDirty, closeConfirmScope, isCreate]);

  // Helper: build dirtyPromptState detail for TabManager
  const buildDirtyDetail = useCallback(
    (activeOverride) => {
      const active =
        typeof activeOverride === "boolean"
          ? activeOverride
          : open && shouldShowCloseConfirm();

      return {
        active,
        // Provide callbacks for TabManager
        onSaveDraft: typeof onSaveDraft === "function" ? onSaveDraft : null,
        onDiscardDraft:
          typeof onDiscardDraft === "function" ? onDiscardDraft : null,
        tabKey, // Include tabKey in event detail
      };
    },
    [open, shouldShowCloseConfirm, onSaveDraft, onDiscardDraft, tabKey]
  );

  // When opening, set expanded width & reset state
  useEffect(() => {
    if (!open) return;

    const expandedWidth = getExpandedDrawerWidth();
    originalWidthRef.current = parseWidthToPixels(width);

    setDrawerWidth(expandedWidth);
    setIsCollapsed(true); // Start expanded when opening
    if (alwaysExpanded) {
      setIsCollapsed(true);
    }
  }, [width, open, alwaysExpanded]);

  // Focus a specific field inside the drawer when opened
  useEffect(() => {
    if (!open) return;

    const timeout = setTimeout(() => {
      try {
        const root = drawerRef.current || document;
        let selector = autoFocusSelector;

        if (!selector && newRowFocusKey) {
          selector =
            `input[name="${newRowFocusKey}"],` +
            `select[name="${newRowFocusKey}"],` +
            `textarea[name="${newRowFocusKey}"],` +
            `[name="${newRowFocusKey}"][contenteditable="true"]`;
        }

        if (!selector) return;

        const el = root.querySelector(selector);
        if (el && typeof el.focus === "function") {
          el.focus();
          try {
            if (typeof el.select === "function") el.select();
          } catch {
            /* no-op */
          }
        }
      } catch {
        /* no-op */
      }
    }, Math.max(0, autoFocusDelay));

    return () => clearTimeout(timeout);
  }, [open, newRowFocusKey, autoFocusSelector, autoFocusDelay]);

  // Initialize stacking when opened
  useEffect(() => {
    if (!open) return;
    setStackZ(allocateTop(idRef.current));
  }, [open]);

  // Desktop resize-drag handler
  useEffect(() => {
    if (!isResizing || isMobile || alwaysExpanded) return;

    const handleMouseMove = (e) => {
      const newWidth = window.innerWidth - e.clientX;
      const clamped = Math.max(
        320,
        Math.min(newWidth, window.innerWidth - getSidebarWidth())
      );
      setDrawerWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "ew-resize";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [isResizing, isMobile, alwaysExpanded]);

  // --- ADD tabKey to all dirtyPromptState broadcasts and scoping to handler ---
  useEffect(() => {
    if (!enableCloseConfirm || disableTabCloseConfirm) return;

    const detail = buildDirtyDetail();
    window.dispatchEvent(new CustomEvent("dirtyPromptState", { detail }));

    return () => {
      // Clear when drawer unmounts or deps change - ensure active is false
      const clearedDetail = buildDirtyDetail(false);
      window.dispatchEvent(
        new CustomEvent("dirtyPromptState", {
          detail: { ...clearedDetail, active: false },
        })
      );
    };
  }, [open, buildDirtyDetail, enableCloseConfirm, disableTabCloseConfirm]);

  // Respond to ping requests from TabManager to report current dirty state, but ONLY for own tabKey
  useEffect(() => {
    const pingHandler = (e) => {
      if (!e || !e.detail || !e.detail.ping) return;
      if (!enableCloseConfirm || disableTabCloseConfirm) return;

      // Only respond to pings for THIS tabKey
      if (e.detail.targetKey !== tabKey) return;

      const detail = buildDirtyDetail();
      window.dispatchEvent(new CustomEvent("dirtyPromptState", { detail }));
    };

    window.addEventListener("dirtyPromptState", pingHandler);
    return () => window.removeEventListener("dirtyPromptState", pingHandler);
  }, [buildDirtyDetail, enableCloseConfirm, disableTabCloseConfirm, tabKey]);

  // Auto-resize when in "expanded" mode (isCollapsed === true)
  useEffect(() => {
    // If alwaysExpanded, always keep it expanded
    if (alwaysExpanded) {
      setIsCollapsed(true);
    }

    if (!isCollapsed && !alwaysExpanded) return;

    const handleResize = () => {
      setDrawerWidth(getExpandedDrawerWidth());
    };

    window.addEventListener("resize", handleResize);
    // Set initial width on mount
    handleResize();

    // --- ResizeObserver for sidebar ---
    const sidebar = getSidebarElement();
    let observer;
    if (sidebar && window.ResizeObserver) {
      observer = new window.ResizeObserver(() => {
        setDrawerWidth(getExpandedDrawerWidth());
      });
      observer.observe(sidebar);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (observer && sidebar) observer.disconnect();
    };
  }, [isCollapsed, alwaysExpanded]);

  const handleCollapseToggle = () => {
    // Prevent toggle if alwaysExpanded is true
    if (alwaysExpanded) return;

    if (isCollapsed) {
      // Collapse to 65% (or default width)
      setDrawerWidth(originalWidthRef.current);
    } else {
      // Expand to full width (minus sidebar)
      setDrawerWidth(getExpandedDrawerWidth());
    }
    setIsCollapsed((prev) => !prev);
  };

  const doClose = useCallback(() => {
    // Whenever we close, also clean any stray Bootstrap backdrops
    cleanupOffcanvasArtifacts();
    if (onClose) onClose();
  }, [onClose]);

  const handleCloseClick = () => {
    if (shouldShowCloseConfirm()) {
      setShowCloseConfirm(true);
    } else {
      doClose();
    }
  };

  const handleConfirmSaveAndClose = () => {
    setShowCloseConfirm(false);
    if (typeof onSaveDraft === "function") onSaveDraft();
    doClose();
  };

  const handleCloseWithoutSave = () => {
    setShowCloseConfirm(false);
    if (typeof onDiscardDraft === "function") onDiscardDraft();
    doClose();
  };

  if (!open) return null;

  const effectiveWidth = isMobile ? "100vw" : drawerWidth;

  return (
    <div
      ref={drawerRef}
      className="offcanvas offcanvas-end show"
      tabIndex="-1"
      style={{
        visibility: "visible",
        width: effectiveWidth,
        background: "#fff",
        boxShadow: "-2px 0 16px rgba(0, 0, 0, 0.08)",
        zIndex: stackZ,
        position: "fixed",
        top: 105,
        right: 0,
        transition: isResizing ? "none" : isCollapsed ? "none" : "width 0.3s",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseDown={() => {
        if (!isTop(idRef.current)) bringFrontGlobal(setStackZ, idRef.current);
      }}
    >
      {/* Resize handle only on desktop and when not alwaysExpanded */}
      {!isMobile && !alwaysExpanded && (
        <div
          style={{
            position: "absolute",
            left: -8,
            top: 0,
            width: 16,
            height: "100%",
            cursor: "ew-resize",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseDown={() => setIsResizing(true)}
        >
          <div
            style={{
              width: 4,
              height: 48,
              borderRadius: 2,
              background: "#d0d7e1",
              boxShadow: "0 0 2px #aaa",
            }}
          />
        </div>
      )}

      <div
        className="border-bottom"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "rgb(147, 108, 145)",
          ...(headerPadding && { padding: headerPadding }),
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Collapse/Expand arrow button */}
          {!isMobile && !alwaysExpanded && (
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                fontSize: 18,
                marginRight: 0,
                cursor: "pointer",
                color: "rgb(255, 255, 255)",
              }}
              title={
                isCollapsed ? "Collapse to half screen" : "Expand to full width"
              }
              onClick={handleCollapseToggle}
            >
              {isCollapsed ? "\u2192" : "\u2190"}{" "}
              {/* → (collapse), ← (expand) */}
            </button>
          )}
          <h3
            className="offcanvas-title mb-0"
            style={{
              color: "rgb(255, 255, 255)",
              marginLeft: alwaysExpanded ? "0" : undefined,
              marginRight: 0,
              marginTop: 0,
              marginBottom: 0,
              ...(titleStyle && titleStyle),
            }}
          >
            {title}
          </h3>
        </div>

        {/* Save/Cancel buttons and close button */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {showEdit ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={onEdit}
              style={{
                background: "rgb(122, 75, 120)",
                color: "#fff",
                borderRadius: "8px",
                width: 33,
                height: 33,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "none",
                border: "none",
              }}
              title="Edit"
            >
              {/* Pencil SVG icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
              </svg>
            </button>
          ) : typeof onSave === "function" ? (
            <>
              <button
                className="btn btn-sm"
                onClick={onSave}
                disabled={isSaveDisabled}
                style={{
                  background: isSaveDisabled ? "#cccccc" : "rgb(122, 75, 120)",
                  color: "#fff",
                  borderRadius: "8px",
                  width: 33,
                  height: 33,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "none",
                  border: "none",
                  cursor: isSaveDisabled ? "not-allowed" : "pointer",
                  opacity: isSaveDisabled ? 0.6 : 1,
                }}
                title="Save"
              >
                {/* Floppy disk SVG icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              </button>

              {typeof disableEdit !== "undefined" &&
                disableEdit &&
                typeof onDisableEdit === "function" && (
                  <button
                    className="btn btn-sm"
                    onClick={onDisableEdit}
                    title="Cancel Edit"
                    style={{ marginLeft: 4, background: "rgb(122, 75, 120)", border: "none" }}
                  >
                    {/* Cancel/disable edit SVG icon (pencil with X) */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
                      <line x1="4" y1="4" x2="20" y2="20" />
                    </svg>
                  </button>
                )}
            </>
          ) : null}

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCloseClick}
            title="Close"
            style={{
              marginTop: "0",
              marginRight: "20px",
              ...(closeButtonStyle && closeButtonStyle),
            }}
          >
            {/* X SVG icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="offcanvas-body right-drawer-body"
        style={{ flex: 1, overflowY: "auto", overflowX: "auto", padding: "20px" }}
      >
        {children}
      </div>

      <ScrollToTopButton drawerRef={drawerRef} />

      <ConfirmDialog
        open={showCloseConfirm}
        title={closeConfirmTitle || "Unsaved Changes"}
        message={
          <div style={{ whiteSpace: "pre-line" }}>
            {"You have unsaved changes in this page.\nAre you sure you want to leave?"}
          </div>
        }
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={handleCloseWithoutSave}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </div>
  );
}
