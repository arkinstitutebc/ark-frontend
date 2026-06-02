import { For, Show } from "solid-js"

const FIELD_LABELS: Record<string, string> = {
  accountingTreatment: "Accounting treatment",
  activity: "Activity / Event",
  amountInWords: "Amount in words",
  claimantDepartment: "Department",
  claimantName: "Name",
  claimantPosition: "Position / Role",
  costType: "Cost type",
  dateFiled: "Date filed",
  expenseCategory: "Expense category",
  items: "Expense items",
  periodEnd: "Period end",
  periodStart: "Period start",
  profitCenter: "For",
  referencedPrCode: "Referenced PR",
  schoolPartner: "School / Partner Covered",
}

function fieldLabel(field: string) {
  if (field.startsWith("items.")) return "Expense items"
  if (field.startsWith("supportingDocs.")) return "Supporting documents"
  return FIELD_LABELS[field] ?? field
}

export function ReimbursementValidationSummary(props: { errors: Record<string, string> }) {
  const entries = () =>
    Object.entries(props.errors).filter(([, message]) => message.trim().length > 0)

  return (
    <Show when={entries().length > 0}>
      <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
        <p class="font-semibold">Review the highlighted fields.</p>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <For each={entries()}>
            {([field, message]) => (
              <li>
                <span class="font-medium">{fieldLabel(field)}:</span> {message}
              </li>
            )}
          </For>
        </ul>
      </div>
    </Show>
  )
}
