/**
 * Form-control class strings shared across all 7 portals.
 *
 * Use when bare `<input>`/`<select>` are needed (e.g. inside an editable table
 * or with `<datalist>`) and `<Input>` / `<Select>` from `@ark/ui` aren't a fit.
 *
 * Together these replace the inline `inputClass` / `errorClass` / `labelClass`
 * consts that were copy-pasted into every modal in `apps/training/components/modals/`.
 */

interface InputClassOpts {
  /** When true, applies the error border styling. */
  error?: boolean
}

const BASE_INPUT =
  "w-full px-3 py-2 border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"

export function formInputClass(opts: InputClassOpts = {}): string {
  const border = opts.error ? "border-red-400 dark:border-red-500" : "border-border"
  return `${BASE_INPUT} ${border}`
}

export const formErrorClass = "text-xs text-red-600 dark:text-red-400 mt-1"

export const formLabelClass = "block text-sm font-medium text-foreground mb-1"
