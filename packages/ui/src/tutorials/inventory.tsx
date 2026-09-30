import type { JSX } from "solid-js"
import type { TutorialSection } from "../layout/tutorial-shell"

export const inventoryTutorial: {
  title: string
  subtitle: string
  intro?: JSX.Element
  workflow?: string[]
  checklist?: string[]
  actions?: { label: string; href: string }[]
  sections: TutorialSection[]
} = {
  title: "How to use Toolkeeping",
  subtitle: "Catalog tools and equipment, record damage, and complete a monthly physical check.",
  intro: (
    <p>
      Toolkeeping is independent from Purchase Orders. Add the tools actually held by ARK, then use
      one monthly checklist to confirm quantity and condition.
    </p>
  ),
  workflow: ["Add tool", "Record price", "Generate month", "Count all tools", "Complete check"],
  checklist: [
    "Use individual tracking for serialized or uniquely tagged equipment.",
    "Record damaged, for-repair, or lost condition as soon as it is known.",
    "Generate one checklist each month; it automatically includes every existing tool.",
  ],
  actions: [
    { label: "Open Toolkeeping", href: "/" },
    { label: "Open Monthly Checks", href: "/monthly" },
  ],
  sections: [
    {
      id: "catalog",
      title: "Maintain the tool catalog",
      body: (
        <p>
          Add each tool or equipment type with its unit price, quantity, reorder level, tracking
          mode, and current condition. Asset tags and serial numbers are available for individually
          tracked equipment.
        </p>
      ),
    },
    {
      id: "monthly",
      title: "Run the monthly check",
      body: (
        <ol class="list-decimal pl-5 space-y-1.5">
          <li>Open Monthly Checks and generate the month.</li>
          <li>Open the checklist; every tool that existed at generation time is included.</li>
          <li>Enter counted and damaged quantities, condition, and any notes.</li>
          <li>Save progress while counting, then complete only after every line is checked.</li>
        </ol>
      ),
    },
    {
      id: "damage",
      title: "Track damage and condition",
      body: (
        <p>
          Use <b>Damaged</b>, <b>For repair</b>, or <b>Lost</b> when the physical check finds an
          issue. Completing the checklist updates the catalog quantity, damaged count, condition,
          and low-stock status together.
        </p>
      ),
    },
    {
      id: "tips",
      title: "Tips",
      body: (
        <ul class="list-disc pl-5 space-y-1.5">
          <li>
            Do not recreate Procurement receipts here; Toolkeeping represents physical custody.
          </li>
          <li>Use notes to identify the exact damaged unit or explain a variance.</li>
          <li>Completed monthly reports are locked as the audit record for that month.</li>
        </ul>
      ),
    },
  ],
}
