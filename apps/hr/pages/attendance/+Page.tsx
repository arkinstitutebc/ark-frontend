import { formatDatePH, PageContainer, PageHeader, Select, StatCard, THead, Th } from "@ark/ui"
import { useEmployeeAttendance, useEmployees, useUpsertEmployeeAttendance } from "@data/hooks"
import type { EmployeeAttendanceStatus } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { QueryBoundary, StatusBadge } from "@/components/ui"

const statusOptions: Array<{ label: string; value: EmployeeAttendanceStatus }> = [
  { label: "Present", value: "present" },
  { label: "Late", value: "late" },
  { label: "Absent", value: "absent" },
  { label: "On Leave", value: "leave" },
  { label: "Holiday", value: "holiday" },
]

export default function AttendancePage() {
  const employees = useEmployees()
  const save = useUpsertEmployeeAttendance()
  const [filterEmployee, setFilterEmployee] = createSignal("")
  const [filterDate, setFilterDate] = createSignal("")
  const query = useEmployeeAttendance(() => ({
    employeeId: filterEmployee() || undefined,
    startDate: filterDate() || undefined,
    endDate: filterDate() || undefined,
  }))
  const [employeeId, setEmployeeId] = createSignal("")
  const [date, setDate] = createSignal(new Date().toISOString().slice(0, 10))
  const [status, setStatus] = createSignal<EmployeeAttendanceStatus>("present")
  const [timeIn, setTimeIn] = createSignal("")
  const [timeOut, setTimeOut] = createSignal("")
  const [notes, setNotes] = createSignal("")
  const employeeOptions = createMemo(() =>
    (employees.data ?? []).map(row => ({ label: row.person.name, value: row.employee.id }))
  )
  const employeeName = (id: string) =>
    (employees.data ?? []).find(row => row.employee.id === id)?.person.name ?? "Unknown employee"

  return (
    <PageContainer>
      <PageHeader
        title="Employee Attendance"
        subtitle="Track daily presence, absences, holidays, and approved leave"
      />
      <form
        class="mb-6 grid gap-3 rounded-lg border border-border bg-surface p-5 md:grid-cols-3"
        onSubmit={event => {
          event.preventDefault()
          save.mutate({
            employeeId: employeeId(),
            date: date(),
            status: status(),
            timeIn: timeIn() || undefined,
            timeOut: timeOut() || undefined,
            notes: notes() || undefined,
          })
        }}
      >
        <Select
          options={employeeOptions()}
          value={employeeId() || undefined}
          onChange={setEmployeeId}
          placeholder="Employee"
          ariaLabel="Employee"
        />
        <input
          type="date"
          required
          value={date()}
          onInput={event => setDate(event.currentTarget.value)}
          class="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <Select
          options={statusOptions}
          value={status()}
          onChange={value => setStatus(value as EmployeeAttendanceStatus)}
          ariaLabel="Attendance status"
        />
        <input
          type="time"
          value={timeIn()}
          onInput={event => setTimeIn(event.currentTarget.value)}
          class="rounded-lg border border-border px-3 py-2 text-sm"
          aria-label="Time in"
        />
        <input
          type="time"
          value={timeOut()}
          onInput={event => setTimeOut(event.currentTarget.value)}
          class="rounded-lg border border-border px-3 py-2 text-sm"
          aria-label="Time out"
        />
        <div class="flex gap-2">
          <input
            value={notes()}
            onInput={event => setNotes(event.currentTarget.value)}
            placeholder="Notes"
            class="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={!employeeId() || save.isPending}
            class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </form>

      <div class="mb-5 grid gap-3 sm:grid-cols-2">
        <Select
          options={[{ label: "All Employees", value: "" }, ...employeeOptions()]}
          value={filterEmployee()}
          onChange={setFilterEmployee}
          ariaLabel="Filter by employee"
        />
        <input
          type="date"
          value={filterDate()}
          onInput={event => setFilterDate(event.currentTarget.value)}
          class="rounded-lg border border-border px-3 py-2 text-sm"
          aria-label="Filter by date"
        />
      </div>

      <QueryBoundary query={query}>
        {rows => (
          <>
            <div class="mb-4 grid grid-cols-3 gap-4">
              <StatCard label="Records" value={rows.length} />
              <StatCard
                label="Present / Late"
                value={rows.filter(row => ["present", "late"].includes(row.status)).length}
              />
              <StatCard label="Absent" value={rows.filter(row => row.status === "absent").length} />
            </div>
            <div class="overflow-hidden rounded-lg border border-border bg-surface">
              <Show
                when={rows.length > 0}
                fallback={
                  <p class="py-12 text-center text-sm text-muted">No attendance records.</p>
                }
              >
                <table class="w-full">
                  <THead>
                    <Th>Employee</Th>
                    <Th>Date</Th>
                    <Th>Status</Th>
                    <Th>Time</Th>
                    <Th>Notes</Th>
                  </THead>
                  <tbody>
                    <For each={rows}>
                      {row => (
                        <tr class="border-t border-border">
                          <td class="px-6 py-4 text-sm font-medium">
                            {employeeName(row.employeeId)}
                          </td>
                          <td class="px-6 py-4 text-sm">{formatDatePH(row.date)}</td>
                          <td class="px-6 py-4">
                            <StatusBadge status={row.status} />
                          </td>
                          <td class="px-6 py-4 text-sm text-muted">
                            {row.timeIn || "—"}–{row.timeOut || "—"}
                          </td>
                          <td class="px-6 py-4 text-sm text-muted">{row.notes || "—"}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </Show>
            </div>
          </>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
