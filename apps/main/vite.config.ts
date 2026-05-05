import path from "node:path"
import vike from "vike/plugin"
import vikeSolid from "vike-solid/vite"
import type { UserConfig } from "vite"
import vercel from "vite-plugin-vercel"

export default {
  plugins: [vike(), vikeSolid(), vercel()],
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
