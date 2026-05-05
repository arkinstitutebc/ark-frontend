import type { Config } from "vike/types"
import vikeSolid from "vike-solid/config"

export default {
  extends: [vikeSolid],
  ssr: true,
  title: "Training | Ark Institute",
  description: "Manage training batches and student enrollments",
} satisfies Config
