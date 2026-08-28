---
name: GitHub Insights
description: A lab-report instrument for reading a GitHub profile's health
colors:
  paper: "#f5f6f2"
  report-sheet: "#ffffff"
  ink: "#14181b"
  ink-muted: "#5b6469"
  hairline: "#d9dcd6"
  stamp-red: "#b3241d"
  stamp-red-pressed: "#8f1b16"
  on-accent: "#ffffff"
  verified-green: "#2f6b4f"
  verified-green-tint: "#e7f0ea"
typography:
  body:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  title:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  label:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.1em"
  micro:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.1em"
  data:
    fontFamily: "Courier Prime, ui-monospace, SFMono-Regular, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.01em"
    fontFeature: "tabular-nums"
rounded:
  none: "0px"
  sm: "3px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.stamp-red}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.stamp-red-pressed}"
    textColor: "{colors.on-accent}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
---

# Design System: GitHub Insights

## Overview

**Creative North Star: "The Lab Report"**

GitHub Insights reads a profile the way a clinic reads a patient: identity first, then a panel of measured values against stated reference ranges, then a plain total reading. The system rejects the category default — indigo buttons, rounded card grids, a soft-shadowed dashboard — in favor of a printed-document register: hairline rules instead of shadows, tabular monospace figures instead of decorative stat tiles. Nothing here is soft. Corners are near-sharp, borders are 1px, and color is rationed to one accent, used only where the visitor is meant to act — never to grade a reading as good or bad.

Two registers exist by design: a light "paper" mode (a report sheet on a lit desk) and a dark "negative" mode (the same report read on a light table in a dark room) — dark mode is not an inverted tint of light mode, it swaps to its own near-black ground and lifted-surface pairing.

Confirmed rejections: no rounded-full pill badges, no soft drop-shadow card grid, no gradient accents, no unicode glyph icons standing in for real iconography, no color-coded grading of a measured value (a low reading is a fact to report, not a fault to flag), no stamp/verdict framing for the total score — it is a plain reading, not a judgment.

**Key Characteristics:**
- Paper-and-ink palette: one accent (stamp red), reserved for actions and locked-content markers — never for grading a reading.
- Every number is a measurement: tabular monospace figures throughout, never a default UI numeral.
- Depth comes from hairline rules and 1px borders, not shadows.
- The total health score is a plain bordered readout (`HealthBadge`) — a measurement alongside the others, not a verdict stamped over them.

## Colors

A near-monochrome paper-and-ink field carries almost the whole system; the one accent is rationed to actions, never to grading a reading.

### Primary
- **Stamp Red** (`#b3241d`; dark register `#cb3a2e`): the system's only expressive color. Carries primary buttons, active form-field underlines, the sidebar's active-route rule, and locked-content markers (`SealedPanel`). Never fills a large area, and never colors a measured value or the total score — those are informational, not graded. It appears as ink (text, thin fills, 1px rules), never as a background field.
- **Stamp Red — Pressed** (`#8f1b16`; dark register `#e1493c`): hover/active state for primary actions only.

### Neutral
- **Ledger Paper** (`#f5f6f2`; dark register, as its own near-black ground, `#0d0f10`): the page ground.
- **Report Sheet White** (`#ffffff`; dark register `#16191b`): the surface every `ReportCard`, form panel, and shell region sits on — one step lighter than the ground so cards read as sheets lifted off the desk.
- **Near-Black Ink** (`#14181b`; dark register `#ecefec`): primary text.
- **Muted Slate** (`#5b6469`; dark register `#9aa3a0`): secondary text, labels, placeholders. Passes ≥4.5:1 against both ground and surface in both registers — never dim it further with an opacity modifier.
- **Hairline Rule** (`#d9dcd6`; dark register `#2a2f30`): every 1px border, divider, bracket end-cap, and scrollbar track.

### Signal (feedback, not grading)
- **Verified Green** (`#2f6b4f`; dark register `#5cb68b`): confirmation text — a successful action (e.g. "Password updated successfully"). Never used on a measured value or the health score; those stay achromatic even when the reading is high.
- **Verified Green — Tint** (`#e7f0ea`; dark register `#12241c`): background for success message boxes only.

### Named Rules
**The Rationed Ink Rule.** Stamp Red is the only saturated color in the system, and it marks an action or a locked state — never a reading. It never becomes a background fill larger than a button; everywhere else it appears as text or a 1px rule.

**The Ungraded Reading Rule.** A measured value's color never depends on whether the number is high or low. `MeasuredValue`'s fill and tick are always `ink-muted`/`ink`; `HealthBadge`'s score and stage word are always `ink`. A low reading is a fact the report states, not a fault it flags.

**The Negative Register Rule.** Dark mode is a second ground truth, not an inverted light theme: `--color-ground` and `--color-surface` are independently defined near-black values, and the accent shifts brighter (`#cb3a2e` → hover `#e1493c`) to stay legible against them rather than reusing the light-mode hex.

## Typography

**Body/Label Font:** Public Sans (with ui-sans-serif, system-ui, sans-serif)
**Data Font:** Courier Prime (with ui-monospace, SFMono-Regular, monospace)

**Character:** Public Sans is the plain, official-document sans — it carries every heading, label, and paragraph and never turns decorative. Courier Prime is reserved entirely for measurement: every score, count, percentage, and stat in the product renders in it, tabular-figured, so numbers read as instrument output rather than incidental UI text. No third face exists; there is no separate "display" font.

### Hierarchy
- **Title** (Public Sans, 600, 18–20px): `ReportCard` headers, page `<h1>`s, the login/signup masthead.
- **Body** (Public Sans, 400, 14px): descriptions, prose, message-box text.
- **Label** (Public Sans, 600, 11px, tracking 0.1em, uppercase): field labels.
- **Micro** (Public Sans, 600, 10px, tracking 0.1–0.2em, uppercase): the smallest tracked-caps step — masthead taglines (`Repository diagnostics`, `Intake — Sign in`), `dt` stat labels (Repos/Followers/Following), `HealthBadge`'s stage word, the billing "Active" badge, `AuthFrame`'s rotated edge label.
- **Data** (Courier Prime, 400, 12–14px, tabular-nums): every measured figure — health scores, repo stats, language percentages, form-field input text, `HealthBadge`'s score.

### Named Rules
**The Instrument-Numeral Rule.** Any number a visitor might compare against another number — a score, a count, a percentage — renders in Courier Prime with tabular figures. A number that appears only as prose (a sentence saying "three repos") does not need this treatment; a number standing alone as data always does.

### Print Report Adaptation
The Pro PDF export (`api/src/utils/reportTemplate.ts`) renders the same ramp compressed for A4 page density — a print medium fits more per page than a scrolling viewport, so its steps run 1–2px under their screen counterparts rather than reusing the exact pixel values: Body compresses to 12px, Data (for a standalone stat like a follower count) to 13px, Micro's smallest caption to 9px. `HealthBadge`'s score is the one exception in the other direction, set at 20px in print (vs. Data's normal 14px ceiling) since the badge itself renders smaller on the page than on screen and needs the bump to stay legible as the report's one emphasized figure. These four values are print-only; the screen app always uses the exact Hierarchy values above.

## Layout

Content columns are narrow and centered: `max-w-3xl` for the dashboard, `max-w-xl` for billing/settings, `max-w-sm` for the login/signup card. Vertical rhythm between sections is a flat 24px (`space-y-6`); inside a `ReportCard`, header and body padding is 14–16px vertical, 20px horizontal.

The authenticated shell is a fixed 224px sidebar (desktop, `md` and up) plus a fluid content column; below `md` the sidebar hides entirely and a horizontal tab strip (`MobileNav`) takes its place directly under the topbar. The unauthenticated shell (`AuthFrame`) is different in kind: a full-viewport frame with a faint repeating-hairline ground texture and four corner registration marks, centering a single intake card — the page itself carries the paper world, not just the card floating on a blank field.

## Elevation & Depth

The system is flat by design: separation comes from a 1px `rule`-colored border and a bare 24px page rhythm, not from shadow. The one shadow in the system is a near-invisible lift (`0 1px 2px rgba(0,0,0,0.05)`) applied to every `ReportCard` and the auth card — just enough to read as a sheet resting on the desk, never a soft SaaS drop-shadow.

### Named Rules
**The Paper-Not-Shadow Rule.** Depth is a hairline border plus a 1px shadow at most. A card, panel, or overlay that needs more separation than that gets a rule between it and its neighbor, never a heavier shadow.

## Shapes

Corners are near-sharp: `ReportCard` uses a 3px radius (`rounded-[3px]`), just enough to soften anti-aliasing; buttons, inputs, and message boxes use no radius at all. Inputs (`FormField`) have no border box at all — they are a bottom 1px rule only, filled in like a blank on a paper form, not a bordered box. Avatars and the health-score readout (`HealthBadge`) render as bordered squares.

### Named Rules
**The All-Rectilinear Rule.** Nothing in the system is circular. An earlier version stamped the total score in a rotated circular ring; that read as a verdict rather than a measurement and was replaced with a plain bordered square (`HealthBadge`) at the same visual weight. Any future signature moment stays inside the system's own rectilinear, ruled-paper vocabulary rather than reaching for a circular or hand-pressed device.

## Components

### Buttons
- **Shape:** no radius (`rounded.none`).
- **Primary:** Stamp Red background, white text, 11px uppercase label type at 0.08em tracking, 10–16px padding. Used for the single primary action per screen (Sign in, Run, Upgrade to Pro, Submit).
- **Secondary:** transparent background, 1px `hairline` border, ink text; border brightens to full ink on hover. Used for lower-emphasis actions (Manage subscription, Log out, Export — PDF once unlocked).

### Cards — `ReportCard`
- **Corner Style:** 3px radius.
- **Background:** Report Sheet White surface, `hairline` 1px border.
- **Shadow Strategy:** the one near-invisible lift described in Elevation & Depth.
- **Structure:** a ruled header (title left, monospace meta right) over a body, with an optional ruled footer. Every data-bearing surface in the product — profile summary, language breakdown, each repo, the billing subscription panel, settings — is a `ReportCard`; it is the system's one container.

### Inputs — `FormField`
- **Style:** no box, no radius; a 1px `hairline` bottom rule only, transparent background, Courier Prime text.
- **Focus:** the bottom rule turns Stamp Red; the browser's native focus-visible outline (also themed to Stamp Red, 2px, 2px offset) provides the visible focus ring.
- **Placeholder:** `ink-muted` at full opacity — never dimmed further; dimming it below its own default breaks the 4.5:1 contrast floor.

### Navigation
- **Sidebar** (desktop, `md`+): ruled list of routes, `ink-muted` at rest, bold `ink` when active, plus a 1px Stamp Red rule on the active item's left edge (1px exactly — a colored border above 1px is never used anywhere in the system).
- **MobileNav** (below `md`): a horizontal, evenly divided tab strip; active state is bold text only, no color.
- **Topbar:** ruled bottom border, right-aligned theme toggle (a two-position "L / D" instrument switch, not a sun/moon icon), user email in Courier Prime, and a secondary-button-styled log-out control.

### Signature components

**`MeasuredValue`** — one row of a metric panel: a label, a reference-range bracket (1px end-caps and baseline, a solid fill bar to the current reading, a taller tick at the reading itself), and the value/max pair in Courier Prime. Fill and tick are always `ink-muted`/`ink`, regardless of where the reading falls in its range — informational, never graded.

**`HealthBadge`** — the total health score: a plain bordered square (`hairline` 1px border, no radius), holding the score (Courier Prime, bold) and a neutral stage word (Mature / Established / Developing / Early stage) in 10px tracked caps. Always `ink` — the badge reports a number, it does not pass a verdict on it.

**`SealedPanel`** — what a locked (free-tier) metric panel shows instead of a blur-and-CTA: redaction bars at fixed widths, with a rotated, Stamp-Red-bordered "Sealed — Unlock Pro" label centered over them.

**`AuthFrame`** — the page-level frame for login/signup: four corner printer's registration marks (crosshair-in-circle, Stamp Red at 60% opacity), a faint repeating-hairline ground texture, and a vertical rotated "Form GH-01 · Intake" edge label.

## Do's and Don'ts

### Do:
- **Do** render every measured figure — scores, counts, percentages — in Courier Prime with tabular figures (`{typography.data}`).
- **Do** keep Stamp Red rationed to actions and locked-content markers, as text, thin fills, or single-element accents; never a large background fill and never a grade on a reading.
- **Do** use a 1px `hairline` rule for separation and state (active nav, dividers); a colored border above 1px is a violation, not a stronger version of the same idea.
- **Do** give dark mode its own near-black ground and lifted surface (`#0d0f10` / `#16191b`), not an inverted light palette.
- **Do** show locked/gated content as a sealed or redacted document (`SealedPanel`), never a generic blur-plus-CTA.

### Don't:
- **Don't** use `rounded-full` or soft `rounded-xl`/`rounded-2xl` cards — the system's one radius is 3px, reserved for `ReportCard`.
- **Don't** use a unicode glyph (★, ⑂, etc.) as an icon. Draw icons as SVG, or — as the system currently prefers — label the figure in text (`STARS 128`) instead of reaching for an icon at all.
- **Don't** add a kicker or eyebrow label above a heading. The system's small tracked-caps labels belong to record headers and form fields, never as decoration above a title.
- **Don't** color a measured value or the total score by whether it's high or low — readings stay `ink`/`ink-muted` regardless of magnitude (The Ungraded Reading Rule).
- **Don't** frame the total score as a verdict (a stamp, a pass/fail badge, a colored ring) — it is a plain reading, same weight as any other measurement.
- **Don't** reduce `ink-muted` with an opacity modifier for placeholder or secondary text; it is already tuned to the contrast floor at full opacity.
