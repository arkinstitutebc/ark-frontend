import type { Config } from "vike/types"
import vikeSolid from "vike-solid/config"

export default {
  extends: [vikeSolid],
  ssr: true,
  server: true,
  // Expose the SSR-resolved session so AuthGate renders without waiting on /me.
  passToClient: ["user", "authResolved"],
  title: "Procurement Portal | Ark Institute",
  description: "Purchase requests, approvals, and order tracking",
} satisfies Config
