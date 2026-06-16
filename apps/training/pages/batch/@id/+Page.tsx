import {
  BackLink,
  Button,
  formatDatePH,
  formatPeso,
  Icons,
  PageContainer,
  statusToneClass,
  THead,
  Th,
  toast,
} from "@ark/ui"
import { useBatch, useBatchStudents, useStudent } from "@data/hooks"
import type { Student } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import {
  AddStudentModal,
  ConfirmDeleteStudentModal,
  EditBatchModal,
  EditStudentModal,
} from "@/components/modals"
import { StudentAvatar } from "@/components/ui"

const PUBLIC_FORMS_URL =
  import.meta.env.VITE_PUBLIC_FORMS_URL?.replace(/\/$/, "") || "https://forms.arkinstitutebc.com"
const STUDENT_VIEW_MODE_KEY = "training.batch.students.viewMode"

type StudentViewMode = "list" | "blocks"

function getInitialStudentViewMode(): StudentViewMode {
  if (typeof window === "undefined") return "list"
  return window.localStorage.getItem(STUDENT_VIEW_MODE_KEY) === "blocks" ? "blocks" : "list"
}

export default function BatchDetailPage() {
  const pageContext = usePageContext()
  const [showAddStudentModal, setShowAddStudentModal] = createSignal(false)
  const [showEditModal, setShowEditModal] = createSignal(false)
  const [editingStudentId, setEditingStudentId] = createSignal<string | null>(null)
  const [deletingStudentId, setDeletingStudentId] = createSignal<string | null>(null)
  const [studentViewMode, setStudentViewMode] = createSignal<StudentViewMode>(
    getInitialStudentViewMode()
  )

  const id = createMemo(() => pageContext.routeParams.id as string)
  const batchQuery = useBatch(id)
  const studentsQuery = useBatchStudents(id)
  const editingStudentQuery = useStudent(() => editingStudentId() || "")
  const deletingStudentQuery = useStudent(() => deletingStudentId() || "")

  const publicEnrollmentUrl = () => `${PUBLIC_FORMS_URL}/student/${id()}`

  const copyPublicEnrollmentLink = async () => {
    try {
      await navigator.clipboard.writeText(publicEnrollmentUrl())
      toast.success("Enrollment link copied")
    } catch {
      toast.error("Could not copy link")
    }
  }

  const setStudentView = (mode: StudentViewMode) => {
    setStudentViewMode(mode)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STUDENT_VIEW_MODE_KEY, mode)
    }
  }

  return (
    <PageContainer>
      <div class="mb-6">
        <BackLink href="/">Back to Batches</BackLink>
      </div>

      <Show
        when={!batchQuery.isLoading}
        fallback={
          <div class="animate-pulse space-y-4">
            <div class="h-10 bg-surface-muted rounded w-1/3" />
            <div class="grid grid-cols-4 gap-4">
              <div class="h-20 bg-surface-muted rounded" />
              <div class="h-20 bg-surface-muted rounded" />
              <div class="h-20 bg-surface-muted rounded" />
              <div class="h-20 bg-surface-muted rounded" />
            </div>
            <div class="h-48 bg-surface-muted rounded" />
          </div>
        }
      >
        <Show
          when={batchQuery.data}
          fallback={
            <div class="text-center py-20">
              <h1 class="text-xl font-semibold text-foreground mb-2">Batch not found</h1>
              <p class="text-sm text-muted">The batch you're looking for doesn't exist.</p>
            </div>
          }
        >
          {b => (
            <>
              <section class="mb-6 overflow-hidden rounded-xl border border-border bg-surface">
                <div class="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0">
                    <div class="mb-2 flex flex-wrap items-center gap-3">
                      <h1 class="truncate text-2xl font-semibold text-foreground">
                        {b().batchCode}
                      </h1>
                      <span
                        class={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusToneClass(b().status)}`}
                      >
                        {b().status}
                      </span>
                    </div>
                    <p class="text-muted">{b().trainingName}</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <FormLinkActions
                      href={publicEnrollmentUrl()}
                      onCopy={copyPublicEnrollmentLink}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      class="border border-border bg-surface text-foreground hover:bg-surface-muted"
                      onClick={() => setShowEditModal(true)}
                    >
                      Edit Batch
                    </Button>
                  </div>
                </div>

                <div class="grid gap-px border-t border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryMetric
                    label="Schedule"
                    value={`${formatDatePH(b().startDate)} – ${formatDatePH(b().endDate)}`}
                  />
                  <SummaryMetric label="Weekly" value={b().weeklySchedule || "Not set"} />
                  <SummaryMetric label="Students" value={b().studentsEnrolled} />
                  <SummaryMetric
                    label="Budget"
                    value={Number(b().budget) > 0 ? formatPeso(b().budget) : "Not set"}
                  />
                </div>
              </section>

              <section class="mb-6 overflow-hidden rounded-xl border border-border bg-surface">
                <div class="border-b border-border px-5 py-3">
                  <h2 class="text-sm font-semibold text-foreground">Details</h2>
                </div>
                <div class="grid gap-3 bg-surface p-4 md:grid-cols-2 xl:grid-cols-3">
                  <DetailItem label="Batch No." value={b().batchNo} />
                  <DetailItem label="RQM" value={b().rqm} />
                  <DetailItem label="Sponsor" value={b().senator} />
                  <DetailItem label="Venue" value={b().venue} />
                  <DetailItem label="Instructor" value={b().instructor} />
                </div>
              </section>

              <div>
                <div class="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 class="text-sm font-semibold text-foreground">
                    Students ({studentsQuery.data?.length ?? 0})
                  </h2>
                  <div class="flex flex-wrap items-center gap-2">
                    <ViewModeToggle value={studentViewMode()} onChange={setStudentView} />
                    <button
                      type="button"
                      onClick={() => setShowAddStudentModal(true)}
                      class="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    >
                      + Add Student
                    </button>
                  </div>
                </div>

                <AddStudentModal
                  open={showAddStudentModal()}
                  onClose={() => setShowAddStudentModal(false)}
                  defaultBatchId={id()}
                />
                <EditBatchModal
                  open={showEditModal()}
                  onClose={() => setShowEditModal(false)}
                  batch={b()}
                />
                <ConfirmDeleteStudentModal
                  open={deletingStudentId() !== null}
                  onClose={() => setDeletingStudentId(null)}
                  student={deletingStudentQuery.data ?? null}
                />
                <Show when={editingStudentQuery.data}>
                  {student => (
                    <EditStudentModal
                      open={editingStudentId() !== null}
                      onClose={() => setEditingStudentId(null)}
                      student={student()}
                    />
                  )}
                </Show>

                <Show
                  when={!studentsQuery.isLoading}
                  fallback={<div class="animate-pulse h-48 bg-surface-muted rounded" />}
                >
                  <div class="bg-surface rounded-xl border border-border overflow-hidden">
                    <Show
                      when={studentViewMode() === "blocks"}
                      fallback={
                        <StudentTable
                          students={studentsQuery.data ?? []}
                          onEdit={setEditingStudentId}
                          onDelete={setDeletingStudentId}
                        />
                      }
                    >
                      <StudentBlockGrid
                        students={studentsQuery.data ?? []}
                        onEdit={setEditingStudentId}
                        onDelete={setDeletingStudentId}
                      />
                    </Show>
                  </div>
                </Show>
              </div>
            </>
          )}
        </Show>
      </Show>
    </PageContainer>
  )
}

function SummaryMetric(props: { label: string; value: string | number }) {
  return (
    <div class="min-w-0 bg-surface px-5 py-4">
      <p class="text-xs font-semibold uppercase tracking-wide text-muted">{props.label}</p>
      <p class="mt-1 truncate text-base font-semibold text-foreground">{props.value}</p>
    </div>
  )
}

function DetailItem(props: { label: string; value?: string | number | null }) {
  return (
    <div class="min-w-0 rounded-lg border border-border bg-surface px-4 py-3">
      <p class="text-xs font-semibold uppercase tracking-wide text-muted">{props.label}</p>
      <p class="mt-1 truncate text-sm font-medium text-foreground">{props.value || "Not set"}</p>
    </div>
  )
}

function FormLinkActions(props: { href: string; onCopy: () => void }) {
  return (
    <div class="inline-flex overflow-hidden rounded-lg border border-border bg-surface">
      <a
        href={props.href}
        target="_blank"
        rel="noreferrer"
        class="inline-flex h-10 items-center justify-center gap-2 border-r border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
      >
        <Icons.externalLink class="h-4 w-4" />
        <span>Open form</span>
      </a>
      <button
        type="button"
        onClick={props.onCopy}
        aria-label="Copy enrollment form link"
        title="Copy enrollment form link"
        class="inline-flex h-10 w-10 items-center justify-center text-muted transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        <Icons.copy class="h-4 w-4" />
      </button>
    </div>
  )
}

function ViewModeToggle(props: {
  value: StudentViewMode
  onChange: (mode: StudentViewMode) => void
}) {
  return (
    <div class="inline-flex rounded-lg border border-border bg-surface-muted p-0.5">
      <button
        type="button"
        onClick={() => props.onChange("list")}
        class={`rounded-md p-2 transition-colors ${
          props.value === "list"
            ? "bg-surface text-foreground shadow-sm"
            : "text-muted hover:text-foreground"
        }`}
        aria-pressed={props.value === "list"}
        aria-label="List view"
        title="List view"
      >
        <Icons.list class="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => props.onChange("blocks")}
        class={`rounded-md p-2 transition-colors ${
          props.value === "blocks"
            ? "bg-surface text-foreground shadow-sm"
            : "text-muted hover:text-foreground"
        }`}
        aria-pressed={props.value === "blocks"}
        aria-label="Block view"
        title="Block view"
      >
        <Icons.layoutGrid class="h-4 w-4" />
      </button>
    </div>
  )
}

function StudentTable(props: {
  students: Student[]
  onEdit: (studentId: string) => void
  onDelete: (studentId: string) => void
}) {
  return (
    <div class="max-h-[560px] overflow-auto">
      <table class="w-full min-w-[720px]">
        <THead>
          <Th>Student ID</Th>
          <Th>Photo</Th>
          <Th>Name</Th>
          <Th>Status</Th>
          <Th align="right">Actions</Th>
        </THead>
        <tbody>
          <Show
            when={props.students.length > 0}
            fallback={
              <tr>
                <td colSpan={5} class="py-12 text-center text-muted text-sm">
                  No students enrolled yet.
                </td>
              </tr>
            }
          >
            <For each={props.students}>
              {student => (
                <tr
                  class="border-t border-border hover:bg-primary/5 transition-colors cursor-pointer"
                  onClick={() => props.onEdit(student.id)}
                  title="Click to edit"
                >
                  <td class="py-4 px-6 text-sm text-foreground font-mono">{student.studentId}</td>
                  <td class="py-4 px-6">
                    <StudentAvatar student={student} size="sm" />
                  </td>
                  <td class="py-4 px-6 text-sm text-foreground">
                    <div class="min-w-0">
                      <p class="truncate font-medium text-foreground">
                        {student.firstName} {student.lastName}
                      </p>
                      <p class="truncate text-xs text-muted">
                        {student.email || student.contactNumber || "No contact yet"}
                      </p>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <span
                      class={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusToneClass(student.status)}`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td class="py-4 px-6 text-right">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        props.onDelete(student.id)
                      }}
                      class="text-muted hover:text-red-500 transition-colors p-1"
                      title="Delete student"
                    >
                      <Icons.trash class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )}
            </For>
          </Show>
        </tbody>
      </table>
    </div>
  )
}

function StudentBlockGrid(props: {
  students: Student[]
  onEdit: (studentId: string) => void
  onDelete: (studentId: string) => void
}) {
  return (
    <Show
      when={props.students.length > 0}
      fallback={<div class="py-12 text-center text-muted text-sm">No students enrolled yet.</div>}
    >
      <div class="max-h-[620px] overflow-auto p-4">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          <For each={props.students}>
            {student => (
              <div class="group relative min-w-0">
                <button
                  type="button"
                  onClick={() => props.onEdit(student.id)}
                  class="w-full min-w-0 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div class="flex flex-col items-center text-center">
                    <StudentAvatar student={student} size="lg" />
                    <p class="mt-3 w-full truncate text-sm font-semibold text-foreground">
                      {student.firstName} {student.lastName}
                    </p>
                    <p class="mt-1 w-full truncate font-mono text-[11px] text-muted">
                      {student.studentId}
                    </p>
                    <p class="mt-1 w-full truncate text-xs text-muted">
                      {student.contactNumber || student.email || "No contact yet"}
                    </p>
                    <span
                      class={`mt-3 inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusToneClass(student.status)}`}
                    >
                      {student.status}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation()
                    props.onDelete(student.id)
                  }}
                  class="absolute right-2 top-2 rounded-md p-1 text-muted opacity-100 transition-colors hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Delete student"
                >
                  <Icons.trash class="h-4 w-4" />
                </button>
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  )
}
