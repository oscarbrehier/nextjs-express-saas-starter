"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ReportCard } from "@/components/ui/ReportCard";
import { FormField } from "@/components/ui/FormField";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const form = e.currentTarget;
    const newPassword = (
      form.elements.namedItem("newPassword") as HTMLInputElement
    ).value;

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Password updated successfully." });
      form.reset();
    }

    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="border-b border-rule pb-4">
        <h1 className="text-xl font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your account settings.</p>
      </div>

      <ReportCard title="Account" meta="On file">
        <div>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
            Email
          </span>
          <p className="border-b border-rule py-2 font-mono text-sm text-ink">{email}</p>
          <p className="mt-1.5 text-xs text-ink-muted">Email cannot be changed here.</p>
        </div>
      </ReportCard>

      <ReportCard title="Change password">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <FormField name="newPassword" label="New password" type="password" required minLength={8} />

          {message && (
            <p
              className={`border px-3 py-2 text-sm ${
                message.type === "success"
                  ? "border-signal-good/40 bg-signal-good-bg text-signal-good"
                  : "border-accent/40 bg-accent/5 text-accent"
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-accent px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-accent-ink transition-colors hover:bg-accent-strong disabled:opacity-50"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </ReportCard>
    </div>
  );
}
