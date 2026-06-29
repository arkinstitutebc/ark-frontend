import type { JSX } from "solid-js"
import type { TutorialSection } from "../layout/tutorial-shell"

export const procurementTutorial: {
  title: string
  subtitle: string
  intro?: JSX.Element
  workflow?: string[]
  checklist?: string[]
  actions?: { label: string; href: string }[]
  sections: TutorialSection[]
} = {
  title: "How to use the Procurement portal",
  subtitle: "Purchase requests, cash vouchers, purchase orders, approvals, and receiving handoff.",
  intro: (
    <p>
      Procurement covers two operating flows: formal purchasing through <b>PR → PO → receiving</b>,
      and small immediate cash needs through <b>Cash Voucher</b>. Both keep approvals, attachments,
      and printable records in the system.
    </p>
  ),
  workflow: ["Request", "Review", "Approve", "Release or order", "Receive or liquidate"],
  checklist: [
    "The request is tied to the correct batch when it is for a training class.",
    "Items, unit prices, and totals match the supplier quote or working canvass.",
    "Purpose, date needed, attachments, and category are complete before approval.",
    "Cash voucher requests include payment details when Digital Transfer is selected.",
  ],
  actions: [
    { label: "Open Requests", href: "/pr" },
    { label: "Open Cash Voucher", href: "/cash-voucher" },
    { label: "Open Approvals", href: "/approvals" },
    { label: "Open Orders", href: "/orders" },
  ],
  sections: [
    {
      id: "overview",
      title: "What this portal is for",
      body: (
        <>
          <p>
            Procurement handles two artifacts: <b>Purchase Requests (PRs)</b> — what a batch needs —
            and <b>Purchase Orders (POs)</b> — what was actually ordered from a supplier. A PR has
            to be approved before it becomes a PO.
          </p>
          <p>
            Use this portal to draft purchase requests, manage cash voucher requests, attach support
            files, send work for approval, create the matching order, and track delivery status.
          </p>
        </>
      ),
    },
    {
      id: "create-pr",
      title: "Create a Purchase Request",
      body: (
        <ol class="list-decimal pl-5 space-y-1.5">
          <li>
            Go to <b>Requests</b> and click <b>+ New Request</b>.
          </li>
          <li>Pick the batch when the items are for a specific class.</li>
          <li>
            Pick a category. Don't have one? Hit <b>Manage categories</b> to add one.
          </li>
          <li>Add items: name, quantity, unit, unit price. Add as many rows as needed.</li>
          <li>(Optional) Attach receipts, supplier quotes, or invoices.</li>
          <li>
            Submit. The request goes to the Director's <b>Approvals</b> queue.
          </li>
        </ol>
      ),
    },
    {
      id: "cash-voucher",
      title: "Request cash voucher",
      body: (
        <>
          <p>
            Use <b>Cash Voucher</b> for small operating expenses that need quick release and later
            liquidation. Trainers can request; admins review, release, and close the record.
          </p>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>
              Go to <b>Cash Voucher</b> → <b>New Request</b>.
            </li>
            <li>Enter the purpose, amount, request date, and release method.</li>
            <li>
              If using <b>Digital Transfer</b>, add the mobile number or GCash/transfer details.
            </li>
            <li>Attach support files if available, then submit for review.</li>
          </ol>
        </>
      ),
    },
    {
      id: "cash-voucher-liquidation",
      title: "Liquidate cash voucher",
      body: (
        <>
          <p>
            After cash is released, upload receipts and the liquidation form from the cash voucher
            detail page. The system compares the released amount against the actual amount used and
            shows whether there is excess or shortage.
          </p>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>Open the released cash voucher request.</li>
            <li>Enter the actual amount used and remarks.</li>
            <li>Upload receipts and the liquidation form.</li>
            <li>Submit. Admin can review, record returns when needed, and close the request.</li>
          </ol>
        </>
      ),
    },
    {
      id: "edit-pr",
      title: "Edit a pending Request",
      body: (
        <p>
          While a PR is still <b>pending</b>, open it and click <b>Edit</b> in the top right. You
          can change anything: batch, category, purpose, items, attachments. Once it's approved,
          rejected, or ordered, the Edit button disappears — that's on purpose so the approval
          record stays trustworthy.
        </p>
      ),
    },
    {
      id: "approvals",
      title: "3-signature approval workflow",
      body: (
        <>
          <p>
            Every PR needs three signatures: <b>Requestor → Coordinator → Management</b>. The
            <b> Approvals</b> page has two queues so each role only sees what's theirs.
          </p>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>
              <b>Coordinator queue</b>: PRs in <b>pending</b> status. The coordinator reviews items
              and supporting details, then sends up or sends back. Same-actor guard means the
              requestor can't review their own PR.
            </li>
            <li>
              <b>Management queue</b>: PRs after coordinator review. Management approves (notes
              optional) or rejects (notes required). A different actor than the coordinator must
              sign here too.
            </li>
            <li>The fully-approved PR is now ready to become a PO.</li>
          </ol>
        </>
      ),
    },
    {
      id: "create-po",
      title: "Turn an approved PR into a PO",
      body: (
        <p>
          Open the approved PR and click <b>Create PO</b>. Fill in the supplier, expected delivery
          date, and any notes. Items are pulled in from the PR — they stay frozen on the PO so you
          can compare quote-vs-actual later. The system only allows PO creation from an{" "}
          <b>approved</b> PR. Save it and the PR's status flips to <b>ordered</b>.
        </p>
      ),
    },
    {
      id: "edit-po",
      title: "Edit a Purchase Order",
      body: (
        <p>
          From the PO detail page, click <b>Edit</b>. You can change supplier, estimated delivery,
          status, and notes. Items are not editable (they came from the approved PR). The Edit
          button disappears once the PO is <b>received</b> or <b>cancelled</b>.
        </p>
      ),
    },
    {
      id: "pdf",
      title: "Print or send the PDF",
      body: (
        <p>
          Both PR and PO detail modals have a <b>View PDF</b> button. It opens a clean
          letterhead-style PDF in a new tab — preview first, then save or print from the browser.
          The PDF includes the items table and signature areas. Blank forms are also available from
          the main portal <b>Forms</b> page.
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
            The collapsible sidebar's mid-edge handle gives more room when reviewing wide item
            tables.
          </li>
          <li>Filter by status on the Requests / Orders pages to focus on what's pending.</li>
        </ul>
      ),
    },
  ],
}
