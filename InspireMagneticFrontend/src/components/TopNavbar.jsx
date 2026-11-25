import React from "react";
import { useNavigate } from "react-router-dom";
import ChangePassword from "../pages/auth/ChangePassword";
import { ConfirmDialog } from "./Notification";
import { hasPermission, menuPermissions } from "../permissions/permissionUtils";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export default function TopNavbar() {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("user"));
  const userName = userData?.empl_name || "";

  // Tab Manager pinned state - controls sidebar but doesn't persist
  const [Sidebarpinned, setSidebarpinned] = React.useState(() => {
    const saved = localStorage.getItem("sidebarPinned");
    return saved ? JSON.parse(saved) : false;
  });

  // Pin/unpin handler - controls sidebar expansion without persistence
  const handlePinToggle = () => {
    const newPinnedState = !Sidebarpinned;
    setSidebarpinned(newPinnedState);

    // Dispatch custom event to notify sidebar (temporary control)
    const event = new CustomEvent("sidebarPinStateChanged", {
      detail: { pinned: newPinnedState },
    });
    window.dispatchEvent(event);
  };

  const handleLogout = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const accessToken = localStorage.getItem("accessToken");

      if (!user || !user.login_id || !accessToken) {
        // Just remove user-related info and redirect
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("token_expiry_date_time");
        localStorage.removeItem("refresh_token_expiry_date_time");
        navigate("/");
        return;
      }

      // Call the backend logout API
      await fetch(`${baseUrl}/api/Auth/Logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ loginID: user.login_id }),
      });

      // Remove only user data and tokens
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("token_expiry_date_time");
      localStorage.removeItem("refresh_token_expiry_date_time");

      navigate("/");
    } catch {
      // Fallback: still remove sensitive data
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("token_expiry_date_time");
      localStorage.removeItem("refresh_token_expiry_date_time");
      navigate("/");
    }
  };

  const [showChangePassword, setShowChangePassword] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  // Profile dropdown (React-controlled, position:fixed so it always floats above everything)
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const profileBtnRef = React.useRef(null);
  const profileMenuRef = React.useRef(null);
  const [_menuPos, setMenuPos] = React.useState({ top: 50, right: 16 });

  const handleProfileClick = (e) => {
    e.preventDefault();
    if (!profileMenuOpen && profileBtnRef.current) {
      const rect = profileBtnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setProfileMenuOpen((prev) => !prev);
  };

  // Close profile menu on outside click
  React.useEffect(() => {
    if (!profileMenuOpen) return;
    const handler = (e) => {
      if (
        !profileBtnRef.current?.contains(e.target) &&
        !profileMenuRef.current?.contains(e.target)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileMenuOpen]);

  // Sidebar menu search state
  const [menuQuery, setMenuQuery] = React.useState("");
  const [menuOptions, setMenuOptions] = React.useState([]);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [highlightIndex, setHighlightIndex] = React.useState(0);
  const searchRef = React.useRef(null);

  // Load menus from JSON file
  React.useEffect(() => {
    const flattenMenuTree = (items, prefix = "") => {
      let result = [];
      if (!Array.isArray(items)) return result;
      items.forEach((item) => {
        if (item.disabled || item.search === false || item.visible === false) return;
        const rawName = item.menu || item.label || "";
        const cleanName = rawName.replace(/<br\s*\/?>|<\/br>/gi, " ").trim();
        const title = prefix ? `${prefix} > ${cleanName}` : cleanName;

        if (item.path) {
          result.push({
            title,
            path: item.path,
            permissionKey: item.permission_key || item.permissionKey,
            permissionId: item.permission_id,
            disabled: !!item.disabled,
            visible: item.visible !== false,
          });
        }

        if (item.children && item.children.length > 0) {
          result = result.concat(flattenMenuTree(item.children, title));
        }
      });
      return result;
    };

    const loadMenus = async () => {
      try {
        const res = await fetch("/menus.json", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const flatList =
            Array.isArray(data) && data.length > 0 && (data[0].menu || data[0].children)
              ? flattenMenuTree(data)
              : data;

          const filteredByPermission = flatList
            // Remove explicitly disabled or hidden (visible: false) entries from search
            .filter((item) => !item.disabled && item.visible !== false)
            // Then apply permission filtering if a permissionKey or permissionId exists
            .filter((item) => {
              const permKey = item.permissionKey || item.permission_key;
              const permId = item.permissionId || item.permission_id;
              if (!permKey && !permId) return true;
              const effectivePermId = menuPermissions[permKey] || permId;
              if (!effectivePermId) return true;
              return hasPermission(effectivePermId);
            });
          setMenuOptions(filteredByPermission);
        }
      } catch (error) {
        console.warn("Failed to load menus:", error);
      }
    };

    loadMenus();
  }, []);

  // Close dropdown on outside click
  React.useEffect(() => {
    function onDocClick(e) {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  React.useEffect(() => {
    const handleCloseProfileDropdown = () => {
      const dropdownToggle = document.querySelector('[data-bs-toggle="dropdown"][aria-label="Open user menu"]');
      const dropdownMenu = dropdownToggle?.nextElementSibling;

      if (dropdownToggle && dropdownMenu) {
        dropdownToggle.classList.remove('show');
        dropdownMenu.classList.remove('show');

        dropdownToggle.setAttribute('aria-expanded', 'false');

        if (window.bootstrap && window.bootstrap.Dropdown) {
          const dropdownInstance = window.bootstrap.Dropdown.getInstance(dropdownToggle);
          if (dropdownInstance) {
            dropdownInstance.hide();
          }
        }
      }
    };

    window.addEventListener('closeProfileDropdown', handleCloseProfileDropdown);
    return () => {
      window.removeEventListener('closeProfileDropdown', handleCloseProfileDropdown);
    };
  }, []);

  const filteredOptions = React.useMemo(() => {
    const q = menuQuery.trim().toLowerCase();
    if (!q) return menuOptions; // Show all options when input is empty

    return menuOptions.filter((opt) => {
      // Remove special characters and spaces from both search query and title
      const cleanQuery = q.replace(/[^a-z0-9]/g, "");
      const cleanTitle = opt.title.toLowerCase().replace(/[^a-z0-9]/g, "");

      // Check if clean query is included in clean title
      return cleanTitle.includes(cleanQuery);
    });
  }, [menuQuery, menuOptions]);

  const handleSelect = (opt) => {
    setMenuOpen(false);
    if (opt?.path) navigate(opt.path);
  };

  return (
    <>
      <style>{`
        .quick-page-search { color: #fff; caret-color: #fff; }
        .quick-page-search::placeholder { color: rgba(255,255,255,0.65); }
        .quick-page-search:-ms-input-placeholder { color: rgba(255,255,255,0.65); }
        .quick-page-search::-ms-input-placeholder { color: rgba(255,255,255,0.65); }
        /* Global search dropdown scrollbar */
        .global-search-dropdown { max-height: 320px; overflow-y: scroll; scrollbar-width: thin;  scrollbar-color: #c1c9d2 transparent; }
        .global-search-dropdown::-webkit-scrollbar { width: 8px;  }
        .global-search-dropdown::-webkit-scrollbar-thumb { background: #c1c9d2; border-radius: 8px; }
        .global-search-dropdown::-webkit-scrollbar-track { background: transparent; }
        @media (max-width: 1024px) {
          .sidebar-pin-toggle-btn {
            display: none !important;
          }
        }
      `}</style>
      <header
        className="navbar navbar-expand-md d-print-none"
        data-bs-theme="dark"
        style={{
          height: 50,
          minHeight: 50,
          background: "#4f2c4e",
          paddingRight: "20px",
          backgroundColor: "#7a4b78",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
          <button
            className="btn btn-sm btn-link sidebar-pin-toggle-btn"
            onClick={handlePinToggle}
            style={{
              background: "#8CA3C1",
              border: "none",
              color: "#fff",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(22,119,255,0.15)",
              transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
              cursor: "pointer",
              outline: "none",
              // marginTop: 8,
            }}
            title={Sidebarpinned ? "Unpin sidebar" : "Pin sidebar"}
            aria-label={Sidebarpinned ? "Unpin sidebar" : "Pin sidebar"}
          >
            {Sidebarpinned ? (
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
                style={{
                  display: "block",
                  margin: "auto",
                }}
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M18 6l-12 12" />
                <path d="M6 6l12 12" />
              </svg>
            ) : (
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
                style={{
                  display: "block",
                  margin: "auto",
                }}
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 6l16 0" />
                <path d="M4 12l16 0" />
                <path d="M4 18l16 0" />
              </svg>
            )}
          </button>
          {/* Quick Page Search moved next to the left X button */}
          <div style={{ flex: "1 1 auto", marginLeft: 12, maxWidth: 280, minWidth: 0 }}>
            <div
              className="nav-item me-2"
              ref={searchRef}
              style={{ position: "relative" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "8px",
                  transform: "translateY(-50%)",
                  color: "#6c757d",
                  pointerEvents: "none",
                }}
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85zm-5.242 1.156a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
              </svg>
              <input
                className="quick-page-search"
                type="text"
                value={menuQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setMenuQuery(value);
                  if (value.trim()) {
                    setMenuOpen(true);
                    setHighlightIndex(0);
                  } else {
                    setMenuOpen(false);
                  }
                }}
                onFocus={() => {
                  if (menuQuery.trim()) {
                    setMenuOpen(true);
                    setHighlightIndex(0);
                  }
                }}
                onClick={() => {
                  if (menuQuery.trim()) {
                    setMenuOpen(true);
                    setHighlightIndex(0);
                  }
                }}
                onKeyDown={(e) => {
                  if (!menuOpen) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlightIndex((i) =>
                      Math.min(i + 1, Math.max(0, filteredOptions.length - 1))
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlightIndex((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (filteredOptions[highlightIndex])
                      handleSelect(filteredOptions[highlightIndex]);
                  } else if (e.key === "Escape") {
                    setMenuOpen(false);
                  }
                }}
                placeholder="Search screens..."
                style={{
                  width: "100%",
                  height: 34,
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.35)",
                  background: "rgb(27 4 4 / 19%)",
                  color: "#fff",
                  padding: "0 28px",
                  outline: "none",
                }}
                aria-label="Quick page search"
              />
              {menuOpen && (
                <div
                  className="global-search-dropdown"
                  role="listbox"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "110%",
                    width: 340,
                    background: "#fff",
                    color: "#263238",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
                    borderRadius: 8,
                    zIndex: 3000,
                    padding: 6,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((opt, idx) => (
                      <div
                        key={opt.path}
                        role="option"
                        aria-selected={idx === highlightIndex}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelect(opt)}
                        onMouseEnter={() => setHighlightIndex(idx)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 6,
                          cursor: "pointer",
                          background:
                            idx === highlightIndex ? "#e6f0ff" : "transparent",
                          color: "#0b3c8c",
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                        }}
                        title={opt.title}
                      >
                        {opt.title}
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: "8px 10px",
                        color: "#666",
                        fontSize: 13,
                        textAlign: "center",
                      }}
                    >
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div
            className="navbar-nav flex-row ms-auto"
            style={{ flex: "0 0 auto" }}
          >
            <div className="ms-auto nav-item" style={{ position: "relative", height: "50px", display: "flex", alignItems: "center" }}>
              <a
                href="#"
                ref={profileBtnRef}
                className="nav-link d-flex lh-1 p-0 px-2"
                aria-label="Open user menu"
                onClick={handleProfileClick}
                style={{
                  borderRadius: "6px",
                  transition: "background 0.2s",
                  cursor: "pointer",
                  color: "#fff",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  className=" avatar-sm"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "30px",
                    height: "40px",
                    backgroundColor: "transparent",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className=" icon-tabler icons-tabler-outline icon-tabler-user-circle"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                    <path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                    <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
                  </svg>
                </span>

                <div className="d-none d-xl-block ps-2">
                  <div>{userName}</div>
                </div>
              </a>

              {/* Profile dropdown - absolutely positioned relative to the nav-item parent */}
              {profileMenuOpen && (
                <div
                  ref={profileMenuRef}
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    backgroundColor: "rgb(99, 55, 97)",
                    zIndex: 99999,
                    minWidth: 200,
                    borderRadius: 8,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    padding: "6px 0",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-6px",
                      right: "24px",
                      width: 0,
                      height: 0,
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderBottom: "6px solid rgb(99, 55, 97)",
                    }}
                  />
                  <a
                    href="#"
                    className="dropdown-item"
                    style={{ fontSize: 15, padding: "10px 20px" }}
                    onClick={(e) => { e.preventDefault(); setProfileMenuOpen(false); }}
                  >
                    Status
                  </a>
                  <button
                    className="dropdown-item"
                    type="button"
                    style={{ fontSize: 15, padding: "10px 20px" }}
                    onClick={() => { setShowChangePassword(true); setProfileMenuOpen(false); }}
                  >
                    Change Password
                  </button>
                  <a
                    href="#"
                    className="dropdown-item"
                    style={{ fontSize: 15, padding: "10px 20px" }}
                    onClick={(e) => { e.preventDefault(); setProfileMenuOpen(false); }}
                  >
                    Feedback
                  </a>
                  <a
                    href="#"
                    className="dropdown-item"
                    style={{ fontSize: 15, padding: "10px 20px" }}
                    onClick={(e) => { e.preventDefault(); setProfileMenuOpen(false); }}
                  >
                    Settings
                  </a>
                  <button
                    onClick={() => { setShowLogoutConfirm(true); setProfileMenuOpen(false); }}
                    className="dropdown-item"
                    type="button"
                    style={{ fontSize: 15, padding: "10px 20px" }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Logout Icon */}
            <div className="nav-item ms-2">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: 6,
                  transition: "background 0.2s",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Logout"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
                onMouseUp={(e) => {
                  // ensure highlight clears after click
                  e.currentTarget.style.background = "none";
                }}
                onBlur={(e) => {
                  // ensure highlight clears when focus leaves
                  e.currentTarget.style.background = "none";
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon icon-tabler icons-tabler-outline icon-tabler-logout-2"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M10 8v-2a2 2 0 0 1 2 -2h7a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2v-2" />
                  <path d="M15 12h-12l3 -3" />
                  <path d="M6 15l-3 -3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      <ChangePassword
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
