import { Modal, ModalFooter } from "@ark/ui"
import { useCreateVenue, useDeleteVenue, useUpdateVenue, useVenues } from "@data/hooks"
import type { Venue } from "@data/types"
import { createSignal, For, Show } from "solid-js"

interface ManageVenuesModalProps {
  open: boolean
  onClose: () => void
}

export function ManageVenuesModal(props: ManageVenuesModalProps) {
  const venuesQuery = useVenues()
  const createMutation = useCreateVenue()
  const updateMutation = useUpdateVenue()
  const deleteMutation = useDeleteVenue()

  const [newName, setNewName] = createSignal("")
  const [editingId, setEditingId] = createSignal<string | null>(null)
  const [editingName, setEditingName] = createSignal("")

  const handleAdd = (e: Event) => {
    e.preventDefault()
    const name = newName().trim()
    if (!name) return
    createMutation.mutate({ name }, { onSuccess: () => setNewName("") })
  }

  const startEdit = (venue: Venue) => {
    setEditingId(venue.id)
    setEditingName(venue.name)
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

  const handleDelete = (venue: Venue) => {
    if (!confirm(`Remove "${venue.name}"? Existing batches will keep this venue name.`)) return
    deleteMutation.mutate(venue.id)
  }

  const handleClose = () => {
    setEditingId(null)
    setEditingName("")
    setNewName("")
    props.onClose()
  }

  return (
    <Modal open={props.open} onClose={handleClose} title="Manage Venues">
      <div class="space-y-4">
        <form onSubmit={handleAdd} class="flex gap-2">
          <input
            type="text"
            value={newName()}
            onInput={e => setNewName(e.target.value)}
            placeholder="Add a new venue..."
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
            when={!venuesQuery.isLoading}
            fallback={<div class="animate-pulse h-32 bg-surface-muted" />}
          >
            <Show
              when={(venuesQuery.data?.length ?? 0) > 0}
              fallback={
                <p class="text-sm text-muted text-center py-8">No venues yet. Add one above.</p>
              }
            >
              <ul class="divide-y divide-border">
                <For each={venuesQuery.data}>
                  {venue => (
                    <li class="flex items-center gap-2 px-3 py-2">
                      <Show
                        when={editingId() === venue.id}
                        fallback={
                          <>
                            <span class="flex-1 text-sm text-foreground">{venue.name}</span>
                            <button
                              type="button"
                              onClick={() => startEdit(venue)}
                              class="text-xs font-medium text-muted hover:text-primary transition-colors px-2"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(venue)}
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

        <Show when={venuesQuery.isError}>
          <p class="text-sm text-red-600 dark:text-red-400">
            {(venuesQuery.error as Error)?.message ?? "Failed to load venues"}
          </p>
        </Show>

        <ModalFooter onCancel={handleClose} cancelLabel="Done" />
      </div>
    </Modal>
  )
}
