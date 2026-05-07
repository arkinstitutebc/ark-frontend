import { Modal } from "@ark/ui"
import { useDeleteStudent } from "@data/hooks"
import type { Student } from "@data/types"

interface ConfirmDeleteStudentModalProps {
  open: boolean
  onClose: () => void
  student: Student | null
}

export function ConfirmDeleteStudentModal(props: ConfirmDeleteStudentModalProps) {
  const mutation = useDeleteStudent()

  const handleDelete = () => {
    if (!props.student) return
    mutation.mutate(props.student.id, { onSuccess: () => props.onClose() })
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title="Delete student?">
      <div class="space-y-4">
        <p class="text-sm text-foreground">
          This will permanently remove{" "}
          <strong>
            {props.student?.firstName} {props.student?.lastName}
          </strong>{" "}
          and any related attendance and assessment records. This can't be undone.
        </p>
        <div class="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={props.onClose}
            class="px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={mutation.isPending}
            class="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
