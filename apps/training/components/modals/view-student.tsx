import { useBatches } from "@data/hooks"
import type { Student } from "@data/types"
import { Show } from "solid-js"
import { Modal, StatusBadge } from "@/components/ui"
import { Icons } from "@/components/ui/icons"

interface ViewStudentModalProps {
  open: boolean
  onClose: () => void
  student: Student
}

export function ViewStudentModal(props: ViewStudentModalProps) {
  const batchesQuery = useBatches()
  const getBatch = () => (batchesQuery.data || []).find(b => b.id === props.student.batchId)

  return (
    <Modal open={props.open} onClose={props.onClose} title="Student Details" size="lg">
      <div class="space-y-6">
        {/* Header */}
        <div class="flex items-center gap-4 pb-6 border-b border-border">
          <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Icons.user class="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">
              {props.student.firstName} {props.student.middleName} {props.student.lastName}
            </h3>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-sm text-muted">{props.student.studentId}</span>
              <StatusBadge status={props.student.status} />
            </div>
          </div>
        </div>

        {/* Details - Simple Grid */}
        <div class="grid grid-cols-3 gap-6">
          <div>
            <span class="text-xs text-muted">Date of Birth</span>
            <p class="text-sm text-foreground mt-0.5">{props.student.dateOfBirth}</p>
          </div>
          <div>
            <span class="text-xs text-muted">Gender</span>
            <p class="text-sm text-foreground mt-0.5">{props.student.gender}</p>
          </div>
          <div>
            <span class="text-xs text-muted">Batch</span>
            <Show when={getBatch()}>
              {batch => (
                <div class="mt-0.5">
                  <a
                    href={`/batch/${batch().id}`}
                    onClick={() => (window.location.href = `/batch/${batch().id}`)}
                    class="text-sm text-primary hover:underline block"
                  >
                    {batch().batchCode}
                  </a>
                  <span class="text-xs text-muted ml-1">{batch().trainingLevel}</span>
                </div>
              )}
            </Show>
          </div>
          <div class="col-span-3">
            <span class="text-xs text-muted">Address</span>
            <p class="text-sm text-foreground mt-0.5">{props.student.address}</p>
          </div>
          <div>
            <span class="text-xs text-muted">Contact</span>
            <p class="text-sm text-foreground mt-0.5">{props.student.contactNumber}</p>
          </div>
          <div>
            <span class="text-xs text-muted">Email</span>
            <p class="text-sm text-foreground mt-0.5">{props.student.email}</p>
          </div>
          <div>
            <span class="text-xs text-muted">Education</span>
            <p class="text-sm text-foreground mt-0.5">{props.student.educationalAttainment}</p>
          </div>
        </div>

        {/* Close */}
        <div class="flex justify-end pt-4 border-t border-border">
          <button
            type="button"
            onClick={props.onClose}
            class="px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
