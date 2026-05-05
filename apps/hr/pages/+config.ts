import type { Config } from "vike/types"
import vikeSolid from "vike-solid/config"

export default {
  extends: [vikeSolid],
  ssr: true,
  title: "HR Portal | Ark Institute",
  description: "Biometric sync and payroll management",
} satisfies Config
