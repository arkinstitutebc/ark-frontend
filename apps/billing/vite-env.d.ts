/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_API_URL: string
  VITE_MAIN_PORTAL_URL: string
  VITE_TRAINING_PORTAL_URL: string
  VITE_PROCUREMENT_PORTAL_URL: string
  VITE_INVENTORY_PORTAL_URL: string
  VITE_FINANCE_PORTAL_URL: string
  VITE_BILLING_PORTAL_URL: string
  VITE_HR_PORTAL_URL: string
}

interface ImportMeta {
  env: ImportMetaEnv
}
