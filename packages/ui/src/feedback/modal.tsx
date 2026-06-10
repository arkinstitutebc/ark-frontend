import type { JSX } from "solid-js"
import { createEffect, createUniqueId, onCleanup, Show } from "solid-js"
import { Portal } from "solid-js/web"
import { Icons } from "../icons"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: JSX.Element
  size?: "md" | "lg" | "xl" | "2xl"
}

const SIZE_CLASS: Record<NonNullable<ModalProps["size"]>, string> = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-5xl",
  "2xl": "max-w-6xl",
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

const modalStack: string[] = []
let scrollLockCount = 0
let previousBodyOverflow: string | null = null

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
  }
  scrollLockCount += 1
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1)
  if (scrollLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow ?? ""
    previousBodyOverflow = null
  }
}

function getFocusable(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    el => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
  )
}

export function Modal(props: ModalProps) {
  const id = createUniqueId()
  const titleId = `${id}-title`
  let dialogRef: HTMLDivElement | undefined

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }

  const sizeClass = () => SIZE_CLASS[props.size ?? "lg"]

  createEffect(() => {
    if (!props.open) return
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    let focusFrame: number | undefined

    modalStack.push(id)
    lockBodyScroll()

    const focusInitialElement = () => {
      const dialog = dialogRef
      if (!dialog) return
      const [firstFocusable] = getFocusable(dialog)
      ;(firstFocusable ?? dialog).focus()
    }

    focusFrame = requestAnimationFrame(focusInitialElement)

    const handleDocumentKeyDown = (e: KeyboardEvent) => {
      if (modalStack.at(-1) !== id) return
      if (e.key === "Escape") {
        props.onClose()
        return
      }
      if (e.key !== "Tab" || !dialogRef) return

      const focusable = getFocusable(dialogRef)
      if (focusable.length === 0) {
        e.preventDefault()
        dialogRef.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", handleDocumentKeyDown)
    onCleanup(() => {
      document.removeEventListener("keydown", handleDocumentKeyDown)
      if (focusFrame !== undefined) cancelAnimationFrame(focusFrame)
      const index = modalStack.lastIndexOf(id)
      if (index >= 0) modalStack.splice(index, 1)
      unlockBodyScroll()
      previouslyFocused?.focus()
    })
  })

  return (
    <Show when={props.open}>
      <Portal>
        <div class="fixed inset-0 z-50 flex animate-fade-in items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close modal"
            class="absolute inset-0 bg-black/50"
            onClick={handleBackdropClick}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            class={`bg-surface relative w-full max-h-[90vh] flex animate-fade-in flex-col rounded-xl shadow-xl outline-none ${sizeClass()}`}
          >
            {/* Header */}
            <div class="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h2 id={titleId} class="text-lg font-semibold text-foreground">
                {props.title}
              </h2>
              <button
                type="button"
                onClick={props.onClose}
                class="p-1 text-muted hover:text-foreground rounded-lg hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
