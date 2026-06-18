import {
  BackLink,
  Button,
  formatDatePH,
  formatPeso,
  Icons,
  PageContainer,
  statusToneClass,
  toast,
} from "@ark/ui"
import {
  type TrainingAuditEvent,
  useBatch,
  useBatchAudit,
  useBatchStudents,
  useStudent,
} from "@data/hooks"
import { createMemo, createSignal, For, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import {
  AddStudentModal,
  ConfirmDeleteStudentModal,
  EditBatchModal,
  EditStudentModal,
} from "@/components/modals"
import {
  StudentBlockGrid,
  StudentListView,
  type StudentViewMode,
  ViewModeToggle,
} from "@/components/students"

const PUBLIC_FORMS_URL =
  import.meta.env.VITE_PUBLIC_FORMS_URL?.replace(/\/$/, "") || "https://forms.arkinstitutebc.com"
const STUDENT_VIEW_MODE_KEY = "training.batch.students.viewMode"

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
  const batchAuditQuery = useBatchAudit(id)
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

              <BatchActivitySection
                events={batchAuditQuery.data?.items ?? []}
                loading={batchAuditQuery.isFetching}
              />

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
                        <StudentListView
                          students={studentsQuery.data ?? []}
                          onEdit={setEditingStudentId}
                          onDelete={setDeletingStudentId}
                          emptyMessage="No students enrolled yet."
                        />
                      }
                    >
                      <StudentBlockGrid
                        students={studentsQuery.data ?? []}
                        onEdit={setEditingStudentId}
                        onDelete={setDeletingStudentId}
                        emptyMessage="No students enrolled yet."
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

function BatchActivitySection(props: { events: TrainingAuditEvent[]; loading: boolean }) {
  return (
    <section class="mb-6 overflow-hidden rounded-xl border border-border bg-surface">
      <div class="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h2 class="text-sm font-semibold text-foreground">Activity</h2>
        <Show when={props.loading}>
          <span class="text-xs text-muted">Refreshing...</span>
        </Show>
      </div>
      <Show
        when={props.events.length > 0}
        fallback={
          <p class="px-5 py-4 text-sm text-muted">
            {props.loading ? "Loading activity..." : "No batch activity yet."}
          </p>
        }
      >
        <div class="divide-y divide-border">
          <For each={props.events}>{event => <BatchActivityRow event={event} />}</For>
        </div>
      </Show>
    </section>
  )
}

function BatchActivityRow(props: { event: TrainingAuditEvent }) {
  const summary = createMemo(() => batchAuditSummary(props.event))

  return (
    <div class="flex gap-3 px-5 py-3">
      <div class="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icons.clock class="h-3.5 w-3.5" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm font-medium text-foreground">{summary().title}</p>
          <time class="text-xs text-muted">{formatAuditTime(props.event.createdAt)}</time>
        </div>
        <p class="mt-0.5 text-xs text-muted">
          {formatActor(props.event.actor)}
          <Show when={summary().detail}> · {summary().detail}</Show>
        </p>
      </div>
    </div>
  )
}

const batchAuditFields = {
  trainingName: "training",
  trainingLevel: "level",
  batchNo: "batch no.",
  rqm: "RQM",
  senator: "sponsor",
  startDate: "start date",
  endDate: "end date",
  weeklySchedule: "weekly schedule",
  venue: "venue",
  instructor: "instructor",
  budget: "budget",
  status: "status",
} as const

function batchAuditSummary(event: TrainingAuditEvent) {
  if (event.action === "create") return { title: "Batch created", detail: event.note ?? "" }
  if (event.action === "delete") return { title: "Batch deleted", detail: event.note ?? "" }

  const before = asRecord(event.before)
  const after = asRecord(event.after)
  const changed = Object.entries(batchAuditFields)
    .filter(
      ([field]) =>
        before && after && normalizeAuditValue(before[field]) !== normalizeAuditValue(after[field])
    )
    .map(([, label]) => label)

  if (changed.length === 1) return { title: `Updated ${changed[0]}`, detail: event.note ?? "" }
  if (changed.length > 1) {
    return {
      title: `Updated ${changed.length} fields`,
      detail: changed.slice(0, 4).join(", "),
    }
  }

  return { title: "Batch updated", detail: event.note ?? "" }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function normalizeAuditValue(value: unknown) {
  if (value === null || value === undefined) return ""
  return String(value)
}

function formatActor(actor?: string | null) {
  if (!actor) return "System"
  if (actor.includes("@")) return actor.split("@")[0]
  return actor
}

function formatAuditTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
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
