"use client";

import { GHRepoHealth } from "@/types";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const METRICS: {
  key: keyof GHRepoHealth["breakdown"];
  label: string;
  max: number;
}[] = [
  { key: "regularity",  label: "Commit regularity", max: 30 },
  { key: "recency",     label: "Recently active",   max: 20 },
  { key: "description", label: "Has description",   max: 20 },
  { key: "readme",      label: "Has README",        max: 15 },
  { key: "license",     label: "Has license",       max: 15 },
];

export function RepoHealthCard({ health }: { health: GHRepoHealth }) {
  const total = Math.round(health.total);
  const strokeOffset = CIRCUMFERENCE * (1 - total / 100);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-5">Repository Health</h2>

      <div className="flex gap-8 items-center">
        {/* Score ring */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#e0e7ff" strokeWidth="10" />
              <circle
                cx="50" cy="50" r={RADIUS}
                fill="none"
                stroke="#6366f1"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeOffset}
                style={{ transition: "stroke-dashoffset 1s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900 leading-none">{total}</span>
              <span className="text-xs text-gray-400 mt-0.5">/100</span>
            </div>
          </div>
          <span className="text-xs font-medium text-gray-400 tracking-wide uppercase">
            Health
          </span>
        </div>

        {/* Metric breakdown */}
        <div className="flex-1 space-y-3.5">
          {METRICS.map(({ key, label, max }) => {
            const value = health.breakdown[key];
            const pct = (value / max) * 100;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-sm text-gray-600">{label}</span>
                <div className="flex-1 h-2 bg-indigo-50 rounded-full overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-indigo-500 transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-xs text-gray-400 tabular-nums">
                  {Math.round(value)}/{max}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
