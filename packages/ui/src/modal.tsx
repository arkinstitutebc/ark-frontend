import type { JSX } from "solid-js"
import { Show } from "solid-js"
import { Portal } from "solid-js/web"
import { Icons } from "./icons"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: JSX.Element
  size?: "md" | "lg"
}

export function Modal(props: ModalProps) {
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }

  return (
    <Show when={props.open}>
      <Portal>
        <div
          role="dialog"
          aria-modal="true"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleBackdropClick}
          onKeyDown={e => e.key === "Escape" && props.onClose()}
        >
          <div
            class={`bg-surface rounded-xl shadow-xl w-full mx-4 max-h-[90vh] overflow-hidden ${props.size === "lg" ? "max-w-2xl" : "max-w-md"}`}
          >
            {/* Header */}
            <div class="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 class="text-lg font-semibold text-foreground">{props.title}</h2>
              <button
                type="button"
                onClick={props.onClose}
                class="p-1 text-muted hover:text-foreground rounded-lg hover:bg-surface-muted transition-colors"
              >
                <Icons.close class="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div class="px-5 py-4 overflow-y-auto">{props.children}</div>
          </div>
        </div>
      </Portal>
    </Show>
  )
}
