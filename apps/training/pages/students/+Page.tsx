import { Button, Icons, PageContainer, PageHeader, Select } from "@ark/ui"
import { useBatches, useStudent, useStudents } from "@data/hooks"
import { createEffect, createMemo, createSignal, Show } from "solid-js"
import { AddStudentModal, ConfirmDeleteStudentModal, EditStudentModal } from "@/components/modals"
import {
  StudentBlockGrid,
  StudentListView,
  type StudentViewMode,
  ViewModeToggle,
} from "@/components/students"

const STUDENTS_VIEW_MODE_KEY = "training.students.viewMode"

function getInitialStudentViewMode(): StudentViewMode {
  if (typeof window === "undefined") return "list"
  return window.localStorage.getItem(STUDENTS_VIEW_MODE_KEY) === "blocks" ? "blocks" : "list"
}

export default function StudentsPage() {
  const [filterBatch, setFilterBatch] = createSignal<string>("all")
  const [searchQuery, setSearchQuery] = createSignal("")
  const [page, setPage] = createSignal(1)
  const [showAddModal, setShowAddModal] = createSignal(false)
  const [editingStudentId, setEditingStudentId] = createSignal<string | null>(null)
  const [deletingStudentId, setDeletingStudentId] = createSignal<string | null>(null)
  const [studentViewMode, setStudentViewMode] = createSignal<StudentViewMode>(
    getInitialStudentViewMode()
  )

  const batchesQuery = useBatches()
  const studentsQuery = useStudents(() => ({
    ...(filterBatch() !== "all" ? { batchId: filterBatch() } : {}),
    page: page(),
    limit: 20,
    search: searchQuery().trim() || undefined,
  }))

  const editingStudentQuery = useStudent(() => editingStudentId() || "")
  const deletingStudentQuery = useStudent(() => deletingStudentId() || "")

  const students = createMemo(() => studentsQuery.data?.items ?? [])
  const totalStudents = createMemo(() => studentsQuery.data?.total ?? 0)
  const pageCount = createMemo(() =>
    studentsQuery.data
      ? Math.max(1, Math.ceil(studentsQuery.data.total / studentsQuery.data.limit))
      : 1
  )

  createEffect(() => {
    filterBatch()
    searchQuery()
    setPage(1)
  })

  const filtersActive = createMemo(() => filterBatch() !== "all" || searchQuery().trim().length > 0)
  const clearFilters = () => {
    setFilterBatch("all")
    setSearchQuery("")
  }

  const batchFilterOptions = createMemo(() => [
    { label: "All Batches", value: "all" },
    ...(batchesQuery.data ?? []).map(b => ({
      label: `${b.batchCode} — ${b.trainingName}`,
      value: b.id,
    })),
  ])

  const getBatchCode = (batchId: string) => {
    const batch = (batchesQuery.data || []).find(b => b.id === batchId)
    return batch?.batchCode || "Unknown"
  }

  const getBatch = (batchId: string) => {
    return (batchesQuery.data || []).find(b => b.id === batchId)
  }

  const getSelectedBatchLabel = () => {
    if (filterBatch() === "all") return "All batches"
    return getBatchCode(filterBatch())
  }

  const shownRange = createMemo(() => {
    const data = studentsQuery.data
    if (!data || data.total === 0) return "0 shown"
    const start = (data.page - 1) * data.limit + 1
    const end = Math.min(data.page * data.limit, data.total)
    return `${start}-${end} shown`
  })

  const emptyMessage = createMemo(() =>
    filtersActive() ? "No matching students." : "No students enrolled yet."
  )

  const setStudentView = (mode: StudentViewMode) => {
    setStudentViewMode(mode)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STUDENTS_VIEW_MODE_KEY, mode)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Students"
        subtitle="Enrollment records, batch assignment, contact details, and documents."
      />

      <AddStudentModal open={showAddModal()} onClose={() => setShowAddModal(false)} />
      <Show when={editingStudentQuery.data}>
        {student => (
          <EditStudentModal
            open={editingStudentId() !== null}
            onClose={() => setEditingStudentId(null)}
            student={student()}
          />
        )}
      </Show>
      <ConfirmDeleteStudentModal
        open={deletingStudentId() !== null}
        onClose={() => setDeletingStudentId(null)}
        student={deletingStudentQuery.data ?? null}
      />

      <section class="overflow-hidden rounded-xl border border-border bg-surface">
        <div class="space-y-4 border-b border-border p-4">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-base font-semibold text-foreground">Student Directory</h2>
                <span class="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted">
                  {totalStudents()} total
                </span>
                <span class="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted">
                  {shownRange()}
                </span>
                <Show when={filtersActive()}>
                  <span class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {getSelectedBatchLabel()}
                  </span>
                </Show>
              </div>
              <p class="mt-1 text-sm text-muted">
                Search records, review student photos, and update profiles from one view.
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <ViewModeToggle value={studentViewMode()} onChange={setStudentView} />
              <Button type="button" size="sm" onClick={() => setShowAddModal(true)}>
                <Icons.plus class="h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div class="relative min-w-[220px] flex-1">
              <Icons.search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search by name or student ID..."
                value={searchQuery()}
                onInput={e => setSearchQuery(e.target.value)}
                class="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div class="w-full sm:w-72">
              <Select
                options={batchFilterOptions()}
                value={filterBatch()}
                onChange={v => setFilterBatch(v)}
                placeholder="All Batches"
                ariaLabel="Filter by batch"
              />
            </div>
            <Show when={filtersActive()}>
              <button
                type="button"
                onClick={clearFilters}
                class="inline-flex items-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-primary"
              >
                <Icons.close class="h-4 w-4" />
                Clear
              </button>
            </Show>
          </div>
        </div>

        <Show
          when={!studentsQuery.isLoading}
          fallback={
            <div class="animate-pulse space-y-3 p-4">
              <div class="h-12 rounded bg-surface-muted" />
              <div class="h-12 rounded bg-surface-muted" />
              <div class="h-12 rounded bg-surface-muted" />
              <div class="h-12 rounded bg-surface-muted" />
            </div>
          }
        >
          <Show
            when={studentViewMode() === "blocks"}
            fallback={
              <StudentListView
                students={students()}
                onEdit={setEditingStudentId}
                onDelete={setDeletingStudentId}
                getBatch={getBatch}
                emptyMessage={emptyMessage()}
              />
            }
          >
            <StudentBlockGrid
              students={students()}
              onEdit={setEditingStudentId}
              onDelete={setDeletingStudentId}
              getBatch={getBatch}
              emptyMessage={emptyMessage()}
            />
          </Show>

          <Show when={studentsQuery.data && totalStudents() > studentsQuery.data.limit}>
            <div class="flex items-center justify-between border-t border-border px-5 py-3">
              <p class="text-xs text-muted">
                Page {page()} of {pageCount()} · {totalStudents()} students
              </p>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page() <= 1 || studentsQuery.isFetching}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  class="px-3 py-1.5 rounded-md border border-border text-xs font-medium text-foreground hover:bg-surface-muted disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page() >= pageCount() || studentsQuery.isFetching}
                  onClick={() => setPage(p => Math.min(pageCount(), p + 1))}
                  class="px-3 py-1.5 rounded-md border border-border text-xs font-medium text-foreground hover:bg-surface-muted disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </Show>
        </Show>
      </section>
    </PageContainer>
  )
}
