import type { JSX } from "solid-js"
import "@/styles/globals.css"

export function Layout(props: { children: JSX.Element }) {
  return <>{props.children}</>
}
