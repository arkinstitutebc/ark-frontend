import type { Config } from "vike/types"
import vikeSolid from "vike-solid/config"

export default {
  extends: [vikeSolid],
  ssr: true,
  title: "Inventory Portal | Ark Institute",
  description: "Stock tracking and receiving",
} satisfies Config
