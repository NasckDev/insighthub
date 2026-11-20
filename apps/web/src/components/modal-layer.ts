import { useEffect, useRef } from 'react';

/**
 * Shared bookkeeping for everything that sits on top of the page (modals, sheets, the command
 * palette): only the topmost layer reacts to Escape, and the page behind is made `inert` while any
 * layer is open, so Tab, the pointer and screen readers all stay inside the layer.
 */
const stack: symbol[] = [];

function appRoot(): HTMLElement | null {
  return document.getElementById('root');
}

function syncInert() {
  const root = appRoot();
  if (!root) return;
  if (stack.length > 0) root.setAttribute('inert', '');
  else root.removeAttribute('inert');
}

/** Registers a layer while mounted. `onEscape` only runs when this layer is the topmost one. */
export function useModalLayer(onEscape: () => void): void {
  const handler = useRef(onEscape);
  useEffect(() => {
    handler.current = onEscape;
  });

  useEffect(() => {
    const id = Symbol('layer');
    stack.push(id);
    syncInert();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || stack[stack.length - 1] !== id) return;
      event.stopPropagation();
      handler.current();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const index = stack.indexOf(id);
      if (index >= 0) stack.splice(index, 1);
      syncInert();
    };
  }, []);
}

export function openLayerCount(): number {
  return stack.length;
}
