"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FormField } from "@/components/ui/FormField";
import { AuthFrame } from "@/components/layout/AuthFrame";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Supabase sends a confirmation email by default.
    // If you disabled it in the project settings, the user is logged in immediately.
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthFrame>
      <div className="border border-rule bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="border-b border-rule px-6 py-5">
          <h1 className="text-lg font-semibold text-ink">GitHub Insights</h1>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Intake — New account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <FormField
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <FormField
            label="Password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="border border-accent/40 bg-accent/5 px-3 py-2 text-sm text-accent">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-accent-ink transition-colors hover:bg-accent-strong disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="border-t border-rule px-6 py-4 text-center">
          <p className="text-sm text-ink-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthFrame>
  );
}
