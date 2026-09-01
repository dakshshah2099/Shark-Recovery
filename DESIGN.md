---
name: SharkRecovery
description: Autonomous Razorpay dropout diagnosis & recovery engine
colors:
  canvas-dark: "#09090b"
  surface-dark: "#121215"
  surface-dark-elevated: "#18181b"
  border-dark: "#27272a"
  text-primary-dark: "#fafafa"
  text-secondary-dark: "#a1a1aa"
  text-muted-dark: "#71717a"
  canvas-light: "#fafafa"
  surface-light: "#ffffff"
  border-light: "#e4e4e7"
  text-primary-light: "#09090b"
  text-secondary-light: "#52525b"
  accent-blue: "#2563eb"
  accent-emerald: "#059669"
  accent-amber: "#d97706"
  accent-rose: "#dc2626"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.005em"
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent-blue}"
    textColor: "{colors.text-primary-dark}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  badge-success:
    backgroundColor: "{colors.surface-dark-elevated}"
    textColor: "{colors.accent-emerald}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
---

# Design System: SharkRecovery (Minimalist Precision Enterprise)

## Overview

**Creative North Star: "The Obsidian Ledger"**

SharkRecovery operates as a high-density, precision-engineered financial instrument. The aesthetic eliminates decorative excess in favor of razor-sharp data legibility, monochromatic neutrality, and purposeful chromatic indicators. Designed for operators who value clarity, speed, and deterministic auditability over ornamental fluff.

**Key Characteristics:**
- Strict neutral grayscale canvas with pure zinc boundaries and 1px hairline dividers.
- High-contrast chromatic signals (Emerald, Blue, Amber, Rose) reserved exclusively for live operational state.
- Compact 6px/8px corner radii; zero bulbous cards or soft decorative glow halos.
- Interactive multi-agent step flow visualizing the autonomous reasoning chain in real time.

## Colors

The palette is anchored in deep neutral charcoals and crisp whites, using color strictly for semantic data states.

### Primary
- **Obsidian Dark Surface** (#121215): Primary card and table container surface.
- **Charcoal Dark Elevated** (#18181b): Elevated hover states, modal popovers, and interactive triggers.
- **Hairline Precision Border** (#27272a): 1px structural container boundary.

### Secondary
- **Operational Blue** (#2563eb / #3b82f6): Active agent triage, primary action buttons, and live link triggers.
- **Captured Emerald** (#059669 / #10b981): Successfully recovered payment links and captured revenue.
- **Risk Amber** (#d97706 / #f59e0b): Dynamic incentive discounts and revenue at risk.
- **Dropout Rose** (#dc2626 / #ef4444): Hard payment failures, gate rejections, and bank timeouts.

### Neutral
- **Primary Text** (#fafafa in dark / #09090b in light): High-contrast titles, customer names, and values.
- **Secondary Text** (#a1a1aa in dark / #52525b in light): Descriptive subtitles and explanatory captions.
- **Mono Muted** (#71717a in dark / #71717a in light): Order IDs, timestamps, and payload keys.

### Named Rules
**The 5% Chromatic Rule.** Saturated color must occupy ≤5% of total screen real estate, reserved strictly for live state changes, disposition badges, and actionable primary buttons.

## Typography

**Display & Body Font:** Inter (weights 400, 500, 600, 700)
**Code & Numeric Font:** JetBrains Mono (weights 400, 500, 600)

**Character:** Utilitarian, crisp, geometric neo-grotesque with optimized tabular numerals for financial precision.

### Hierarchy
- **Display** (700, 1.75rem, line-height 1.2): Section titles and KPI aggregates.
- **Headline** (600, 1.25rem, line-height 1.3): Card headers and modal titles.
- **Title** (600, 0.875rem, line-height 1.4): Table column headers and group labels.
- **Body** (400, 0.75rem, line-height 1.5): Descriptions, failure messages, and reasoning summaries.
- **Label** (500, 0.6875rem, JetBrains Mono): Order IDs, transaction codes, and technical telemetry.

## Layout

- Single-column dense container (max-width 1280px) with adaptive spacing (16px–24px padding).
- Collapsible 64px/256px sidebar with instant transition and zero layout shifting.
- Unified 5-view tab switching with instant cache invalidation.

## Elevation & Depth

Flat-by-default. Depth is achieved strictly through tonal background shifting (#09090b -> #121215 -> #18181b) and 1px hairline border contrast (#27272a). Zero drop shadows on static elements.

## Shapes

- Containers and cards: 8px radius (`rounded-lg`).
- Controls, inputs, and buttons: 6px radius (`rounded-md`).
- Badges and status pills: 4px radius (`rounded`).

## Components

### Interactive Multi-Agent Node Flow
- Visual progression pipeline showing live status: Webhook -> Diagnostic Agent -> Strategy Agent -> Link Tool -> Dispatch Tool -> Settlement.
- Expandable nodes displaying LLM latency, token counts, and full JSON payloads.

### Buttons & Inputs
- Primary: Solid #2563eb with crisp white text, 6px radius, hover tone shift.
- Secondary / Ghost: 1px hairline border with #18181b hover fill.
- Inputs: 36px height (h-9), hairline border, focus ring with 1px border shift.

## Do's and Don'ts

### Do:
- **Do** maintain strict WCAG AA contrast (≥4.5:1 for body text, ≥3:1 for large text).
- **Do** format all financial figures in standard Indian numbering (e.g. ₹1,24,500.00).
- **Do** use JetBrains Mono exclusively for order IDs, failure codes, and numeric telemetry.

### Don't:
- **Don't** use decorative gradient text or multi-color card borders.
- **Don't** use bulbous `rounded-2xl` or `rounded-3xl` radii.
- **Don't** hide agent reasoning chains behind opaque uninspectable states.
