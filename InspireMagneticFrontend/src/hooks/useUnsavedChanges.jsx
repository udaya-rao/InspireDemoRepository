import { useState, useCallback, useRef } from 'react';

export const useUnsavedChanges = (options = {}) => {
  const {
    title = "Unsaved Changes",
    message = "You have unsaved changes. Are you sure you want to leave this page?",
    suppressDialogs = false, // When true, dialogs won't show (e.g., when RightDrawer manages close)
  } = options;

  // State management
  const [isDirty, setIsDirty] = useState(false);
  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);
  const [showEditCloseConfirm, setShowEditCloseConfirm] = useState(false);
  const [, setPendingAction] = useState(null);
  const [pendingData, setPendingData] = useState(null);

  // Ref to store the action function
  const actionRef = useRef(null);
  const dataRef = useRef(null);

  // Check if action should be blocked due to unsaved changes
  const checkUnsavedChanges = useCallback((action, data = null) => {
    if (isDirty) {
      if (!data) {
        return true;
      }

      actionRef.current = action;
      dataRef.current = data;
      setPendingAction(() => action);
      setPendingData(data);
      setShowDirtyConfirm(true);
      return false; // Block the action
    }
    return true; // Allow the action
  }, [isDirty]);

  // Confirm discard changes and proceed with action
  const confirmDirtyAction = useCallback(async () => {
    setShowDirtyConfirm(false);
    setIsDirty(false);

    const action = actionRef.current;
    const data = dataRef.current;

    actionRef.current = null;
    dataRef.current = null;
    setPendingData(null);
    setPendingAction(null);


    if (typeof action === 'function') {
      if (data) {
        await action(data);
      } else {
        console.error("No data available in confirmDirtyAction. Data ref was:", data);
      }
    } else {
      console.error("No action available in confirmDirtyAction. Action ref was:", action);
    }
  }, []);

  // Cancel the pending action
  const cancelDirtyAction = useCallback(() => {
    setShowDirtyConfirm(false);
    actionRef.current = null;
    dataRef.current = null;
    setPendingData(null);
  }, []);

  // Handle edit close confirmation
  const handleEditClose = useCallback((forceClose = false) => {
    if (!forceClose && isDirty) {
      setShowEditCloseConfirm(true);
      return false; // Block close
    }
    return true; // Allow close
  }, [isDirty]);

  // Confirm edit close (discard changes)
  const confirmEditClose = useCallback(() => {
    setShowEditCloseConfirm(false);
    setIsDirty(false);
    return true; // Allow close
  }, []);

  // Cancel edit close
  const cancelEditClose = useCallback(() => {
    setShowEditCloseConfirm(false);
  }, []);

  // Reset dirty state
  const resetDirty = useCallback(() => {
    setIsDirty(false);
  }, []);

  // Set pending action with ref to avoid stale closures
  const setPendingActionWithRef = useCallback((action) => {
    actionRef.current = action;
    setPendingAction(() => action);
  }, []);

  return {
    // State
    isDirty,
    showDirtyConfirm,
    showEditCloseConfirm,
    pendingData,

    // Actions
    setIsDirty,
    checkUnsavedChanges,
    confirmDirtyAction,
    cancelDirtyAction,
    handleEditClose,
    confirmEditClose,
    cancelEditClose,
    resetDirty,
    setPendingActionWithRef,

    // Dialog configurations
    dirtyConfirmDialog: {
      open: suppressDialogs ? false : showDirtyConfirm,
      title,
      message: pendingData ? (
        <div>
          <div>You have unsaved changes.</div>
          <div>Are you sure you want to leave this page?</div>
        </div>
      ) : message,
      confirmLabel: "Yes",
      cancelLabel: "No",
      onConfirm: confirmDirtyAction,
      onCancel: cancelDirtyAction
    },

    editCloseConfirmDialog: {
      open: suppressDialogs ? false : showEditCloseConfirm,
      title: "Unsaved Changes",
      message: (
        <div>
          <div>You have unsaved changes in this page.</div>
          <div>Are you sure you want to leave?</div>
        </div>
      ),
      confirmLabel: "Yes",
      cancelLabel: "No",
      onConfirm: confirmEditClose,
      onCancel: cancelEditClose
    }
  };
};
