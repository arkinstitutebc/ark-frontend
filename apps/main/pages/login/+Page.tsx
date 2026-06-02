import { createSignal } from "solid-js"
import { Button, Input, UI } from "@/components/ui"

const collageImages = [
  {
    src: "/login/portal-collage-1.jpg",
    alt: "Ark Institute students outside the campus building",
  },
  {
    src: "/login/portal-collage-2.jpg",
    alt: "Ark Institute training group in front of the main building",
  },
  {
    src: "/login/portal-collage-3.jpg",
    alt: "Ark Institute team group photo",
  },
]

export default function LoginPage() {
  const [email, setEmail] = createSignal("")
  const [password, setPassword] = createSignal("")
  const [showPassword, setShowPassword] = createSignal(false)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000"
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email(), password: password() }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Invalid credentials")
      }

      const user = await res.json().catch(() => ({}))

      // Honor ?return= query (e.g., from sub-portal AuthGate redirect)
      // unless the user must change their password — that takes priority
      const params = new URLSearchParams(window.location.search)
      const returnTo = params.get("return")

      if (user.mustChangePassword) {
        window.location.href = "/profile?required=1"
      } else if (returnTo) {
        window.location.href = returnTo
      } else {
        window.location.href = "/"
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main class="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
      <BrandCollage />

      <section class="flex min-h-[calc(100vh-18rem)] items-center justify-center px-5 py-10 sm:px-8 lg:min-h-screen lg:px-12">
        <div class="w-full max-w-md">
          <div class="mb-8 flex items-center gap-4 lg:hidden">
            <img
              src="/logo/ark-transpa.png"
              alt="Ark Institute Logo"
              width="56"
              height="56"
              class="object-contain"
            />
            <div>
              <p class="text-lg font-bold text-foreground">Ark Institute</p>
              <p class="text-sm text-muted">ERP Portal</p>
            </div>
          </div>

          <div class="rounded-2xl border border-border bg-surface shadow-xl">
            <div class="border-b border-border px-8 py-7 sm:px-10">
              <div class="hidden items-center gap-4 lg:flex">
                <img
                  src="/logo/ark-transpa.png"
                  alt="Ark Institute Logo"
                  width="64"
                  height="64"
                  class="object-contain"
                />
                <div>
                  <h1 class="text-2xl font-bold text-foreground">Ark Institute</h1>
                  <p class="text-sm text-muted">ERP Portal</p>
                </div>
              </div>
              <div class="lg:hidden">
                <h1 class="text-2xl font-bold text-foreground">Sign in</h1>
                <p class="mt-1 text-sm text-muted">Use your Ark portal account.</p>
              </div>
            </div>

            <form class="space-y-5 px-8 py-8 sm:px-10" onSubmit={handleSubmit}>
              <Input
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                value={email()}
                onInput={e => setEmail(e.currentTarget.value)}
                leftIcon={UI.mail}
                autocomplete="email"
              />

              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password()}
                onInput={e => setPassword(e.currentTarget.value)}
                leftIcon={UI.lock}
                showPasswordToggle
                showPassword={showPassword()}
                onTogglePassword={() => setShowPassword(!showPassword())}
                eyeIcon={UI.eye}
                eyeOffIcon={UI.eyeOff}
                autocomplete="current-password"
              />

              {error() && (
                <div class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <UI.alert class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                  <p class="text-sm text-red-700">{error()}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                class="w-full shadow-glow-primary"
                loading={loading()}
                loadingLabel="Signing in..."
              >
                Sign In
              </Button>
            </form>

            <div class="border-t border-border bg-surface-muted/50 px-8 py-5 sm:px-10">
              <p class="text-center text-xs text-muted">Secure portal access</p>
            </div>
          </div>

          <p class="mt-6 text-center text-sm text-muted">
            <a href="https://arkinstitutebc.com" class="font-medium text-primary hover:underline">
              arkinstitutebc.com
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}

function BrandCollage() {
  return (
    <section class="relative min-h-[18rem] overflow-hidden bg-primary lg:min-h-screen">
      <div class="absolute inset-0 grid grid-rows-3 gap-2 p-2 sm:gap-3 sm:p-3 lg:gap-4 lg:p-5">
        {collageImages.map(image => (
          <div class="relative overflow-hidden rounded-lg border border-white/15 shadow-2xl">
            <img
              src={image.src}
              alt={image.alt}
              class="h-full w-full object-cover"
              loading="eager"
            />
            <div class="absolute inset-0 bg-primary/45 mix-blend-multiply" />
            <div class="absolute inset-0 bg-gradient-to-r from-primary/65 via-primary/20 to-accent/30" />
          </div>
        ))}
      </div>

      <div class="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/20 to-transparent" />
      <div class="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
        <div class="max-w-xl rounded-lg border border-white/20 bg-primary/80 p-5 text-white shadow-2xl backdrop-blur-md">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white">
              <img
                src="/logo/ark-transpa.png"
                alt="Ark Institute Logo"
                width="46"
                height="46"
                class="object-contain"
              />
            </div>
            <div>
              <p class="text-lg font-bold">Ark Institute ERP</p>
              <p class="text-sm text-white/75">Operations, training, finance, and records.</p>
            </div>
          </div>
          <a
            href="https://arkinstitutebc.com"
            class="mt-5 inline-flex text-sm font-medium text-white/80 hover:text-white"
          >
            arkinstitutebc.com
          </a>
        </div>
      </div>
    </section>
  )
}
