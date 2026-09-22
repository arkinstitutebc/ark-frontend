import type { CurrentUser, UserRole } from "@ark/api-client"

export type AuthGateState = "loading" | "redirect" | "denied" | "allowed"

export interface AuthGateInput {
  /** Session resolved during SSR, when the portal supplies one. */
  ssrUser?: CurrentUser | null
  isPending: boolean
  isError: boolean
  data?: CurrentUser
  allowedRoles?: readonly UserRole[]
}

function isAllowed(user: CurrentUser, allowedRoles?: readonly UserRole[]) {
  return !allowedRoles || allowedRoles.includes(user.role)
}

/**
 * Decides what AuthGate should render. Split out from the component so it can
 * be tested directly — this repo has no DOM test setup.
 */
export function resolveAuthGateState(input: AuthGateInput): AuthGateState {
  // A live error always wins. It catches sessions that expire mid-use, which
  // the SSR snapshot taken at request time cannot know about.
  if (input.isError) return "redirect"

  const user = input.ssrUser ?? input.data
  if (user) return isAllowed(user, input.allowedRoles) ? "allowed" : "denied"

  return input.isPending ? "loading" : "redirect"
}
