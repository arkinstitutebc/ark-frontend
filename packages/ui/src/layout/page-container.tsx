import type { JSX } from "solid-js"

interface PageContainerProps {
  children: JSX.Element
  /** Tailwind max-width utility. Default `max-w-6xl`. */
  maxWidth?: string
  /** Optional override for the outer wrapper class (defaults to standard padding). */
  class?: string
}

/**
 * Standard page wrapper: padded outer (`px-6 sm:px-8 lg:px-12 py-8`) with a
 * centered constrained-width inner. Replaces the duplicated structure that
 * existed in 30+ `+Page.tsx` files.
 */
export function PageContainer(props: PageContainerProps) {
  return (
    <div class={props.class ?? "px-6 sm:px-8 lg:px-12 py-8"}>
      <div class={`${props.maxWidth ?? "max-w-6xl"} mx-auto`}>{props.children}</div>
    </div>
  )
}
