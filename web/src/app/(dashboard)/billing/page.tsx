"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createCheckoutSession, createPortalSession } from "@/lib/api";
import { SubscriptionStatus } from "@/types";

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

      if (data) setStatus(data.subscription_status as SubscriptionStatus);
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
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your subscription.</p>
      </div>

      {fetchingStatus ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {isPro ? "Pro Plan" : "Free Plan"}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {isPro
                  ? "Full access to all insights and repositories."
                  : "Limited to top 3 repos and basic stats."}
              </p>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isPro
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {isPro ? "Active" : "Free"}
            </span>
          </div>

          <hr className="border-gray-100" />

          {/* Plan comparison */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-2">Free</p>
              <ul className="space-y-1 text-gray-500">
                <li>Top 3 repos only</li>
                <li>Basic user stats</li>
                <li>Language breakdown</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-indigo-700 mb-2">Pro — $9/mo</p>
              <ul className="space-y-1 text-gray-600">
                <li>Top 10 repos</li>
                <li>Repo insights (commits, contributors)</li>
                <li>All free features</li>
              </ul>
            </div>
          </div>

          <div className="pt-2">
            {isPro ? (
              <button
                onClick={handleManage}
                disabled={loading}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {loading ? "Loading…" : "Manage subscription"}
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Loading…" : "Upgrade to Pro"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
