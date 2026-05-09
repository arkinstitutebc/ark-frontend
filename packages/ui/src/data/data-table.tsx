import type { JSX } from "solid-js"

export interface DataTableProps {
  children: JSX.Element
  /** Extra classes appended to the outer scroll wrapper. */
  class?: string
}

/**
 * Table chrome — handles horizontal overflow and the consistent surface
 * styling that every list page wants. Pair with `<THead>` + `<Th>` for the
 * header row and `<Tr>` (or a plain `<tr>`) inside `<tbody>` for body rows.
 *
 * ```tsx
 * <DataTable>
 *   <THead>
 *     <Th>Description</Th>
 *     <Th align="right">Amount</Th>
 *   </THead>
 *   <tbody>
 *     <For each={rows}>{row => <Tr>...cells...</Tr>}</For>
 *   </tbody>
 * </DataTable>
 * ```
 */
export function DataTable(props: DataTableProps) {
  return (
    <div class={`overflow-x-auto ${props.class ?? ""}`}>
      <table class="w-full">{props.children}</table>
    </div>
  )
}

export interface THeadProps {
  children: JSX.Element
}

/** Renders the standard `<thead><tr>...children...</tr></thead>` shell. */
export function THead(props: THeadProps) {
  return (
    <thead class="bg-surface-muted border-b border-border">
      <tr>{props.children}</tr>
    </thead>
  )
}

export interface ThProps {
  children: JSX.Element
  /** Text alignment. Defaults to `"left"`. */
  align?: "left" | "right" | "center"
  /**
   * Vertical padding for the header cell. Match the body row's padding so
   * head + body line up.
   *  - `default` → `py-4 px-6` (most list pages)
   *  - `dense`   → `py-3 px-6` (data-heavy pages where row density matters)
   *  - `compact` → `py-2 px-3` (modal mini-tables)
   */
  size?: "default" | "dense" | "compact"
  /** Pass-through extra classes (rarely needed). */
  class?: string
  /** Optional column span. */
  colSpan?: number
}

const ALIGN: Record<NonNullable<ThProps["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
}

const PADDING: Record<NonNullable<ThProps["size"]>, string> = {
  default: "py-4 px-6",
  dense: "py-3 px-6",
  compact: "py-2 px-3",
}

/** Standard column header cell. */
export function Th(props: ThProps) {
  const align = () => ALIGN[props.align ?? "left"]
  const padding = () => PADDING[props.size ?? "default"]
  return (
    <th
      colSpan={props.colSpan}
      class={`${padding()} ${align()} text-xs font-semibold text-muted uppercase tracking-wider ${props.class ?? ""}`}
    >
      {props.children}
    </th>
  )
}

export interface TrProps {
  children: JSX.Element
  /** Show hover-highlight (defaults to `true`). Set `false` for static rows. */
  hover?: boolean
  /** Click handler — when set, the row gets a pointer cursor. */
  onClick?: () => void
  class?: string
}

/** Standard data row — handles the divider + optional hover highlight. */
export function Tr(props: TrProps) {
  const hover = () => props.hover !== false
  return (
    <tr
      onClick={props.onClick}
      class={`border-t border-border ${
        hover() ? "hover:bg-surface-muted transition-colors" : ""
      } ${props.onClick ? "cursor-pointer" : ""} ${props.class ?? ""}`}
    >
      {props.children}
    </tr>
  )
}
