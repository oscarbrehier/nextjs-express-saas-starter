"use client";

import { useEffect, useState } from "react";

/**
 * A two-position instrument switch (L / D), not a sun-and-moon icon —
 * reads as another dial on the report rather than a generic UI affordance.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage unavailable (private mode, disabled storage) — the
      // toggle still works for this render, it just won't persist.
    }
  }

  if (!mounted) {
    return <div className="h-7 w-12 shrink-0" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light register" : "Switch to dark register"}
      className="inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-rule bg-ground px-0.5 transition-colors"
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full bg-ink font-mono text-[10px] font-bold text-ground transition-transform ${
          dark ? "translate-x-5" : "translate-x-0"
        }`}
      >
        {dark ? "D" : "L"}
      </span>
    </button>
  );
}
