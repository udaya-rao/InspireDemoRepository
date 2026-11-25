import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import '@tabler/core/dist/css/tabler.min.css';
// import '@tabler/core/dist/js/tabler.min.js';
import './lib/axiosSetup'
import App from './App.jsx'
import { Provider } from 'react-redux';
import store from './store';
import RefreshOnlySplash from './components/RefreshOnlySplash.jsx'

// Global guard: prevent mouse wheel and arrow keys from changing number inputs across the app
// CSS alone cannot block wheel increment behavior in inputs, so attach JS listeners once here
(() => {
  const isNumberInput = (el) => !!el && el.tagName === 'INPUT' && el.type === 'number';
  const getActiveInput = () => {
    try { return document.activeElement; } catch { return null; }
  };

  const onWheel = (e) => {
    const active = getActiveInput();
    if (isNumberInput(active)) {
      try { e.preventDefault(); } catch { /* noop */ }
      try { e.stopPropagation(); } catch { /* noop */ }
      try { active.blur(); } catch { /* noop */ }
    }
  };

  const onKeyDown = (e) => {
    const active = getActiveInput();
    if (!isNumberInput(active)) return;
    const blocked = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'];
    if (blocked.includes(e.key)) {
      try { e.preventDefault(); } catch { /* noop */ }
      try { e.stopPropagation(); } catch { /* noop */ }
    }
  };

  try {
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown, { passive: false });
  } catch {
    // ignore
  }
})();

// Hide the instant HTML splash as soon as React mounts (or after 3s on reload)
function useHideHtmlSplash() {
  React.useEffect(() => {
    const splash = document.getElementById('app-splash');
    const bar = document.getElementById('app-splash-bar');
    if (!splash) return;

    const isReload = (() => {
      try {
        const nav = performance.getEntriesByType?.('navigation')?.[0];
        if (nav) return nav.type === 'reload';
        const legacy = performance.navigation && performance.navigation.type;
        return legacy === 1;
      } catch { return false; }
    })();

    // Animate the bar quickly; on reload keep at least 3s
    let start;
    let raf;
    const duration = isReload ? 2600 : 400; // bar visual progress
    const tick = (t) => {
      if (!start) start = t;
      const pct = Math.min(1, (t - start) / duration);
      if (bar) bar.style.width = `${Math.floor(pct * 100)}%`;
      if (pct < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const minShow = isReload ? 3000 : 0;
    const hide = () => { splash.style.display = 'none'; };
    const id = setTimeout(hide, minShow);
    return () => { if (raf) cancelAnimationFrame(raf); clearTimeout(id); };
  }, []);
}

function AppWithHtmlSplash() {
  useHideHtmlSplash();
  return (
    <RefreshOnlySplash>
      <App />
    </RefreshOnlySplash>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <AppWithHtmlSplash />
    </Provider>
  </StrictMode>,
)

export default AppWithHtmlSplash;
