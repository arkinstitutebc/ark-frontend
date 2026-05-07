import { ConfirmDialog } from "@ark/ui"
import { useDeleteStudent } from "@data/hooks"
import type { Student } from "@data/types"

interface ConfirmDeleteStudentModalProps {
  open: boolean
  onClose: () => void
  student: Student | null
}

/**
 * Thin wrapper around `ConfirmDialog` that wires the delete-student mutation
 * + the contextual student name. Other portals use `ConfirmDialog` directly.
 */
export function ConfirmDeleteStudentModal(props: ConfirmDeleteStudentModalProps) {
  const mutation = useDeleteStudent()

  const handleDelete = () => {
    if (!props.student) return
    mutation.mutate(props.student.id, { onSuccess: () => props.onClose() })
  }

  return (
    <ConfirmDialog
      open={props.open}
      onClose={props.onClose}
      title="Delete student?"
      description={
        <>
          This will permanently remove{" "}
          <strong>
            {props.student?.firstName} {props.student?.lastName}
          </strong>{" "}
          and any related attendance and assessment records. This can't be undone.
        </>
      }
      danger
      pending={mutation.isPending}
      onConfirm={handleDelete}
    />
  )
}
