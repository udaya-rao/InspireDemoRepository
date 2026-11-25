import { useState, useEffect, useRef } from 'react';

export const useWindowManager = (storageKey, options = {}) => {
  const {
    onWindowAdd,
    onWindowRemove,
    onWindowMinimize,
    onWindowRestore
  } = options;

  const [windows, setWindows] = useState([]);
  const [minimizedWindows, setMinimizedWindows] = useState(new Set());
  const [restored, setRestored] = useState(false);
  const nextWindowIdRef = useRef(1);

  const WINDOW_STORAGE_KEY = `${storageKey}ViewWindows`;
  const MINIMIZED_STORAGE_KEY = `${storageKey}MinimizedWindows`;

  // Restore windows and minimized state on mount
  useEffect(() => {
    const saved = localStorage.getItem(WINDOW_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWindows(parsed);
        if (parsed.length > 0) {
          nextWindowIdRef.current = Math.max(...parsed.map(w => w.id)) + 1;
        }
      } catch (error) {
        console.warn('Failed to restore windows from localStorage:', error);
      }
    }

    const minimized = localStorage.getItem(MINIMIZED_STORAGE_KEY);
    if (minimized) {
      try {
        const parsed = JSON.parse(minimized);
        setMinimizedWindows(new Set(parsed));
      } catch (error) {
        console.warn('Failed to restore minimized windows from localStorage:', error);
      }
    }
    
    setRestored(true);
  }, [WINDOW_STORAGE_KEY, MINIMIZED_STORAGE_KEY]);

  // Persist windows
  useEffect(() => {
    if (restored) {
      localStorage.setItem(WINDOW_STORAGE_KEY, JSON.stringify(windows));
    }
  }, [windows, restored, WINDOW_STORAGE_KEY]);

  // Persist minimized windows
  useEffect(() => {
    if (restored) {
      localStorage.setItem(MINIMIZED_STORAGE_KEY, JSON.stringify(Array.from(minimizedWindows)));
    }
  }, [minimizedWindows, restored, MINIMIZED_STORAGE_KEY]);

  const addWindow = (data) => {
    const newId = nextWindowIdRef.current++;
    const newWindow = { id: newId, data };
    
    setWindows(prev => [...prev, newWindow]);
    
    if (onWindowAdd) {
      onWindowAdd(newWindow);
    }
    
    return newId;
  };

  const removeWindow = (id) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    setMinimizedWindows(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    
    if (onWindowRemove) {
      onWindowRemove(id);
    }
  };

  const minimizeWindow = (id) => {
    setMinimizedWindows(prev => new Set([...prev, id]));
    
    if (onWindowMinimize) {
      onWindowMinimize(id);
    }
  };

  const restoreWindow = (id) => {
    setMinimizedWindows(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    
    if (onWindowRestore) {
      onWindowRestore(id);
    }
  };

  const isWindowMinimized = (id) => {
    return minimizedWindows.has(id);
  };

  const getWindow = (id) => {
    return windows.find(w => w.id === id);
  };

  const findWindowByData = (predicate) => {
    return windows.find(w => predicate(w.data));
  };

  const clearAllWindows = () => {
    setWindows([]);
    setMinimizedWindows(new Set());
  };

  return {
    // State
    windows,
    minimizedWindows,
    restored,
    
    // Actions
    addWindow,
    removeWindow,
    minimizeWindow,
    restoreWindow,
    
    // Utilities
    isWindowMinimized,
    getWindow,
    findWindowByData,
    clearAllWindows,
    
    // Refs (for advanced usage)
    nextWindowIdRef
  };
};
