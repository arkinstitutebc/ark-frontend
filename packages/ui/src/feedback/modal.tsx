import type { JSX } from "solid-js"
import { createEffect, createUniqueId, onCleanup, Show } from "solid-js"
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

const modalStack: string[] = []

export function Modal(props: ModalProps) {
  const id = createUniqueId()

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }
  const handleBackdropKeyDown = (e: KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
      props.onClose()
    }
  }

  const sizeClass = () => SIZE_CLASS[props.size ?? "lg"]

  createEffect(() => {
    if (!props.open) return
    modalStack.push(id)
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalStack.at(-1) === id) props.onClose()
    }
    document.addEventListener("keydown", closeOnEscape)
    onCleanup(() => {
      document.removeEventListener("keydown", closeOnEscape)
      const index = modalStack.lastIndexOf(id)
      if (index >= 0) modalStack.splice(index, 1)
    })
  })

  return (
    <Show when={props.open}>
      <Portal>
        <div
          role="dialog"
          aria-modal="true"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6"
          onClick={handleBackdropClick}
          onKeyDown={handleBackdropKeyDown}
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
