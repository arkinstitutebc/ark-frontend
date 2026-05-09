import path from "node:path"
import vike from "vike/plugin"
import vikeSolid from "vike-solid/vite"
import type { UserConfig } from "vite"
import pkg from "../../package.json" with { type: "json" }

export default {
  plugins: [vike(), vikeSolid()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@data": path.resolve(__dirname, "data"),
    },
  },
  define: {
    global: "globalThis",
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 3006,
  },
} satisfies UserConfig
