'use client';

import { useEffect } from 'react';

function shouldBlockKey(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  const code = event.code;
  if (code === 'F12' || key === 'f12') return true;
  const ctrl = event.ctrlKey || event.metaKey;
  if (ctrl && event.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) return true;
  if (ctrl && key === 'u') return true;
  if (event.metaKey && event.altKey && ['i', 'j', 'c'].includes(key)) return true;
  return false;
}

function isDevToolsOpen() {
  const threshold = 160;
  return (
    window.outerWidth - window.innerWidth > threshold ||
    window.outerHeight - window.innerHeight > threshold
  );
}

export function InspectGuard() {
  useEffect(() => {
    let reloading = false;
    const reload = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!shouldBlockKey(event)) return;
      event.preventDefault();
      event.stopPropagation();
      reload();
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const onDragStart = (event: DragEvent) => {
      const target = event.target;
      if (target instanceof HTMLImageElement || target instanceof HTMLMediaElement) {
        event.preventDefault();
      }
    };

    const check = () => {
      if (window.innerWidth < 640) return;
      if (isDevToolsOpen()) reload();
    };

    const probe = () => {
      const start = performance.now();
      try {
        // Keep this as a runtime trap so production minify cannot drop it.
        // eslint-disable-next-line no-new-func
        new Function('debugger')();
      } catch {
        // ignore
      }
      if (performance.now() - start > 120) reload();
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('contextmenu', onContextMenu, true);
    document.addEventListener('dragstart', onDragStart, true);
    window.addEventListener('resize', check);
    const sizeTimer = window.setInterval(check, 1000);
    const probeTimer = window.setInterval(probe, 2500);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('contextmenu', onContextMenu, true);
      document.removeEventListener('dragstart', onDragStart, true);
      window.removeEventListener('resize', check);
      window.clearInterval(sizeTimer);
      window.clearInterval(probeTimer);
    };
  }, []);

  return null;
}
