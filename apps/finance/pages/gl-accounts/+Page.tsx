import { onMount } from "solid-js"
import { navigate } from "vike/client/router"

export default function Page() {
  onMount(() => {
    void navigate("/settings")
  })

  return null
}
