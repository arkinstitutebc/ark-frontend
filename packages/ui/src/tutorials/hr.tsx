import type { JSX } from "solid-js"
import type { TutorialSection } from "../layout/tutorial-shell"

export const hrTutorial: {
  title: string
  subtitle: string
  intro?: JSX.Element
  workflow?: string[]
  checklist?: string[]
  actions?: { label: string; href: string }[]
  sections: TutorialSection[]
} = {
  title: "How to use the HR portal",
  subtitle: "Trainers, attendance, and payroll periods.",
  intro: (
    <p>
      HR keeps trainer records, attendance, and payroll periods organized. Review rates and hours
      before processing because payroll records become the reference for accounting and filing.
    </p>
  ),
  workflow: ["Maintain trainers", "Log attendance", "Create period", "Review entries", "Process"],
  checklist: [
    "Trainer hourly rate and active status are current.",
    "Attendance dates fall inside the payroll period.",
    "Review entries before processing because processed periods are locked.",
  ],
  actions: [
    { label: "Open Trainers", href: "/" },
    { label: "Open Attendance", href: "/attendance" },
    { label: "Open Payroll", href: "/payroll" },
  ],
  sections: [
    {
      id: "overview",
      title: "What this portal is for",
      body: (
        <p>
          HR is for managing <b>trainers</b> (their profiles, pay rate, status) and running{" "}
          <b>payroll periods</b>. Attendance and payroll stay together so admin can trace how each
          payout was computed.
        </p>
      ),
    },
    {
      id: "trainers",
      title: "Add or edit a trainer",
      body: (
        <ol class="list-decimal pl-5 space-y-1.5">
          <li>
            Go to <b>Trainers</b> → <b>+ New Trainer</b>.
          </li>
          <li>Fill in name, contact info, pay rate (per hour or per day), and status.</li>
          <li>Save. Edit anytime — change of pay rate applies to future payroll only.</li>
        </ol>
      ),
    },
    {
      id: "payroll",
      title: "Run a payroll period",
      body: (
        <>
          <p>Payroll is a two-step flow:</p>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>
              Create a payroll period (label, start, end). The system calculates draft entries from
              logged attendance.
            </li>
            <li>
              Review the entries, adjust if needed, then click <b>Process</b>. The PDF payroll
              report becomes downloadable for review and filing.
            </li>
          </ol>
          <p>
            Processed periods are locked. To fix mistakes, create a new period with adjustments
            rather than editing the old one.
          </p>
        </>
      ),
    },
    {
      id: "tips",
      title: "Tips",
      body: (
        <ul class="list-disc pl-5 space-y-1.5">
          <li>Pay rate changes mid-period don't reach back — they apply to the next period.</li>
          <li>The payroll PDF is print-ready: hand it out or file it for accounting.</li>
          <li>HR is admin/director only — trainers don't see their own data here.</li>
        </ul>
      ),
    },
  ],
}
