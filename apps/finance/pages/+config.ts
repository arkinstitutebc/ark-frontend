import type { Config } from "vike/types"
import vikeSolid from "vike-solid/config"

export default {
  extends: [vikeSolid],
  ssr: true,
  server: true,
  // Expose the SSR-resolved session so AuthGate renders without waiting on /me.
  passToClient: ["user", "authResolved"],
  title: "Finance Portal | Ark Institute",
  description: "Two-bank tracking and P&L management",
} satisfies Config
