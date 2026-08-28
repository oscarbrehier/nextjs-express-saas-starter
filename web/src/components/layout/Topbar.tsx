"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface TopbarProps {
  email: string;
}

export function Topbar({ email }: TopbarProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-4 border-b border-rule bg-surface px-6">
      <ThemeToggle />
      <span className="font-mono text-xs text-ink-muted">{email}</span>
      <button
        onClick={handleLogout}
        className="border border-rule px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted transition-colors hover:border-ink hover:text-ink"
      >
        Log out
      </button>
    </header>
  );
}
