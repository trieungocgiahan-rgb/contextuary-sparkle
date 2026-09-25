import { useCallback, useEffect, useState } from "react";

const EVENT = "contextuary:toggle-change";

function read(key: string, fallback: boolean) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw === "1";
  } catch {
    return fallback;
  }
}

/**
 * Boolean UI state persisted in localStorage and synced across
 * every component that uses the same key.
 */
export function usePersistentToggle(key: string, fallback = false) {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    setValue(read(key, fallback));
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string; value: boolean }>).detail;
      if (detail?.key === key) setValue(detail.value);
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? next(prev) : next;
        try {
          localStorage.setItem(key, v ? "1" : "0");
        } catch {
          /* noop */
        }
        window.dispatchEvent(new CustomEvent(EVENT, { detail: { key, value: v } }));
        return v;
      });
    },
    [key],
  );

  return [value, set] as const;
}
