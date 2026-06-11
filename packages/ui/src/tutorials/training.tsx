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
  subtitle: "Batches, schedules, students, documents, and TESDA program records.",
  intro: (
    <p>
      Start here when setting up program delivery. Training is the source of truth for batches and
      student enrollment; Procurement, Billing, and reports reuse this batch data downstream.
    </p>
  ),
  workflow: ["Create batch", "Set schedule", "Enroll students", "Attach records", "Keep current"],
  checklist: [
    "Training type, level, batch number, RQM, dates, and weekly schedule are confirmed.",
    "Venue is marked as On-site or Off-site before the batch is saved.",
    "Student profile details and documents are ready before uploading photos or PSA files.",
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
          photos and PSA certificates, and keep the class schedule current.
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
          <li>Set the training type, level, status, batch number, RQM code, sponsor, and dates.</li>
          <li>
            Add the weekly schedule, then choose <b>On-site</b> or <b>Off-site</b> venue.
          </li>
          <li>Pick an instructor, or choose Other and type the instructor name.</li>
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
            education, employment, optional photo, and PSA certificate. Student IDs are
            auto-generated as <b>STU-YYYY-NNNNN</b>, so do not type them manually.
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
          Venue selection is intentionally simple: use <b>On-site</b> when the class happens inside
          Ark facilities and <b>Off-site</b> when the training happens elsewhere. Keep the exact
          location in notes or supporting records when needed.
        </p>
      ),
    },
    {
      id: "tips",
      title: "Tips",
      body: (
        <ul class="list-disc pl-5 space-y-1.5">
          <li>
            Student photos and certificates are stored as uploaded documents and can be updated from
            the student profile modal.
          </li>
          <li>
            Edit and delete each have a confirm step. There's no undo if you confirm a delete.
          </li>
        </ul>
      ),
    },
  ],
}
