import { useAttendance } from "@data/hooks"
import type { Trainer } from "@data/types"
import { For, Show } from "solid-js"
import { AttendanceStatusBadge, Icons, TrainerStatusBadge } from "@/components/ui"
import { Modal } from "@/components/ui/modal"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount)
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr))
}

interface TrainerDetailModalProps {
  open: boolean
  onClose: () => void
  trainer: Trainer | null
}

export function TrainerDetailModal(props: TrainerDetailModalProps) {
  const attendanceQuery = useAttendance(() =>
    props.trainer?.id ? { trainerId: props.trainer.id } : {}
  )

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
                  <TrainerStatusBadge status={trainer().status} />
                </div>
                <p class="text-sm text-muted mt-1">{trainer().specialization}</p>
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
                  {formatCurrency(Number(trainer().hourlyRate))}
                </p>
              </div>
              <div>
                <p class="text-xs text-muted mb-1">Hire Date</p>
                <p class="text-sm text-foreground">{formatDate(trainer().hireDate)}</p>
              </div>
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
                    <thead class="bg-surface-muted border-b border-border">
                      <tr>
                        <th class="py-2 px-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                          Date
                        </th>
                        <th class="py-2 px-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                          Time In
                        </th>
                        <th class="py-2 px-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                          Time Out
                        </th>
                        <th class="py-2 px-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                          Hours
                        </th>
                        <th class="py-2 px-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={recentAttendance()}>
                        {record => (
                          <tr class="border-t border-border">
                            <td class="py-2 px-3 text-sm text-foreground">
                              {formatDate(record.date)}
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
                              <AttendanceStatusBadge status={record.status} />
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
