import { NO_FOUC_SCRIPT } from "@ark/ui"

export function Head() {
  return (
    <>
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
      <meta name="theme-color" content="#193a7a" />
      <script innerHTML={NO_FOUC_SCRIPT} />
    </>
  )
}
