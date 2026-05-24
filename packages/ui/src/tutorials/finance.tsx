import type { JSX } from "solid-js"
import type { TutorialSection } from "../layout/tutorial-shell"

export const financeTutorial: {
  title: string
  subtitle: string
  intro?: JSX.Element
  workflow?: string[]
  checklist?: string[]
  actions?: { label: string; href: string }[]
  sections: TutorialSection[]
} = {
  title: "How to use the Finance portal",
  subtitle:
    "Banks, transfers, disbursements, reimbursements, P&L, Income Statement, GL Accounts, Assets.",
  intro: (
    <p>
      Finance is the school's ledger plus reporting layer. Every transaction is double-entry and
      immutable; corrections happen via reversing entries.
    </p>
  ),
  workflow: ["Classify", "Record", "Review banks", "Report", "Reconcile"],
  checklist: [
    "Pick the correct bank before recording cash movement.",
    "Use the 4 accounting axes consistently so Income Statement segments stay correct.",
    "Use reversals or correcting entries for mistakes; do not overwrite historical transactions.",
  ],
  actions: [
    { label: "Open Banks", href: "/banks" },
    { label: "Open Disbursements", href: "/disbursements" },
    { label: "Open Income Statement", href: "/income-statement" },
  ],
  sections: [
    {
      id: "overview",
      title: "What this portal is for",
      body: (
        <p>
          Finance tracks <b>banks</b>, <b>transfers</b> between accounts, <b>disbursements</b> (cash
          out), <b>reimbursements</b> (staff out-of-pocket claims), and produces two reports: the
          monthly <b>P&L Report</b> (batch-segmented) and the period <b>Income Statement</b>{" "}
          (profit-center-segmented). The <b>GL Accounts</b> catalog drives the classification on
          every expense; the <b>Asset Register</b> tracks depreciable items.
        </p>
      ),
    },
    {
      id: "transfer",
      title: "Record a bank transfer (admin / director)",
      body: (
        <>
          <p>
            Use a transfer when money moves between Ark's own accounts. The system writes two paired
            transactions atomically.
          </p>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>
              Go to <b>Transfers</b> → <b>+ New Transfer</b>.
            </li>
            <li>Pick from-bank, to-bank, amount, date, notes.</li>
            <li>Save. Both bank balances update instantly.</li>
          </ol>
        </>
      ),
    },
    {
      id: "disbursement",
      title: "Record a disbursement (with 4-axis classification)",
      body: (
        <>
          <p>
            A disbursement is money going out from the Operational Hub bank. The form auto-prefills
            the 4 accounting axes when you pick a category — you can override.
          </p>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>
              Go to <b>Disbursements</b> → <b>+ New Disbursement</b>.
            </li>
            <li>
              Pick the <b>category</b> (grouped by Cost of Services / Admin / Fixed Asset / Other).
              Defaults fill in.
            </li>
            <li>
              Adjust <b>Expense Category</b>, <b>Profit Center</b>, <b>Accounting Treatment</b>,{" "}
              <b>Cost Type</b> if the spend doesn't match the default.
            </li>
            <li>Enter amount, description, optional reference (PR / RR code).</li>
            <li>
              Save — the bank balance decreases and the row lands on both reports correctly tagged.
            </li>
          </ol>
        </>
      ),
    },
    {
      id: "reimbursement",
      title: "Reimbursement Requests (RR)",
      body: (
        <>
          <p>
            For staff claiming out-of-pocket expenses. 3-stage workflow:{" "}
            <b>Claimant → Finance verifies → Management approves</b>. An optional 4th stage records
            the Accounting note after approval.
          </p>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>
              <b>Submit</b>: <i>Reimbursements → + New Claim</i>. Add items, totals, the 4
              classifications, supporting-docs checklist, attachments (receipt photos / PDFs).
            </li>
            <li>
              <b>Edit while pending</b>: open the claim → <i>Edit</i> link.
            </li>
            <li>
              <b>Finance verifies</b>: queue at <i>RR Approvals → Finance queue</i>.
            </li>
            <li>
              <b>Management approves</b>: queue at <i>RR Approvals → Management queue</i>. Approval
              auto-creates a classified expense transaction.
            </li>
            <li>
              <b>Accounting notes</b>: any reviewer adds the closing note for audit.
            </li>
          </ol>
          <p>
            Management approval posts a classified expense to the ledger automatically, so reports
            update without a second manual transaction.
          </p>
        </>
      ),
    },
    {
      id: "income-statement",
      title: "Segmented Income Statement",
      body: (
        <p>
          The flagship report. Pick a date range (or use Current quarter / Last quarter / YTD
          chips). Shows the full waterfall: Revenue → Variable Costs → <b>Contribution Margin</b> →
          Traceable Fixed → <b>Segment Margin</b> → Common/Admin → <b>Net Operating Income</b>, with
          three profit-center columns (JDVP / TWSP-FBS / TWSP-HSK) + Total. <b>View PDF</b> for a
          branded letterhead version.
        </p>
      ),
    },
    {
      id: "pnl",
      title: "P&L Report (monthly, batch-segmented)",
      body: (
        <p>
          Different cut: one month, columns are training <b>batches</b> instead of profit centers.
          Use for batch profitability. <b>CSV / XLSX / PDF</b> exports available. Keep using this
          alongside the Income Statement — they answer different questions.
        </p>
      ),
    },
    {
      id: "gl-accounts",
      title: "GL Accounts catalog (admin / director)",
      body: (
        <p>
          The chart of accounts that powers the disbursement category picker. 20 accounts seeded
          from the paper Accounting Treatment matrix. Add / rename / deactivate from{" "}
          <b>GL Accounts</b>. Code is immutable after creation (historical disbursements link to
          it).
        </p>
      ),
    },
    {
      id: "assets",
      title: "Asset Register",
      body: (
        <>
          <p>
            Track depreciable items (computers, equipment, fit-out). Straight-line depreciation is
            computed on the fly — no monthly job to run.
          </p>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>
              <b>Register</b>: <i>Assets → + Register Asset</i>. Set acquisition cost, useful life
              (months), residual value, profit center.
            </li>
            <li>
              <b>View schedule</b>: open any asset to see month-by-month depreciation + accumulated
              + book value.
            </li>
            <li>
              <b>Dispose</b>: when sold or written off, <i>Dispose</i> stops depreciation at the
              disposal date and optionally records proceeds.
            </li>
          </ol>
        </>
      ),
    },
    {
      id: "tips",
      title: "Tips",
      body: (
        <ul class="list-disc pl-5 space-y-1.5">
          <li>
            Transactions are immutable. Mistakes are corrected via a reversing entry, never an edit.
          </li>
          <li>
            <b>Two-Bank</b> page is the day-to-day cash-flow view. Income Statement / P&L are the
            accounting view.
          </li>
          <li>
            Reimbursement approval auto-creates a classified expense — so the income statement
            reflects RRs as soon as Management signs off.
          </li>
        </ul>
      ),
    },
  ],
}
