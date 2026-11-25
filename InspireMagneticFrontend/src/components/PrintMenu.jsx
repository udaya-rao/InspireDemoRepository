import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  MenuItem,
  ListItemText,
  Tooltip,
} from "@mui/material";
import {
  Print as PrintIcon,
} from "@mui/icons-material";

const PrintMenu = ({
  options = [],
  onSelect,
  tooltip = "Print Options",
  disabled = false,
  clickMode = false, // New prop: if true, use click instead of hover
  icon, // Custom icon element
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const handleClick = (event) => {
    if (disabled) return;
    if (clickMode) {
      setAnchorEl(anchorEl ? null : event.currentTarget);
    }
  };

  const handleMouseEnter = () => {
    if (disabled || clickMode) return;

    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    // Set a small delay to prevent accidental opening
    const timeout = setTimeout(() => {
      setAnchorEl(buttonRef.current);
    }, 200);

    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (clickMode) return;
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleMenuMouseEnter = () => {
    if (clickMode) return;
    // Clear timeout when mouse enters menu
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleMenuMouseLeave = () => {
    if (clickMode) return;
    // Close menu when mouse leaves
    const timeout = setTimeout(() => {
      setAnchorEl(null);
    }, 100);
    setHoverTimeout(timeout);
  };

  const handleClose = () => {
    setAnchorEl(null);
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleOptionClick = (option) => {
    if (onSelect) {
      onSelect(option);
    }
    handleClose();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // const getOptionIcon = (option) => {
  //   const optionLower = option.toLowerCase();
  //   if (optionLower.includes('approved')) {
  //     return <BusinessIcon fontSize="small" />;
  //   } else if (optionLower.includes('spares') || optionLower.includes('tools')) {
  //     return <DocumentIcon fontSize="small" />;
  //   } else if (optionLower.includes('msme')) {
  //     return <PdfIcon fontSize="small" />;
  //   }
  //   return <PrintIcon fontSize="small" />;
  // };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title={tooltip}>
        <button
          ref={buttonRef}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          disabled={disabled}
          className="btn btn-sm"
          style={{
            background: "#fff",
            color: disabled ? "#9e9e9e" : "#1677ff",
            borderRadius: "8px",
            width: 33,
            height: 33,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "none",
            border: "1px solid #d0d7de",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {icon || <PrintIcon sx={{ fontSize: 20, color: "#1677ff" }} />}
        </button>
      </Tooltip>

      <Menu
        ref={menuRef}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onMouseEnter={clickMode ? undefined : handleMenuMouseEnter}
        onMouseLeave={clickMode ? undefined : handleMenuMouseLeave}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            minWidth: 200,
            maxWidth: 300,
            mt: 0.5,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            border: "1px solid",
            borderColor: "divider",
            fontFamily: "inherit",
            fontSize: "0.875rem",
          },
        }}
        MenuListProps={{
          sx: {
            py: 0.5,
            fontFamily: "inherit",
            fontSize: "0.875rem",
          },
        }}
        disableAutoFocusItem
        disableEnforceFocus
        disableRestoreFocus
      >
        {options.map((option, index) => (
          <MenuItem
            key={index}
            onClick={() => handleOptionClick(option)}
            sx={{
              py: 1,
              px: 2,
              "&:hover": { backgroundColor: "primary.50" },
              "&:focus": { backgroundColor: "primary.50" },
              fontFamily: "inherit",
              fontSize: "0.875rem",
            }}
          >
            <ListItemText
              primary={option}
              primaryTypographyProps={{
                fontSize: "0.870rem",
                fontWeight: 'normal',
                fontFamily: "inherit",
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default PrintMenu;
