import {
  BackLink,
  formatDatePH,
  formatPeso,
  Icons,
  PageContainer,
  statusToneClass,
  THead,
  Th,
} from "@ark/ui"
import { useBatch, useBatchStudents, useStudent } from "@data/hooks"
import { createMemo, createSignal, For, Show } from "solid-js"
import { usePageContext } from "vike-solid/usePageContext"
import { AddStudentModal, ConfirmDeleteStudentModal, EditBatchModal } from "@/components/modals"

export default function BatchDetailPage() {
  const pageContext = usePageContext()
  const [showAddStudentModal, setShowAddStudentModal] = createSignal(false)
  const [showEditModal, setShowEditModal] = createSignal(false)
  const [deletingStudentId, setDeletingStudentId] = createSignal<string | null>(null)

  const id = createMemo(() => pageContext.routeParams.id as string)
  const batchQuery = useBatch(id)
  const studentsQuery = useBatchStudents(id)
  const deletingStudentQuery = useStudent(() => deletingStudentId() || "")

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
              <div class="flex items-start justify-between mb-8">
                <div>
                  <div class="flex items-center gap-3 mb-2">
                    <h1 class="text-2xl font-semibold text-foreground">{b().batchCode}</h1>
                    <span
                      class={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusToneClass(b().status)}`}
                    >
                      {b().status}
                    </span>
                  </div>
                  <p class="text-muted">{b().trainingName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  class="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors"
                >
                  Edit Batch
                </button>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-surface rounded-lg border border-border p-4">
                  <p class="text-xs text-muted mb-1">Schedule</p>
                  <p class="text-sm font-medium text-foreground">
                    {formatDatePH(b().startDate)} – {formatDatePH(b().endDate)}
                  </p>
                </div>
                <div class="bg-surface rounded-lg border border-border p-4">
                  <p class="text-xs text-muted mb-1">Students</p>
                  <p class="text-sm font-medium text-foreground">{b().studentsEnrolled}</p>
                </div>
                <div class="bg-surface rounded-lg border border-border p-4">
                  <p class="text-xs text-muted mb-1">Budget</p>
                  <p class="text-sm font-medium text-foreground">{formatPeso(b().budget)}</p>
                </div>
                <div class="bg-surface rounded-lg border border-border p-4">
                  <p class="text-xs text-muted mb-1">Level</p>
                  <p class="text-sm font-medium text-foreground">{b().trainingLevel}</p>
                </div>
              </div>

              <div class="bg-surface rounded-lg border border-border mb-8">
                <div class="px-4 py-3 border-b border-border">
                  <h2 class="text-sm font-semibold text-foreground">Details</h2>
                </div>
                <div class="divide-y divide-border">
                  <div class="flex py-4 px-6">
                    <span class="w-32 text-sm text-muted">Sponsor</span>
                    <span class="text-sm text-foreground">{b().senator}</span>
                  </div>
                  <div class="flex py-4 px-6">
                    <span class="w-32 text-sm text-muted">Venue</span>
                    <span class="text-sm text-foreground">{b().venue}</span>
                  </div>
                  <div class="flex py-4 px-6">
                    <span class="w-32 text-sm text-muted">Instructor</span>
                    <span class="text-sm text-foreground">{b().instructor}</span>
                  </div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-sm font-semibold text-foreground">
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
                <ConfirmDeleteStudentModal
                  open={deletingStudentId() !== null}
                  onClose={() => setDeletingStudentId(null)}
                  student={deletingStudentQuery.data ?? null}
                />

                <Show
                  when={!studentsQuery.isLoading}
                  fallback={<div class="animate-pulse h-48 bg-surface-muted rounded" />}
                >
                  <div class="bg-surface rounded-lg border border-border overflow-hidden">
                    <table class="w-full">
                      <THead>
                        <Th>Student ID</Th>
                        <Th>Name</Th>
                        <Th>Status</Th>
                        <Th align="right">Actions</Th>
                      </THead>
                      <tbody>
                        <Show
                          when={(studentsQuery.data?.length ?? 0) > 0}
                          fallback={
                            <tr>
                              <td colSpan={4} class="py-12 text-center text-muted text-sm">
                                No students enrolled yet.
                              </td>
                            </tr>
                          }
                        >
                          <For each={studentsQuery.data}>
                            {student => (
                              <tr class="border-t border-border hover:bg-surface-muted transition-colors">
                                <td class="py-4 px-6 text-sm text-foreground font-mono">
                                  {student.studentId}
                                </td>
                                <td class="py-4 px-6 text-sm text-foreground">
                                  {student.firstName} {student.lastName}
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
                                    onClick={() => setDeletingStudentId(student.id)}
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
                </Show>
              </div>
            </>
          )}
        </Show>
      </Show>
    </PageContainer>
  )
}
