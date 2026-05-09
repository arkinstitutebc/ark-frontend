import type { JSX } from "solid-js"
import type { TutorialSection } from "../layout/tutorial-shell"

export const financeTutorial: {
  title: string
  subtitle: string
  intro?: JSX.Element
  sections: TutorialSection[]
} = {
  title: "How to use the Finance portal",
  subtitle: "Banks, transfers, disbursements, and the P&L report.",
  sections: [
    {
      id: "overview",
      title: "What this portal is for",
      body: (
        <p>
          Finance is the school's ledger. It tracks <b>banks</b>, <b>transfers</b> between bank
          accounts, <b>disbursements</b> (expenses), and produces a <b>P&L</b> report. Every
          transaction is double-entry and immutable.
        </p>
      ),
    },
    {
      id: "transfer",
      title: "Record a bank transfer (admin / director)",
      body: (
        <>
          <p>
            Use a transfer when money moves between Ark's own accounts (savings → operations, etc.).
            The system writes two paired transactions atomically.
          </p>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>
              Go to <b>Transfers</b> → <b>+ New Transfer</b>.
            </li>
            <li>Pick from-bank, to-bank, amount, date, optional notes.</li>
            <li>Save. Both bank balances update instantly.</li>
          </ol>
        </>
      ),
    },
    {
      id: "disbursement",
      title: "Record a disbursement",
      body: (
        <p>
          A disbursement is money going out of a bank to a payee (supplier, utility, etc.). Pick the
          bank, payee, category, amount, and date. The bank balance decreases. Linking to a PO is
          optional but recommended for paid procurement.
        </p>
      ),
    },
    {
      id: "pnl",
      title: "Read the P&L report",
      body: (
        <p>
          <b>P&L Report</b> shows month-over-month income vs. expense by category. Click{" "}
          <b>Download PDF</b> for a print-ready segmented income statement. Numbers come straight
          from the transaction ledger — they reflect what was recorded, not what's pending.
        </p>
      ),
    },
    {
      id: "tips",
      title: "Tips",
      body: (
        <ul class="list-disc pl-5 space-y-1.5">
          <li>
            You can't edit a transaction once saved. Mistakes are corrected via a reversing entry.
          </li>
          <li>Excel export is available on transaction lists — useful for accountants.</li>
          <li>
            Two-bank reconciliation lives under <b>Two-Bank</b> for cash-flow checks.
          </li>
        </ul>
      ),
    },
  ],
}
