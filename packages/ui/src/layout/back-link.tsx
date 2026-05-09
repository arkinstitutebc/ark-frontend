import { ArrowLeft } from "lucide-solid"
import type { JSX } from "solid-js"

export interface BackLinkProps {
  /** Where to link. Use this OR `onClick`. */
  href?: string
  /** Programmatic handler (e.g. `() => navigate(...)`). When set, overrides href. */
  onClick?: (e: MouseEvent) => void
  /**
   * Visual variant.
   *  - `inline` (default): small chip with text label — e.g. "Back to Orders"
   *  - `icon`: icon-only round button, used next to page titles
   */
  variant?: "inline" | "icon"
  /** Aria label — required when `variant="icon"`. */
  label?: string
  children?: JSX.Element
  class?: string
}

/**
 * Standard back-button used at the top of detail / create / edit pages and in
 * the main portal header. Sleeker than the bare-link version it replaces:
 * subtle pill background on hover, arrow nudges left on hover, primary tint
 * for visibility.
 */
export function BackLink(props: BackLinkProps) {
  const variant = () => props.variant ?? "inline"

  if (variant() === "icon") {
    const label = props.label ?? "Go back"
    const iconClass = `group inline-flex items-center justify-center w-9 h-9 rounded-full text-foreground/80 bg-surface-muted/70 border border-border hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${props.class ?? ""}`
    const inner = <ArrowLeft class="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
    if (props.href && !props.onClick) {
      return (
        <a href={props.href} aria-label={label} title={label} class={iconClass}>
          {inner}
        </a>
      )
    }
    return (
      <button
        type="button"
        onClick={props.onClick}
        aria-label={label}
        title={label}
        class={iconClass}
      >
        {inner}
      </button>
    )
  }

  // Visible pill at rest — light surface bg + soft border so the user can find
  // it without having to hover. Lights up primary on hover.
  const inlineClass = `group inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground/80 bg-surface-muted/70 border border-border hover:text-primary hover:bg-primary/10 hover:border-primary/30 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${props.class ?? ""}`

  if (props.onClick && !props.href) {
    return (
      <button type="button" onClick={props.onClick} class={inlineClass}>
        <ArrowLeft class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        <span>{props.children ?? "Back"}</span>
      </button>
    )
  }

  return (
    <a href={props.href ?? "#"} onClick={props.onClick} class={inlineClass}>
      <ArrowLeft class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
      <span>{props.children ?? "Back"}</span>
    </a>
  )
}
