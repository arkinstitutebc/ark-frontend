import { Icons, StatusBadge, THead, Th } from "@ark/ui"
import type { Batch, Student } from "@data/types"
import { For, Show } from "solid-js"
import { StudentAvatar } from "@/components/ui"

type BatchLookup = (batchId: string) => Batch | undefined

interface StudentDirectoryProps {
  students: Student[]
  onEdit: (studentId: string) => void
  onDelete: (studentId: string) => void
  getBatch?: BatchLookup
  emptyMessage?: string
}

function fullName(student: Student) {
  return `${student.firstName} ${student.lastName}`.trim()
}

function contactLine(student: Student) {
  return student.email || student.contactNumber || "No contact yet"
}

function batchCode(student: Student, getBatch?: BatchLookup) {
  return getBatch?.(student.batchId)?.batchCode || "Unknown batch"
}

function trainingLine(student: Student, getBatch?: BatchLookup) {
  const batch = getBatch?.(student.batchId)
  if (!batch) return ""
  return `${batch.trainingName} ${batch.trainingLevel}`
}

export function StudentListView(props: StudentDirectoryProps) {
  const showTraining = () => Boolean(props.getBatch)

  return (
    <div class="max-h-[640px] overflow-auto">
      <table class="w-full min-w-[760px]">
        <THead>
          <Th>Student ID</Th>
          <Th>Name</Th>
          <Show when={showTraining()}>
            <Th>Training</Th>
          </Show>
          <Th>Status</Th>
          <Th align="right">Actions</Th>
        </THead>
        <tbody>
          <Show
            when={props.students.length > 0}
            fallback={
              <tr>
                <td colSpan={showTraining() ? 5 : 4} class="py-12 text-center text-sm text-muted">
                  {props.emptyMessage || "No students found."}
                </td>
              </tr>
            }
          >
            <For each={props.students}>
              {student => (
                <tr
                  class="cursor-pointer border-t border-border transition-colors hover:bg-primary/5"
                  onClick={() => props.onEdit(student.id)}
                  title="Click to edit"
                >
                  <td class="px-6 py-4 font-mono text-sm text-foreground">
                    {student.studentId || "—"}
                  </td>
                  <td class="px-6 py-4 text-sm text-foreground">
                    <div class="flex min-w-0 items-center gap-3">
                      <StudentAvatar student={student} />
                      <div class="min-w-0">
                        <p class="truncate font-medium text-foreground">{fullName(student)}</p>
                        <p class="truncate text-xs text-muted">{contactLine(student)}</p>
                      </div>
                    </div>
                  </td>
                  <Show when={showTraining()}>
                    <td class="px-6 py-4 text-sm">
                      <div class="min-w-0">
                        <p class="truncate font-medium text-foreground">
                          {batchCode(student, props.getBatch)}
                        </p>
                        <p class="truncate text-xs text-muted">
                          {trainingLine(student, props.getBatch)}
                        </p>
                      </div>
                    </td>
                  </Show>
                  <td class="px-6 py-4">
                    <StatusBadge status={student.status} />
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation()
                        props.onDelete(student.id)
                      }}
                      class="rounded-md p-1 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Delete student"
                    >
                      <Icons.trash class="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )}
            </For>
          </Show>
        </tbody>
      </table>
    </div>
  )
}

export function StudentBlockGrid(props: StudentDirectoryProps) {
  return (
    <Show
      when={props.students.length > 0}
      fallback={
        <div class="py-12 text-center text-sm text-muted">
          {props.emptyMessage || "No students found."}
        </div>
      }
    >
      <div class="max-h-[640px] overflow-auto p-4">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          <For each={props.students}>
            {student => (
              <div class="group relative min-w-0">
                <button
                  type="button"
                  onClick={() => props.onEdit(student.id)}
                  class="w-full min-w-0 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div class="flex flex-col items-center text-center">
                    <StudentAvatar student={student} size="lg" />
                    <p class="mt-3 w-full truncate text-sm font-semibold text-foreground">
                      {fullName(student)}
                    </p>
                    <p class="mt-1 w-full truncate font-mono text-[11px] text-muted">
                      {student.studentId || "—"}
                    </p>
                    <p class="mt-1 w-full truncate text-xs text-muted">{contactLine(student)}</p>
                    <Show when={props.getBatch}>
                      <p class="mt-2 w-full truncate text-xs font-medium text-foreground">
                        {batchCode(student, props.getBatch)}
                      </p>
                    </Show>
                    <span class="mt-3">
                      <StatusBadge status={student.status} />
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation()
                    props.onDelete(student.id)
                  }}
                  class="absolute right-2 top-2 rounded-md p-1 text-muted opacity-100 transition-colors hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Delete student"
                >
                  <Icons.trash class="h-4 w-4" />
                </button>
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  )
}
