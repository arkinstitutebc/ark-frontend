import type { Config } from "vike/types"
import vikeSolid from "vike-solid/config"

export default {
  extends: [vikeSolid],
  ssr: true,
  server: true,
  title: "Billing Portal | Ark Institute",
  description: "TESDA billing and AR tracking",
} satisfies Config
