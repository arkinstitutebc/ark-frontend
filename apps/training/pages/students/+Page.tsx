import { Button, Icons, PageContainer, PageHeader, Select, StatusBadge, THead, Th } from "@ark/ui"
import { useBatches, useStudent, useStudents } from "@data/hooks"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { AddStudentModal, ConfirmDeleteStudentModal, EditStudentModal } from "@/components/modals"
import { StudentAvatar } from "@/components/ui"

export default function StudentsPage() {
  const [filterBatch, setFilterBatch] = createSignal<string>("all")
  const [searchQuery, setSearchQuery] = createSignal("")
  const [page, setPage] = createSignal(1)
  const [showAddModal, setShowAddModal] = createSignal(false)
  const [editingStudentId, setEditingStudentId] = createSignal<string | null>(null)
  const [deletingStudentId, setDeletingStudentId] = createSignal<string | null>(null)

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

  const getTrainingLevel = (batchId: string) => {
    const batch = (batchesQuery.data || []).find(b => b.id === batchId)
    return batch?.trainingLevel || ""
  }

  const activeCount = createMemo(
    () => students().filter(s => s.status === "Enrolled" || s.status === "In Training").length
  )

  return (
    <PageContainer>
      <PageHeader
        title="Students"
        subtitle="Enrollment records, batch assignment, contact details, and documents."
        action={
          <Button type="button" size="sm" onClick={() => setShowAddModal(true)}>
            <Icons.plus class="h-4 w-4" />
            Add Student
          </Button>
        }
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

      <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted">Total students</p>
          <p class="mt-2 text-2xl font-semibold text-foreground">{totalStudents()}</p>
        </div>
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted">
            Active in current view
          </p>
          <p class="mt-2 text-2xl font-semibold text-foreground">{activeCount()}</p>
        </div>
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted">Shown page</p>
          <p class="mt-2 text-2xl font-semibold text-foreground">{students().length}</p>
        </div>
      </div>

      <div class="bg-surface border border-border rounded-xl p-3 mb-6 flex flex-wrap items-center gap-3">
        <div class="relative flex-1 min-w-[220px]">
          <Icons.search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or student ID..."
            value={searchQuery()}
            onInput={e => setSearchQuery(e.target.value)}
            class="pl-9 pr-3 py-2.5 w-full border border-border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div class="w-full sm:w-64">
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
            class="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary transition-colors px-2 py-2.5"
          >
            <Icons.close class="h-4 w-4" />
            Clear
          </button>
        </Show>
      </div>

      <Show
        when={!studentsQuery.isLoading}
        fallback={
          <div class="animate-pulse space-y-3">
            <div class="h-12 bg-surface-muted rounded" />
            <div class="h-64 bg-surface-muted rounded" />
          </div>
        }
      >
        <div class="bg-surface rounded-xl border border-border overflow-hidden">
          <div class="max-h-[640px] overflow-auto">
            <table class="w-full min-w-[760px]">
              <THead>
                <Th>Student ID</Th>
                <Th>Name</Th>
                <Th>Batch</Th>
                <Th>Level</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </THead>
              <tbody>
                <Show
                  when={students().length > 0}
                  fallback={
                    <tr>
                      <td colSpan={6} class="py-12 text-center text-muted text-sm">
                        No students found.
                      </td>
                    </tr>
                  }
                >
                  <For each={students()}>
                    {student => (
                      <tr
                        class="border-t border-border hover:bg-primary/5 transition-colors cursor-pointer"
                        onClick={() => setEditingStudentId(student.id)}
                        title="Click to edit"
                      >
                        <td class="py-4 px-6 text-sm text-foreground font-mono">
                          {student.studentId || "—"}
                        </td>
                        <td class="py-4 px-6 text-sm text-foreground">
                          <div class="flex items-center gap-3">
                            <StudentAvatar student={student} />
                            <div>
                              <p class="font-medium text-foreground">
                                {student.firstName} {student.lastName}
                              </p>
                              <p class="text-xs text-muted">
                                {student.email || student.contactNumber || "No contact yet"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td class="py-4 px-6 text-sm text-muted">
                          {getBatchCode(student.batchId)}
                        </td>
                        <td class="py-4 px-6 text-sm font-medium text-foreground">
                          {getTrainingLevel(student.batchId)}
                        </td>
                        <td class="py-4 px-6">
                          <StatusBadge status={student.status} />
                        </td>
                        <td class="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation()
                              setDeletingStudentId(student.id)
                            }}
                            class="rounded-md p-1 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
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
        </div>
      </Show>
    </PageContainer>
  )
}
