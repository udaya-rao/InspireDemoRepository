import React, { useState, useEffect, useRef, useMemo } from 'react';
import { allocateTop, bringToFront as bringFrontGlobal, isTop } from './zIndexManager';
import ScrollToTopButton from './ScrollToTopButton';
import { ConfirmDialog } from './Notification';
import Loader from './Loader';
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 600);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

export default function InlineEditableDrawer({ 
  open, 
  onClose, 
  title, 
  children, 
  width = '65%', 
  onSave, 
  showEdit, 
  onEdit, 
  disableEdit, 
  onDisableEdit, 
  enableCloseConfirm = false, 
  closeConfirmScope = 'create', 
  isCreate = false, 
  isDirty = false, 
  closeConfirmTitle = 'Unsaved Changes', 
  closeConfirmMessage = 'You have unsaved changes. Choose an option below.', 
  onSaveDraft, 
  onDiscardDraft,
  // New props for table functionality
  columns = [],
  data = [],
  onAdd,
  onCancel,
  getActions,
  canAdd = true,
  canEdit = true,
  loading = false,
  onTableSave,
  tableTitle = "Table",
  // New controls for tab embedding
  hideHeader = false,
  triggerAddSignal,
  triggerSaveSignal,
  triggerCancelSignal,
  // Expose imperative API and pending change callback
  exposeApiRef,
  onPendingChange
}) {
  const isMobile = useIsMobile();
  const getSidebarElement = () => document.querySelector('.sidebar-hover-expand.expanded, .sidebar-hover-expand');
  const getSidebarWidth = () => {
    const sidebar = getSidebarElement();
    return sidebar ? sidebar.offsetWidth : 240;
  };
  const [drawerWidth, setDrawerWidth] = useState(() => window.innerWidth - getSidebarWidth());
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Start expanded
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const drawerRef = useRef(null);
  const idRef = useRef(Symbol('RightDrawer'));
  const [stackZ, setStackZ] = useState(1050);
  const originalWidthRef = useRef(width);
  
  // Table state
  const [tableData, setTableData] = useState(data);
  const [newRows, setNewRows] = useState([]);
  const [editBuffer, setEditBuffer] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPlacement, setDropdownPlacement] = useState('down');
  const actionBtnRefs = useRef({});
  const [showNothingToSaveDialog, setShowNothingToSaveDialog] = useState(false);
  const [confirmRemoveIdx, setConfirmRemoveIdx] = useState(null);
  // Expose imperative API to parent (add, save, cancel)
  React.useImperativeHandle(exposeApiRef, () => ({
    addNew: handleAddNew,
    saveAll: handleSaveAll,
    cancel: handleCancel,
  }), []);

  // Notify parent when there are pending changes
  useEffect(() => {
    const hasPending = (newRows && newRows.length > 0) || (editBuffer && Object.keys(editBuffer).length > 0);
    if (typeof onPendingChange === 'function') {
      try { onPendingChange(hasPending); } catch { /* no-op */ }
    }
  }, [newRows, editBuffer, onPendingChange]);

  
  // No blink or restriction logic for drawer per requirement

  useEffect(() => {
    if (open) {
      const expandedWidth = window.innerWidth - getSidebarWidth();
      originalWidthRef.current = width;
      setDrawerWidth(expandedWidth);
      setIsCollapsed(true); // Start expanded when opening
    }
  }, [width, open]);

  // Allow external trigger for adding a new row (for tab bar add button)
  useEffect(() => {
    if (triggerAddSignal === undefined || triggerAddSignal === null) return;
    if (triggerAddSignal === false) return; // explicit no-op
    // Add only when a real signal value is sent
    if (Array.isArray(columns) && columns.length > 0) {
      handleAddNew();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerAddSignal]);

  // External trigger for Save and Cancel (from tab bar)
  useEffect(() => {
    if (triggerSaveSignal === undefined || triggerSaveSignal === null) return;
    handleSaveAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerSaveSignal]);

  useEffect(() => {
    if (triggerCancelSignal === undefined || triggerCancelSignal === null) return;
    handleCancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerCancelSignal]);

  // Update table data when data prop changes
  const memoizedData = useMemo(() => data, [JSON.stringify(data)]);
  useEffect(() => {
    setTableData(memoizedData);
  }, [memoizedData]);
  

  // Initialize stacking when opened
  useEffect(() => {
    if (!open) return;
    setStackZ(allocateTop(idRef.current));
  }, [open]);

  useEffect(() => {
    if (!isResizing || isMobile) return;
    const handleMouseMove = (e) => {
      const newWidth = window.innerWidth - e.clientX;
      setDrawerWidth(Math.max(320, Math.min(newWidth, 900)));
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isResizing, isMobile]);

  // Broadcast a global dirty context so TabManager can intercept tab closes
  useEffect(() => {
    if (!enableCloseConfirm) return;
    const active = open && shouldShowCloseConfirm();
    const detail = {
      active,
      // Provide callbacks for TabManager
      onSaveDraft: typeof onSaveDraft === 'function' ? onSaveDraft : null,
      onDiscardDraft: typeof onDiscardDraft === 'function' ? onDiscardDraft : null,
    };
    window.dispatchEvent(new CustomEvent('dirtyPromptState', { detail }));
    return () => {
      // Clear when drawer unmounts or deps change - ensure active is false
      window.dispatchEvent(new CustomEvent('dirtyPromptState', { detail: { active: false, onSaveDraft: null, onDiscardDraft: null } }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isDirty, isCreate, closeConfirmScope, enableCloseConfirm, onSaveDraft, onDiscardDraft]);

  // Respond to ping requests from TabManager to report current dirty state
  useEffect(() => {
    const pingHandler = (e) => {
      if (!e || !e.detail || !e.detail.ping) return;
      if (!enableCloseConfirm) return;
      const active = open && shouldShowCloseConfirm();
      const detail = {
        active,
        onSaveDraft: typeof onSaveDraft === 'function' ? onSaveDraft : null,
        onDiscardDraft: typeof onDiscardDraft === 'function' ? onDiscardDraft : null,
      };
      window.dispatchEvent(new CustomEvent('dirtyPromptState', { detail }));
    };
    window.addEventListener('dirtyPromptState', pingHandler);
    return () => window.removeEventListener('dirtyPromptState', pingHandler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isDirty, isCreate, closeConfirmScope, enableCloseConfirm, onSaveDraft, onDiscardDraft]);

  useEffect(() => {
    if (!isCollapsed) return;
    const handleResize = () => {
      setDrawerWidth(Math.max(320, window.innerWidth - getSidebarWidth()));
    };
    window.addEventListener('resize', handleResize);
    // Set initial width on mount
    handleResize();

    // --- ResizeObserver for sidebar ---
    const sidebar = getSidebarElement();
    let observer;
    if (sidebar && window.ResizeObserver) {
      observer = new window.ResizeObserver(() => {
        setDrawerWidth(Math.max(320, window.innerWidth - getSidebarWidth()));
      });
      observer.observe(sidebar);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer && sidebar) observer.disconnect();
    };
  }, [isCollapsed]);

  const handleCollapseToggle = () => {
    if (isCollapsed) {
      // Collapse to original width (65% or specified width)
      const collapsedWidth = typeof originalWidthRef.current === 'string' && originalWidthRef.current.endsWith('%')
        ? window.innerWidth * (parseFloat(originalWidthRef.current) / 100)
        : typeof originalWidthRef.current === 'string' && originalWidthRef.current.endsWith('px')
        ? parseFloat(originalWidthRef.current)
        : typeof originalWidthRef.current === 'number'
        ? originalWidthRef.current
        : window.innerWidth * 0.65;
      setDrawerWidth(collapsedWidth);
    } else {
      // Expand: extend drawer to full width minus sidebar
      setDrawerWidth(window.innerWidth - getSidebarWidth());
    }
    setIsCollapsed(!isCollapsed);
  };

  const shouldShowCloseConfirm = () => {
    if (!enableCloseConfirm) return false;
    if (!isDirty) return false;
    if (closeConfirmScope === 'always') return true;
    if (closeConfirmScope === 'create' && isCreate) return true;
    if (closeConfirmScope === 'edit' && !isCreate) return true;
    return false;
  };

  const handleCloseClick = () => {
    if (shouldShowCloseConfirm()) {
      setShowCloseConfirm(true);
    } else {
      onClose && onClose();
    }
  };

  const handleConfirmSaveAndClose = () => {
    setShowCloseConfirm(false);
    if (typeof onSaveDraft === 'function') onSaveDraft();
    onClose && onClose();
  };

  const handleCloseWithoutSave = () => {
    setShowCloseConfirm(false);
    if (typeof onDiscardDraft === 'function') onDiscardDraft();
    onClose && onClose();
  };

  // Table functionality methods
  const handleAddNew = () => {
    setNewRows([...newRows, {}]);
  };

  const handleInputChange = (rowIdx, colKey, value, isNew = false) => {
    if (isNew) {
      const updated = [...newRows];
      updated[rowIdx][colKey] = value;
      setNewRows(updated);
    } else {
      setEditBuffer({
        ...editBuffer,
        [rowIdx]: { ...editBuffer[rowIdx], [colKey]: value },
      });
    }
  };

  const handleSaveAll = async () => {
    const isRowEmpty = (row) =>
      Object.values(row).every(
        (val) => val === "" || val === null || val === undefined
      );
    const filteredNewRows = (newRows || []).filter((row) => !isRowEmpty(row));
    const filteredEditedRows = Object.entries(editBuffer).map(
      ([rowIdx, editedRow]) => {
        return {
          ...editedRow,
          _originalRowIndex: parseInt(rowIdx),
          _originalRow: tableData[parseInt(rowIdx)],
        };
      }
    );

    if (filteredNewRows.length === 0 && filteredEditedRows.length === 0) {
      setShowNothingToSaveDialog(true);
      return;
    }

    if (onTableSave) {
      const saveResult = await onTableSave({
        newRows: filteredNewRows,
        editedRows: filteredEditedRows,
      });

      if (saveResult !== false) {
        setNewRows([]);
        setEditBuffer({});
      }
    }
  };

  const handleCancel = () => {
    setNewRows([]);
    setEditBuffer({});
  };

  const handleDropdown = (idx) => {
    if (openDropdown === idx) {
      setOpenDropdown(null);
      return;
    }
    setOpenDropdown(idx);
  };

  const handleDropdownClose = () => setOpenDropdown(null);

  // Render cell function - Always render as editable for inline editing
  const renderCell = (row, col, rowIdx, isNew = false) => {
    if (col.key === "actions") {
      if (isNew) {
        return <div style={{ width: "100%" }}></div>;
      }
      
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            width: "100%",
            gap: 3,
          }}
        >
          {getActions &&
            (getActions(row) || [])
              .filter(action => action.showAsButton === true)
              .map((action, index) => {
                const IconEl = action.icon || (
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
                    <circle cx="12" cy="12" r="3" />
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                  </svg>
                );
                return (
                  <button
                    key={index}
                    className="btn-sm"
                    title={action.title || action.label}
                    style={{
                      padding: "2px 6px",
                      display: "inline-flex",
                      color: "#1677ff",
                      background: "#fff",
                      marginRight: index < (getActions(row) || []).filter(a => a.showAsButton === true).length - 1 ? "4px" : "0"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (action.onClick) action.onClick(row);
                    }}
                  >
                    {IconEl}
                  </button>
                );
              })}
          <div
            className="dropdown"
            style={{ position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              ref={(el) =>
                (actionBtnRefs.current[isNew ? `new-${rowIdx}` : rowIdx] = el)
              }
              style={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                padding: 4,
                borderRadius: 6,
                transition: "background 0.2s",
                ...(openDropdown === (isNew ? `new-${rowIdx}` : rowIdx)
                  ? { background: "#f3f4f6" }
                  : {}),
              }}
              aria-label="Actions"
              tabIndex={0}
              onClick={() => { setSelectedRow(isNew ? null : rowIdx); handleDropdown(isNew ? `new-${rowIdx}` : rowIdx); }}
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
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                <path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                <path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
              </svg>
            </span>
            {openDropdown === (isNew ? `new-${rowIdx}` : rowIdx) && (
              <div
                className="dropdown-menu show"
                style={{
                  display: "block",
                  position: "absolute",
                  left: 45,
                  top: dropdownPlacement === 'down' ? '100%' : undefined,
                  bottom: dropdownPlacement === 'up' ? '100%' : undefined,
                  minWidth: 160,
                  zIndex: 3000,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                }}
              >
                {(getActions ? getActions(row) || [] : []).map(
                  (action, i) => (
                    !action.showAsButton && (
                      <button
                        key={i}
                        className="dropdown-item d-flex align-items-center"
                        type="button"
                        onClick={() => {
                          action.onClick && action.onClick(row);
                          handleDropdownClose();
                        }}
                      >
                        {action.icon && (
                          <span className="me-2">{action.icon}</span>
                        )}
                        {action.label}
                      </button>
                    )
                  )
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Get the current value
    const value = isNew
      ? newRows[rowIdx]?.[col.key] || ""
      : editBuffer[rowIdx]?.[col.key] !== undefined
      ? editBuffer[rowIdx][col.key]
      : row[col.key];

    const onChange = (e) =>
      handleInputChange(rowIdx, col.key, e.target.value, isNew);

    // Always use col.renderEdit if present for both new and existing rows
    if (col.renderEdit) {
      const mergedRow = isNew
        ? newRows[rowIdx]
        : { ...row, ...(editBuffer[rowIdx] || {}) };
      const setField = (key, val) => handleInputChange(rowIdx, key, val, isNew);
      const setFields = (updates) => {
        if (!updates || typeof updates !== "object") return;
        Object.entries(updates).forEach(([k, v]) =>
          handleInputChange(rowIdx, k, v, isNew)
        );
      };
      return col.renderEdit({
        value,
        onChange,
        row: mergedRow,
        isNew,
        setField,
        setFields,
      });
    }
    
    if (col.readOnly) {
      return (
        <input
          type="text"
          className="form-control form-control-sm"
          value={value}
          disabled
        />
      );
    }
    
    return (
      <input
        type="text"
        className="form-control form-control-sm"
        value={value}
        onChange={onChange}
      />
    );
  };

  // If used as tab content (width=100%), render without drawer wrapper
  if (width === '100%') {
    return (
      <div style={{ width: '100%', height: '100%' }}>
        {loading && <Loader />}
        
        {/* Table rendering for tab content */}
        {columns.length > 0 ? (
          <>
          <div className="card h-100" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {!hideHeader && (
              <div className="card-header" style={{ paddingTop: "0.45rem", paddingBottom: "0.45rem" }}>
                <div className="d-flex flex-wrap align-items-center justify-content-between w-100" style={{ rowGap: 8 }}>
                  <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                    <h1 className="mb-0" style={{ fontWeight: 700, fontSize: 22, lineHeight: "1" }}>
                      {tableTitle}
                    </h1>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {canAdd && (
                      <button className="btn btn-sm" onClick={handleAddNew} style={{ background: "#1677ff", color: "#fff", borderRadius: "4px", width: 33, height: 33, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "none", border: "none" }} title="Add New Row">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      </button>
                    )}
                    {((canAdd && newRows.length > 0) || (canEdit && Object.keys(editBuffer).length > 0)) && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={handleSaveAll} title="Save Changes">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                        </button>
                        {canAdd && newRows.length > 0 && (
                          <button className="btn btn-secondary btn-sm" onClick={handleCancel} title="Cancel Changes">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="card-body p-0 flex-grow-1" style={{ overflow: "hidden", display: 'flex', minHeight: 0 }}>
              <div className="table-responsive" style={{ flex: '1 1 auto', minHeight: 0, overflowY: "auto", overflowX: "auto" }}>
                <table className="table table-vcenter table-selectable" style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: "100%" }}>
                  <thead className="" style={{ height: "40px", color: "#fff" }}>
                    {/* Optional grouped header row */}
                    {(() => {
                      const groups = [];
                      let current = null;
                      columns.forEach((col) => {
                        const groupLabel = col.group;
                        if (!groupLabel) {
                          if (current) { groups.push(current); current = null; }
                          groups.push({ label: null, span: 1 });
                          return;
                        }
                        if (!current) {
                          current = { label: groupLabel, span: 1 };
                        } else if (current.label === groupLabel) {
                          current.span += 1;
                        } else {
                          groups.push(current); current = { label: groupLabel, span: 1 };
                        }
                      });
                      if (current) groups.push(current);
                      const hasGroup = groups.some(g => g.label);
                      if (!hasGroup) return null;
                      return (
                        <tr style={{ position: "sticky", top: 0, zIndex: 51 }}>
                          {groups.map((g, idx) => {
                            const isVisible = Boolean(g.label);
                            return (
                              <th key={`group-${idx}`} colSpan={g.span}
                                style={{
                                  backgroundColor: isVisible ? "#15468f" : "transparent",
                                  color: isVisible ? "#fff" : "transparent",
                                  borderColor: isVisible ? "#1677ff" : "transparent",
                                  padding: isVisible ? "0.25rem 0.75rem" : 0,
                                  textAlign: "center",
                                }}
                              >
                                {isVisible ? g.label : ""}
                              </th>
                            );
                          })}
                        </tr>
                      );
                    })()}
                    <tr style={{ position: "sticky", top: 0, zIndex: 50 }}>
                      {columns.map((col, index) => (
                        <th
                          key={col.key}
                          className={col.key === "actions" ? "actions-column" : ""}
                          style={{
                            position: "relative",
                            backgroundColor: "#1c52a3",
                            color: "#fff",
                            borderColor: "#1677ff",
                            padding: "0.25rem 0.75rem",
                            marginRight: "8px",
                            borderRight: "2px solid #fff",
                            whiteSpace: "nowrap",
                            textAlign: "center",
                            ...(col.width ? { width: col.width } : {}),
                            ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                            ...(col.maxWidth ? { maxWidth: col.maxWidth } : {}),
                          }}
                        >
                          <span style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            width: "100%"
                          }}>
                            {col.key === 'actions' ? 'Actions' : col.label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(newRows || []).map((row, idx) => (
                      <tr
                        key={`new-${idx}`}
                        onDoubleClick={() => setConfirmRemoveIdx(idx)}
                        style={{
                          cursor: "pointer",
                          background: "#fffbe6",
                          height: "30px",
                          padding: "0px",
                        }}
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={col.key === "actions" ? "actions-column" : ""}
                            style={{
                              padding: "0.25rem 0.75rem",
                              ...(col.width ? { width: col.width } : {}),
                              ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                              ...(col.maxWidth ? { maxWidth: col.maxWidth } : {}),
                              ...(col.style || {}),
                            }}
                          >
                            {renderCell(row, col, idx, true)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {tableData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length}
                          style={{
                            textAlign: "center",
                            color: "#888",
                            padding: "20px",
                          }}
                        >
                          No data available
                        </td>
                      </tr>
                    ) : (
                      tableData.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          onClick={() => setSelectedRow(rowIdx)}
                          style={{
                            cursor: "pointer",
                            backgroundColor: selectedRow === rowIdx ? "#e3f2fd" : "transparent",
                            borderLeft: selectedRow === rowIdx ? "4px solid #1677ff" : "none",
                            height: "30px",
                            transition: "background-color 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedRow !== rowIdx) {
                              e.currentTarget.style.backgroundColor = "#f5f5f5";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedRow !== rowIdx) {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }
                          }}
                        >
                          {columns.map((col) => (
                            <td
                              key={col.key}
                              className={col.key === "actions" ? "actions-column" : ""}
                              style={{
                                padding: "0.25rem 0.75rem",
                                ...(col.width ? { width: col.width } : {}),
                                ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                                ...(col.maxWidth ? { maxWidth: col.maxWidth } : {}),
                                ...(col.style || {}),
                              }}
                            >
                              {renderCell(row, col, rowIdx)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {confirmRemoveIdx !== null && (
            <ConfirmDialog
              open={true}
              title="Remove this new row?"
              message="Are you sure you want to remove this unsaved row?"
              onConfirm={() => {
                setNewRows((prev) => prev.filter((_, i) => i !== confirmRemoveIdx));
                setConfirmRemoveIdx(null);
              }}
              onCancel={() => setConfirmRemoveIdx(null)}
            />
          )}
          </>
        ) : (
          children
        )}
      </div>
    );
  }

  if (!open) return null;
  const effectiveWidth = isMobile ? '100vw' : drawerWidth;
  return (
    <div
      ref={drawerRef}
      className="offcanvas offcanvas-end show"
      tabIndex="-1"
      style={{
        visibility: 'visible',
        width: effectiveWidth,
        background: '#fff',
        boxShadow: '-2px 0 16px rgba(0,0,0,0.08)',
        zIndex: stackZ,
        position: 'fixed',
        top: 105,
        right: 0,
        height: '90vh',
        transition: isResizing ? 'none' : (isCollapsed ? 'none' : 'width 0.3s'),
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '100vw',
      }}
      onMouseDown={() => { if (!isTop(idRef.current)) bringFrontGlobal(setStackZ, idRef.current); }}
    >
      {/* Resize handle only on desktop */}
      {!isMobile && (
        <div
          style={{
            position: 'absolute',
            left: -8,
            top: 0,
            width: 16,
            height: '100%',
            cursor: 'ew-resize',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseDown={() => setIsResizing(true)}
        >
          <div style={{ width: 4, height: 48, borderRadius: 2, background: '#d0d7e1', boxShadow: '0 0 2px #aaa' }} />
        </div>
      )}
      <div className="border-bottom" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgb(76 102 140)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Collapse/Expand arrow button */}
          {!isMobile && (
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                fontSize: 18,
                marginRight: 0,
                cursor: 'pointer',
                color: '#fff'
              }}
              title={isCollapsed ? "Collapse to half screen" : "Expand to full width"}
              onClick={handleCollapseToggle}
            >
              {isCollapsed ? '\u2192' : '\u2190'} {/* → or ← */}
            </button>
          )}
          <h3 className="offcanvas-title mb-0" style={{color:'#fff'}}>{title}</h3>
        </div>
        {/* Add button for table functionality */}
        {canAdd && onAdd && (
          <button
            className="btn btn-success btn-sm"
            onClick={onAdd}
            title="Add New"
            style={{ marginRight: 8 }}
          >
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
        {/* Save/Cancel buttons and close button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {showEdit ? (
            <button className="btn btn-primary btn-sm" onClick={onEdit} title="Edit">
              {/* Pencil SVG icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z" /></svg>
            </button>
          ) : typeof onSave === 'function' && (
            <>
              <button className="btn btn-primary btn-sm" onClick={onSave} title="Save">
                {/* Floppy disk SVG icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              </button>
              {typeof disableEdit !== 'undefined' && disableEdit && typeof onDisableEdit === 'function' && (
                <button className="btn btn-outline-primary btn-sm" onClick={onDisableEdit} title="Cancel Edit" style={{marginLeft: 4}}>
                  {/* Cancel/disable edit SVG icon (pencil with X) */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#205084" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"/><line x1="4" y1="4" x2="20" y2="20"/></svg>
                </button>
              )}
            </>
          )}
           <button className="btn btn-secondary btn-sm" onClick={handleCloseClick} title="Close"style={{marginTop:'0',marginRight:'20px'}}>
              {/* X SVG icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
      </div>
      <div className="offcanvas-body" style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {loading && <Loader />}
        
        {/* Table rendering */}
        {columns.length > 0 ? (
          <div className="card h-100" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="card-header" style={{ paddingTop: "0.45rem", paddingBottom: "0.45rem" }}>
              <div className="d-flex flex-wrap align-items-center justify-content-between w-100" style={{ rowGap: 8 }}>
                <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                  <h1 className="mb-0" style={{ fontWeight: 700, fontSize: 22, lineHeight: "1" }}>
                    {tableTitle}
                  </h1>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {/* Save/Cancel buttons for table */}
                  {((canAdd && newRows.length > 0) || (canEdit && Object.keys(editBuffer).length > 0)) && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={handleSaveAll}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <polyline points="17 21 17 13 7 13 7 21" />
                          <polyline points="7 3 7 8 15 8" />
                        </svg>
                      </button>
                      {canAdd && newRows.length > 0 && (
                        <button className="btn btn-secondary btn-sm ms-2" onClick={handleCancel}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body p-0 flex-grow-1" style={{ overflow: "hidden", display: 'flex', minHeight: 0 }}>
              <div className="table-responsive" style={{ flex: '1 1 auto', minHeight: 0, overflowY: "auto", overflowX: "auto" }}>
                <table className="table table-vcenter table-selectable" style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: "100%" }}>
                  <thead className="" style={{ height: "40px", color: "#fff" }}>
                    {/* Optional grouped header row */}
                    {(() => {
                      const groups = [];
                      let current = null;
                      columns.forEach((col) => {
                        const groupLabel = col.group;
                        if (!groupLabel) {
                          if (current) { groups.push(current); current = null; }
                          groups.push({ label: null, span: 1 });
                          return;
                        }
                        if (!current) {
                          current = { label: groupLabel, span: 1 };
                        } else if (current.label === groupLabel) {
                          current.span += 1;
                        } else {
                          groups.push(current); current = { label: groupLabel, span: 1 };
                        }
                      });
                      if (current) groups.push(current);
                      const hasGroup = groups.some(g => g.label);
                      if (!hasGroup) return null;
                      return (
                        <tr style={{ position: "sticky", top: 0, zIndex: 51 }}>
                          {groups.map((g, idx) => {
                            const isVisible = Boolean(g.label);
                            return (
                              <th key={`group2-${idx}`} colSpan={g.span}
                                style={{
                                  backgroundColor: isVisible ? "#15468f" : "transparent",
                                  color: isVisible ? "#fff" : "transparent",
                                  borderColor: isVisible ? "#1677ff" : "transparent",
                                  padding: isVisible ? "0.25rem 0.75rem" : 0,
                                  textAlign: "center",
                                }}
                              >
                                {isVisible ? g.label : ""}
                              </th>
                            );
                          })}
                        </tr>
                      );
                    })()}
                    <tr style={{ position: "sticky", top: 0, zIndex: 50 }}>
                      {columns.map((col, index) => (
                        <th
                          key={col.key}
                          className={col.key === "actions" ? "actions-column" : ""}
                          style={{
                            position: "relative",
                            backgroundColor: "#1c52a3",
                            color: "#fff",
                            borderColor: "#1677ff",
                            padding: "0.25rem 0.75rem",
                            marginRight: "8px",
                            borderRight: "2px solid #fff",
                            whiteSpace: "nowrap",
                            textAlign: "center",
                            ...(col.width ? { width: col.width } : {}),
                            ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                            ...(col.maxWidth ? { maxWidth: col.maxWidth } : {}),
                          }}
                        >
                          <span style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            width: "100%"
                          }}>
                            {col.key === 'actions' ? 'Actions' : col.label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(newRows || []).map((row, idx) => (
                      <tr
                        key={`new-${idx}`}
                        onDoubleClick={() => setConfirmRemoveIdx(idx)}
                        style={{
                          cursor: "pointer",
                          background: "#fffbe6",
                          height: "30px",
                          padding: "0px",
                        }}
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={col.key === "actions" ? "actions-column" : ""}
                            style={{
                              padding: "0.25rem 0.75rem",
                              ...(col.width ? { width: col.width } : {}),
                              ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                              ...(col.maxWidth ? { maxWidth: col.maxWidth } : {}),
                              ...(col.style || {}),
                            }}
                          >
                            {renderCell(row, col, idx, true)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {tableData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length}
                          style={{
                            textAlign: "center",
                            color: "#888",
                            padding: "20px",
                          }}
                        >
                          No data available
                        </td>
                      </tr>
                    ) : (
                      tableData.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          onClick={() => setSelectedRow(rowIdx)}
                          style={{
                            cursor: "pointer",
                            backgroundColor: selectedRow === rowIdx ? "#e3f2fd" : "transparent",
                            borderLeft: selectedRow === rowIdx ? "4px solid #1677ff" : "none",
                            height: "30px",
                            transition: "background-color 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedRow !== rowIdx) {
                              e.currentTarget.style.backgroundColor = "#f5f5f5";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedRow !== rowIdx) {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }
                          }}
                        >
                          {columns.map((col) => (
                            <td
                              key={col.key}
                              className={col.key === "actions" ? "actions-column" : ""}
                              style={{
                                padding: "0.25rem 0.75rem",
                                ...(col.width ? { width: col.width } : {}),
                                ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                                ...(col.maxWidth ? { maxWidth: col.maxWidth } : {}),
                                ...(col.style || {}),
                              }}
                            >
                              {renderCell(row, col, rowIdx)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          children
        )}
        {confirmRemoveIdx !== null && (
          <ConfirmDialog
            open={true}
            title="Remove this new row?"
            message="Are you sure you want to remove this unsaved row?"
            onConfirm={() => {
              setNewRows((prev) => prev.filter((_, i) => i !== confirmRemoveIdx));
              setConfirmRemoveIdx(null);
            }}
            onCancel={() => setConfirmRemoveIdx(null)}
          />
        )}
      </div>
      <ScrollToTopButton drawerRef={drawerRef} />
      <ConfirmDialog
        open={showCloseConfirm}
        title={closeConfirmTitle}
        message={
          <>
            <div>{closeConfirmMessage}</div>
          </>
        }
        confirmLabel="Save and Close"
        cancelLabel="Cancel"
        secondaryLabel="Don't Save"
        onSecondary={handleCloseWithoutSave}
        onConfirm={handleConfirmSaveAndClose}
        onCancel={() => setShowCloseConfirm(false)}
      />
      <ConfirmDialog
        open={showNothingToSaveDialog}
        title="Nothing to Save"
        message="There are no changes to save."
        onConfirm={() => setShowNothingToSaveDialog(false)}
        onCancel={() => setShowNothingToSaveDialog(false)}
      />
    </div>
  );
} 