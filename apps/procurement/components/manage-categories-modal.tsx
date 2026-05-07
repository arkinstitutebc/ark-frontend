import { Modal, ModalFooter } from "@ark/ui"
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@data/hooks"
import type { ProcurementCategory } from "@data/types"
import { createSignal, For, Show } from "solid-js"

interface ManageCategoriesModalProps {
  open: boolean
  onClose: () => void
}

export function ManageCategoriesModal(props: ManageCategoriesModalProps) {
  const categoriesQuery = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const [newName, setNewName] = createSignal("")
  const [editingId, setEditingId] = createSignal<string | null>(null)
  const [editingName, setEditingName] = createSignal("")

  const handleAdd = (e: Event) => {
    e.preventDefault()
    const name = newName().trim()
    if (!name) return
    createMutation.mutate({ name }, { onSuccess: () => setNewName("") })
  }

  const startEdit = (cat: ProcurementCategory) => {
    setEditingId(cat.id)
    setEditingName(cat.name)
  }

  const saveEdit = () => {
    const id = editingId()
    const name = editingName().trim()
    if (!id || !name) {
      setEditingId(null)
      return
    }
    updateMutation.mutate(
      { id, name },
      {
        onSuccess: () => {
          setEditingId(null)
          setEditingName("")
        },
      }
    )
  }

  const handleDelete = (cat: ProcurementCategory) => {
    if (!confirm(`Remove "${cat.name}"? Existing PRs will keep this category name.`)) return
    deleteMutation.mutate(cat.id)
  }

  const handleClose = () => {
    setEditingId(null)
    setEditingName("")
    setNewName("")
    props.onClose()
  }

  return (
    <Modal open={props.open} onClose={handleClose} title="Manage Categories">
      <div class="space-y-4">
        <form onSubmit={handleAdd} class="flex gap-2">
          <input
            type="text"
            value={newName()}
            onInput={e => setNewName(e.target.value)}
            placeholder="Add a new category..."
            class="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !newName().trim()}
            class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </form>

        <div class="border border-border rounded-lg overflow-hidden">
          <Show
            when={!categoriesQuery.isLoading}
            fallback={<div class="animate-pulse h-32 bg-surface-muted" />}
          >
            <Show
              when={(categoriesQuery.data?.length ?? 0) > 0}
              fallback={
                <p class="text-sm text-muted text-center py-8">No categories yet. Add one above.</p>
              }
            >
              <ul class="divide-y divide-border">
                <For each={categoriesQuery.data}>
                  {cat => (
                    <li class="flex items-center gap-2 px-3 py-2">
                      <Show
                        when={editingId() === cat.id}
                        fallback={
                          <>
                            <span class="flex-1 text-sm text-foreground">{cat.name}</span>
                            <button
                              type="button"
                              onClick={() => startEdit(cat)}
                              class="text-xs font-medium text-muted hover:text-primary transition-colors px-2"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(cat)}
                              class="text-xs font-medium text-muted hover:text-red-500 transition-colors px-2"
                            >
                              Delete
                            </button>
                          </>
                        }
                      >
                        <input
                          type="text"
                          value={editingName()}
                          onInput={e => setEditingName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") saveEdit()
                            if (e.key === "Escape") {
                              setEditingId(null)
                              setEditingName("")
                            }
                          }}
                          ref={el => queueMicrotask(() => el?.focus())}
                          class="flex-1 px-2 py-1 text-sm border border-border rounded bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={saveEdit}
                          class="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null)
                            setEditingName("")
                          }}
                          class="text-xs font-medium text-muted hover:text-foreground transition-colors px-2"
                        >
                          Cancel
                        </button>
                      </Show>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Show>
        </div>

        <Show when={categoriesQuery.isError}>
          <p class="text-sm text-red-600 dark:text-red-400">
            {(categoriesQuery.error as Error)?.message ?? "Failed to load categories"}
          </p>
        </Show>

        <ModalFooter onCancel={handleClose} cancelLabel="Done" />
      </div>
    </Modal>
  )
}
