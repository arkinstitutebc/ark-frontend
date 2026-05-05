import { createQuery } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"

export function useBanks() {
  return createQuery(() => ({
    queryKey: queryKeys.banks.all,
    queryFn: () =>
      api<Array<{ id: string; name: string; bankName: string; accountNumber: string }>>(
        "/api/finance/banks"
      ),
  }))
}

export function useBankBalance(bankId: () => string) {
  return createQuery(() => ({
    queryKey: queryKeys.banks.balance(bankId()),
    queryFn: () =>
      api<{ id: string; name: string; bankName: string; accountNumber: string; balance: number }>(
        `/api/finance/banks/${bankId()}/balance`
      ),
    enabled: !!bankId(),
  }))
}
