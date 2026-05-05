import { Icons } from "@ark/ui"
import { usePageContext } from "vike-solid/usePageContext"

export default function ErrorPage() {
  const ctx = usePageContext()
  const is404 = ctx.is404 === true
  const heading = is404 ? "Page Not Found" : "Something Went Wrong"
  const message = is404
    ? "The page you're looking for doesn't exist."
    : "An unexpected error occurred. Please try again."

  return (
    <div class="min-h-screen flex items-center justify-center bg-surface-muted px-4">
      <div class="max-w-md w-full text-center">
        <div class="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6">
          <Icons.alert class="w-8 h-8 text-accent" />
        </div>
        <h1 class="text-3xl font-semibold text-foreground mb-2">{heading}</h1>
        <p class="text-muted mb-8">{message}</p>
        <div class="flex items-center justify-center gap-3">
          <a
            href="/"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Icons.home class="w-4 h-4" />
            Dashboard
          </a>
          <a
            href="/login"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-surface text-foreground border border-border rounded-lg font-medium hover:bg-surface-muted transition-colors"
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  )
}
