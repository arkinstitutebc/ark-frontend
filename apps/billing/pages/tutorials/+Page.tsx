import { type TutorialSection, TutorialShell } from "@ark/ui"

const sections: TutorialSection[] = [
  {
    id: "overview",
    title: "What this portal is for",
    body: (
      <p>
        Billing tracks <b>accounts receivable (AR)</b> for TESDA students — what's owed, what's been
        paid, and what's outstanding. Each receivable is tied to a batch.
      </p>
    ),
  },
  {
    id: "create-ar",
    title: "Create a receivable",
    body: (
      <>
        <ol class="list-decimal pl-5 space-y-1.5">
          <li>
            Go to <b>Receivables</b> → <b>+ New Receivable</b>.
          </li>
          <li>Pick the batch (and student if individual).</li>
          <li>Enter the total amount due and the due date.</li>
          <li>Save. The new AR shows up with a balance equal to the total.</li>
        </ol>
      </>
    ),
  },
  {
    id: "record-payment",
    title: "Record a payment",
    body: (
      <p>
        Open the receivable and click <b>Record Payment</b>. Enter amount, payment method (cash,
        bank transfer, GCash, etc.), reference number, and date. The balance decreases
        automatically. Multiple partial payments are fine.
      </p>
    ),
  },
  {
    id: "statement",
    title: "Generate a billing statement (PDF)",
    body: (
      <p>
        From the receivable detail page, click <b>Download Statement</b>. A letterhead-style PDF
        lists the AR header, all payment rows, and the running balance. Send it to the student or
        keep on file.
      </p>
    ),
  },
  {
    id: "tips",
    title: "Tips",
    body: (
      <ul class="list-disc pl-5 space-y-1.5">
        <li>
          Filter by <b>Outstanding</b> to focus on unpaid balances.
        </li>
        <li>Payments are immutable. Refunds → record a new negative payment with a clear note.</li>
        <li>
          Statement PDFs reflect the moment they were generated; regenerate after each payment.
        </li>
      </ul>
    ),
  },
]

export default function BillingTutorialPage() {
  return (
    <TutorialShell
      title="How to use the Billing portal"
      subtitle="TESDA student receivables, payments, and statements."
      sections={sections}
    />
  )
}
