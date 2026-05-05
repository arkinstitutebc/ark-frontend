# @ark/design-system

Shared global styles + brand tokens. Theme-aware (light/dark).

## Use

```ts
import "@ark/design-system/globals.css"
```

The CSS is imported once per app via its `+Layout.tsx`.

## Brand (no theme flip)

- Primary: `#193a7a` (Ark Blue)
- Accent: `#c80100` (Ark Red)
- Font: Montserrat (loaded from Google Fonts CDN)

## Semantic tokens

| Token | Light | Dark | Tailwind utilities |
|---|---|---|---|
| `--color-background` | `#ffffff` | `#0b1220` | `bg-background` |
| `--color-foreground` | `#171717` | `#e5e7eb` | `text-foreground` |
| `--color-surface` | `#ffffff` | `#0f172a` | `bg-surface` |
| `--color-surface-muted` | `#f9fafb` | `#1e293b` | `bg-surface-muted` |
| `--color-border` | `#e5e7eb` | `#334155` | `border-border` |
| `--color-muted` | `#6b7280` | `#94a3b8` | `text-muted`, `placeholder:text-muted` |

Use these in components — they flip automatically when `<html data-theme="dark">` is set.

Avoid raw `bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-*`.

## How dark mode works

Token cascade in `:root` (light defaults inside `@theme`) and `:root[data-theme="dark"]` (overrides) means switching `data-theme` on `<html>` re-themes the whole UI without a re-render.

`<ThemeProvider>` from `@ark/ui` writes `data-theme`. The `NO_FOUC_SCRIPT` (also from `@ark/ui`) sets it before first paint via Vike's `+Head.tsx`.

## Edit

`src/globals.css` (Tailwind v4, CSS-first config — `@theme` block + `:root[data-theme]` overrides).
