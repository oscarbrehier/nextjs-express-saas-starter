"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Billing", href: "/billing" },
  { label: "Settings", href: "/settings" },
];

/** The Sidebar's index, read as a strip of tabs below the letterhead on narrow screens. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 divide-x divide-rule border-b border-rule bg-surface md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex-1 px-3 py-2.5 text-center text-xs uppercase tracking-[0.06em] transition-colors",
              active ? "font-semibold text-ink" : "text-ink-muted"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
