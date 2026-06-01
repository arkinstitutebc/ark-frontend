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

export interface ScrollableDataTableProps extends DataTableProps {
  /** Max-height class for the scroll area. Defaults to a settings-friendly viewport cap. */
  maxHeightClass?: string
}

/**
 * DataTable variant for dense admin/settings lists that need vertical scrolling
 * with visible column headers.
 */
export function ScrollableDataTable(props: ScrollableDataTableProps) {
  return (
    <DataTable
      class={`border border-border rounded-lg ${
        props.maxHeightClass ?? "max-h-[min(520px,calc(100vh-20rem))]"
      } overflow-auto [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-surface-muted ${
        props.class ?? ""
      }`}
    >
      {props.children}
    </DataTable>
  )
}

export interface THeadProps {
  children: JSX.Element
}

/** Renders the standard `<thead><tr>...children...</tr></thead>` shell. */
export function THead(props: THeadProps) {
  return (
    <thead class="sticky top-0 z-10 bg-surface-muted border-b border-border">
      <tr>{props.children}</tr>
    </thead>
  )
}

export interface ThProps {
  children: JSX.Element
  /** Text alignment. Defaults to `"left"`. */
  align?: "left" | "right" | "center"
  /** Sort state for accessible sortable headers. */
  ariaSort?: "ascending" | "descending" | "none"
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
      aria-sort={props.ariaSort}
      class={`${padding()} ${align()} text-xs font-semibold text-muted uppercase tracking-wider ${props.class ?? ""}`}
    >
      {props.children}
    </th>
  )
}

export interface SortableThProps {
  label: string
  active: boolean
  dir: "asc" | "desc"
  onClick: () => void
  align?: "left" | "right" | "center"
  size?: "default" | "dense" | "compact"
  class?: string
}

/** Sortable table header with consistent affordance + aria-sort wiring. */
export function SortableTh(props: SortableThProps) {
  const ariaSort = () =>
    props.active ? (props.dir === "asc" ? "ascending" : "descending") : "none"
  const justify = () => {
    if (props.align === "right") return "justify-end"
    if (props.align === "center") return "justify-center"
    return "justify-start"
  }
  const indicator = () => {
    if (!props.active) return "↕"
    return props.dir === "asc" ? "▲" : "▼"
  }

  return (
    <Th
      align={props.align}
      ariaSort={ariaSort()}
      size={props.size}
      class={`${props.class ?? ""} sticky top-0 z-10 bg-surface-muted`}
    >
      <button
        type="button"
        onClick={props.onClick}
        class={`group inline-flex w-full items-center gap-1.5 ${justify()} transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
        aria-label={`Sort by ${props.label}`}
      >
        <span>{props.label}</span>
        <span
          aria-hidden="true"
          class={`text-[10px] transition-colors ${
            props.active ? "text-foreground" : "text-muted/60 group-hover:text-muted"
          }`}
        >
          {indicator()}
        </span>
      </button>
    </Th>
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
