import { Modal, ModalFooter } from "@ark/ui"
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
        <ModalFooter
          onCancel={props.onClose}
          onSubmit={handleDelete}
          submitting={mutation.isPending}
          danger
        />
      </div>
    </Modal>
  )
}
