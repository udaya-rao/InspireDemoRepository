import React, { useState, useEffect, useRef, useCallback } from "react";
import SortableTable from "../../components/SortableTable";
import RightDrawer from "../../components/RightDrawer";
import DraggableModal from "../../components/DraggableModal";
import SaveOrUpdateEmployeeForm from "./SaveOrUpdateEmployeeForm";
import {
  ConfirmDialog,
  DeleteConfirmDialog,
} from "../../components/Notification";
import Loader from "../../components/Loader";
import { useToast } from "../../components/useToast";
import SecurityMaster from "../securitymaster/SecurityMaster";
import { hasPermission, menuPermissions } from "../../permissions/permissionUtils";
import { useWindowManager } from "../../hooks/useWindowManager";
import usePaginatedTable from "../../hooks/usePaginatedTable";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges.jsx";
import {
  fetchEmployeeList,
  fetchEmployeeDetails,
  deleteEmployee,
} from "../../services/employeeService";
import "../../style/Employee.css";

// Remove initialData, use API data instead
const userColumns = [
  { key: "actions", label: "Actions", sortable: false, width: 100 },
  {
    key: "empl_id",
    label: "Employee Code",
    style: { textAlign: "center" },
    width: "40%",
    minWidth: "200px",
  },
  {
    key: "login_id",
    label: "Login ID",
    sortable: true,
    sortType: "string",
    width: "20%",
    minWidth: "200px",
  },
  {
    key: "empl_name",
    label: "Employee Name",
    ignoreSpecial: true,
    width: "20%",
    minWidth: "200px",
  },
  {
    key: "dept_name",
    label: "Department",
    width: "20%",
    minWidth: "200px",
  },
  {
    key: "empl_status",
    label: "Status",
    width: "20%",
    minWidth: "200px",
    style: { textAlign: "center" },
    sortValue: (row) => -row.empl_status,
    render: (row) =>
      row.empl_status === 1 ? (
        <span className="employee-status employee-status--active">Active</span>
      ) : (
        <span className="employee-status employee-status--inactive">
          Inactive
        </span>
      ),
  },
];

// Helper to map API EMPLOYEE_DETAILS row to your form model
function mapEmployeeDetails(details) {
  return {
    employeeID: details.empl_auto_id,
    employeeCode: details.empl_id,
    loginID: details.login_id,
    employeeName: details.empl_name,
    departmentID: details.dept_id,
    employeeStatus: details.empl_status,
    departmentName: details.dept_name,
    loginPassword: details.cc_pwd,
    emailID: details.email_id || "",
    mobileNumber: details.mobile_no || "",
    dateofBirth: details.birth_date ? details.birth_date.split("T")[0] : "",
    paramType: "UPDATE",
  };
}

export default function Users() {
  const { showToast } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const {
    rows: employeeData,
    setRows: setEmployeeData,
    tableProps,
    insertNewRowAtTopOfCurrentPage,
  } = usePaginatedTable([], 25, {
    enableGlobalEvents: true,
    tableId: "employees",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loading, setLoading] = useState(true);

  const tableRef = useRef();
  const addFormRef = useRef();
  const editFormRef = useRef();
  const [editMode, setEditMode] = useState(false);

  // View-in-window modal state (support multiple windows)
  const {
    windows: viewWindows,
    minimizedWindows,
    removeWindow,
    minimizeWindow,
    restoreWindow,
  } = useWindowManager("employee");

  const modalRefs = useRef({});

  // Separate dirty state for add and edit forms
  const {
    isDirty: isAddFormDirty,
    setIsDirty: setIsAddFormDirty,
    // checkUnsavedChanges: checkAddFormUnsavedChanges,
    resetDirty: resetAddFormDirty,
    dirtyConfirmDialog: addFormDirtyConfirmDialog,
  } = useUnsavedChanges({});

  const {
    isDirty: isEditFormDirty,
    setIsDirty: setIsEditFormDirty,
    checkUnsavedChanges: checkEditFormUnsavedChanges,
    resetDirty: resetEditFormDirty,
    dirtyConfirmDialog: editFormDirtyConfirmDialog,
  } = useUnsavedChanges({});

  // Centralized employees fetch using service
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      // Currently API does not use employeeID, so we just load full list
      const data = await fetchEmployeeList({ pageSize: 0, pageNumber: 0 });
      setEmployeeData(data?.data?.TOTAL_RECORDS || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployeeData([]);
      showToast("Failed to fetch employee list", "error");
    } finally {
      setLoading(false);
    }
  }, [setEmployeeData, showToast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);


  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (!userToDelete) return;

    try {
      const data = await deleteEmployee(userToDelete.empl_auto_id);
      await fetchEmployees();

      const msg =
        data?.data?.EMPLOYEE_DELETE_RESPONSE?.[0]?.Message ||
        "Employee deleted successfully.";
      showToast(msg, "success");
    } catch (error) {
      console.error("Failed to delete employee:", error);
      showToast("Failed to delete employee", "error");
    } finally {
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  // Extracted shared logic to load single employee details
  const loadEmployeeDetails = useCallback(
    async (employeeAutoId) => {
      const data = await fetchEmployeeDetails(employeeAutoId);
      const details = data?.data?.EMPLOYEE_DETAILS?.[0];
      return details ? mapEmployeeDetails(details) : null;
    },
    []
  );

  // REFACTORED handleEditUser function using the hook
  const handleEditUser = async (row) => {
    if (!row || !row.empl_auto_id) {
      console.error("Invalid row data in handleEditUser:", row);
      return; 
    }
    
    // Close profile dropdown if open
    window.dispatchEvent(new Event('closeProfileDropdown'));

    // Check for unsaved changes only in the edit/view drawer (not add drawer)
    // This allows add form to remain open while opening view
    const canProceed = checkEditFormUnsavedChanges(async (data) => {
      // This function will execute if user confirms discarding changes
      if (data && data.empl_auto_id) {
        await handleEditUserInternal(data);
      }
    }, row);

    if (canProceed) {
      await handleEditUserInternal(row);
    }
  };

  // Extract the actual edit logic
  const handleEditUserInternal = async (row) => {
    if (!row || !row.empl_auto_id) {
      console.error("Invalid row data in handleEditUserInternal:", row);
      setTimeout(() => {
        showToast("Invalid employee data", "error");
      }, 0);
      return;
    }
    
    try {
      const mapped = await loadEmployeeDetails(row.empl_auto_id);
      if (mapped) {
        setEditUser(mapped);
        setShowEditForm(true);
        setEditMode(false); // Reset to view mode
        resetEditFormDirty(); // Use hook's reset function
      } else {
        setEditUser(null);
        setTimeout(() => {
          showToast("No details found for this user.", "error");
        }, 0);
      }
    } catch (err) {
      console.error("Error fetching employee details:", err);
      setEditUser(null);
      // showToast("Failed to fetch employee details", "error");
    }
  };

  // View details in draggable modal window (read-only)
  

  const closeViewWindow = (id) => {
    removeWindow(id);
  };

  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [selectedSecurityUser, setSelectedSecurityUser] = useState(null);

  const handleSecurity = (row) => {
    setSelectedSecurityUser(row);
    setShowSecurityModal(true);
  };

  const getActions = (row) => {
    const actions = [];

    // Add Security action only if user has permission
    if (hasPermission(menuPermissions.EMPLOYEE_SECURITY)) {
      actions.push({
        label: "Security",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
        onClick: () => handleSecurity(row),
      });
    }

    // Add other actions
    actions.push(
      {
        label: "View",
        title: "View Employee Details",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ),
        onClick: () => {
          handleEditUser(row);
        },
      },
      // {
      //   label: "Delete",
      //   icon: (
      //     <svg
      //       xmlns="http://www.w3.org/2000/svg"
      //       className="icon"
      //       width="18"
      //       height="18"
      //       viewBox="0 0 24 24"
      //       fill="none"
      //       stroke="currentColor"
      //       strokeWidth="2"
      //       strokeLinecap="round"
      //       strokeLinejoin="round"
      //     >
      //       <path d="M4 7h16" />
      //       <path d="M10 11v6" />
      //       <path d="M14 11v6" />
      //       <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
      //       <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
      //     </svg>
      //   ),
      //   onClick: () => handleDelete(row),
      // }
    );

    return actions;
  };

  // Add User Drawer
  const confirmCloseAdd = () => {
    setShowAddForm(false);
    // Reset dirty state when the drawer closes
    resetAddFormDirty();
  };

  // Custom onSuccess for add form
  const handleAddEmployee = (newEmployee) => {
    insertNewRowAtTopOfCurrentPage(newEmployee);
    setShowAddForm(false);
    resetAddFormDirty();
  };

  const addUserDrawer = (
    <RightDrawer
      open={showAddForm}
      tabKey="employee"
      newRowFocusKey="employeeCode"
      onClose={confirmCloseAdd}
      title="Add Employee"
      onSave={() => addFormRef.current && addFormRef.current.submit()}
      enableCloseConfirm
      closeConfirmScope="create"
      isCreate={true}
      isDirty={isAddFormDirty}
      closeConfirmTitle="Unsaved Changes"
      closeConfirmMessage="You have unsaved changes. Save draft or close without saving?"
      onSaveDraft={() => {
        // No-op: form auto-saves draft on change
      }}
      onDiscardDraft={() => {
        try {
          addFormRef.current?.clearDraft?.();
        } catch {
          /* no-op */
        }
        // After discarding, the form should not be considered dirty
        resetAddFormDirty();
      }}
    >
      <SaveOrUpdateEmployeeForm
        ref={addFormRef}
        onClose={confirmCloseAdd}
        onSuccess={handleAddEmployee} // <-- use custom handler
        onDirtyChange={(dirty) => setIsAddFormDirty(dirty)}
      />
    </RightDrawer>
  );

  // REFACTORED confirmCloseEdit function using the hook
  const confirmCloseEdit = (forceClose = false) => {
    if (forceClose) {
      setShowEditForm(false);
      setEditUser(null);
      setEditMode(false);
      resetEditFormDirty();
      return;
    }
    
    setShowEditForm(false);
    setEditUser(null);
    setEditMode(false);
    resetEditFormDirty();
  };

  const editUserDrawer = (
    <RightDrawer
      tabKey="employee"
      open={showEditForm}
      onClose={confirmCloseEdit}
      title={editUser ? `Edit Employee ` : "Add Employee"}
      onSave={
        editMode ? () => editFormRef.current && editFormRef.current.submit() : undefined
      }
      showEdit={editUser && !editMode}
      onEdit={() => setEditMode(true)}
      disableEdit={editMode}
      onDisableEdit={() => setEditMode(false)}
      isDirty={isEditFormDirty}
      isCreate={!editUser}
      enableCloseConfirm
      closeConfirmScope="edit"
      // Only disable tab close confirm when in view mode (not edit mode)
      disableTabCloseConfirm={!!editUser && !editMode && !isEditFormDirty}
      onDiscardDraft={() => {
        try {
          resetEditFormDirty();
        } catch {
          /* noop */
        }
      }}
    >
      {/* Always render form if editUser exists - ensures form is visible even when dialog is open */}
      {editUser && (
        <SaveOrUpdateEmployeeForm
          key={editUser.employeeID || "new"} // Force re-render when employee changes
          ref={editFormRef}
          onClose={() => confirmCloseEdit(true)}
          initialData={editUser}
          editMode={editMode}
          onSuccess={fetchEmployees}
          onDirtyChange={(dirty) => {
            setIsEditFormDirty(dirty); // Use hook's setIsDirty
          }}
        />
      )}
    </RightDrawer>
  );

  return (
    <div className="employee-page">
      {/* Loader overlays on top but table is always rendered */}
      {loading && <Loader />}

      {/* Main Content */}
      <main className="p-1 employee-main">
        <div>
          <div>
            {/* Removed old header block with title and buttons. Only SortableTable header will be used. */}
            {addUserDrawer}
            {editUserDrawer}

            <SortableTable
              ref={tableRef}
              columns={userColumns}
              data={employeeData}
              title="Employee Master"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
              onAdd={() => setShowAddForm(true)}
              onRefresh={() => {
                fetchEmployees();
                tableRef.current?.refresh();
              }}
              getActions={getActions}
              showGlobalSearch={false}
              autoSelectFirstRow={true}
              // Pagination control props from reusable hook
              {...tableProps}
            />
          </div>
        </div>
      </main>

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={showDeleteConfirm}
        message={userToDelete ? ` ${userToDelete.empl_name}` : ""}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* REPLACE OLD DIRTY CONFIRM DIALOGS WITH HOOK'S DIALOGS */}
      <ConfirmDialog {...addFormDirtyConfirmDialog} />
      <ConfirmDialog {...editFormDirtyConfirmDialog} />

      {/* View-in-window draggable modals (multiple) */}
      {viewWindows.map((win, idx) => (
        <DraggableModal
          key={win.id}
          ref={(el) => {
            if (el) modalRefs.current[win.id] = el;
            else delete modalRefs.current[win.id];
          }}
          open={true}
          minimized={minimizedWindows.has(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
          onRestore={() => restoreWindow(win.id)}
          onClose={() => closeViewWindow(win.id)}
          title={`Employee Details ${
            win.data?.employeeCode || win.data?.employeeID || ""
          }`}
          width={600}
          initialX={160 + idx * 24}
          initialY={100 + idx * 24}
          maskBlocksPointerEvents={false}
          blinkKey={win.id}
        >
          <SaveOrUpdateEmployeeForm
            key={`view-${win.id}`}
            initialData={win.data}
            editMode={false}
            onClose={() => closeViewWindow(win.id)}
            onDirtyChange={() => {
              /* view-only */
            }}
          />
        </DraggableModal>
      ))}

      {/* Security Master Modal */}
      {showSecurityModal && (
        <SecurityMaster
          open={showSecurityModal}
          onClose={() => {
            setShowSecurityModal(false);
            setSelectedSecurityUser(null);
          }}
          employee={selectedSecurityUser}
        />
      )}
    </div>
  );
}
