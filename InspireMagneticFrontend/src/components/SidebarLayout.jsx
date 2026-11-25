// src/components/SidebarLayout.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import LogoFull from "../assets/logo/inspire-magnetics-logo.png";
import LogoSymbol from "../assets/logo/IM_Icon.png";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  menuPermissions,
  // hasAnyPermission,
  hasPermission,
} from "../permissions/permissionUtils";
import sidebarMenuData from "../../public/menus.json";

// Hook to listen to permission changes across storage or custom events
const usePermissionsUpdate = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const handleUpdate = () => setTick((t) => t + 1);
    window.addEventListener("permissionsUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("permissionsUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);
};

// Map top-level menu names to their respective Tabler icons
const MENU_ICONS = {
  Dashboard: "ti ti-home",
  Systems: "ti ti-layout-grid",
  Masters: "ti ti-database",
  Design: "ti ti-pencil",
  Marketing: "ti ti-speakerphone",
  Production: "ti ti-settings",
  Purchase: "ti ti-shopping-cart",
  Quality: "ti ti-award",
  Stores: "ti ti-building-warehouse",
  Report: "ti ti-report-analytics",
};

export default function SidebarLayout() {
  const location = useLocation();
  const [sidebarHovered, setSidebarHovered] = useState(false);

  // Force re-render when permissions are updated
  usePermissionsUpdate();

  // Persist sidebarPinned in localStorage
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    const saved = localStorage.getItem("sidebarPinned");
    return saved ? JSON.parse(saved) : false;
  });

  // Dynamic open/close states for collapsible submenus
  const [openMenus, setOpenMenus] = useState({});

  // ── Tablet responsiveness ──────────────────────────────────────────────────
  // Detect if we are on a tablet/touch screen (≤1024px)
  const [isTablet, setIsTablet] = useState(() => window.innerWidth <= 1024);
  // Flyout submenu state for tablet hover/tap: { menu, top, title } | null
  const [flyoutMenu, setFlyoutMenu] = useState(null);
  const flyoutTimerRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    const handleChange = (e) => {
      setIsTablet(e.matches);
      setFlyoutMenu(null);
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  // Close flyout when navigating or on unmount
  useEffect(() => {
    setFlyoutMenu(null);
    return () => {
      if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    };
  }, [location.pathname, location.search]);

  // Close flyout on sidebar scroll so it doesn't get detached from the icon
  useEffect(() => {
    const navEl = scrollableNavRef.current;
    if (!navEl) return;
    const handleNavScroll = () => {
      setFlyoutMenu(null);
    };
    navEl.addEventListener("scroll", handleNavScroll, { passive: true });
    return () => navEl.removeEventListener("scroll", handleNavScroll);
  }, []);

  // Dismiss flyout when clicking/tapping outside (without needing a blocking DOM overlay)
  useEffect(() => {
    if (!flyoutMenu) return;
    const handleOutsideClick = (e) => {
      // 1. If clicked inside the flyout popover itself, keep it open
      if (e.target.closest(".sidebar-tablet-flyout")) {
        return;
      }
      // 2. If clicked on a sidebar menu item (li or nav-link), let the menu item's own click handler handle it
      if (
        e.target.closest(".sidebar-hover-expand li") ||
        e.target.closest(".sidebar-hover-expand .nav-link")
      ) {
        return;
      }
      // 3. Otherwise (clicked on page content, header, empty sidebar space, etc.), close the flyout
      setFlyoutMenu(null);
    };
    window.addEventListener("pointerdown", handleOutsideClick);
    return () => window.removeEventListener("pointerdown", handleOutsideClick);
  }, [flyoutMenu]);

  const handleItemMouseEnter = (menu, e) => {
    if (!isTablet) return;
    // If a menu was locked open by click, do NOT let hover switch or close it
    if (flyoutMenu?.isLocked) return;

    if (flyoutTimerRef.current) {
      clearTimeout(flyoutTimerRef.current);
    }
    // Only open flyout if menu actually has sub-options (e.g. not Dashboard)
    if (!menu.children || menu.children.length === 0) {
      setFlyoutMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const childCount = menu.children?.length || 1;
    const estimatedHeight = 44 + childCount * 38;
    const maxTop = window.innerHeight - estimatedHeight - 16;
    const targetTop = Math.max(10, Math.min(rect.top, maxTop));

    setFlyoutMenu({
      menu,
      top: targetTop,
      title: menu.menu,
      isLocked: false,
    });
  };

  const handleItemMouseLeave = () => {
    if (!isTablet) return;
    // If opened/locked by click, do NOT close on mouse leave
    if (flyoutMenu?.isLocked) return;

    if (flyoutTimerRef.current) {
      clearTimeout(flyoutTimerRef.current);
    }
    flyoutTimerRef.current = setTimeout(() => {
      setFlyoutMenu(null);
    }, 350);
  };

  const handleItemClick = (menu, e) => {
    if (!isTablet) return;
    if (flyoutTimerRef.current) {
      clearTimeout(flyoutTimerRef.current);
    }

    // If clicking on the same menu that is already locked open, toggle it closed
    if (flyoutMenu?.title === menu.menu && flyoutMenu?.isLocked) {
      setFlyoutMenu(null);
      return;
    }

    if (!menu.children || menu.children.length === 0) {
      setFlyoutMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const childCount = menu.children?.length || 1;
    const estimatedHeight = 44 + childCount * 38;
    const maxTop = window.innerHeight - estimatedHeight - 16;
    const targetTop = Math.max(10, Math.min(rect.top, maxTop));
    setFlyoutMenu({
      menu,
      top: targetTop,
      title: menu.menu,
      isLocked: true,
    });
  };

  const handleFlyoutMouseEnter = () => {
    if (flyoutTimerRef.current) {
      clearTimeout(flyoutTimerRef.current);
    }
  };

  const handleFlyoutMouseLeave = () => {
    // If opened/locked by click, do NOT close on mouse leave
    if (flyoutMenu?.isLocked) return;

    if (flyoutTimerRef.current) {
      clearTimeout(flyoutTimerRef.current);
    }
    flyoutTimerRef.current = setTimeout(() => {
      setFlyoutMenu(null);
    }, 350);
  };

  const handleFlyoutItemClick = () => {
    if (flyoutTimerRef.current) {
      clearTimeout(flyoutTimerRef.current);
    }
    setFlyoutMenu(null);
  };
  // ──────────────────────────────────────────────────────────────────────────

  const scrollableNavRef = useRef(null);
  const menuRefs = useRef({});
  const manualSuppressUntilRef = useRef(0);

  // Consistent submenu style object
  const submenuStyle = {
    listStyle: "none",
    padding: 0,
    margin: 0,
    borderLeft: "2px solid rgb(238, 238, 238)",
    marginLeft: 33,
    fontWeight: 400,
    fontSize: 14,
  };

  // Nested submenu style object for deeper levels
  const nestedSubmenuStyle = {
    listStyle: "none",
    padding: 0,
    margin: 0,
    borderLeft: "2px solid rgb(238, 238, 238)",
    marginLeft: 24,
    fontWeight: 400,
    fontSize: 14,
  };

  // Helper to parse HTML <br> tags in menu labels dynamically
  const parseLabel = (label) => {
    if (!label) return "";
    const normalized = label.replace(/<br\s*\/?>|<\/br>/gi, "\n");
    const parts = normalized.split("\n");
    return parts.map((part, i) => (
      <React.Fragment key={i}>
        {part}
        {i < parts.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Centralized key→value map of route prefixes per active group
  const GROUP_PREFIXES = {
    systems: ["/companyinformation", "/employees", "/change-employee-password", "/print-label"],
    masters: [
      "/customermaster",
      "/fginventorymaster",
      "/gstmaster",
      "/hsnmaster",
      "/inspectionmaster",
      "/inventorymaster",
      "/suppliermaster",
      "/supplieritem",
    ],
    marketing: ["/quotation", "/order", "/delivery-notes"],
    production: ["/workorder", "/jobcard", "/dailyjob", "/grn/work-order"],
    purchase: ["/purchase-order", "/grn/purchase"],
    quality: ["/grn/quality"],
    stores: [
      "/stores/stock-addition",
      "/stores/stock-deduction",
      "/stores/stock-transfer",
      "/stores/stock-adjustment",
    ],
    report: [
      "/stores/transaction-history",
      "/stores/current-stock",
    ],
  };

  const pathMatches = (prefixes = []) =>
    prefixes.some(
      (p) =>
        location.pathname === p ||
        location.pathname.startsWith(p + "/") ||
        location.pathname.startsWith(p),
    );

  // Toggle dynamic submenus cleanly
  const closeOtherMenus = (menuToKeepOpen) => {
    setOpenMenus((prev) => ({
      [menuToKeepOpen]: !prev[menuToKeepOpen],
    }));
  };

  // Update localStorage when sidebarPinned changes
  useEffect(() => {
    localStorage.setItem("sidebarPinned", JSON.stringify(sidebarPinned));
  }, [sidebarPinned]);

  // Listen for pin state changes from TabManager
  useEffect(() => {
    const handlePinStateChange = (event) => {
      setSidebarPinned(event.detail.pinned);
    };

    window.addEventListener("sidebarPinStateChanged", handlePinStateChange);
    return () =>
      window.removeEventListener(
        "sidebarPinStateChanged",
        handlePinStateChange,
      );
  }, []);

  const scrollToChild = (container, el) => {
    if (!container || !el) return;
    const containerTop = container.getBoundingClientRect().top;
    const elTop = el.getBoundingClientRect().top;
    const currentScrollTop = container.scrollTop;
    const deltaY = elTop - containerTop;
    const desiredTop = currentScrollTop + deltaY - 60;
    container.scrollTo({ top: Math.max(desiredTop, 0), behavior: "smooth" });
  };

  const suppressAndScrollTo = (el) => {
    manualSuppressUntilRef.current = Date.now() + 800;
    setTimeout(() => {
      const container = scrollableNavRef.current;
      scrollToChild(container, el);
    }, 0);
  };

  // Helper to check if a submenu item is active
  const isActive = (target) => {
    if (!target) return false;
    const [targetPath, targetQuery] = target.split("?");
    if (location.pathname !== targetPath) return false;
    if (!targetQuery) return true;
    return location.search.replace(/^\?/, "") === targetQuery;
  };

  // Active state checkers for active categories
  const isSystemsActive = () => pathMatches(GROUP_PREFIXES.systems);
  const isMastersActive = () => pathMatches(GROUP_PREFIXES.masters);
  const isMarketingActive = () => pathMatches(GROUP_PREFIXES.marketing);
  const isProductionActive = () => pathMatches(GROUP_PREFIXES.production);
  const isPurchaseActive = () => pathMatches(GROUP_PREFIXES.purchase);
  const isQualityActive = () => pathMatches(GROUP_PREFIXES.quality);
  const isStoresActive = () => pathMatches(GROUP_PREFIXES.stores);
  const isReportActive = () => pathMatches(GROUP_PREFIXES.report);

  const getIsParentActive = (menu) => {
    switch (menu.menu) {
      case "Systems":
        return isSystemsActive();
      case "Masters":
        return isMastersActive();
      case "Marketing":
        return isMarketingActive();
      case "Production":
        return isProductionActive();
      case "Purchase":
        return isPurchaseActive();
      case "Quality":
        return isQualityActive();
      case "Stores":
        return isStoresActive();
      case "Report":
        return isReportActive();
      default:
        return false;
    }
  };

  // Sidebar expanded if hovered or pinned (desktop only)
  const expanded = !isTablet && (sidebarHovered || sidebarPinned);

  // Sync open states with route changes
  useEffect(() => {
    if (expanded) {
      setOpenMenus({
        Systems: isSystemsActive(),
        Masters: isMastersActive(),
        Marketing: isMarketingActive(),
        Production: isProductionActive(),
        Purchase: isPurchaseActive(),
        Quality: isQualityActive(),
        Stores: isStoresActive(),
        Report: isReportActive(),
      });
    } else {
      setOpenMenus({});
    }
  }, [expanded, location.pathname, location.search]);

  // Auto-scroll sidebar to keep the active menu item in view on route changes
  useEffect(() => {
    if (Date.now() < manualSuppressUntilRef.current) return;
    const timeoutId = setTimeout(() => {
      const container = scrollableNavRef.current;
      if (!container) return;

      let activeEl = container.querySelector("a.nav-link.active");
      if (!activeEl) {
        activeEl = container.querySelector(`a[href="${location.pathname}"]`);
      }

      if (activeEl) {
        const containerTop = container.getBoundingClientRect().top;
        const activeTop = activeEl.getBoundingClientRect().top;
        const currentScrollTop = container.scrollTop;
        const deltaY = activeTop - containerTop;

        const desiredTop = currentScrollTop + deltaY - 60;
        container.scrollTo({
          top: Math.max(desiredTop, 0),
          behavior: "smooth",
        });
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, openMenus, sidebarPinned, sidebarHovered]);

  // Helper functions to check permissions dynamically
  const hasItemAccess = (child) => {
    if (child.permission_key) {
      const permissionId =
        menuPermissions[child.permission_key] || child.permission_id;
      if (permissionId) {
        return hasPermission(permissionId);
      }
    }
    return true;
  };

  // Check visibility of menu/submenu items recursively
  const checkVisibility = (item) => {
    if (item.commented_out) return false;
    if (item.visible === false) return false;

    // Parent item check: show parent if at least one child is visible
    if (item.children && item.children.length > 0) {
      return item.children.some((child) => checkVisibility(child));
    }

    // Leaf item permission checks
    if (item.permission_key || item.permission_id) {
      if (!hasItemAccess(item)) return false;
    }

    return true;
  };

  // Render standard child or nested submenus
  const renderSubmenuItem = (child) => {
    if (!checkVisibility(child)) return null;

    const isLinkActive = isActive(child.path);
    const styleColor = child.disabled ? { color: "gray" } : {};

    // Render nested submenus (recursively)
    if (child.children && child.children.length > 0) {
      const isSubOpen = !!openMenus[child.label];

      return (
        <li key={child.label}>
          <div
            className="nav-link"
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              fontWeight: 500,
              fontSize: 15,
            }}
            onClick={(e) => {
              e.stopPropagation();
              closeOtherMenus(child.label);
              suppressAndScrollTo(menuRefs.current[child.label]);
            }}
            ref={(el) => (menuRefs.current[child.label] = el)}
          >
            <span style={{ display: "flex", alignItems: "center" }}>
              <FilterListIcon style={{ fontSize: 16, marginRight: 2 }} />
              <span className="nav-link-title">{parseLabel(child.label)}</span>
              <i
                className={`ti ${isSubOpen ? "ti-chevron-down" : "ti-chevron-right"}`}
                style={{ marginLeft: 8 }}
              ></i>
            </span>
          </div>
          {isSubOpen && (
            <ul style={nestedSubmenuStyle}>
              {child.children.map((subChild) => renderSubmenuItem(subChild))}
            </ul>
          )}
        </li>
      );
    }

    // Standard Link wrapper for precise active class matching
    const navLinkClassStr = `nav-link${child.disabled ? " disabled" : ""}${expanded && !child.disabled && isLinkActive ? " active" : ""
      }`;

    return (
      <li key={child.label + child.path}>
        <Link
          className={navLinkClassStr}
          to={child.path || "#"}
          style={styleColor}
          onClick={(e) => {
            if (child.disabled) {
              e.preventDefault();
            } else {
              e.currentTarget.blur?.();
            }
          }}
          onFocus={(e) => e.currentTarget.blur?.()}
        >
          <FilterListIcon style={{ fontSize: 16, marginRight: 2 }} />
          <span className="nav-link-title">{parseLabel(child.label)}</span>
        </Link>
      </li>
    );
  };

  // Render flyout submenu child for tablet
  const renderFlyoutChild = (child) => {
    if (!checkVisibility(child)) return null;
    const isLinkActive = isActive(child.path);

    if (child.children && child.children.length > 0) {
      return (
        <li key={child.label}>
          <div
            style={{
              padding: "8px 16px 4px",
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.65)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {parseLabel(child.label)}
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {child.children.map((sub) => renderFlyoutChild(sub))}
          </ul>
        </li>
      );
    }

    return (
      <li key={child.label + (child.path || "")}>
        <Link
          to={child.path || "#"}
          className={`sidebar-flyout-item${isLinkActive ? " active" : ""}${child.disabled ? " disabled" : ""}`}
          style={{
            display: "block",
            padding: "9px 18px",
            color: isLinkActive ? "#ffffff" : "rgba(255, 255, 255, 0.88)",
            backgroundColor: isLinkActive ? "rgba(255, 255, 255, 0.18)" : "transparent",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: isLinkActive ? 600 : 400,
            cursor: child.disabled ? "not-allowed" : "pointer",
            opacity: child.disabled ? 0.5 : 1,
            transition: "background 0.15s, color 0.15s, padding-left 0.15s",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          }}
          onClick={(e) => {
            if (child.disabled) {
              e.preventDefault();
            } else {
              handleFlyoutItemClick();
            }
          }}
        >
          {parseLabel(child.label)}
        </Link>
      </li>
    );
  };

  // Render top level menus
  const renderTopLevelMenu = (menu) => {
    if (!checkVisibility(menu)) return null;

    const isFlyout = isTablet && flyoutMenu?.title === menu.menu;

    // Direct top level link (e.g. Dashboard)
    if (!menu.children || menu.children.length === 0) {
      const isLinkActive = isActive(menu.path);
      const navLinkClassStr = `nav-link${((expanded && isLinkActive) || isLinkActive) ? " active" : ""}${isFlyout ? " flyout-active" : ""}`;
      const iconClass = MENU_ICONS[menu.menu] || "ti ti-home";

      return (
        <li
          key={menu.menu}
          onMouseEnter={(e) => handleItemMouseEnter(menu, e)}
          onMouseLeave={handleItemMouseLeave}
        >
          <Link
            className={navLinkClassStr}
            to={menu.path}
            onClick={(e) => {
              if (isTablet) handleFlyoutItemClick();
              e.currentTarget.blur?.();
            }}
            onFocus={(e) => e.currentTarget.blur?.()}
          >
            <i className={iconClass}></i>
            <span className="nav-link-title">{parseLabel(menu.menu)}</span>
          </Link>
        </li>
      );
    }

    // Collapsible top level menu
    const isMenuOpen = !!openMenus[menu.menu];
    const isParentActive = getIsParentActive(menu);
    const iconClass = MENU_ICONS[menu.menu] || "ti ti-layout-grid";

    return (
      <li
        key={menu.menu}
        onMouseEnter={(e) => handleItemMouseEnter(menu, e)}
        onMouseLeave={handleItemMouseLeave}
        onClick={(e) => {
          if (isTablet) {
            e.stopPropagation();
            handleItemClick(menu, e);
          }
        }}
      >
        <div
          className={`nav-link${isParentActive ? " active" : ""}${isFlyout ? " flyout-active" : ""}`}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          onClick={(e) => {
            if (isTablet) {
              e.stopPropagation();
              handleItemClick(menu, e);
            } else {
              closeOtherMenus(menu.menu);
              suppressAndScrollTo(menuRefs.current[menu.menu]);
            }
          }}
          ref={(el) => (menuRefs.current[menu.menu] = el)}
        >
          <span style={{ display: "flex", alignItems: "center" }}>
            <i className={iconClass}></i>
            <span className="nav-link-title">{parseLabel(menu.menu)}</span>
          </span>
          {!isTablet && (
            <i
              className={`ti ${isMenuOpen ? "ti-chevron-down" : "ti-chevron-right"}`}
            ></i>
          )}
        </div>
        {!isTablet && isMenuOpen && (
          <ul style={submenuStyle}>
            {menu.children.map((child) => renderSubmenuItem(child))}
          </ul>
        )}
      </li>
    );
  };

  // Determine the CSS class for the aside element
  const sidebarClassName = [
    "sidebar-hover-expand no-print d-print-none",
    expanded ? "expanded" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {/* ── Tablet Flyout Submenu Popover ── */}
      {isTablet && flyoutMenu && (
        <div
          className="sidebar-tablet-flyout"
          style={{
            position: "fixed",
            top: flyoutMenu.top,
            left: 60,
            zIndex: 100000,
            minWidth: 195,
            maxWidth: 260,
            backgroundColor: "rgb(99, 55, 97)",
            borderRadius: "8px",
            boxShadow: "0 8px 28px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            overflow: "hidden",
          }}
          onMouseEnter={handleFlyoutMouseEnter}
          onMouseLeave={handleFlyoutMouseLeave}
        >
          {/* Header: Menu Category Name (e.g. Marketing) */}
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.15)",
              padding: "10px 16px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
              textAlign: "center",
              fontWeight: 700,
              fontSize: 13,
              color: "#ffffff",
              letterSpacing: "0.5px",
              textTransform: "capitalize",
            }}
          >
            {flyoutMenu.title}
          </div>

          {/* Submenu options */}
          {flyoutMenu.menu.children && flyoutMenu.menu.children.length > 0 && (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: "4px 0",
                maxHeight: "calc(100vh - 120px)",
                overflowY: "auto",
              }}
            >
              {flyoutMenu.menu.children.map((child) => renderFlyoutChild(child))}
            </ul>
          )}
        </div>
      )}

      <aside
        className={sidebarClassName}
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "fixed",
          zIndex: isTablet ? 10050 : 100,
        }}
        onMouseEnter={() => !isTablet && !sidebarPinned && setSidebarHovered(true)}
        onMouseLeave={() => !isTablet && !sidebarPinned && setSidebarHovered(false)}
      >
        {/* Fixed Logo Section */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            width: "100%",
            height: isTablet ? 50 : undefined,
            minHeight: isTablet ? 50 : undefined,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgb(99, 55, 97)",
          }}
        >
          {isTablet ? (
            <Link
              to="/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 60,
                height: 50,
                textDecoration: "none",
              }}
              title="Dashboard"
              onClick={() => {
                if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
                setFlyoutMenu(null);
              }}
            >
              <img
                src={LogoSymbol}
                alt="Inspire Magnetics"
                style={{
                  width: 36,
                  height: 36,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </Link>
          ) : (
            <div
              className="sidebar-logo"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 3,
                marginTop: 12,
              }}
            >
              <img src={LogoSymbol} alt="Logo symbol" className="logo-symbol" />
              <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
                <img
                  src={LogoFull}
                  alt="inspire magnetics"
                  className="logo-full"
                  width="150px"
                  style={{ backgroundColor: "white", borderRadius: "5%", display: "block", margin: "0 auto" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Section */}
        <div
          className="scrollable-nav"
          style={{
            flex: "1 1 0%",
            width: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            marginTop: 10,
          }}
          ref={scrollableNavRef}
        >
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {sidebarMenuData.map((menu) => renderTopLevelMenu(menu))}
          </ul>
        </div>
      </aside>
    </>
  );
}
