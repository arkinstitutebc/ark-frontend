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
  title: "How to use the Inventory portal",
  subtitle: "Stock items, receiving deliveries, and the movement log.",
  intro: (
    <p>
      Inventory closes the loop after Procurement. Receiving validates delivered items against the
      PO, updates on-hand stock, and leaves an immutable movement trail for audit.
    </p>
  ),
  workflow: ["Receive PO", "Update stock", "Review partials", "Count shelf", "Adjust variances"],
  checklist: [
    "Use the PO from Procurement, not a manual supplier note.",
    "Count actual delivered quantities before saving.",
    "Use Stock Take for full shelf reconciliation and Adjust for one item correction.",
  ],
  actions: [
    { label: "Open Stock", href: "/" },
    { label: "Open Receiving", href: "/receiving" },
    { label: "Open Movements", href: "/movements" },
  ],
  sections: [
    {
      id: "overview",
      title: "What this portal is for",
      body: (
        <p>
          Inventory tracks <b>stock items</b> (training materials, supplies) and records every{" "}
          <b>movement</b> in or out. Items show their on-hand quantity, reorder level, and a derived
          stock status so users can quickly see what needs replenishment.
        </p>
      ),
    },
    {
      id: "receive",
      title: "Receive a delivery",
      body: (
        <>
          <p>
            When a PO arrives, go to <b>Receiving</b>, link the purchase order, and confirm
            quantities. Items get auto-bumped on hand and a movement row is logged for each item.
            The PO stays <b>partial</b> until cumulative received quantities match the ordered
            quantities for every line.
          </p>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>
              Click <b>Receive PO</b>.
            </li>
            <li>Pick the PO from the dropdown.</li>
            <li>Adjust quantities if the supplier shorted delivery. Over-receiving is blocked.</li>
            <li>Save. Movements appear in the Movements log instantly.</li>
          </ol>
        </>
      ),
    },
    {
      id: "stock-take",
      title: "Run a stock take (cycle count)",
      body: (
        <>
          <p>
            Use <b>Stock Take</b> to reconcile the whole shelf in one session — counter walks the
            items, types each <b>Counted</b> quantity, and submits once. The variance column shows
            what'll change before you commit.
          </p>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>
              Open <b>Stock Take</b> from the sidebar.
            </li>
            <li>(Optional) Add a session note — appears on every adjustment row.</li>
            <li>Type the counted quantity for each item. Leave blank to skip.</li>
            <li>
              Hit <b>Submit count</b>. Items that match on-hand are skipped; differences become
              adjustment movements automatically.
            </li>
          </ol>
          <p>
            The whole submission is saved together. If anything fails, nothing is partly updated.
          </p>
        </>
      ),
    },
    {
      id: "adjust",
      title: "Adjust a single item",
      body: (
        <p>
          Open an item from the <b>Stock</b> page and click <b>Adjust</b>. Enter a quantity
          (positive = in, negative = out, or pick "adjustment" for corrections) and a reason. Each
          adjustment writes one movement row — the log is your audit trail.
        </p>
      ),
    },
    {
      id: "movements",
      title: "Read the movement log",
      body: (
        <p>
          The <b>Movements</b> tab is the full ledger: who did what, when, and why. Filter by item
          or type. Use this when something doesn't reconcile against the physical shelf.
        </p>
      ),
    },
    {
      id: "tips",
      title: "Tips",
      body: (
        <ul class="list-disc pl-5 space-y-1.5">
          <li>
            Stock status comes from on-hand quantity and reorder level; update counts, not labels.
          </li>
          <li>If receiving fails, the PO and stock do not change. Retry after fixing the issue.</li>
          <li>Movements are immutable. Made a typo? Create a new "adjustment" row to correct.</li>
        </ul>
      ),
    },
  ],
}
