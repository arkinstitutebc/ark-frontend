import path from "node:path"
import vike from "vike/plugin"
import vikeSolid from "vike-solid/vite"
import type { UserConfig } from "vite"

export default {
  plugins: [vike(), vikeSolid()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  define: {
    global: "globalThis",
  },
  server: {
    port: 3000,
  },
} satisfies UserConfig
