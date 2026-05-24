import type { JSX } from "solid-js"
import type { TutorialSection } from "../layout/tutorial-shell"

export const trainingTutorial: {
  title: string
  subtitle: string
  intro?: JSX.Element
  workflow?: string[]
  checklist?: string[]
  actions?: { label: string; href: string }[]
  sections: TutorialSection[]
} = {
  title: "How to use the Training portal",
  subtitle: "Batches, students, venues, and TESDA program records.",
  intro: (
    <p>
      Start here when setting up program delivery. Training is the source of truth for batches and
      student enrollment; Procurement, Billing, and reports reuse this batch data downstream.
    </p>
  ),
  workflow: ["Create batch", "Enroll students", "Attach records", "Keep batch current"],
  checklist: [
    "Program name, level, dates, venue, and sponsor are confirmed.",
    "Student profile details are ready before uploading photos or PSA files.",
    "Batch budget is reviewed because Procurement reads it for spend checks.",
  ],
  actions: [
    { label: "Open Batches", href: "/batch" },
    { label: "Open Students", href: "/students" },
  ],
  sections: [
    {
      id: "overview",
      title: "What this portal is for",
      body: (
        <p>
          Training is the home for <b>batches</b> (a class running a TESDA program for a date range)
          and the <b>students</b> enrolled in them. You'll create batches, enroll students, manage
          their photos and PSA certificates, and track venues.
        </p>
      ),
    },
    {
      id: "create-batch",
      title: "Create a batch",
      body: (
        <ol class="list-decimal pl-5 space-y-1.5">
          <li>
            Go to <b>Batches</b> and click <b>+ New Batch</b>.
          </li>
          <li>Set the program name, batch code, start/end dates, and budget.</li>
          <li>Pick a venue (or add one via Manage Venues).</li>
          <li>Save. The batch shows up immediately on the dashboard.</li>
        </ol>
      ),
    },
    {
      id: "enroll-student",
      title: "Enroll a student",
      body: (
        <>
          <p>
            Open a batch detail page and click <b>+ Add Student</b>. Fill in name, contact info,
            optional photo + PSA cert (uploads go straight to Cloudinary). Student IDs are
            auto-generated as <b>STU-YYYY-NNNNN</b>.
          </p>
          <p>
            You can also bulk-add from the standalone <b>Students</b> page, then assign batches
            afterwards.
          </p>
          <p>
            Keep names and attachments clean before saving. These records are reused in billing,
            reporting, and printed references.
          </p>
        </>
      ),
    },
    {
      id: "venues",
      title: "Manage venues",
      body: (
        <p>
          Click <b>Manage Venues</b> from any batch form to add, rename, or delete a venue. Existing
          batches keep the venue name they were saved with even if you rename it later.
        </p>
      ),
    },
    {
      id: "tips",
      title: "Tips",
      body: (
        <ul class="list-disc pl-5 space-y-1.5">
          <li>
            Photos and certificates upload directly to Cloudinary — no upload size cap on the form.
          </li>
          <li>
            Batch budgets are visible from the procurement portal too — they prevent over-spend.
          </li>
          <li>
            Edit and delete each have a confirm step. There's no undo if you confirm a delete.
          </li>
        </ul>
      ),
    },
  ],
}
