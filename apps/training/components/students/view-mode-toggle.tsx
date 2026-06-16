import { Icons } from "@ark/ui"

export type StudentViewMode = "list" | "blocks"

export function ViewModeToggle(props: {
  value: StudentViewMode
  onChange: (mode: StudentViewMode) => void
}) {
  return (
    <div class="inline-flex rounded-lg border border-border bg-surface-muted p-0.5">
      <button
        type="button"
        onClick={() => props.onChange("list")}
        class={`rounded-md p-2 transition-colors ${
          props.value === "list"
            ? "bg-surface text-foreground shadow-sm"
            : "text-muted hover:text-foreground"
        }`}
        aria-pressed={props.value === "list"}
        aria-label="List view"
        title="List view"
      >
        <Icons.list class="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => props.onChange("blocks")}
        class={`rounded-md p-2 transition-colors ${
          props.value === "blocks"
            ? "bg-surface text-foreground shadow-sm"
            : "text-muted hover:text-foreground"
        }`}
        aria-pressed={props.value === "blocks"}
        aria-label="Block view"
        title="Block view"
      >
        <Icons.layoutGrid class="h-4 w-4" />
      </button>
    </div>
  )
}
