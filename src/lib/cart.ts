'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'lms.store.cart';
const EVENT = 'lms-cart-changed';

export function readCart(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]') as unknown;
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeCart(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(EVENT));
}

export function clearCart() {
  if (typeof window === 'undefined') return;
  writeCart([]);
}

export function useCart() {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setIds(readCart());
    sync();
    setReady(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const add = useCallback((id: string) => {
    const next = readCart();
    if (!next.includes(id)) next.push(id);
    writeCart(next);
    setIds(next);
  }, []);

  const remove = useCallback((id: string) => {
    const next = readCart().filter((item) => item !== id);
    writeCart(next);
    setIds(next);
  }, []);

  const toggle = useCallback((id: string) => {
    const current = readCart();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    writeCart(next);
    setIds(next);
  }, []);

  const clear = useCallback(() => {
    clearCart();
    setIds([]);
  }, []);

  return {
    ids,
    ready,
    add,
    remove,
    toggle,
    clear,
    has: (id: string) => ids.includes(id),
  };
}
