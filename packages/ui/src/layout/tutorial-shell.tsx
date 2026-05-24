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
    <div class="max-w-6xl mx-auto">
      <header class="mb-6 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0">
            <p class="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Icons.helpCircle class="h-3.5 w-3.5" />
              How-to manual
            </p>
            <h1 class="text-2xl sm:text-3xl font-semibold text-foreground">{props.title}</h1>
            <Show when={props.subtitle}>
              <p class="mt-2 max-w-3xl text-sm text-muted leading-relaxed">{props.subtitle}</p>
            </Show>
          </div>

          <Show when={props.actions?.length}>
            <div class="flex flex-wrap gap-2 lg:justify-end">
              <For each={props.actions}>
                {action => (
                  <a
                    href={action.href}
                    class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/30 hover:text-primary"
                  >
                    <span>{action.label}</span>
                    <Icons.arrowRight class="h-4 w-4" />
                  </a>
                )}
              </For>
            </div>
          </Show>
        </div>

        <Show when={props.subtitle}>
          <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-border bg-surface-muted p-4">
              <p class="text-xs font-semibold uppercase tracking-wider text-muted">Sections</p>
              <p class="mt-1 text-2xl font-semibold text-foreground">{props.sections.length}</p>
            </div>
            <Show when={props.workflow?.length}>
              <div class="rounded-xl border border-border bg-surface-muted p-4 sm:col-span-2">
                <p class="text-xs font-semibold uppercase tracking-wider text-muted">Workflow</p>
                <ol class="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-foreground">
                  <For each={props.workflow}>
                    {(step, index) => (
                      <li class="flex items-center gap-2">
                        <span class="rounded-full bg-primary/10 px-2 py-1 text-primary">
                          {index() + 1}. {step}
                        </span>
                        <Show when={index() < (props.workflow?.length ?? 0) - 1}>
                          <Icons.arrowRight class="h-3.5 w-3.5 text-muted" />
                        </Show>
                      </li>
                    )}
                  </For>
                </ol>
              </div>
            </Show>
          </div>
        </Show>
      </header>

      <div class="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <Show when={props.intro}>
          <div class="rounded-xl border border-primary/10 bg-primary/5 p-5 text-sm text-foreground/80 leading-relaxed">
            {props.intro}
          </div>
        </Show>

        <Show when={props.checklist?.length}>
          <div class="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Before you start
            </p>
            <ul class="space-y-2">
              <For each={props.checklist}>
                {item => (
                  <li class="flex gap-2 text-sm text-foreground/80">
                    <Icons.checkCircle class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Show>
      </div>

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

      <div class="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
        <div class="space-y-5">
          <For each={props.sections}>
            {(section, index) => (
              <section
                id={section.id}
                class="scroll-mt-20 rounded-xl border border-border bg-surface p-5 shadow-sm"
              >
                <div class="mb-3 flex items-start gap-3">
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                    {index() + 1}
                  </span>
                  <h2 class="pt-1 text-lg font-semibold text-foreground">{section.title}</h2>
                </div>
                <div class="pl-0 sm:pl-11 text-sm text-foreground/80 leading-relaxed space-y-3">
                  {section.body}
                </div>
              </section>
            )}
          </For>
        </div>

        <aside class="hidden lg:block">
          <div class="sticky top-6 p-4 rounded-xl border border-border bg-surface shadow-sm">
            <p class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              On this page
            </p>
            <ul class="space-y-1">
              <For each={props.sections}>
                {(section, index) => (
                  <li>
                    <a
                      href={`#${section.id}`}
                      class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted transition-colors hover:bg-primary/5 hover:text-primary"
                    >
                      <span class="font-semibold text-primary/70">{index() + 1}</span>
                      <span>{section.title}</span>
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
