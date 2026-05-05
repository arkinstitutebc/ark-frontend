import { useBatches, useStudent, useStudents } from "@data/hooks"
import { createMemo, createSignal, For, Show } from "solid-js"
import { AddStudentModal, EditStudentModal, ViewStudentModal } from "@/components/modals"
import { Icons, StatusBadge } from "@/components/ui"

export default function StudentsPage() {
  const [filterBatch, setFilterBatch] = createSignal<string>("all")
  const [searchQuery, setSearchQuery] = createSignal("")
  const [showAddModal, setShowAddModal] = createSignal(false)
  const [editingStudentId, setEditingStudentId] = createSignal<string | null>(null)
  const [viewingStudentId, setViewingStudentId] = createSignal<string | null>(null)

  const batchesQuery = useBatches()
  const studentsQuery = useStudents(() =>
    filterBatch() !== "all" ? { batchId: filterBatch() } : {}
  )

  const editingStudentQuery = useStudent(() => editingStudentId() || "")
  const viewingStudentQuery = useStudent(() => viewingStudentId() || "")

  const filteredStudents = createMemo(() => {
    let result = studentsQuery.data || []
    if (searchQuery().trim()) {
      const query = searchQuery().toLowerCase()
      result = result.filter(
        (s: any) =>
          s.firstName.toLowerCase().includes(query) ||
          s.lastName.toLowerCase().includes(query) ||
          (s.studentId || "").toLowerCase().includes(query)
      )
    }
    return result
  })

  const getBatchCode = (batchId: string) => {
    const batch = (batchesQuery.data || []).find((b: any) => b.id === batchId)
    return batch?.batchCode || "Unknown"
  }

  const getTrainingLevel = (batchId: string) => {
    const batch = (batchesQuery.data || []).find((b: any) => b.id === batchId)
    return batch?.trainingLevel || ""
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8">
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">Students</h1>
            <p class="text-sm text-gray-500 mt-1">
              {filteredStudents().length} student{filteredStudents().length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            class="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            + Add Student
          </button>
        </div>

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
        <Show when={viewingStudentQuery.data}>
          {student => (
            <ViewStudentModal
              open={viewingStudentId() !== null}
              onClose={() => setViewingStudentId(null)}
              student={student()}
            />
          )}
        </Show>

        <div class="flex items-center gap-3 mb-6">
          <div class="relative">
            <Icons.search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery()}
              onInput={e => setSearchQuery(e.target.value)}
              class="pl-9 pr-4 py-2 w-64 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select
            value={filterBatch()}
            onChange={e => setFilterBatch(e.target.value)}
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Batches</option>
            <For each={batchesQuery.data || []}>
              {(batch: any) => <option value={batch.id}>{batch.batchCode}</option>}
            </For>
          </select>
        </div>

        <Show
          when={!studentsQuery.isLoading}
          fallback={
            <div class="animate-pulse space-y-3">
              <div class="h-12 bg-gray-200 rounded" />
              <div class="h-64 bg-gray-200 rounded" />
            </div>
          }
        >
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Batch
                  </th>
                  <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Level
                  </th>
                  <th class="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <Show
                  when={filteredStudents().length > 0}
                  fallback={
                    <tr>
                      <td colSpan={6} class="py-12 text-center text-gray-500 text-sm">
                        No students found.
                      </td>
                    </tr>
                  }
                >
                  <For each={filteredStudents()}>
                    {(student: any) => (
                      <tr
                        class="border-t border-gray-100 hover:bg-primary/5 transition-colors cursor-pointer"
                        onClick={() => setViewingStudentId(student.id)}
                      >
                        <td class="py-4 px-6 text-sm text-gray-900 font-mono">
                          {student.studentId}
                        </td>
                        <td class="py-4 px-6 text-sm text-gray-900">
                          {student.firstName} {student.lastName}
                        </td>
                        <td class="py-4 px-6 text-sm text-gray-600">
                          {getBatchCode(student.batchId)}
                        </td>
                        <td class="py-4 px-6 text-sm text-primary font-medium">
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
                              setEditingStudentId(student.id)
                            }}
                            class="text-gray-500 hover:text-primary transition-colors p-1"
                            title="Edit student"
                          >
                            <Icons.edit class="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )}
                  </For>
                </Show>
              </tbody>
            </table>
          </div>
        </Show>
      </div>
    </div>
  )
}
