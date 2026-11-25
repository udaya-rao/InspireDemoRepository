import React, { forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { allocateTop, bringToFront as bringFrontGlobal, isTop } from './zIndexManager';
import { ConfirmDialog } from './Notification';

/**
 * DraggableModal
 * - Reusable modal window that can be dragged anywhere within the viewport
 * - Renders via portal to document.body
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - title?: string | ReactNode
 * - children: ReactNode
 * - footer?: ReactNode
 * - headerActions?: ReactNode (renders in header before minimize/close)
 * - width?: number | string (default: 640)
 * - height?: number | string (auto height by content)
 * - initialX?: number (default: centered)
 * - initialY?: number (default: centered)
 * - maskClosable?: boolean (default: true)
 * - showClose?: boolean (default: true)
 * - zIndex?: number (default: 1000)
 * - fixedZIndex?: number (forces exact z-index; bypasses stack)
 */
// Global stack manager moved to zIndexManager

const DraggableModal = forwardRef(function DraggableModal({
  open,
  onClose,
  title,
  children,
  footer,
  headerActions = null,
  width = 640,
  height,
  initialX,
  initialY,
  left: explicitLeft,
  top: explicitTop,
  maskClosable = true,
  showClose = true,
  zIndex,
  maskBlocksPointerEvents = true,
  resizable = true,
  requireTopToClose = true,
  fixedZIndex,
  minWidth = 320,
  minHeight = 160,
  dragOverflowRatio = 0.5,
  blinkKey,
  allowMinimize = false,

  minimized: controlledMinimized,
  onMinimize,
  onRestore,
  maxWidth,
  maxHeight,
  onResize, // <-- add this prop
  // Simple boolean-based dirty flag for reuse across many modals
  isDirty,
  // Optional overrides for the dirty confirmation dialog (when using isDirty)
  dirtyTitle: dirtyTitleProp,
  dirtyMessage: dirtyMessageProp,
  dirtyConfirmLabel: dirtyConfirmLabelProp,
  dirtyCancelLabel: dirtyCancelLabelProp,
  // Advanced configuration object (overrides isDirty + dirty* props when provided)
  dirtyGuard = null,
}, ref) {
  const modalRef = React.useRef(null);
  const draggingRef = React.useRef(false);
  const pointerStartRef = React.useRef({ x: 0, y: 0 });
  const modalStartRef = React.useRef({ x: 0, y: 0 });
  const [position, setPosition] = React.useState({ left: 0, top: 0 });
  const idRef = React.useRef(Symbol('DraggableModal'));
  const [stackZ, setStackZ] = React.useState(0);
  const resizingRef = React.useRef(false);
  const resizeStartRef = React.useRef({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0, dir: '' });
  const [size, setSize] = React.useState({
    width: typeof width === 'number' ? width : undefined,
    height: typeof height === 'number' ? height : undefined,
  });

  // Sync size when props change dynamically
  React.useEffect(() => {
    setSize(prev => {
      const newWidth = typeof width === 'number' ? width : undefined;
      const newHeight = typeof height === 'number' ? height : undefined;
      if (prev.width !== newWidth || prev.height !== newHeight) {
        return { width: newWidth, height: newHeight };
      }
      return prev;
    });
  }, [width, height]);

  // Reset size state to props when modal closes to allow natural recalculation on next open
  React.useEffect(() => {
    if (!open) {
      setSize({
        width: typeof width === 'number' ? width : undefined,
        height: typeof height === 'number' ? height : undefined,
      });
    }
  }, [open, width, height]);

  const [internalMinimized, setInternalMinimized] = React.useState(false);
  const isMinimized = controlledMinimized !== undefined ? controlledMinimized : internalMinimized;
  const [showDirtyCloseConfirm, setShowDirtyCloseConfirm] = React.useState(false);

  const dirtyGuardConfig = React.useMemo(() => {
    // If caller passed full config, use it as-is
    if (dirtyGuard) return dirtyGuard;
    // Fallback: if a simple boolean is provided, wrap it and apply optional labels
    if (typeof isDirty === 'boolean') {
      return {
        enabled: true,
        isDirty: () => isDirty,
        title: dirtyTitleProp,
        message: dirtyMessageProp,
        confirmLabel: dirtyConfirmLabelProp,
        cancelLabel: dirtyCancelLabelProp,
      };
    }
    return null;
  }, [
    dirtyGuard,
    isDirty,
    dirtyTitleProp,
    dirtyMessageProp,
    dirtyConfirmLabelProp,
    dirtyCancelLabelProp,
  ]);
  const dirtyGuardEnabled =
    !!(
      dirtyGuardConfig &&
      (dirtyGuardConfig.enabled === undefined ? true : dirtyGuardConfig.enabled) &&
      typeof dirtyGuardConfig.isDirty === 'function'
    );
  const dirtyIsDirtyFn = dirtyGuardConfig?.isDirty;
  const dirtyTitle = dirtyGuardConfig?.title || 'Unsaved Changes';
  const dirtyMessage =
    dirtyGuardConfig?.message || (
      <>
        <div>You have unsaved changes.</div>
        <div>Are you sure you want to close ?</div>
      </>
    );
  const dirtyConfirmLabel = dirtyGuardConfig?.confirmLabel || 'OK';
  const dirtyCancelLabel = dirtyGuardConfig?.cancelLabel || 'Cancel';

  const requestClose = React.useCallback(() => {
    if (dirtyGuardEnabled && dirtyIsDirtyFn?.()) {
      setShowDirtyCloseConfirm(true);
      return;
    }
    onClose?.();
  }, [dirtyGuardEnabled, dirtyIsDirtyFn, onClose]);

  const handleDirtyConfirm = React.useCallback(() => {
    setShowDirtyCloseConfirm(false);
    try {
      dirtyGuardConfig?.onConfirm?.();
    } catch {
      /* noop */
    }
    onClose?.();
  }, [dirtyGuardConfig, onClose]);

  const handleDirtyCancel = React.useCallback(() => {
    setShowDirtyCloseConfirm(false);
    try {
      dirtyGuardConfig?.onCancel?.();
    } catch {
      /* noop */
    }
  }, [dirtyGuardConfig]);

  useImperativeHandle(ref, () => ({
    restore: () => {
      if (controlledMinimized === undefined) setInternalMinimized(false);
      if (onRestore) onRestore();
      bringToFront();
    },
    isMinimized: () => isMinimized,
    bringToFront
  }), [isMinimized, controlledMinimized, onRestore]);

  const chipIdRef = React.useRef(`modal-chip-${Math.random().toString(36).substr(2, 9)}`);

  // Ensure a shared minibar container exists (legacy fallback) and position it near sidebar
  React.useEffect(() => {
    const minibarId = 'draggable-modal-minibar';
    let node = document.getElementById(minibarId);
    if (!node) {
      node = document.createElement('div');
      node.id = minibarId;
      node.setAttribute('aria-live', 'polite');
      Object.assign(node.style, {
        position: 'fixed',
        left: '12px',
        bottom: '12px',
        display: 'flex',
        gap: '8px',
        flexWrap: 'nowrap',
        alignItems: 'center',
        zIndex: 3000,
        pointerEvents: 'auto',
        overflowX: 'auto',
        overflowY: 'hidden',
        whiteSpace: 'nowrap',
      });
      document.body.appendChild(node);
    }
    // Position the fallback minibar to start after the sidebar's current width
    const getSidebarElement = () => document.querySelector('.sidebar-hover-expand.expanded, .sidebar-hover-expand');
    const getSidebarWidth = () => {
      const sidebar = getSidebarElement();
      return sidebar ? sidebar.offsetWidth : 0;
    };
    const positionMinibar = () => {
      const sidebarWidth = getSidebarWidth();
      node.style.left = `${Math.max(0, sidebarWidth + 12)}px`;
      node.style.right = '12px';
    };
    positionMinibar();
    window.addEventListener('resize', positionMinibar);
    const sidebarEl = getSidebarElement();
    let observer;
    if (sidebarEl && window.ResizeObserver) {
      observer = new window.ResizeObserver(positionMinibar);
      observer.observe(sidebarEl);
    }
    return () => {
      window.removeEventListener('resize', positionMinibar);
      if (observer && sidebarEl) observer.disconnect();
    };
  }, []);

  // Inject a soft Fluent-style danger ring animation (once per app load)
  React.useEffect(() => {
    const styleId = 'draggable-modal-fluent-danger';
    if (typeof document === 'undefined' || document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Soft, Microsoft Fluent-like danger pulse */
      .draggable-modal-window.danger-blink::after {
        content: '';
        position: absolute;
        inset: 0; /* stay within bounds to respect overflow: hidden */
        border-radius: inherit;
        pointer-events: none;
        /* two inner rings to feel like an attention affordance, not an error */
        box-shadow:
          0 0 0 2px rgba(209, 52, 56, 0.95) inset,
          0 0 0 6px rgba(209, 52, 56, 0.18) inset;
        animation: fm-danger-ring 600ms cubic-bezier(0.2, 0, 0, 1) forwards;
      }

      @keyframes fm-danger-ring {
        0% { transform: scale(0.995); opacity: 0; }
        35% { opacity: 1; }
        100% { transform: scale(1); opacity: 0; }
      }

      /* Respect reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .draggable-modal-window.danger-blink::after {
          animation: none;
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const resolvePositionValue = React.useCallback((value, axis) => {
    if (value == null) return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return null;

    const parseNumeric = (raw) => {
      const num = parseFloat(raw);
      return Number.isFinite(num) ? num : null;
    };

    const viewportSize = () => {
      if (typeof window === 'undefined') return null;
      return axis === 'x' ? window.innerWidth : window.innerHeight;
    };

    if (trimmed.endsWith('px')) return parseNumeric(trimmed);
    if (trimmed.endsWith('%')) {
      const base = viewportSize();
      const numeric = parseNumeric(trimmed);
      return base != null && numeric != null ? (base * numeric) / 100 : null;
    }
    if (trimmed.endsWith('vw')) {
      const base = typeof window !== 'undefined' ? window.innerWidth : null;
      const numeric = parseNumeric(trimmed);
      return base != null && numeric != null ? (base * numeric) / 100 : null;
    }
    if (trimmed.endsWith('vh')) {
      const base = typeof window !== 'undefined' ? window.innerHeight : null;
      const numeric = parseNumeric(trimmed);
      return base != null && numeric != null ? (base * numeric) / 100 : null;
    }
    return parseNumeric(trimmed);
  }, []);

  const computeCenteredPosition = React.useCallback(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
    const modalWidth = typeof width === 'number' ? width : (modalRef.current?.offsetWidth || 640);
    const modalHeight = typeof height === 'number' ? height : (modalRef.current?.offsetHeight || 320);
    const left = Math.max(8, Math.round((viewportWidth - modalWidth) / 2));
    const top = Math.max(8, Math.round((viewportHeight - modalHeight) / 2));
    return { left, top };
  }, [height, width]);

  // Center the modal by default when opened (before paint to avoid flicker)
  React.useLayoutEffect(() => {
    if (!open) return;
    const resolvedLeftSource = initialX ?? explicitLeft;
    const resolvedTopSource = initialY ?? explicitTop;
    const resolvedLeft = resolvePositionValue(resolvedLeftSource, 'x');
    const resolvedTop = resolvePositionValue(resolvedTopSource, 'y');
    if (resolvedLeft != null || resolvedTop != null) {
      const fallback = computeCenteredPosition();
      setPosition({
        left: resolvedLeft != null ? resolvedLeft : fallback.left,
        top: resolvedTop != null ? resolvedTop : fallback.top,
      });
      return;
    }
    setPosition(computeCenteredPosition());
  }, [open, width, height, initialX, initialY, explicitLeft, explicitTop, resolvePositionValue, computeCenteredPosition]);

  // Initialize size on open (measure before paint)
  React.useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const initialW = typeof width === 'number' ? width : undefined;
      const initialH = typeof height === 'number' ? height : undefined;
      setSize({ width: initialW, height: initialH });
    };
    measure();
  }, [open, width, height]);

  // Escape to close (only top-most)
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!requireTopToClose || isTop(idRef.current)) requestClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, requestClose, requireTopToClose]);

  // Initialize stacking and bring to front when opened
  React.useEffect(() => {
    if (!open) return;
    setStackZ(allocateTop(idRef.current));
  }, [open]);

  // Restrict tab switching while any modal is open (set a global flag on <body>)
  React.useEffect(() => {
    if (!open) return;
    const prev = Number(document.body.getAttribute('data-modal-open-count') || 0);
    document.body.setAttribute('data-modal-open-count', String(prev + 1));
    document.body.setAttribute('data-modal-open', 'true');
    return () => {
      const prev2 = Number(document.body.getAttribute('data-modal-open-count') || 1);
      const next = Math.max(0, prev2 - 1);
      if (next <= 0) {
        document.body.removeAttribute('data-modal-open-count');
        document.body.removeAttribute('data-modal-open');
      } else {
        document.body.setAttribute('data-modal-open-count', String(next));
      }
    };
  }, [open]);

  // Constrain within viewport (with optional partial overflow)
  const clampToViewport = React.useCallback((left, top) => {
    const node = modalRef.current;
    if (!node) return { left, top };
    const rect = node.getBoundingClientRect();
    const modalWidth = rect.width;
    const modalHeight = rect.height;
    const padding = 8;
    const overflowX = Math.max(0, Math.min(1, dragOverflowRatio)) * modalWidth;
    const overflowY = Math.max(0, Math.min(1, dragOverflowRatio)) * modalHeight;
    const minLeft = -overflowX + padding;
    const minTop = -overflowY + padding;
    const maxLeft = window.innerWidth - modalWidth + overflowX - padding;
    const maxTop = window.innerHeight - modalHeight + overflowY - padding;
    return {
      left: Math.min(Math.max(left, minLeft), maxLeft),
      top: Math.min(Math.max(top, minTop), maxTop),
    };
  }, [dragOverflowRatio]);

  const bringToFront = () => bringFrontGlobal(setStackZ, idRef.current);

  const onPointerDown = (e) => {
    // Only left mouse / primary pointer
    if (e.button !== undefined && e.button !== 0) return;
    bringToFront();
    draggingRef.current = true;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    modalStartRef.current = { x: position.left, y: position.top };
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
  };

  // Allow dragging from anywhere in the window except interactive elements
  const shouldStartDrag = (target) => {
    if (!target) return false;
    const interactive = target.closest(
      'input, textarea, select, button, a, [role="button"], [contenteditable=""], [contenteditable="true"], .no-drag, [data-no-drag]'
    );
    return !interactive;
  };

  const onContainerPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    // Prevent bubbling to underlying modals/windows
    if (e.stopPropagation) e.stopPropagation();
    // If clicked on resize handles, they call stopPropagation; otherwise check interactivity
    if (!shouldStartDrag(e.target)) return;
    onPointerDown(e);
  };

  // Listen for overlayBlink to animate a danger border briefly
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const evtKey = e?.detail?.key;
      // If an event key is provided, only blink when it matches this window's key
      if (evtKey !== undefined && evtKey !== blinkKey) return;
      const node = modalRef.current;
      if (!node) return;
      node.classList.remove('danger-blink');
      // force reflow to restart animation
      node.getBoundingClientRect();
      node.classList.add('danger-blink');
      setTimeout(() => node.classList.remove('danger-blink'), 600);
    };
    window.addEventListener('overlayBlink', handler);
    return () => window.removeEventListener('overlayBlink', handler);
  }, [open, blinkKey]);

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const next = clampToViewport(modalStartRef.current.x + dx, modalStartRef.current.y + dy);
    setPosition(next);
  };

  const onPointerUp = () => {
    draggingRef.current = false;
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', onPointerMove);
  };

  // Resize handlers (bottom-right corner)
  const onResizeDown = (e, dir) => {
    if (!resizable) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    bringToFront();
    resizingRef.current = true;
    const rect = modalRef.current?.getBoundingClientRect();
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: rect?.width || size.width || 640,
      height: rect?.height || size.height || 420,
      left: position.left,
      top: position.top,
      dir: dir || 'se',
    };
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', onResizeUp, { once: true });
  };

  const onResizeMove = (e) => {
    if (!resizingRef.current) return;
    const dx = e.clientX - resizeStartRef.current.x;
    const dy = e.clientY - resizeStartRef.current.y;
    const { width: startW, height: startH, left: startL, top: startT, dir } = resizeStartRef.current;

    let newLeft = startL;
    let newTop = startT;
    let newWidth = startW;
    let newHeight = startH;

    // Horizontal
    if (dir.includes('e')) {
      newWidth = startW + dx;
    }
    if (dir.includes('w')) {
      newWidth = startW - dx;
      newLeft = startL + dx;
    }
    // Vertical
    if (dir.includes('s')) {
      newHeight = startH + dy;
    }
    if (dir.includes('n')) {
      newHeight = startH - dy;
      newTop = startT + dy;
    }

    // Min constraints
    newWidth = Math.max(newWidth, minWidth);
    newHeight = Math.max(newHeight, minHeight);

    // Clamp to viewport (8px padding)
    const maxRight = window.innerWidth - 8;
    const maxBottom = window.innerHeight - 8;

    // If resizing from left/top, keep right/bottom fixed when clamped
    const rightEdge = startL + startW;
    const bottomEdge = startT + startH;

    if (newLeft < 0) {
      newLeft = 0;
      if (dir.includes('w')) newWidth = rightEdge - newLeft;
    }
    if (newTop < 0) {
      newTop = 0;
      if (dir.includes('n')) newHeight = bottomEdge - newTop;
    }

    if (newLeft + newWidth > maxRight) {
      if (dir.includes('e')) newWidth = maxRight - newLeft;
      else newLeft = Math.max(0, maxRight - newWidth);
    }
    if (newTop + newHeight > maxBottom) {
      if (dir.includes('s')) newHeight = maxBottom - newTop;
      else newTop = Math.max(0, maxBottom - newHeight);
    }

    setPosition({ left: newLeft, top: newTop });
    setSize({ width: newWidth, height: newHeight });
    // NEW — Call onResize if provided
    if (typeof onResize === 'function') {
      onResize(newWidth, newHeight);
    }
  };

  const onResizeUp = () => {
    resizingRef.current = false;
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', onResizeMove);
  };

  if (!open) return null;

  // When minimized, render only a small restore chip in the minibar (prefer global under-tab bar) and skip backdrop/window
  if (isMinimized) {
    // Prefer global minibar placed under tab content; fallback to legacy sidebar-aligned minibar
    let minibar = document.getElementById('tab-global-minibar');
    if (!minibar) minibar = document.getElementById('draggable-modal-minibar');
    if (!minibar) minibar = document.body;
    const chip = (
      <div
        id={chipIdRef.current}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        {/* Chip styled like a tab with close button */}
        <div
          role="button"
          onClick={() => {
            if (controlledMinimized !== undefined && onRestore) onRestore();
            else setInternalMinimized(false);
            bringToFront();
          }}
          title={typeof title === 'string' ? `Restore: ${title}` : 'Restore'}
          style={{
            pointerEvents: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 999,
            padding: '3px 10px',
            border: '1px solid #e3eaf5',
            background: 'rgb(24 101 181)',
            cursor: 'pointer',
            maxWidth: '40vw',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: 13,
            color: '#fff',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold', fontSize: 13 }}>
            {typeof title === 'string' ? title : 'Window'}
          </span>
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              requestClose();
            }}
            aria-label="Close"
            title="Close"
            style={{
              width: 17,
              height: 17,
              backgroundColor: '#8CA3C1',
              borderRadius: '50%',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              marginLeft: 6,
              color: '#fff',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="white" style={{ display: 'block' }}>
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Drag handle for chip (scroll the minibar horizontally) */}
        <span
          onPointerDown={(e) => {
            // simple horizontal drag for chips (works for both per-tab and fallback minibar)
            const target = minibar;
            if (!target) return;
            const startX = e.clientX;
            const startScroll = target.scrollLeft;
            const onMove = (ev) => {
              target.scrollLeft = startScroll - (ev.clientX - startX);
            };
            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
            };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp, { once: true });
          }}
          title="Drag bar"
          style={{ cursor: 'grab', width: 10, height: 24, display: 'inline-block' }}
        />
      </div>
    );
    return createPortal(chip, minibar);
  }

  const effectiveZ = fixedZIndex != null
    ? fixedZIndex
    : (zIndex != null ? Math.max(zIndex, stackZ) : stackZ);

  const containerStyle = maskBlocksPointerEvents
    ? { position: 'fixed', inset: 0, zIndex: effectiveZ }
    : { position: 'fixed', inset: 0, zIndex: effectiveZ, pointerEvents: 'none' };

  const modalNode = (
    <div aria-modal="true" role="dialog" style={containerStyle} className="draggable-modal-container" onMouseDown={e => e.stopPropagation()}>
      <div
        onClick={() => {
          if (!maskBlocksPointerEvents) return;
          if (!maskClosable) return;
          if (!requireTopToClose || isTop(idRef.current)) requestClose();
          else bringToFront();
        }}
        onPointerDown={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: maskBlocksPointerEvents ? 'auto' : 'none'
        }}
      />
      <div
        ref={modalRef}
        onPointerDown={onContainerPointerDown}
        className="draggable-modal-window"
        style={{
          position: 'absolute',
          left: position.left,
          top: position.top,
          width: size.width || width,
          maxWidth: maxWidth !== undefined ? maxWidth : 'calc(100vw - 16px)',
          maxHeight: maxHeight !== undefined ? maxHeight : 'calc(100vh - 16px)',
          background: '#fff',
          borderRadius: 10,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: size.height || height,
          // Ensure window remains interactive when container is click-through
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            cursor: 'grab',
            background: 'linear-gradient(180deg, #f8fafc, #eef2f7)',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 20 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
              {title}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {headerActions}
            {allowMinimize && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (!isTop(idRef.current)) bringToFront();
                  if (controlledMinimized !== undefined && onMinimize) onMinimize();
                  else setInternalMinimized(true);
                }}
                title="Minimize"
                style={{ marginTop: '0' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="19" /></svg>
              </button>
            )}
            {showClose && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  requestClose();
                }}
                title="Close"
                style={{ marginTop: '0', marginRight: '20px' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
        </div>

        <div
          className="draggable-modal-body"
          onWheel={(e) => { e.stopPropagation(); }}
          style={{
            margin: 12,
            overflow: 'auto',
            flex: '1 1 0%',
            minHeight: 0,
            height,
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {children}
        </div>

        {footer && (
          <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', background: '#fafafa' }}>
            {footer}
          </div>
        )}

        {resizable && (
          <>
            <div onPointerDown={(e) => onResizeDown(e, 'nw')} style={{ position: 'absolute', left: 0, top: 0, width: 14, height: 14, cursor: 'nwse-resize' }} />
            <div onPointerDown={(e) => onResizeDown(e, 'ne')} style={{ position: 'absolute', right: 0, top: 0, width: 14, height: 14, cursor: 'nesw-resize' }} />
            <div onPointerDown={(e) => onResizeDown(e, 'sw')} style={{ position: 'absolute', left: 0, bottom: 0, width: 14, height: 14, cursor: 'nesw-resize' }} />
            <div onPointerDown={(e) => onResizeDown(e, 'se')} style={{ position: 'absolute', right: 0, bottom: 0, width: 14, height: 14, cursor: 'nwse-resize' }} />
            <div onPointerDown={(e) => onResizeDown(e, 'n')} style={{ position: 'absolute', left: 8, right: 8, top: 0, height: 8, cursor: 'ns-resize' }} />
            <div onPointerDown={(e) => onResizeDown(e, 's')} style={{ position: 'absolute', left: 8, right: 8, bottom: 0, height: 8, cursor: 'ns-resize' }} />
            <div onPointerDown={(e) => onResizeDown(e, 'w')} style={{ position: 'absolute', top: 8, bottom: 8, left: 0, width: 8, cursor: 'ew-resize' }} />
            <div onPointerDown={(e) => onResizeDown(e, 'e')} style={{ position: 'absolute', top: 8, bottom: 8, right: 0, width: 8, cursor: 'ew-resize' }} />
          </>
        )}
      </div>
    </div>
  );

  return createPortal(
    <>
      {modalNode}
      {dirtyGuardEnabled && (
        <ConfirmDialog
          open={showDirtyCloseConfirm}
          title={dirtyTitle}
          message={dirtyMessage}
          confirmLabel={dirtyConfirmLabel}
          cancelLabel={dirtyCancelLabel}
          onConfirm={handleDirtyConfirm}
          onCancel={handleDirtyCancel}
        />
      )}
    </>,
    document.body
  );
});

export default DraggableModal;


