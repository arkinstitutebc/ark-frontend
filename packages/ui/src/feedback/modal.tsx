import type { JSX } from "solid-js"
import { Show } from "solid-js"
import { Portal } from "solid-js/web"
import { Icons } from "../icons"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: JSX.Element
  size?: "md" | "lg" | "xl"
}

const SIZE_CLASS: Record<NonNullable<ModalProps["size"]>, string> = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
}

export function Modal(props: ModalProps) {
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }

  const sizeClass = () => SIZE_CLASS[props.size ?? "lg"]

  return (
    <Show when={props.open}>
      <Portal>
        <div
          role="dialog"
          aria-modal="true"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6"
          onClick={handleBackdropClick}
          onKeyDown={e => e.key === "Escape" && props.onClose()}
        >
          <div
            class={`bg-surface rounded-xl shadow-xl w-full max-h-[90vh] flex flex-col ${sizeClass()}`}
          >
            {/* Header */}
            <div class="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h2 class="text-lg font-semibold text-foreground">{props.title}</h2>
              <button
                type="button"
                onClick={props.onClose}
                class="p-1 text-muted hover:text-foreground rounded-lg hover:bg-surface-muted transition-colors"
                aria-label="Close"
              >
                <Icons.close class="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div class="px-6 py-5 overflow-y-auto flex-1">{props.children}</div>
          </div>
        </div>
      </Portal>
    </Show>
  )
}
