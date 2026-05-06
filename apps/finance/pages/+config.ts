import type { Config } from "vike/types"
import vikeSolid from "vike-solid/config"

export default {
  extends: [vikeSolid],
  ssr: true,
  server: true,
  title: "Finance Portal | Ark Institute",
  description: "Two-bank tracking and P&L management",
} satisfies Config
