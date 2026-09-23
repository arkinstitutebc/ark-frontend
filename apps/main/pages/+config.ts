import type { Config } from "vike/types"
import vikeSolid from "vike-solid/config"

export default {
  extends: [vikeSolid],
  ssr: true,
  server: true,
  // Expose the SSR-resolved session to the client.
  passToClient: ["user", "authResolved"],
  // Global defaults (can be overridden per page)
  title: "Ark Institute Portal",
  description:
    "Ark Institute ERP Portal - Access training, procurement, inventory, finance, HR, and billing modules.",
} satisfies Config
