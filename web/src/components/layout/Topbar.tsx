"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <header className="h-14 shrink-0 border-b border-gray-200 bg-white flex items-center justify-end px-6 gap-4">
      <span className="text-sm text-gray-600">{email}</span>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        Log out
      </button>
    </header>
  );
}
