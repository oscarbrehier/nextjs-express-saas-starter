# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary audience is portfolio reviewers — developers, hiring managers, and other engineers evaluating Oscar Bréhier's work by trying the live demo. They sign up, search a GitHub username, and see the product work end-to-end; they are not real paying customers using this to track GitHub activity day to day.

## Product Purpose

A portfolio piece: a fully working SaaS built to a production-shaped standard, using a GitHub-stats dashboard as the vehicle. Success means a reviewer comes away convinced this person can ship a real SaaS end-to-end — auth, billing, tiered access, export — not that the GitHub-insights idea itself has commercial traction.

## Positioning

Two things make this more than a thin wrapper around the GitHub API:

1. A home-grown, weighted repo health score (commit regularity, recency, description, README, license) that turns raw repo stats into a defensible rating with a per-metric breakdown — the signature analysis layer.
2. A complete, working SaaS backbone: Supabase JWT auth, Free/Pro tier gating enforced server-side, Stripe Checkout + webhooks, and PDF report export — implemented as real, working flows rather than mockups.

The GitHub analysis is the pretext; the SaaS backbone is the actual thing being demonstrated.

## Operating Context

- Reviewed as a live demo: a visitor signs up, searches a GitHub username, sees tiered results, can walk through Stripe test-mode checkout to see Pro unlock, and can download a PDF report.
- Local dev requires a Supabase project, a Stripe test-mode account, and a GitHub PAT (documented in README.md).

## Capabilities and Constraints

- Free tier: top 3 repos only.
- Pro tier: top 10 repos + repo insights (health score breakdown, commit activity, contributors) + PDF report export.
- Tier gating is enforced server-side (`requirePro` middleware); every API response carries `tier: "free" | "pro"` for the frontend to key off.
- Auth is Supabase email/password; JWT verified in Express middleware (currently ES256 via JWKS).
- GitHub API calls happen only server-side (`api/src/services/github.ts`), rate-limit aware.

## Brand Commitments

- Product name "GitHub Insights" is fixed, not a placeholder.
- Pro price of €9/month is fixed, not a placeholder.
- The Free (top 3 repos) / Pro (top 10 + insights) tier split is a fixed structure to design around, not soften away.
- No existing logo or mark. Current UI uses Tailwind's default indigo/gray palette with no distinct visual identity yet — open ground for a visual world.

## Evidence on Hand

- No real testimonials, customer logos, or usage data exist. None should be fabricated — any "trust" or "proof" content on future persuasive surfaces must be clearly illustrative or omitted entirely.
- README.md documents a roadmap of unbuilt ideas (social OAuth, a dedicated repo-insights page, a commit-activity chart, Redis caching, transactional email, an admin panel, a rate-limit UI, a webhook log, multi-repo comparison, CI, tests). Treat these as backlog, not shipped capability, unless asked to build them.

## Product Principles

- Every surface should read as a working SaaS, not a mockup — the auth, billing, gating, and export flows must actually function, since end-to-end credibility is the whole point.
- The repo health score is the signature feature. Give it visual weight and clarity wherever repo data appears; don't bury it as a minor stat among raw numbers.
- Never fabricate commercial proof (testimonials, logos, traction figures). The credibility case rests on demonstrated engineering craft, not invented business signals.
- Keep the Free/Pro contrast legible — the tier boundary is a deliberate showcase of the gating mechanism, not something to blur or soften.
