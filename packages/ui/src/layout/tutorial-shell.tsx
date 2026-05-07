import { For, type JSX, Show } from "solid-js"

export interface TutorialSection {
  id: string
  title: string
  body: JSX.Element
}

export interface TutorialShellProps {
  title: string
  subtitle?: string
  sections: TutorialSection[]
  /** Optional element rendered above the sections (e.g. an intro paragraph). */
  intro?: JSX.Element
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
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <header class="mb-8">
        <h1 class="text-3xl font-semibold text-foreground">{props.title}</h1>
        <Show when={props.subtitle}>
          <p class="mt-2 text-muted text-sm">{props.subtitle}</p>
        </Show>
      </header>

      <Show when={props.intro}>
        <div class="mb-8 p-5 rounded-xl bg-primary/5 border border-primary/10 text-sm text-foreground/80 leading-relaxed">
          {props.intro}
        </div>
      </Show>

      <div class="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-10">
        <div class="space-y-10">
          <For each={props.sections}>
            {section => (
              <section id={section.id} class="scroll-mt-20">
                <h2 class="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span class="inline-block w-1 h-5 bg-primary rounded-full" />
                  {section.title}
                </h2>
                <div class="text-sm text-foreground/80 leading-relaxed space-y-3">
                  {section.body}
                </div>
              </section>
            )}
          </For>
        </div>

        <aside class="hidden lg:block">
          <div class="sticky top-6 p-4 rounded-xl border border-border bg-surface">
            <p class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              On this page
            </p>
            <ul class="space-y-1.5">
              <For each={props.sections}>
                {section => (
                  <li>
                    <a
                      href={`#${section.id}`}
                      class="block text-xs text-muted hover:text-primary transition-colors"
                    >
                      {section.title}
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
