import { Button, formatDatePH, formatPeso, Modal, THead, Th } from "@ark/ui"
import { useAttendance, useTrainerAssignments } from "@data/hooks"
import type { Trainer } from "@data/types"
import { For, Show } from "solid-js"
import { Icons, StatusBadge } from "@/components/ui"

interface TrainerDetailModalProps {
  open: boolean
  onClose: () => void
  trainer: Trainer | null
  onEdit?: (trainer: Trainer) => void
  onDelete?: (trainer: Trainer) => void
  deleting?: boolean
}

export function TrainerDetailModal(props: TrainerDetailModalProps) {
  const attendanceQuery = useAttendance(() =>
    props.trainer?.id ? { trainerId: props.trainer.id } : {}
  )
  const assignmentsQuery = useTrainerAssignments(() => props.trainer?.id)

  const recentAttendance = () => {
    if (!props.trainer || !attendanceQuery.data) return []
    return [...attendanceQuery.data].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title="Trainer Details" size="lg">
      <Show when={props.trainer}>
        {trainer => (
          <div class="space-y-6">
            <div class="flex items-start gap-4">
              <div class="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm flex-shrink-0">
                <Icons.user class="w-7 h-7 text-white" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-3">
                  <h3 class="text-lg font-semibold text-foreground">{trainer().name}</h3>
                  <StatusBadge status={trainer().status} />
                </div>
                <p class="text-sm text-muted mt-1">{trainer().specialization}</p>
              </div>
              <div class="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => props.onEdit?.(trainer())}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="text-red-700 hover:bg-red-50"
                  disabled={props.deleting}
                  onClick={() => props.onDelete?.(trainer())}
                >
                  Delete
                </Button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-muted mb-1">Email</p>
                <p class="text-sm text-foreground">{trainer().email || "—"}</p>
              </div>
              <div>
                <p class="text-xs text-muted mb-1">Phone</p>
                <p class="text-sm text-foreground">{trainer().phone || "—"}</p>
              </div>
              <div>
                <p class="text-xs text-muted mb-1">Hourly Rate</p>
                <p class="text-sm text-foreground">
                  {Number(trainer().hourlyRate) > 0
                    ? formatPeso(Number(trainer().hourlyRate))
                    : "—"}
                </p>
              </div>
              <div>
                <p class="text-xs text-muted mb-1">Hire Date</p>
                <p class="text-sm text-foreground">
                  {trainer().hireDate ? formatDatePH(trainer().hireDate) : "—"}
                </p>
              </div>
            </div>

            <div>
              <h4 class="text-sm font-semibold text-foreground mb-3">Batches & Fees</h4>
              <Show
                when={(assignmentsQuery.data?.length ?? 0) > 0}
                fallback={
                  <p class="text-sm text-muted">
                    {assignmentsQuery.isPending ? "Loading..." : "No batches assigned."}
                  </p>
                }
              >
                <div class="space-y-2">
                  <For each={assignmentsQuery.data ?? []}>
                    {row => (
                      <div class="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface-muted p-3 text-sm">
                        <div>
                          <p class="font-medium">
                            {row.batch.trainingOfferingLabel ?? row.batch.trainingName}
                          </p>
                          <p class="text-xs text-muted">
                            {row.batch.batchCode} ·{" "}
                            {row.batch.trainingSchemeLabel ?? "Legacy scheme"} · {row.batch.status}
                          </p>
                        </div>
                        <div class="shrink-0 text-right">
                          <p>{formatPeso(Number(row.assignment.fixedFee))} fee</p>
                          <p class="text-xs text-muted">
                            {formatPeso(row.paidAmount)} paid · {formatPeso(row.outstandingAmount)}{" "}
                            due
                          </p>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            <div>
              <h4 class="text-sm font-semibold text-foreground mb-3">Recent Attendance</h4>
              <Show
                when={recentAttendance().length > 0}
                fallback={
                  <p class="text-sm text-muted">
                    {attendanceQuery.isPending ? "Loading..." : "No attendance records found."}
                  </p>
                }
              >
                <div class="bg-surface-muted rounded-lg border border-border overflow-hidden">
                  <table class="w-full">
                    <THead>
                      <Th size="compact">Date</Th>
                      <Th size="compact">Time In</Th>
                      <Th size="compact">Time Out</Th>
                      <Th size="compact" align="right">
                        Hours
                      </Th>
                      <Th size="compact">Status</Th>
                    </THead>
                    <tbody>
                      <For each={recentAttendance()}>
                        {record => (
                          <tr class="border-t border-border">
                            <td class="py-2 px-3 text-sm text-foreground">
                              {formatDatePH(record.date)}
                            </td>
                            <td class="py-2 px-3 text-sm text-muted font-mono">
                              {record.timeIn || "—"}
                            </td>
                            <td class="py-2 px-3 text-sm text-muted font-mono">
                              {record.timeOut || "—"}
                            </td>
                            <td class="py-2 px-3 text-sm text-foreground text-right">
                              {record.hoursWorked}
                            </td>
                            <td class="py-2 px-3">
                              <StatusBadge status={record.status} />
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </Show>
            </div>
          </div>
        )}
      </Show>
    </Modal>
  )
}
