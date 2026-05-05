# @ark/design-system

Shared design tokens + global styles. Imported once per app.

## What's here

- `src/globals.css` — Tailwind v4 theme + brand tokens + Montserrat font

## Usage

In each app's `+Layout.tsx`:

```ts
import "@ark/design-system/globals.css"
```

That's it. The CSS imports `tailwindcss`, declares `@source` directives for the apps' file globs, and defines the brand `@theme` block.

## Brand tokens

- **Primary**: `#193a7a` (Ark Blue)
- **Accent**: `#c80100` (Ark Red)
- **Font**: Montserrat (loaded from Google Fonts in globals.css)

## Editing

Change the CSS in `src/globals.css` once → all 7 apps inherit on next bundle.

Tailwind v4 uses CSS-first config (no `tailwind.config.js`). Custom colors and fonts are declared inside the `@theme` block.
