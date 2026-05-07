import { type TutorialSection, TutorialShell } from "@ark/ui"

const sections: TutorialSection[] = [
  {
    id: "overview",
    title: "What this portal is for",
    body: (
      <>
        <p>
          Procurement handles two artifacts: <b>Purchase Requests (PRs)</b> — what a batch needs —
          and <b>Purchase Orders (POs)</b> — what was actually ordered from a supplier. A PR has to
          be approved before it becomes a PO.
        </p>
        <p>
          Use this portal to draft requests, attach quotes, send them up for approval, create the
          matching order, and track delivery status.
        </p>
      </>
    ),
  },
  {
    id: "create-pr",
    title: "Create a Purchase Request",
    body: (
      <>
        <ol class="list-decimal pl-5 space-y-1.5">
          <li>
            Go to <b>Requests</b> and click <b>+ New Request</b>.
          </li>
          <li>Pick the batch the items are for. The budget remaining shows on the right.</li>
          <li>
            Pick a category. Don't have one? Hit <b>Manage categories</b> to add one.
          </li>
          <li>Add items: name, quantity, unit, unit price. Add as many rows as needed.</li>
          <li>(Optional) Attach receipts, supplier quotes, or invoices.</li>
          <li>
            Submit. The request goes to the Director's <b>Approvals</b> queue.
          </li>
        </ol>
      </>
    ),
  },
  {
    id: "edit-pr",
    title: "Edit a pending Request",
    body: (
      <p>
        While a PR is still <b>pending</b>, open it and click <b>Edit</b> in the top right. You can
        change anything: batch, category, purpose, items, attachments. Once it's approved, rejected,
        or ordered, the Edit button disappears — that's on purpose so the approval record stays
        trustworthy.
      </p>
    ),
  },
  {
    id: "approvals",
    title: "Approve or reject (admin / director)",
    body: (
      <>
        <p>
          Approvals show up in the <b>Approvals</b> tab and on your notification bell. Open a
          request, review the items + total, then either approve (with optional notes) or reject
          (notes required so the requester knows what to fix).
        </p>
        <p>
          Approving a PR fires a notification to the requester. Rejecting it sets the status to{" "}
          <b>rejected</b> — they can copy the items into a fresh PR with the fixes.
        </p>
      </>
    ),
  },
  {
    id: "create-po",
    title: "Turn an approved PR into a PO",
    body: (
      <p>
        Open the approved PR and click <b>Create PO</b>. Fill in the supplier, expected delivery
        date, and any notes. Items are pulled in from the PR — they stay frozen on the PO so you can
        compare quote-vs-actual later. Save it and the PR's status flips to <b>ordered</b>.
      </p>
    ),
  },
  {
    id: "edit-po",
    title: "Edit a Purchase Order",
    body: (
      <p>
        From the PO detail page, click <b>Edit</b>. You can change supplier, estimated delivery,
        status, and notes. Items are not editable (they came from the approved PR). The Edit button
        disappears once the PO is <b>received</b> or <b>cancelled</b>.
      </p>
    ),
  },
  {
    id: "pdf",
    title: "Print or send the PDF",
    body: (
      <p>
        Both PR and PO detail modals have a <b>View PDF</b> button. It opens a clean
        letterhead-style PDF in a new tab — preview first, then save or print from the browser. The
        PDF includes the items table, signatures, and a "Page N of M" footer.
      </p>
    ),
  },
  {
    id: "tips",
    title: "Tips",
    body: (
      <ul class="list-disc pl-5 space-y-1.5">
        <li>Drag receipts straight onto the attachments area — multiple files supported.</li>
        <li>
          The collapsible sidebar's mid-edge handle gives more room when reviewing wide item tables.
        </li>
        <li>Filter by status on the Requests / Orders pages to focus on what's pending.</li>
      </ul>
    ),
  },
]

export default function ProcurementTutorialPage() {
  return (
    <TutorialShell
      title="How to use the Procurement portal"
      subtitle="Purchase Requests, Purchase Orders, approvals, and delivery tracking."
      intro={
        <p>
          Procurement is built around a simple flow: <b>request → approve → order → receive</b>.
          Everything else (categories, attachments, PDFs) supports those four moments.
        </p>
      }
      sections={sections}
    />
  )
}
