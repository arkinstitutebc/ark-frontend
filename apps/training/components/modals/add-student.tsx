import { Modal, Select, toast } from "@ark/ui"
import { useBatches, useCreateStudent } from "@data/hooks"
import { createStudentSchema } from "@data/schemas"
import { validateForm } from "@data/validate"
import { createMemo, createSignal, Index, Show } from "solid-js"

interface AddStudentModalProps {
  open: boolean
  onClose: () => void
  defaultBatchId?: string
}

type Mode = "single" | "bulk"

interface BulkRow {
  firstName: string
  lastName: string
}

function emptyRow(): BulkRow {
  return { firstName: "", lastName: "" }
}

export function AddStudentModal(props: AddStudentModalProps) {
  const batchesQuery = useBatches()
  const createMutation = useCreateStudent()

  const [mode, setMode] = createSignal<Mode>("single")
  const [errors, setErrors] = createSignal<Record<string, string>>({})

  // single mode
  const [firstName, setFirstName] = createSignal("")
  const [lastName, setLastName] = createSignal("")
  const [batchId, setBatchId] = createSignal(props.defaultBatchId || "")

  // bulk mode
  const [rows, setRows] = createSignal<BulkRow[]>([emptyRow(), emptyRow(), emptyRow()])
  const [bulkBatchId, setBulkBatchId] = createSignal(props.defaultBatchId || "")
  const [submitting, setSubmitting] = createSignal(false)

  const batchOptions = createMemo(() =>
    (batchesQuery.data ?? []).map(b => ({
      label: `${b.batchCode} — ${b.trainingName} — ${b.studentsEnrolled}/${b.studentsCapacity}`,
      value: b.id,
    }))
  )

  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors()[field] ? "border-red-400 dark:border-red-500" : "border-border"}`

  const errorClass = "text-xs text-red-600 dark:text-red-400 mt-1"

  // ---------------- single mode ----------------

  const handleSingleSubmit = (e: Event) => {
    e.preventDefault()
    const data = { firstName: firstName(), lastName: lastName(), batchId: batchId() }
    const result = validateForm(createStudentSchema, data)
    if (!result.success) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    createMutation.mutate(result.data, {
      onSuccess: () => {
        resetSingle()
        props.onClose()
      },
    })
  }

  const resetSingle = () => {
    setFirstName("")
    setLastName("")
    setBatchId(props.defaultBatchId || "")
    setErrors({})
  }

  // ---------------- bulk mode ----------------

  const updateRow = (i: number, key: keyof BulkRow, value: string) => {
    setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)))
  }

  const removeRow = (i: number) => {
    setRows(prev => (prev.length === 1 ? [emptyRow()] : prev.filter((_, idx) => idx !== i)))
  }

  const addRow = () => setRows(prev => [...prev, emptyRow()])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const parsed = parseClipboardCsv(text)
      if (!parsed.length) {
        toast.error("Clipboard is empty or unreadable")
        return
      }
      setRows(parsed)
      toast.success(`Pasted ${parsed.length} row${parsed.length === 1 ? "" : "s"}`)
    } catch {
      toast.error("Couldn't read clipboard. Paste manually instead.")
    }
  }

  const handleBulkSubmit = async (e: Event) => {
    e.preventDefault()
    if (!bulkBatchId()) {
      setErrors({ batchId: "Batch is required" })
      return
    }
    const valid = rows().filter(r => r.firstName.trim() && r.lastName.trim())
    if (!valid.length) {
      toast.error("Add at least one student")
      return
    }
    setErrors({})
    setSubmitting(true)
    let added = 0
    let failed = 0
    for (const row of valid) {
      try {
        await createMutation.mutateAsync({
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          batchId: bulkBatchId(),
        })
        added++
      } catch {
        failed++
      }
    }
    setSubmitting(false)
    if (failed > 0) toast.error(`Added ${added}, ${failed} failed`)
    else toast.success(`Added ${added} student${added === 1 ? "" : "s"}`)
    if (added > 0) {
      setRows([emptyRow(), emptyRow(), emptyRow()])
      props.onClose()
    }
  }

  const handleClose = () => {
    resetSingle()
    setRows([emptyRow(), emptyRow(), emptyRow()])
    setBulkBatchId(props.defaultBatchId || "")
    props.onClose()
  }

  return (
    <Modal open={props.open} onClose={handleClose} title="Add New Student">
      <div class="flex gap-1 p-1 bg-surface-muted rounded-lg mb-4">
        <button
          type="button"
          onClick={() => setMode("single")}
          class={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            mode() === "single"
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Single
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          class={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            mode() === "bulk"
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Bulk Add
        </button>
      </div>

      <Show when={mode() === "single"}>
        <form onSubmit={handleSingleSubmit} class="space-y-4" noValidate>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="block text-sm font-medium text-foreground mb-1">First Name</span>
              <input
                type="text"
                value={firstName()}
                onInput={e => setFirstName(e.target.value)}
                placeholder="Juan"
                class={inputClass("firstName")}
              />
              <Show when={errors().firstName}>
                <p class={errorClass}>{errors().firstName}</p>
              </Show>
            </label>
            <label class="block">
              <span class="block text-sm font-medium text-foreground mb-1">Last Name</span>
              <input
                type="text"
                value={lastName()}
                onInput={e => setLastName(e.target.value)}
                placeholder="Dela Cruz"
                class={inputClass("lastName")}
              />
              <Show when={errors().lastName}>
                <p class={errorClass}>{errors().lastName}</p>
              </Show>
            </label>
          </div>

          <div>
            <span class="block text-sm font-medium text-foreground mb-1">Assign to Batch</span>
            <Select
              options={batchOptions()}
              value={batchId() || undefined}
              onChange={v => setBatchId(v)}
              placeholder={batchesQuery.isLoading ? "Loading batches…" : "Select a batch"}
              disabled={batchesQuery.isLoading}
              ariaLabel="Assign to batch"
            />
            <Show when={errors().batchId}>
              <p class={errorClass}>{errors().batchId}</p>
            </Show>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              class="px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? "Adding..." : "Add Student"}
            </button>
          </div>
        </form>
      </Show>

      <Show when={mode() === "bulk"}>
        <form onSubmit={handleBulkSubmit} class="space-y-4" noValidate>
          <div>
            <span class="block text-sm font-medium text-foreground mb-1">Assign to Batch</span>
            <Select
              options={batchOptions()}
              value={bulkBatchId() || undefined}
              onChange={v => setBulkBatchId(v)}
              placeholder={batchesQuery.isLoading ? "Loading batches…" : "Select a batch"}
              disabled={batchesQuery.isLoading}
              ariaLabel="Assign to batch"
            />
            <Show when={errors().batchId}>
              <p class={errorClass}>{errors().batchId}</p>
            </Show>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="block text-sm font-medium text-foreground">Students</span>
              <button
                type="button"
                onClick={handlePaste}
                class="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Paste from clipboard
              </button>
            </div>
            <p class="text-xs text-muted mb-2">
              Tip: paste a list like <code class="text-foreground">Juan, Dela Cruz</code> per line,
              or first/last separated by tab from a spreadsheet.
            </p>
            <div class="border border-border rounded-lg overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-surface-muted">
                  <tr>
                    <th class="text-left px-3 py-2 font-medium text-muted text-xs">First Name</th>
                    <th class="text-left px-3 py-2 font-medium text-muted text-xs">Last Name</th>
                    <th class="w-10" />
                  </tr>
                </thead>
                <tbody>
                  <Index each={rows()}>
                    {(row, i) => (
                      <tr class="border-t border-border">
                        <td class="p-1.5">
                          <input
                            type="text"
                            value={row().firstName}
                            onInput={e => updateRow(i, "firstName", e.target.value)}
                            placeholder="Juan"
                            class="w-full px-2 py-1.5 text-sm bg-transparent text-foreground focus:outline-none focus:bg-surface-muted rounded"
                          />
                        </td>
                        <td class="p-1.5">
                          <input
                            type="text"
                            value={row().lastName}
                            onInput={e => updateRow(i, "lastName", e.target.value)}
                            placeholder="Dela Cruz"
                            class="w-full px-2 py-1.5 text-sm bg-transparent text-foreground focus:outline-none focus:bg-surface-muted rounded"
                          />
                        </td>
                        <td class="p-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => removeRow(i)}
                            class="text-muted hover:text-red-500 transition-colors text-xs px-1"
                            aria-label="Remove row"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    )}
                  </Index>
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addRow}
              class="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              + Add row
            </button>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              class="px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting()}
              class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting() ? "Adding..." : "Add All"}
            </button>
          </div>
        </form>
      </Show>
    </Modal>
  )
}

function parseClipboardCsv(text: string): BulkRow[] {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/[\t,]/).map(s => s.trim())
      return { firstName: parts[0] ?? "", lastName: parts[1] ?? "" }
    })
    .filter(r => r.firstName || r.lastName)
}
