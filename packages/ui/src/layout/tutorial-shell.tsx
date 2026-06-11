import { For, type JSX, Show } from "solid-js"
import { Icons } from "../icons"

export interface TutorialSection {
  id: string
  title: string
  body: JSX.Element
}

export interface TutorialAction {
  label: string
  href: string
}

export interface TutorialShellProps {
  title: string
  subtitle?: string
  sections: TutorialSection[]
  /** Optional element rendered above the sections (e.g. an intro paragraph). */
  intro?: JSX.Element
  workflow?: string[]
  checklist?: string[]
  actions?: TutorialAction[]
}

/**
 * Page chrome for "How to use this portal" tutorial pages. Renders a header,
 * an optional intro block, a sticky table-of-contents on the right (desktop),
 * and a vertically-stacked section list with anchor scroll targets.
 *
 * Per-portal pages just supply a `sections` array — content stays in the
 * portal so each team can tune wording without touching shared UI.
 */
export function TutorialShell(props: TutorialShellProps) {
  return (
    <div class="mx-auto max-w-7xl">
      <header class="mb-6 border-b border-border pb-6">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0">
            <p class="mb-3 inline-flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
              <Icons.helpCircle class="h-3.5 w-3.5" />
              How To
            </p>
            <h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {props.title}
            </h1>
            <Show when={props.subtitle}>
              <p class="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{props.subtitle}</p>
            </Show>
          </div>

          <Show when={props.actions?.length}>
            <div class="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
              <For each={props.actions}>
                {action => (
                  <a
                    href={action.href}
                    class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                  >
                    <span>{action.label}</span>
                    <Icons.arrowRight class="h-4 w-4" />
                  </a>
                )}
              </For>
            </div>
          </Show>
        </div>

        <Show when={props.workflow?.length}>
          <div class="mt-6 rounded-lg border border-border bg-surface p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted">Typical Flow</p>
            <ol class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <For each={props.workflow}>
                {(step, index) => (
                  <li class="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 text-sm font-medium text-foreground">
                    <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {index() + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                )}
              </For>
            </ol>
          </div>
        </Show>
      </header>

      <div class="mb-6 overflow-x-auto rounded-xl border border-border bg-surface p-2 lg:hidden">
        <div class="flex gap-2">
          <For each={props.sections}>
            {section => (
              <a
                href={`#${section.id}`}
                class="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-muted transition hover:bg-primary/5 hover:text-primary"
              >
                {section.title}
              </a>
            )}
          </For>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div class="space-y-4">
          <Show when={props.intro || props.checklist?.length}>
            <section class="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <Show when={props.intro}>
                <div class="text-sm leading-relaxed text-foreground/80">{props.intro}</div>
              </Show>

              <Show when={props.checklist?.length}>
                <div class={props.intro ? "mt-5 border-t border-border pt-4" : ""}>
                  <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    Before You Start
                  </p>
                  <ul class="grid gap-2 sm:grid-cols-2">
                    <For each={props.checklist}>
                      {item => (
                        <li class="flex gap-2 text-sm leading-relaxed text-foreground/80">
                          <Icons.checkCircle class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{item}</span>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>
            </section>
          </Show>

          <For each={props.sections}>
            {(section, index) => (
              <section
                id={section.id}
                class="scroll-mt-20 rounded-lg border border-border bg-surface p-5 shadow-sm"
              >
                <div class="mb-4 flex items-start gap-3">
                  <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {index() + 1}
                  </span>
                  <h2 class="pt-0.5 text-lg font-semibold text-foreground">{section.title}</h2>
                </div>
                <div class="text-sm leading-relaxed text-foreground/80 sm:pl-10 [&_ol]:space-y-1.5 [&_ul]:space-y-1.5">
                  {section.body}
                </div>
              </section>
            )}
          </For>
        </div>

        <aside class="hidden lg:block">
          <div class="sticky top-6 rounded-lg border border-border bg-surface p-4 shadow-sm">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              On This Page
            </p>
            <ul class="space-y-1">
              <For each={props.sections}>
                {(section, index) => (
                  <li>
                    <a
                      href={`#${section.id}`}
                      class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted transition-colors hover:bg-primary/5 hover:text-primary"
                    >
                      <span class="w-5 shrink-0 font-semibold text-primary/70">{index() + 1}</span>
                      <span class="line-clamp-2">{section.title}</span>
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
