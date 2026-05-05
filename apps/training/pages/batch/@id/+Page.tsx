import { useBatch, useBatchStudents } from "@data/hooks"
import type { Batch } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { AddStudentModal, EditBatchModal } from "@/components/modals"
import { Icons } from "@/components/ui/icons"

export default function BatchDetailPage() {
  const pageContext = usePageContext()
  const [showAddStudentModal, setShowAddStudentModal] = createSignal(false)
  const [showEditModal, setShowEditModal] = createSignal(false)

  const id = createMemo(() => pageContext.routeParams.id as string)
  const batchQuery = useBatch(id)
  const studentsQuery = useBatchStudents(id)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: Batch["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700"
      case "In Progress":
        return "bg-blue-100 text-blue-700"
      case "Not Started":
        return "bg-gray-100 text-gray-600"
      case "On Hold":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const getStudentStatusColor = (status: string) => {
    switch (status) {
      case "Certified":
        return "bg-green-100 text-green-700"
      case "In Training":
      case "Enrolled":
        return "bg-blue-100 text-blue-700"
      case "Completed":
        return "bg-gray-100 text-gray-600"
      case "Dropped":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8">
      <div class="max-w-6xl mx-auto">
        <a
          href="/"
          class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-6"
        >
          <Icons.arrowLeft class="w-4 h-4" />
          Back to Batches
        </a>

        <Show
          when={!batchQuery.isLoading}
          fallback={
            <div class="animate-pulse space-y-4">
              <div class="h-10 bg-gray-200 rounded w-1/3" />
              <div class="grid grid-cols-4 gap-4">
                <div class="h-20 bg-gray-200 rounded" />
                <div class="h-20 bg-gray-200 rounded" />
                <div class="h-20 bg-gray-200 rounded" />
                <div class="h-20 bg-gray-200 rounded" />
              </div>
              <div class="h-48 bg-gray-200 rounded" />
            </div>
          }
        >
          <Show
            when={batchQuery.data}
            fallback={
              <div class="text-center py-20">
                <h1 class="text-xl font-semibold text-gray-900 mb-2">Batch not found</h1>
                <p class="text-sm text-gray-500">The batch you're looking for doesn't exist.</p>
              </div>
            }
          >
            {b => (
              <>
                <div class="flex items-start justify-between mb-8">
                  <div>
                    <div class="flex items-center gap-3 mb-2">
                      <h1 class="text-2xl font-semibold text-gray-900">{b().batchCode}</h1>
                      <span
                        class={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(b().status)}`}
                      >
                        {b().status}
                      </span>
                    </div>
                    <p class="text-gray-600">{b().trainingName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Edit Batch
                  </button>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <p class="text-xs text-gray-500 mb-1">Schedule</p>
                    <p class="text-sm font-medium text-gray-900">
                      {formatDate(b().startDate)} – {formatDate(b().endDate)}
                    </p>
                  </div>
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <p class="text-xs text-gray-500 mb-1">Students</p>
                    <p class="text-sm font-medium text-gray-900">{b().studentsEnrolled}</p>
                  </div>
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <p class="text-xs text-gray-500 mb-1">Budget</p>
                    <p class="text-sm font-medium text-gray-900">
                      {formatCurrency(Number(b().budget))}
                    </p>
                  </div>
                  <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <p class="text-xs text-gray-500 mb-1">Level</p>
                    <p class="text-sm font-medium text-gray-900">{b().trainingLevel}</p>
                  </div>
                </div>

                <div class="bg-white rounded-lg border border-gray-200 mb-8">
                  <div class="px-4 py-3 border-b border-gray-100">
                    <h2 class="text-sm font-semibold text-gray-900">Details</h2>
                  </div>
                  <div class="divide-y divide-gray-100">
                    <div class="flex py-4 px-6">
                      <span class="w-32 text-sm text-gray-500">Sponsor</span>
                      <span class="text-sm text-gray-900">{b().senator}</span>
                    </div>
                    <div class="flex py-4 px-6">
                      <span class="w-32 text-sm text-gray-500">Venue</span>
                      <span class="text-sm text-gray-900">{b().venue}</span>
                    </div>
                    <div class="flex py-4 px-6">
                      <span class="w-32 text-sm text-gray-500">Instructor</span>
                      <span class="text-sm text-gray-900">{b().instructor}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-4">
                    <h2 class="text-sm font-semibold text-gray-900">
                      Students ({studentsQuery.data?.length ?? 0})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowAddStudentModal(true)}
                      class="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    >
                      + Add Student
                    </button>
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

                  <Show
                    when={!studentsQuery.isLoading}
                    fallback={<div class="animate-pulse h-48 bg-gray-200 rounded" />}
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
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <Show
                            when={(studentsQuery.data?.length ?? 0) > 0}
                            fallback={
                              <tr>
                                <td colSpan={3} class="py-12 text-center text-gray-500 text-sm">
                                  No students enrolled yet.
                                </td>
                              </tr>
                            }
                          >
                            <For each={studentsQuery.data}>
                              {student => (
                                <tr class="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td class="py-4 px-6 text-sm text-gray-900 font-mono">
                                    {student.studentId}
                                  </td>
                                  <td class="py-4 px-6 text-sm text-gray-900">
                                    {student.firstName} {student.lastName}
                                  </td>
                                  <td class="py-4 px-6">
                                    <span
                                      class={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStudentStatusColor(student.status)}`}
                                    >
                                      {student.status}
                                    </span>
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
              </>
            )}
          </Show>
        </Show>
      </div>
    </div>
  )
}
