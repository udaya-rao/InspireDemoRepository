import React, { useMemo } from "react";
import TopNavbar from "./TopNavbar";
import { ConfirmDialog } from "./Notification";
import { useLocation, useNavigate } from "react-router-dom";
import GlobalMinibar from "./GlobalMinibar";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToHorizontalAxis,
  restrictToFirstScrollableAncestor,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { hasPermission } from "../permissions/permissionUtils";
import { routePermissions } from "../permissions/PermissionRoute";

// Single aggregated storage key per user with tab descriptors
// Shape: { [userId]: { [tabInstanceId]: { openTabs: Array<{ key, title, path, basePath, isVirtual }>, activeTab: string, activePath: string, tabHistory: string[] } } }
const TABS_STATE_KEY = "tabsStateByUser";

// Small helper to normalize basePath from a url
const getBasePath = (path) => String(path || "").split("?")[0];

// Generate a unique ID for this browser tab/window instance
const getTabInstanceId = () => {
  let tabId = sessionStorage.getItem("tabInstanceId");
  if (!tabId) {
    // Generate a unique ID using timestamp and random number
    // tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    tabId = `InspireMagnetics_${getCurrentUserId()}_tabs`;
    sessionStorage.setItem("tabInstanceId", tabId);
  }
  return tabId;
};

const readTabsState = () => {
  try {
    const raw = localStorage.getItem(TABS_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeTabsState = (state) => {
  try {
    localStorage.setItem(TABS_STATE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
};

// Helper to get current user ID (stable across the app)
const getCurrentUserId = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userObj = JSON.parse(userStr);
      // Prefer empl_id, fallback to login_id, else label as unknown
      return String(userObj?.empl_id || userObj?.login_id || "unknown");
    }
  } catch {
    /* ignore */
  }
  return "unknown";
};

/**
 * Map persisted "openTabs" into descriptor objects.
 * Handles legacy string format and new descriptor format.
 */
const mapSavedToDescriptors = (saved, pages) => {
  if (!Array.isArray(saved)) return [];

  return saved.map((t) => {
    if (typeof t === "string") {
      const page = pages.find((p) => p.key === t);
      const path = page?.path || "/";
      return {
        key: t,
        title: page?.title || t,
        path,
        basePath: getBasePath(path),
        isVirtual: false,
      };
    }
    return t;
  });
};

/**
 * Build live tab objects from descriptors, reattaching basePage content + icon.
 */
const restoreTabsFromDescriptors = (descriptors, pages) =>
  descriptors
    .map((d) => {
      const basePath = getBasePath(d.basePath || d.path || "");

      const matchingPages = pages.filter((p) =>
        basePath.startsWith(String(p.path || "")),
      );
      const basePage =
        matchingPages.reduce((best, p) => {
          if (!best) return p;
          return (p.path?.length || 0) > (best.path?.length || 0) ? p : best;
        }, null) || pages.find((p) => p.key === d.key);

      if (!basePage) return null;

      // Filter based on permission
      const requiredPermission = routePermissions[basePage.path];
      if (requiredPermission && !hasPermission(requiredPermission)) {
        return null; // User no longer has permission for this page
      }

      // For virtual tabs, override key/title/path but reuse base content/icon
      if (d.isVirtual) {
        return {
          key: d.key,
          title: d.title || basePage.title,
          path: d.path || basePage.path,
          icon: basePage.icon,
          content: basePage.content,
        };
      }

      // Static tab
      return basePage;
    })
    .filter(Boolean);

export default function TabManager({ pages }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Minibar handled in GlobalMinibar component

  const currentUserId = getCurrentUserId();
  const tabInstanceId = getTabInstanceId();

  // Refs and helpers to auto-scroll the active tab into view
  const tabListRef = React.useRef(null);
  const tabRefs = React.useRef({});
  const lastTabScrollLeftRef = React.useRef(0);
  // Flag to prevent writing to localStorage during storage sync
  const isSyncingFromStorageRef = React.useRef(false);

  const setTabRef = React.useCallback((key, node) => {
    if (node) {
      tabRefs.current[key] = node;
    } else {
      delete tabRefs.current[key];
    }
  }, []);

  // Restore for this user and tab instance from aggregated storage (supports virtual tabs)
  const [openTabs, setOpenTabs] = React.useState(() => {
    const map = readTabsState();
    const saved = map[currentUserId]?.[tabInstanceId]?.openTabs || [];
    const descriptors = mapSavedToDescriptors(saved, pages);
    return restoreTabsFromDescriptors(descriptors, pages);
  });

  const [activeTabKey, setActiveTabKey] = React.useState(() => {
    // Do not auto-restore last active tab on fresh load; we'll land on Dashboard instead
    return null;
  });

  // Track most-recently-used (MRU) tab order to restore focus on close
  const [tabHistory, setTabHistory] = React.useState(() => {
    const map = readTabsState();
    return map[currentUserId]?.[tabInstanceId]?.tabHistory || [];
  });

  // On first load only redirect to dashboard if at root path (post-login landing)
  React.useEffect(() => {
    if (location.pathname === "/" || location.pathname === "") {
      const dashboardTab = pages.find((p) => p.key === "dashboard");
      if (dashboardTab) {
        setActiveTabKey(dashboardTab.key);
        navigate(dashboardTab.path, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist changes to aggregated storage (store descriptors, not React nodes)
  React.useEffect(() => {
    // Skip writing if we're currently syncing from storage to avoid loops
    if (isSyncingFromStorageRef.current) return;

    const map = readTabsState();
    if (!map[currentUserId]) map[currentUserId] = {};

    const existingInstanceState = map[currentUserId][tabInstanceId] || {
      openTabs: [],
      activeTab: null,
      activePath: null,
      tabHistory: [],
    };

    // Persist openTabs as descriptors
    const descriptors = openTabs.map((t) => {
      const basePath = getBasePath(t.path);
      const isStatic = !!pages.find((p) => p.key === t.key);
      return {
        key: t.key,
        title: t.title,
        path: t.path,
        basePath,
        isVirtual: !isStatic,
      };
    });

    // compute active path from available tabs definition
    let activePath = null;
    if (activeTabKey) {
      const tabObj =
        openTabs.find((t) => t.key === activeTabKey) ||
        pages.find((p) => p.key === activeTabKey);
      activePath = tabObj?.path || null;
    }

    // Persist MRU history per user and tab instance (filtered to currently open tabs)
    const filteredHistory = tabHistory.filter((key) =>
      openTabs.some((t) => t.key === key),
    );

    map[currentUserId][tabInstanceId] = {
      ...existingInstanceState,
      openTabs: descriptors,
      activeTab: activeTabKey || null,
      activePath,
      tabHistory: filteredHistory,
    };

    writeTabsState(map);
  }, [openTabs, activeTabKey, tabHistory, currentUserId, tabInstanceId, pages]);

  // Detect user change: switch to that user's saved tabs for this tab instance (or start fresh)
  const [lastUserId, setLastUserId] = React.useState(currentUserId);

  React.useEffect(() => {
    if (lastUserId === currentUserId) return;

    const map = readTabsState();
    const saved = map[currentUserId]?.[tabInstanceId]?.openTabs || [];
    const descriptors = mapSavedToDescriptors(saved, pages);
    const restored = restoreTabsFromDescriptors(descriptors, pages);

    isSyncingFromStorageRef.current = true;
    setOpenTabs(restored);

    const hist = (map[currentUserId]?.[tabInstanceId]?.tabHistory || []).filter(
      (k) => restored.find((t) => t.key === k),
    );
    setTabHistory(hist);

    // Do not auto-select savedActive; land on Dashboard instead (history and open tabs preserved)
    const savedActive =
      map[currentUserId]?.[tabInstanceId]?.activeTab ||
      hist[hist.length - 1] ||
      restored[0]?.key ||
      null;

    const dashboard = pages.find((p) => p.key === "dashboard");
    if (dashboard) setActiveTabKey(dashboard.key);
    setLastUserId(currentUserId);

    const target = dashboard || pages.find((p) => p.key === savedActive);
    if (target && !location.pathname.startsWith(target.path))
      navigate(target.path);

    // next tick, re-enable persistence
    setTimeout(() => {
      isSyncingFromStorageRef.current = false;
    }, 0);
  }, [
    currentUserId,
    lastUserId,
    tabInstanceId,
    pages,
    navigate,
    location.pathname,
  ]);

  // Only sync if user changes in another tab (reload) - tab state is now independent per browser tab
  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "user") {
        // User changed in another tab - reload to switch user context
        window.location.reload();
      }
      // Tab state changes in other tabs are no longer synced - each browser tab maintains its own state
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Open tab if URL changes to a new page, but only if not already open
  React.useEffect(() => {
    // Skip auto-opening tabs if we're in the middle of closing a tab
    if (window._isClosingTab) return;

    // Prefer the longest matching page path (avoid '/fair-report' matching '/fair-report-master')
    const matchingPages = pages.filter((p) =>
      location.pathname.startsWith(p.path),
    );

    const page = matchingPages.reduce((best, p) => {
      if (!best) return p;
      return (p.path?.length || 0) > (best.path?.length || 0) ? p : best;
    }, null);

    if (page) {
      // Check permission before opening tab
      const requiredPermission = routePermissions[page.path];
      if (requiredPermission && !hasPermission(requiredPermission)) {
        return;
      }
      // Prevent auto-opening a duplicate tab only if an identical base path tab is already open
      const currentBase = location.pathname;
      const hasMatchingOpen = openTabs.some(
        (t) => getBasePath(t.path) === currentBase,
      );
      const pageIsOpen = openTabs.find((t) => t.key === page.key);

      // Only block adding the static page tab if a matching virtual tab exists;
      // but still allow focusing the static page if it's already open.
      if (!hasMatchingOpen) {
        setOpenTabs((prev) => {
          if (prev.find((t) => t.key === page.key)) return prev;
          return [...prev, page];
        });
      }

      // Focus the page tab if it is open or we just added it
      if (pageIsOpen || !hasMatchingOpen) {
        setActiveTabKey(page.key);
      }
    }
  }, [location.pathname, pages, openTabs]);

  // Listen for requests to open a virtual tab (e.g., FAIR per itemCode)
  React.useEffect(() => {
    const handler = (e) => {
      const { key, title, path, icon, content } = e.detail || {};
      if (!key || !path || !content) return;

      setOpenTabs((prev) => {
        const existing = prev.find((t) => t.key === key);
        if (existing) {
          // Update the existing tab's path/title/icon/content (keep position)
          return prev.map((t) =>
            t.key === key
              ? {
                ...t,
                title: title || t.title,
                path,
                icon: icon || t.icon,
                content: content || t.content,
              }
              : t,
          );
        }
        return [...prev, { key, title, path, icon, content }];
      });

      // Navigate exactly to the requested path if different from current
      const currentFullPath = `${location.pathname}${location.search || ""}`;
      if (currentFullPath !== String(path)) {
        navigate(path);
      }

      // Defer focus to run after any route-driven effects
      setTimeout(() => {
        setActiveTabKey(key);
      }, 0);
    };

    window.addEventListener("openVirtualTab", handler);
    return () => window.removeEventListener("openVirtualTab", handler);
  }, [navigate, location.pathname, location.search]); // <-- add location.search here

  // Active tab is the one matching the current URL (prefer exact path incl. query)
  const activeTab = useMemo(() => {
    // 1) If a specific tab key is selected, honor it
    if (activeTabKey) {
      return openTabs.find((t) => t.key === activeTabKey) || openTabs[0];
    }

    // 2) Try to match a virtual tab whose full path (incl. query) equals the current URL
    const fullPath = `${location.pathname}${location.search || ""}`;
    const exact = openTabs.find((t) => String(t.path || "") === fullPath);
    if (exact) return exact;

    // 3) Fallback to the tab with the longest base-path match against the current URL
    const matches = openTabs
      .map((t) => ({ tab: t, base: getBasePath(t.path) }))
      .filter(({ base }) => location.pathname.startsWith(base));

    if (matches.length > 0) {
      matches.sort((a, b) => b.base.length - a.base.length);
      return matches[0].tab;
    }

    return openTabs[0];
  }, [openTabs, location.pathname, location.search, activeTabKey]);

  // Ensure we set the activeTabKey to the tab that exactly matches the current URL on first load/refresh
  React.useEffect(() => {
    if (activeTabKey) return;
    const fullPath = `${location.pathname}${location.search || ""}`;
    const exact = openTabs.find((t) => String(t.path || "") === fullPath);
    if (exact) setActiveTabKey(exact.key);
  }, [activeTabKey, openTabs, location.pathname, location.search]);

  // Maintain MRU history whenever the active tab changes
  React.useEffect(() => {
    if (!activeTabKey) return;
    setTabHistory((prev) => {
      const without = prev.filter((k) => k !== activeTabKey);
      return [...without, activeTabKey];
    });
  }, [activeTabKey]);

  // Ensure the active tab is visible by scrolling it into view
  const scrollActiveTabIntoView = React.useCallback(
    (keyOverride) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const container = tabListRef.current;
          const keyToUse = keyOverride || activeTabKey;
          const node = keyToUse ? tabRefs.current[keyToUse] : null;
          if (!container || !node) return;

          const containerRect = container.getBoundingClientRect();
          const nodeRect = node.getBoundingClientRect();

          const containerScrollLeft = container.scrollLeft;
          const nodeCenter = nodeRect.left + nodeRect.width / 2;
          const containerCenter = containerRect.left + containerRect.width / 2;
          const scrollOffset = nodeCenter - containerCenter;

          const targetScrollLeft = containerScrollLeft + scrollOffset;
          const duration = 100; // ms

          if (Math.abs(scrollOffset) < 2) return; // Don't animate if already centered

          const startTime = performance.now();

          function easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          }

          function animateScroll(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeInOutQuad(progress);
            container.scrollLeft =
              containerScrollLeft +
              (targetScrollLeft - containerScrollLeft) * ease;
            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            }
          }

          requestAnimationFrame(animateScroll);
        });
      });
    },
    [activeTabKey],
  );

  React.useEffect(() => {
    scrollActiveTabIntoView();
  }, [activeTabKey, openTabs.length, scrollActiveTabIntoView]);

  // Expose active tab key on <body> so overlays can target the correct minibar
  React.useEffect(() => {
    if (activeTab?.key) {
      document.body.setAttribute("data-active-tab", activeTab.key);
    } else {
      document.body.removeAttribute("data-active-tab");
    }
    return () => {
      document.body.removeAttribute("data-active-tab");
    };
  }, [activeTab?.key]);

  // Open a tab (navigate to its path and update URL)
  const openTab = (key) => {
    const tab =
      openTabs.find((t) => t.key === key) || pages.find((p) => p.key === key);
    if (!tab) return;

    const currentFullPath = `${location.pathname}${location.search || ""}`;
    const targetPath = String(tab.path || "");
    if (currentFullPath !== targetPath) {
      navigate(targetPath);
    }
    setActiveTabKey(key);
    setTimeout(() => scrollActiveTabIntoView(key), 0);
  };

  // Close a tab
  const [closeConfirm, setCloseConfirm] = React.useState({
    open: false,
    onSave: null,
    onDiscard: null,
    key: null,
    title: null,
  });
  const bypassRef = React.useRef(false);

  // ✅ UPDATED: keep your exact logic, but make the function stable (prevents re-registration / hook warnings)
  const closeTab = React.useCallback(
    (key) => {
      if (openTabs.length === 1) return; // Prevent closing last tab
      if (key === "dashboard") return; // Prevent closing Dashboard tab

      // Set a flag to prevent auto-opening tabs during close operation
      const isClosingActiveTab = activeTab && activeTab.key === key;
      if (isClosingActiveTab) {
        window._isClosingTab = true;
      }

      // If bypass flag set (after user decided), skip interception once
      if (bypassRef.current) {
        bypassRef.current = false;
        return actuallyClose();
      }

      // Intercept with global dirty state (if any form drawer is dirty in create mode)
      let blocked = false;
      let saveCb = null;
      let discardCb = null;

      const handler = (e) => {
        // Ignore our own ping event
        if (e?.detail?.ping) return;
        const { active, onSaveDraft, onDiscardDraft } = e.detail || {};
        if (active) {
          blocked = true;
          saveCb = onSaveDraft || null;
          discardCb = onDiscardDraft || null;
        }
      };

      window.addEventListener("dirtyPromptState", handler);
      // Ask current state for the specific tab we intend to close
      window.dispatchEvent(
        new CustomEvent("dirtyPromptState", {
          detail: { ping: true, targetKey: key },
        }),
      );

      // Give the response a tick to arrive, then decide
      setTimeout(() => {
        window.removeEventListener("dirtyPromptState", handler);
        if (blocked) {
          // capture current horizontal scroll before dialog opens
          try {
            lastTabScrollLeftRef.current = tabListRef.current?.scrollLeft || 0;
          } catch {
            /* noop */
          }
          const tabMeta =
            openTabs.find((t) => t.key === key) ||
            pages.find((p) => p.key === key) ||
            null;
          const title = tabMeta?.title || key;
          setCloseConfirm({
            open: true,
            onSave: saveCb,
            onDiscard: discardCb,
            key,
            title,
          });
        } else {
          actuallyClose();
        }
      }, 10);

      function actuallyClose() {
        let idx = openTabs.findIndex((t) => t.key === key);
        if (idx === -1) return;

        const newTabs = openTabs.filter((t) => t.key !== key);
        setOpenTabs(newTabs);
        setTabHistory((prev) => prev.filter((k) => k !== key));

        if (activeTab && activeTab.key === key) {
          // Select the last (rightmost) tab in the current order
          const nextTab = newTabs[newTabs.length - 1];
          if (nextTab) {
            setActiveTabKey(nextTab.key);
            // Navigate after a small delay to avoid conflicts
            setTimeout(() => {
              navigate(nextTab.path);
              // Clear the closing flag after navigation
              setTimeout(() => {
                window._isClosingTab = false;
              }, 100);
            }, 50);
            setTimeout(() => {
              scrollActiveTabIntoView(nextTab.key);
            }, 0);
          }
        }
      }
    },
    [openTabs, pages, activeTab, navigate, scrollActiveTabIntoView],
  );

  /**
   *
   * Pass a tab key. If that key is the CURRENT ACTIVE tab, close it (remove from tab list).
   * If it's not the active tab, do nothing.
   */
  const closeTabIfActive = React.useCallback(
    (key) => {
      if (!key) return;

      // Most reliable "active" source in your app (you already set this)
      const bodyActiveKey =
        document.body.getAttribute("data-active-tab") || null;

      const activeKey = bodyActiveKey || activeTab?.key || activeTabKey || null;

      if (activeKey === key) {
        closeTab(key);
      }
    },
    [closeTab, activeTab?.key, activeTabKey],
  );

  /**
   * Expose global helpers
   * - window.closeTabIfActive(key)  -> closes only if key is the active tab
   * - window.closeSpecificTab(key)  -> closes regardless (kept for compatibility if you used it earlier)
   * - window.closeActiveTab()       -> convenience
   */
  React.useEffect(() => {
    window.closeTabIfActive = (tabKey) => {
      closeTabIfActive(tabKey);
    };

    window.closeSpecificTab = (tabKey) => {
      if (!tabKey) return;
      closeTab(tabKey);
    };

    window.closeActiveTab = () => {
      const k = document.body.getAttribute("data-active-tab");
      if (!k) return;
      closeTab(k);
    };

    return () => {
      delete window.closeTabIfActive;
      delete window.closeSpecificTab;
      delete window.closeActiveTab;
    };
  }, [closeTabIfActive, closeTab]);

  // Preserve/restore tabbar horizontal scroll position when confirmation dialog opens/closes
  React.useEffect(() => {
    const container = tabListRef.current;
    if (!container) return;
    // After state changes and DOM updates, restore prior scrollLeft
    const id = setTimeout(() => {
      try {
        container.scrollLeft = lastTabScrollLeftRef.current || 0;
      } catch {
        /* noop */
      }
    }, 0);
    return () => clearTimeout(id);
  }, [closeConfirm.open]);

  // DnD-kit setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    setOpenTabs((tabs) => {
      const oldIndex = tabs.findIndex((tab) => tab.key === active.id);
      const newIndex = tabs.findIndex((tab) => tab.key === over.id);
      if (oldIndex === -1 || newIndex === -1) return tabs;
      return arrayMove(tabs, oldIndex, newIndex);
    });
  }

  // SortableTab component for each tab
  function SortableTab({ id, tab, ...props }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id,
      transition: {
        duration: 150,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      },
    });

    const isActive = tab.key === activeTab?.key;

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: 1, // Keep tab fully opaque while dragging
      zIndex: isDragging ? 1000 : "auto",
      boxShadow: isDragging ? "0 4px 16px rgba(0,0,0,0.15)" : undefined,
      scale: isDragging ? 1.02 : 1, // Slight scale for feedback
      minWidth: 100,
      borderRadius: 999,
      padding: "0px 0px",
      marginRight: 3,
      background: isActive
        ? "linear-gradient(357deg, rgba(99,55,97,1), rgba(70,35,68,1))"
        : "#eeeeee",
      fontWeight: isActive ? 600 : 500,
      fontSize: 14,
      cursor: "grab",
      flexShrink: 0,
      borderRight: "2px solid rgba(255, 255, 255, 0.3)",
      position: "relative",
      height: 30,
      display: "flex",
      alignItems: "center",
      contain: "layout style paint", // Prevent layout shifts
    };

    return (
      <li
        ref={(node) => {
          setNodeRef(node);
          setTabRef(id, node);
        }}
        style={style}
        className="nav-item"
        {...attributes}
        {...listeners}
        {...props}
      >
        <a
          className={`nav-link ${isActive ? "active" : ""}`}
          style={{
            cursor: "pointer",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: isActive ? "#fff" : "#1677ff",
          }}
          onClick={() => openTab(tab.key)}
          role="tab"
          aria-selected={isActive}
          tabIndex={0}
          title={tab.title}
        >
          <span
            className="tab-label"
            style={{
              fontSize: 14,
              fontWeight: isActive ? "bold" : "600",
              color: isActive ? "#fff" : "#1677ff",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {tab.icon} {tab.title}
          </span>
          {openTabs.length > 1 && tab.key !== "dashboard" && (
            <button
              // className="btn btn-sm btn-link"
              style={{
                width: 20,
                height: 20,
                backgroundColor: "#8CA3C1",
                borderRadius: "50%",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                marginLeft: 6,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.key);
              }}
              title="Close tab"
              aria-label={`Close ${tab.title}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="white"
                style={{ display: "block" }}
              >
                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </a>
      </li>
    );
  }

  return (
    <>
      <TopNavbar />
      <style>{`
        .tab-scrollbar {
          display: flex;
          flex-direction: row;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          white-space: nowrap;
          scrollbar-width: thin !important;
          // scrollbar-color: #c1c1c1 transparent !important;
          max-width: 100%;
          box-sizing: border-box;
          flex: 1 1 auto;
          -webkit-overflow-scrolling: touch !important;
        }
        .tab-scrollbar > .nav-item {
          height: 33px;
          display: flex;
          align-items: center;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .tab-scrollbar::-webkit-scrollbar {
          height: 6px !important;
          width: 6px !important;
          display: block !important;
          -webkit-appearance: none !important;
        }
        .tab-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1 !important;
          border-radius: 6px !important;
        }
        .tab-scrollbar::-webkit-scrollbar-thumb:hover,
        .tab-scrollbar::-webkit-scrollbar-thumb:active {
          background: #c1c1c1 !important;
        }
        .tab-scrollbar::-webkit-scrollbar-track {
          background: transparent !important;
          border-radius: 6px !important;
        }
        .tab-scrollbar::-webkit-scrollbar-corner {
          background: transparent !important;
        }
        .tab-content-scrollable {
          flex: 1 1 0%;
          overflow-y: auto;
          min-height: 0;
          background: #fff;
        }
        .tab-label {
          display: inline-block;
          white-space: nowrap;
          vertical-align: middle;
        }
        /* Danger blink animation for active overlays */
        @keyframes danger-border-blink {
          0% { box-shadow: 0 0 0 2px rgba(220,38,38,0.9), 0 0 16px rgba(220,38,38,0.6); }
          50% { box-shadow: 0 0 0 2px rgba(220,38,38,0.2), 0 0 6px rgba(220,38,38,0.2); }
          100% { box-shadow: 0 0 0 2px rgba(220,38,38,0.9), 0 0 16px rgba(220,38,38,0.6); }
        }
        .danger-blink {
          animation: danger-border-blink 0.6s ease-in-out 1;
          border: 1px solid #ef4444 !important;
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Top Tab Bar + Profile */}
        <div
          className="navbar navbar-expand-md d-print-none tab-navbar-container"
          style={{
            minHeight: "44px",
            backgroundColor: "rgba(99, 55, 97, 0.1)",
            padding: "4px 0px 0px 0px",
            alignItems: "center",
            display: "flex",
          }}
          role="tablist"
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[
              restrictToHorizontalAxis,
              restrictToFirstScrollableAncestor,
            ]}
          >
            <SortableContext
              items={openTabs.map((tab) => tab.key)}
              strategy={horizontalListSortingStrategy}
            >
              <ul
                className="navbar-nav flex-row tab-scrollbar"
                style={{
                  flex: 1,
                  minHeight: "0rem",
                  overflowX: "auto",
                  overflowY: "hidden",
                  whiteSpace: "nowrap",
                  marginTop: "0px",
                  paddingBottom: "4px",
                  paddingLeft: "8px",
                  gap: "3px",
                  position: "relative",
                  alignItems: "center",
                }}
                ref={tabListRef}
                onWheel={(e) => {
                  if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY;
                    e.preventDefault();
                  }
                }}
              >
                {openTabs.map((tab) => (
                  <SortableTab key={tab.key} id={tab.key} tab={tab} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          {/* Right section (profile and logout) removed */}
        </div>

        {/* Active Tab Content - scrollable only this area */}
        <div
          className="tab-content-scrollable"
          style={{ flex: 1, minHeight: 0 }}
        >
          {openTabs.map((tab) => (
            <div
              key={tab.key}
              style={{
                display: tab.key === activeTab?.key ? "block" : "none",
                width: "100%",
                height: "100%",
              }}
            >
              {tab.content}
            </div>
          ))}
          {/* Global minibar for minimized modal chips; always visible under active tab content */}
          <GlobalMinibar />
        </div>
      </div>

      <ConfirmDialog
        open={closeConfirm.open}
        title="Unsaved Changes"
        message={
          <>
            You have unsaved changes in "{closeConfirm.title || ""}".
            <br />
            Close this tab and discard them?
          </>
        }
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={() => {
          const key = closeConfirm.key;
          const discard = closeConfirm.onDiscard;
          setCloseConfirm({
            open: false,
            onSave: null,
            onDiscard: null,
            key: null,
            title: null,
          });
          if (typeof discard === "function") discard();
          bypassRef.current = true;
          setTimeout(() => closeTab(key), 10);
        }}
        onCancel={() => {
          try {
            window._isClosingTab = false;
          } catch {
            /* noop */
          }
          setCloseConfirm({
            open: false,
            onSave: null,
            onDiscard: null,
            key: null,
            title: null,
          });
        }}
      />
    </>
  );
}
