import { formatDatePH, PageContainer, PageHeader, Select } from "@ark/ui"
import {
  useCreateHoliday,
  useCreateLeave,
  useEmployees,
  useHrCalendar,
  useReviewLeave,
} from "@data/hooks"
import { createMemo, createSignal, For, Show } from "solid-js"
import { QueryBoundary, StatusBadge } from "@/components/ui"

export default function CalendarPage() {
  const [month, setMonth] = createSignal(new Date().toISOString().slice(0, 7))
  const calendar = useHrCalendar(month)
  const employees = useEmployees()
  const addHoliday = useCreateHoliday()
  const addLeave = useCreateLeave()
  const review = useReviewLeave()
  const [holidayDate, setHolidayDate] = createSignal("")
  const [holidayName, setHolidayName] = createSignal("")
  const [employeeId, setEmployeeId] = createSignal("")
  const [startDate, setStartDate] = createSignal("")
  const [endDate, setEndDate] = createSignal("")
  const [leaveType, setLeaveType] = createSignal("vacation")
  const monthDays = createMemo(() => {
    const year = Number(month().slice(0, 4))
    const monthIndex = Number(month().slice(5, 7)) - 1
    const offset = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7
    const count = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
    return Array.from({ length: offset + count }, (_, index) =>
      index < offset ? null : `${month()}-${String(index - offset + 1).padStart(2, "0")}`
    )
  })
  const changeMonth = (delta: number) => {
    const year = Number(month().slice(0, 4))
    const monthIndex = Number(month().slice(5, 7)) - 1
    setMonth(new Date(Date.UTC(year, monthIndex + delta, 1)).toISOString().slice(0, 7))
  }
  return (
    <PageContainer>
      <PageHeader
        title="Leave & Holiday Calendar"
        subtitle="See who is away on each day and record absences and holidays"
      />
      <div class="mb-6 grid gap-4 lg:grid-cols-2">
        <form
          class="grid content-start gap-3 rounded-lg border border-border bg-surface p-5 md:grid-cols-[160px_minmax(0,1fr)_auto]"
          onSubmit={event => {
            event.preventDefault()
            addHoliday.mutate({ date: holidayDate(), name: holidayName(), type: "regular" })
          }}
        >
          <input
            type="date"
            required
            value={holidayDate()}
            onInput={event => setHolidayDate(event.currentTarget.value)}
            class="h-10 min-w-0 rounded-lg border border-border px-3 py-2 text-sm"
          />
          <input
            required
            value={holidayName()}
            onInput={event => setHolidayName(event.currentTarget.value)}
            placeholder="Holiday name"
            class="h-10 min-w-0 rounded-lg border border-border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            class="h-10 whitespace-nowrap rounded-lg bg-primary px-3 py-2 text-sm text-white"
          >
            Add holiday
          </button>
        </form>
        <form
          class="grid gap-3 rounded-lg border border-border bg-surface p-5 md:grid-cols-2"
          onSubmit={event => {
            event.preventDefault()
            addLeave.mutate({
              employeeId: employeeId(),
              startDate: startDate(),
              endDate: endDate(),
              type: leaveType(),
            })
          }}
        >
          <Select
            options={(employees.data ?? []).map(row => ({
              label: row.person.name,
              value: row.employee.id,
            }))}
            value={employeeId() || undefined}
            onChange={setEmployeeId}
            placeholder="Employee"
            ariaLabel="Employee"
          />
          <input
            value={leaveType()}
            onInput={event => setLeaveType(event.currentTarget.value)}
            placeholder="Leave type"
            class="rounded-lg border border-border px-3 py-2 text-sm"
          />
          <input
            type="date"
            required
            value={startDate()}
            onInput={event => setStartDate(event.currentTarget.value)}
            class="rounded-lg border border-border px-3 py-2 text-sm"
          />
          <div class="flex gap-2">
            <input
              type="date"
              required
              value={endDate()}
              onInput={event => setEndDate(event.currentTarget.value)}
              class="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm"
            />
            <button type="submit" class="rounded-lg bg-primary px-3 py-2 text-sm text-white">
              Request
            </button>
          </div>
        </form>
      </div>
      <QueryBoundary query={calendar}>
        {data => (
          <>
            <section class="mb-6 overflow-hidden rounded-lg border border-border bg-surface">
              <div class="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  class="rounded-lg border border-border px-3 py-1.5 text-sm"
                >
                  Previous
                </button>
                <h2 class="font-semibold">
                  {new Date(`${month()}-01T00:00:00Z`).toLocaleDateString("en-PH", {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </h2>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  class="rounded-lg border border-border px-3 py-1.5 text-sm"
                >
                  Next
                </button>
              </div>
              <div class="grid grid-cols-7 border-b border-border bg-surface-muted text-center text-xs font-medium text-muted">
                <For each={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}>
                  {day => <span class="py-2">{day}</span>}
                </For>
              </div>
              <div class="grid grid-cols-7">
                <For each={monthDays()}>
                  {date => (
                    <div class="min-h-28 border-b border-r border-border p-2 text-xs">
                      <Show when={date}>
                        {day => (
                          <>
                            <p class="mb-2 font-semibold text-foreground">
                              {Number(day().slice(-2))}
                            </p>
                            <For each={data.holidays.filter(item => item.date === day())}>
                              {holiday => (
                                <p class="mb-1 rounded bg-primary/10 px-1.5 py-1 text-primary">
                                  {holiday.name}
                                </p>
                              )}
                            </For>
                            <For
                              each={data.leaves.filter(
                                row =>
                                  row.leave.status === "approved" &&
                                  row.leave.startDate <= day() &&
                                  row.leave.endDate >= day()
                              )}
                            >
                              {row => (
                                <p class="mb-1 rounded bg-surface-muted px-1.5 py-1 text-foreground">
                                  {row.person.name} · {row.leave.type}
                                </p>
                              )}
                            </For>
                          </>
                        )}
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </section>
            <div class="grid gap-6 lg:grid-cols-2">
              <section class="rounded-lg border border-border bg-surface">
                <h2 class="border-b border-border px-5 py-4 font-semibold">Holidays</h2>
                <For each={data.holidays}>
                  {holiday => (
                    <div class="border-b border-border px-5 py-3 last:border-0">
                      <p class="font-medium">{holiday.name}</p>
                      <p class="text-xs text-muted">
                        {formatDatePH(holiday.date)} · {holiday.type}
                      </p>
                    </div>
                  )}
                </For>
              </section>
              <section class="rounded-lg border border-border bg-surface">
                <h2 class="border-b border-border px-5 py-4 font-semibold">Employee Leave</h2>
                <For each={data.leaves}>
                  {row => (
                    <div class="border-b border-border px-5 py-3 last:border-0">
                      <div class="flex items-center justify-between">
                        <div>
                          <p class="font-medium">{row.person.name}</p>
                          <p class="text-xs text-muted">
                            {formatDatePH(row.leave.startDate)} – {formatDatePH(row.leave.endDate)}{" "}
                            · {row.leave.type}
                          </p>
                        </div>
                        <StatusBadge status={row.leave.status} />
                      </div>
                      {row.leave.status === "pending" && (
                        <div class="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => review.mutate({ id: row.leave.id, action: "reject" })}
                            class="text-xs text-red-700"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => review.mutate({ id: row.leave.id, action: "approve" })}
                            class="text-xs font-medium text-primary"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </For>
              </section>
            </div>
          </>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
