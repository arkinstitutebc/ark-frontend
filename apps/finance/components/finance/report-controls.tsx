import { formInputClass, Icons, SegmentedControl } from "@ark/ui"

export type DateRangePreset = "current-quarter" | "last-quarter" | "year-to-date" | "custom"

interface MonthStepperProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

interface DateRangeControlsProps {
  from: string
  to: string
  preset: DateRangePreset
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onPresetChange: (value: Exclude<DateRangePreset, "custom">) => void
}

function toMonthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function monthDate(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number)
  return new Date(year, month - 1, 1)
}

function formatMonth(monthValue: string) {
  return monthDate(monthValue).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  })
}

function shiftMonth(monthValue: string, delta: number) {
  const date = monthDate(monthValue)
  date.setMonth(date.getMonth() + delta)
  return toMonthValue(date)
}

export function currentMonthValue() {
  return toMonthValue(new Date())
}

export function MonthStepper(props: MonthStepperProps) {
  return (
    <div class="block">
      <span class="block text-xs text-muted mb-1">{props.label ?? "Month"}</span>
      <div class="inline-flex items-center overflow-hidden rounded-lg border border-border bg-surface">
        <button
          type="button"
          onClick={() => props.onChange(shiftMonth(props.value, -1))}
          class="h-10 w-10 inline-flex items-center justify-center text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
          aria-label="Previous month"
        >
          <Icons.chevronLeft class="w-4 h-4" />
        </button>
        <div class="h-10 min-w-[172px] px-3 inline-flex items-center justify-center gap-2 border-x border-border text-sm font-medium text-foreground">
          <Icons.calendar class="w-4 h-4 text-muted" />
          <span>{formatMonth(props.value)}</span>
        </div>
        <button
          type="button"
          onClick={() => props.onChange(shiftMonth(props.value, 1))}
          class="h-10 w-10 inline-flex items-center justify-center text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
          aria-label="Next month"
        >
          <Icons.chevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function DateRangeControls(props: DateRangeControlsProps) {
  return (
    <div class="flex flex-wrap gap-3 items-end">
      <label class="block w-40">
        <span class="block text-xs text-muted mb-1">From</span>
        <input
          type="date"
          value={props.from}
          onInput={e => props.onFromChange(e.currentTarget.value)}
          class={formInputClass()}
        />
      </label>
      <label class="block w-40">
        <span class="block text-xs text-muted mb-1">To</span>
        <input
          type="date"
          value={props.to}
          onInput={e => props.onToChange(e.currentTarget.value)}
          class={formInputClass()}
        />
      </label>
      <SegmentedControl
        value={props.preset}
        onChange={value => {
          if (value !== "custom") props.onPresetChange(value)
        }}
        ariaLabel="Report date range"
        class="mb-0.5"
        options={[
          { label: "Current quarter", value: "current-quarter", icon: Icons.calendar },
          { label: "Last quarter", value: "last-quarter", icon: Icons.clock },
          { label: "YTD", value: "year-to-date", icon: Icons.barChart3 },
        ]}
      />
    </div>
  )
}
