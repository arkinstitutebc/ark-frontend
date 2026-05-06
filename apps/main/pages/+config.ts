import type { Config } from "vike/types"
import vikeSolid from "vike-solid/config"

export default {
  extends: [vikeSolid],
  ssr: true,
  server: true,
  // Global defaults (can be overridden per page)
  title: "Ark Institute Portal",
  description:
    "Ark Institute ERP Portal - Access training, procurement, inventory, finance, HR, and billing modules.",
} satisfies Config
