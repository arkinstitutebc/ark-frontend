import { formatPeso, PageContainer, PageHeader, StatCard } from "@ark/ui"
import { useCreateEmployee, useEmployees } from "@data/hooks"
import { createSignal, For, Show } from "solid-js"
import { QueryBoundary, StatusBadge } from "@/components/ui"

export default function EmployeesPage() {
  const query = useEmployees()
  const createEmployee = useCreateEmployee()
  const [name, setName] = createSignal("")
  const [email, setEmail] = createSignal("")
  const [jobTitle, setJobTitle] = createSignal("")
  const [salary, setSalary] = createSignal(0)
  return (
    <PageContainer>
      <PageHeader title="Employees" subtitle="Employee payroll directory, separate from trainers" />
      <form
        class="mb-6 grid gap-3 rounded-lg border border-border bg-surface p-5 md:grid-cols-4"
        onSubmit={event => {
          event.preventDefault()
          createEmployee.mutate(
            {
              name: name(),
              email: email() || undefined,
              jobTitle: jobTitle() || undefined,
              monthlySalary: salary(),
            },
            {
              onSuccess: () => {
                setName("")
                setEmail("")
                setJobTitle("")
                setSalary(0)
              },
            }
          )
        }}
      >
        <input
          required
          value={name()}
          onInput={event => setName(event.currentTarget.value)}
          placeholder="Employee name"
          class="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          type="email"
          value={email()}
          onInput={event => setEmail(event.currentTarget.value)}
          placeholder="Email"
          class="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          value={jobTitle()}
          onInput={event => setJobTitle(event.currentTarget.value)}
          placeholder="Job title"
          class="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <div class="flex gap-2">
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={salary() || ""}
            onInput={event => setSalary(Number(event.currentTarget.value))}
            placeholder="Monthly salary"
            class="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Add
          </button>
        </div>
      </form>
      <QueryBoundary query={query}>
        {rows => (
          <>
            <div class="mb-4 grid grid-cols-2 gap-4">
              <StatCard label="Employees" value={rows.length} />
              <StatCard
                label="Active"
                value={rows.filter(row => row.employee.status === "active").length}
              />
            </div>
            <div class="overflow-hidden rounded-lg border border-border bg-surface">
              <For each={rows}>
                {row => (
                  <div class="grid grid-cols-[1fr_1fr_auto] items-center gap-4 border-b border-border px-5 py-4 last:border-0">
                    <div>
                      <p class="font-medium">{row.person.name}</p>
                      <p class="text-xs text-muted">{row.person.email || "No email"}</p>
                    </div>
                    <div>
                      <p class="text-sm">{row.employee.jobTitle || "—"}</p>
                      <p class="text-xs text-muted">
                        {formatPeso(Number(row.employee.monthlySalary))} / month
                      </p>
                    </div>
                    <StatusBadge status={row.employee.status} />
                  </div>
                )}
              </For>
              <Show when={rows.length === 0}>
                <p class="py-12 text-center text-sm text-muted">No employees yet.</p>
              </Show>
            </div>
          </>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
