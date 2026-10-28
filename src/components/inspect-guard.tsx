'use client';

import { useEffect } from 'react';

function isInspectShortcut(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  const code = event.code;
  if (code === 'F12' || key === 'f12') return true;
  const ctrl = event.ctrlKey || event.metaKey;
  if (ctrl && event.shiftKey && ['i', 'j', 'c', 'k', 'e'].includes(key)) return true;
  if (ctrl && key === 'u') return true;
  if (event.metaKey && event.altKey && ['i', 'j', 'c', 'u'].includes(key)) return true;
  return false;
}

export function InspectGuard() {
  useEffect(() => {
    let reloading = false;
    let baseWidthGap = -1;
    let baseHeightGap = -1;

    const reload = () => {
      if (reloading) return;
      reloading = true;
      window.location.replace(window.location.href);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isInspectShortcut(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      reload();
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const captureBaseline = () => {
      baseWidthGap = Math.max(0, window.outerWidth - window.innerWidth);
      baseHeightGap = Math.max(0, window.outerHeight - window.innerHeight);
    };

    const checkSize = () => {
      if (document.fullscreenElement) return;
      if (window.innerWidth < 768) return;
      if (baseWidthGap < 0 || baseHeightGap < 0) {
        captureBaseline();
        return;
      }
      const widthGap = Math.max(0, window.outerWidth - window.innerWidth);
      const heightGap = Math.max(0, window.outerHeight - window.innerHeight);
      if (widthGap - baseWidthGap > 180 || heightGap - baseHeightGap > 180) {
        reload();
      }
    };

    const checkDebugger = () => {
      const start = performance.now();
      try {
        // eslint-disable-next-line no-eval
        eval('debugger');
      } catch {
        // ignore
      }
      if (performance.now() - start > 100) reload();
    };

    captureBaseline();
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('contextmenu', onContextMenu, true);
    window.addEventListener('resize', checkSize);
    const sizeTimer = window.setInterval(checkSize, 700);
    const debuggerTimer = window.setInterval(checkDebugger, 1400);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('contextmenu', onContextMenu, true);
      window.removeEventListener('resize', checkSize);
      window.clearInterval(sizeTimer);
      window.clearInterval(debuggerTimer);
    };
  }, []);

  return null;
}
