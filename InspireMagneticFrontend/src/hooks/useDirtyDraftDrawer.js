import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * useDirtyDraftDrawer
 * Reusable hook that centralizes:
 * - per-open dirty baseline (includes merged draft on create)
 * - isDirty calculation via onValuesChange
 * - RightDrawer props wiring for create/edit with 3 vs 2 button confirm
 * - draft keep/discard behaviors
 */
export function useDirtyDraftDrawer({
  open,
  initialValues,
  initialData,
  draftKey,
  confirmScope, // overrides create/edit detection when provided
}) {
  const isCreate = useMemo(() => initialData ? false : true, [initialData]);
  const [isDirty, setIsDirty] = useState(false);
  const baselineRef = useRef(null);


  useEffect(() => {
    // Always keep baseline in sync with initialValues identity changes
    // (regardless of whether the drawer is open)
    try {
      if (isCreate && draftKey) {
        const raw = localStorage.getItem(draftKey);
        baselineRef.current = raw ? { ...initialValues, ...JSON.parse(raw) } : { ...initialValues };
      } else {
        baselineRef.current = { ...initialValues };
      }
    } catch {
      baselineRef.current = { ...initialValues };
    }

    // ValidatedForm fires onValuesChange with the new values before this effect runs.
    if (!isCreate) {
      setIsDirty(false);
    }
  }, [initialValues, isCreate]); // isCreate added so the guard is always current

  // When the drawer opens, re-establish baseline and reset dirty flag
  useEffect(() => {
    if (!open) return;
    try {
      if (isCreate && draftKey) {
        const raw = localStorage.getItem(draftKey);
        baselineRef.current = raw ? { ...initialValues, ...JSON.parse(raw) } : { ...initialValues };
      } else {
        baselineRef.current = { ...initialValues };
      }
    } catch {
      baselineRef.current = { ...initialValues };
    }
    setIsDirty(false);
  }, [open, isCreate, draftKey, initialValues]);

  const onValuesChange = useCallback((nextValues) => {
    try {
      const dirtyNow = JSON.stringify(nextValues) !== JSON.stringify(baselineRef.current);
      // Use functional update to skip re-render when the dirty value hasn't actually changed
      setIsDirty((prev) => (prev === dirtyNow ? prev : dirtyNow));
    } catch {
      // conservative: if compare fails, consider not dirty to avoid blocking UX
      setIsDirty((prev) => (prev ? false : prev));
    }
  }, []); // baselineRef is a ref - stable reference, safe to omit

  const resetDirty = () => {
    try {
      // Clear draft from storage if applicable
      if (draftKey) {
        localStorage.removeItem(draftKey);
      }
    } catch {
      /* no-op */
    }
    setIsDirty(false);
  };


  const updateBaseline = useCallback((currentValues) => {
    if (currentValues) {
      baselineRef.current = { ...currentValues };
    }
    setIsDirty(false);
  }, []);

  const rightDrawerProps = {
    enableCloseConfirm: true,
    closeConfirmScope: confirmScope || (isCreate ? 'create' : 'edit'),
    isCreate,
    isDirty,
    // Keep draft on Save & Close so reopen auto-fills (create flow)
    onSaveDraft: () => { },
    // Discard draft on "Don't Save"
    onDiscardDraft: () => resetDirty(),
    // Disable tab close confirmation by not broadcasting dirtyPromptState
    // disableTabCloseConfirm: true,
  };

  return { isDirty, onValuesChange, rightDrawerProps, setIsDirty, resetDirty, updateBaseline };
}

export default useDirtyDraftDrawer;


