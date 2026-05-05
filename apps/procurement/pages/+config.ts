import type { Config } from "vike/types"
import vikeSolid from "vike-solid/config"

export default {
  extends: [vikeSolid],
  ssr: true,
  title: "Procurement Portal | Ark Institute",
  description: "Purchase requests, approvals, and order tracking",
} satisfies Config
