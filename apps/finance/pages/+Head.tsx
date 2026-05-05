import { NO_FOUC_SCRIPT } from "@ark/ui"

export default function Head() {
  return (
    <>
      <title>Finance Portal | Ark Institute</title>
      <script innerHTML={NO_FOUC_SCRIPT} />
    </>
  )
}
