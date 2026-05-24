export const API_URL = process.env.VITE_API_URL || "http://localhost:4000"

export const PORTAL_URLS = {
  main: "http://localhost:3000",
  training: "http://localhost:3001",
  procurement: "http://localhost:3002",
  inventory: "http://localhost:3003",
  finance: "http://localhost:3004",
  billing: "http://localhost:3005",
  hr: "http://localhost:3006",
} as const

export type PortalKey = keyof typeof PORTAL_URLS
