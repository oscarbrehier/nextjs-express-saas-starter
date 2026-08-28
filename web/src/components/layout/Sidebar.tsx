"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Billing", href: "/billing" },
  { label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-rule bg-surface md:flex">
      <div className="border-b border-rule px-5 py-5">
        <span className="text-base font-semibold leading-tight text-ink">
          GitHub Insights
        </span>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          Repository diagnostics
        </p>
      </div>

      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "relative flex items-center gap-2 border-b border-rule px-5 py-3 text-sm transition-colors",
                active
                  ? "font-semibold text-ink"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              {active && (
                <span className="absolute inset-y-0 left-0 w-px bg-accent" aria-hidden="true" />
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
