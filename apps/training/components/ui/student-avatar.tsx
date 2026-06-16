import { Icons } from "@ark/ui"
import type { Student } from "@data/types"
import { Show } from "solid-js"

interface StudentAvatarProps {
  student: Pick<Student, "firstName" | "lastName" | "photoUrl">
  size?: "sm" | "md" | "lg"
}

const sizeClass = {
  sm: "h-8 w-8 rounded-lg text-[11px]",
  md: "h-9 w-9 rounded-lg text-xs",
  lg: "h-20 w-20 rounded-xl text-lg",
}

function initials(student: StudentAvatarProps["student"]) {
  const first = student.firstName?.trim()[0] ?? ""
  const last = student.lastName?.trim()[0] ?? ""
  return `${first}${last}`.toUpperCase() || null
}

export function StudentAvatar(props: StudentAvatarProps) {
  const size = () => props.size ?? "md"

  return (
    <div
      class={`flex shrink-0 items-center justify-center overflow-hidden border border-border bg-surface-muted font-semibold text-primary ${sizeClass[size()]}`}
    >
      <Show
        when={props.student.photoUrl}
        fallback={
          <Show when={initials(props.student)} fallback={<Icons.user class="h-4 w-4 text-muted" />}>
            {value => <span aria-hidden="true">{value()}</span>}
          </Show>
        }
      >
        {url => (
          <img
            src={url()}
            alt=""
            class="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
          />
        )}
      </Show>
    </div>
  )
}
