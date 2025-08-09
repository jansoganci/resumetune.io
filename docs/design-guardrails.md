# Design Guardrails (extracted from current code)

This document is derived from the existing UI. Follow these rules when adding new UI so the product remains consistent, simple, and fast.

## Overview
- Source files scanned: `src/App.tsx`, `src/components/*`, `src/index.css`, `tailwind.config.js` (default scale assumed).
- Primary style approach: Tailwind utilities with neutral (gray), blue (brand), amber/green/red status blocks, rounded corners, light shadows, constrained containers.

## Color Tokens (Tailwind → Token)
- Background (app): `bg-gray-50` → `--color-bg: #f9fafb` (Tailwind gray-50)
- Surface (cards): `bg-white` → `--color-surface: #ffffff`
- Text primary: `text-gray-900` → `--color-text-primary: #111827`
- Text secondary: `text-gray-600` → `--color-text-secondary: #4b5563`
- Brand (primary): `bg-blue-600`, `hover:bg-blue-700`, `text-blue-600/700/800/900` →
  - `--color-brand: #2563eb` (blue-600)
  - `--color-brand-hover: #1d4ed8` (blue-700)
  - `--color-brand-ink: #1e40af` (blue-800) / `#1e3a8a` (blue-900)
- Accent (amber info): `bg-amber-50`, `border-amber-200`, `text-amber-800`, `text-amber-900` →
  - `--color-accent-amber-50: #fffbeb`
  - `--color-accent-amber-200: #fde68a`
  - `--color-accent-amber-800: #92400e`
  - `--color-accent-amber-900: #78350f`
- Success (green): `bg-green-50`, `border-green-200`, `text-green-600/700/800` →
  - `--color-success-50: #ecfdf5`
  - `--color-success-200: #a7f3d0`
  - `--color-success-600: #16a34a`
  - `--color-success-700: #15803d`
  - `--color-success-800: #166534`
- Danger (red): `bg-red-50`, `border-red-200`, `text-red-600/700/800` →
  - `--color-danger-50: #fef2f2`
  - `--color-danger-200: #fecaca`
  - `--color-danger-600: #dc2626`
  - `--color-danger-700: #b91c1c`
  - `--color-danger-800: #991b1b`
- Info (blue tints): `bg-blue-50`, `border-blue-200`, `text-blue-800/900` →
  - `--color-info-50: #eff6ff`
  - `--color-info-200: #bfdbfe`
  - `--color-info-800: #1e40af`
  - `--color-info-900: #1e3a8a`
- Border neutral: `border-gray-200/300` → `--color-border: #e5e7eb` (gray-200), `--color-border-strong: #d1d5db` (gray-300)
- Chat bubbles: user `bg-blue-600 text-white`, assistant `bg-gray-100 text-gray-800` → use brand + neutral tokens.

References: `App.tsx` (header, panels, buttons), `ChatInterface.tsx`, `ContactInfoInput.tsx`, `FileUpload.tsx`, `ProfileInput.tsx`, `MatchResult.tsx`.

## Typography
- Base font: Tailwind default sans → `--font-sans: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Helvetica, Arial, Noto Sans`.
- Weights: regular (400), medium (500), semibold (600), bold (700).
- Heading scale observed:
  - H1: `text-2xl font-bold` (≈ 1.5rem / 24px)
  - H3: `text-lg font-semibold` (≈ 1.125rem / 18px)
  - Small text: `text-xs` (≈ 0.75rem / 12px), body: default (1rem / 16px)
- Usage:
  - Page title (header): H1.
  - Section titles: H3 semibold.
  - Captions/hints: `text-xs` with secondary color.

## Spacing Scale (Tailwind default assumed)
- Used utilities: `px-4 sm:px-6 lg:px-8`, `py-4/6/8`, `p-6`, `space-y-2/3/4/6`, `gap-2/3/4`.
- Tokenization (px):
  - `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-6: 24px`, `--space-8: 32px`
- Layout examples:
  - Header container: `py-4` + `px-4 sm:px-6 lg:px-8`.
  - Card padding: `p-6`.
  - Main stack: `space-y-6`.

## Radius & Shadow
- Radius observed: `rounded`, `rounded-md`, `rounded-lg`.
  - Tokens: `--radius-sm: 4px`, `--radius-md: 6px`, `--radius-lg: 8px`
- Shadow observed: `shadow-sm` on cards.
  - Token: `--shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05)`

## Layout Primitives
- Containers: `max-w-4xl`, `max-w-7xl`.
  - Tokens: `--container-4xl: 56rem` (896px), `--container-7xl: 80rem` (1280px)
- Grid & gap: forms use `grid grid-cols-1 md:grid-cols-2 gap-3/4`.
- Responsive paddings: `px-4 sm:px-6 lg:px-8` (page), `p-6` (card), `py-8` (main).

## Components Mapping (style patterns)
- ProfileInput: `border border-gray-300 rounded-lg`, form inputs `focus:ring-2 focus:ring-blue-500`, actions `bg-blue-600 hover:bg-blue-700` (tokens: border, brand, radius-lg).
- ContactInfoInput: edit panel `bg-gray-50 border-gray-300 rounded-lg`, success `bg-green-50 border-green-200` (tokens: surface, success, radius-lg).
- FileUpload: info blocks `bg-blue-50 / bg-amber-50` with `border-*-200`, buttons `rounded-md` toggles; dropzone `border-2 border-dashed rounded-lg`.
- JobDescriptionInput: textarea `border-gray-300 rounded-lg focus:ring-blue-500`.
- MatchResult: success/error panels `bg-green-50 / bg-red-50` with `border-*-200`, headings `text-*-800`.
- ChatInterface: container `border border-gray-300 rounded-lg bg-white`, header `bg-gray-50 border-b`, user bubble `bg-blue-600 text-white`, assistant bubble `bg-gray-100 text-gray-800`, export chips `bg-red-100 / bg-blue-100`.
- LanguageSwitcher: chip `bg-gray-100 text-gray-700 border-gray-200 rounded-full`, menu items selected `bg-blue-50 text-blue-700`.
- Toast (assumed): minimal, follows brand/neutral tokens.

## Do / Don’t Guardrails
- Buttons:
  - Do: use `bg-blue-600 text-white rounded-lg` with `hover:bg-blue-700`; disabled state `disabled:bg-gray-400 disabled:cursor-not-allowed`.
  - Don’t: introduce new random brand colors; keep interactive focus rings `focus:ring-blue-500`.
- Info/Alert panels:
  - Do: use blue/amber/green/red families with 50/100/200 backgrounds & borders; headings at 800/900 ink tones.
  - Don’t: mix multiple color families in one panel.
- Headings & body:
  - Do: H1 `text-2xl font-bold`; H3 `text-lg font-semibold`; body default; captions `text-xs`.
  - Don’t: jump outside scale without reason.
- Layout:
  - Do: wrap pages with `max-w-4xl/7xl` and responsive paddings; stack content with `space-y-*`.
  - Don’t: create full‑bleed blocks without clear reason.

## References
- `src/App.tsx`: header (bg-white shadow-sm border-b), primary button (bg-blue-600 → hover:bg-blue-700), info panels (blue/amber/green), containers (max-w-4xl/7xl), spacings.
- `src/components/ChatInterface.tsx`: chat container, bubbles, chips, borders.
- `src/components/ContactInfoInput.tsx`: edit/success states, inputs, grids.
- `src/components/FileUpload.tsx`: toggles, info blocks, dropzone.
- `src/components/JobDescriptionInput.tsx`: textarea, labels.
- `src/components/MatchResult.tsx`: success/error cards.
- `src/components/ProfileInput.tsx`: inputs, actions.
- `src/components/LanguageSwitcher.tsx`: chip + menu.

> Assumptions: Tailwind config is default (`tailwind.config.js` shows no custom theme). Token values map to Tailwind’s default scales.

