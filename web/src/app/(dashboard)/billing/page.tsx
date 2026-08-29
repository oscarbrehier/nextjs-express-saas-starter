"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createCheckoutSession, createPortalSession } from "@/lib/api";
import { SubscriptionStatus, isSubscriptionStatus } from "@/types";
import { ReportCard } from "@/components/ui/ReportCard";

export default function BillingPage() {
  const [status, setStatus] = useState<SubscriptionStatus>("free");
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", user.id)
        .single();

      if (data && isSubscriptionStatus(data.subscription_status)) {
        setStatus(data.subscription_status);
      }
      setFetchingStatus(false);
    }

    loadProfile();
  }, []);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { url } = await createCheckoutSession(session.access_token);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  async function handleManage() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { url } = await createPortalSession(session.access_token);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  const isPro = status === "active";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="border-b border-rule pb-4">
        <h1 className="text-xl font-semibold text-ink">Billing</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your subscription.</p>
      </div>

      {fetchingStatus ? (
        <div className="font-mono text-sm text-ink-muted">Loading…</div>
      ) : (
        <ReportCard
          title="Subscription"
          meta={isPro ? "Active — Pro" : "Active — Free"}
        >
          <div className="space-y-5">
            <p className="text-sm text-ink-muted">
              {isPro
                ? "Full access to all insights and repositories."
                : "Limited to top 3 repos and basic stats."}
            </p>

            {/* Plan comparison, read as two adjoining panels of the same record */}
            <div className="grid grid-cols-2 divide-x divide-rule border border-rule text-sm">
              <PlanPanel
                name="Free"
                price="€0/mo"
                features={["Top 3 repos only", "Basic user stats", "Language breakdown"]}
                active={!isPro}
              />
              <PlanPanel
                name="Pro"
                price="€9/mo"
                features={["Top 10 repos", "Repo insights (commits, contributors)", "All free features"]}
                active={isPro}
              />
            </div>

            <div>
              {isPro ? (
                <button
                  onClick={handleManage}
                  disabled={loading}
                  className="border border-rule px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:border-ink disabled:opacity-50"
                >
                  {loading ? "Loading…" : "Manage subscription"}
                </button>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-accent-ink transition-colors hover:bg-accent-strong disabled:opacity-50"
                >
                  {loading ? "Loading…" : "Upgrade to Pro"}
                </button>
              )}
            </div>
          </div>
        </ReportCard>
      )}
    </div>
  );
}

function PlanPanel({
  name,
  price,
  features,
  active,
}: {
  name: string;
  price: string;
  features: string[];
  active: boolean;
}) {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-semibold text-ink">
          {name} <span className="font-mono font-normal text-ink-muted">{price}</span>
        </p>
        {active && (
          <span className="shrink-0 border border-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
            Active
          </span>
        )}
      </div>
      <ul className="space-y-1.5 text-ink-muted">
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  );
}
