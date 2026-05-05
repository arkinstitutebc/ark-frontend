import { useAttendance, useTrainers } from "@data/hooks"
import type { AttendanceStatus, HrAttendance, Trainer } from "@data/types"
import { createMemo, createSignal, For, Show } from "solid-js"
import { AttendanceStatusBadge, Icons, QueryBoundary } from "@/components/ui"

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr))
}

export default function Page() {
  const [filterTrainer, setFilterTrainer] = createSignal<string>("all")
  const [filterStatus, setFilterStatus] = createSignal<AttendanceStatus | "all">("all")
  const [filterDate, setFilterDate] = createSignal("")

  const trainersQuery = useTrainers()
  const attendanceQuery = useAttendance(() => {
    const f: { trainerId?: string; date?: string } = {}
    if (filterTrainer() !== "all") f.trainerId = filterTrainer()
    if (filterDate()) f.date = filterDate()
    return f
  })

  const filteredRecords = createMemo(() => {
    const data = attendanceQuery.data || []
    return data
      .filter(r => filterStatus() === "all" || r.status === filterStatus())
      .sort((a, b) => b.date.localeCompare(a.date))
  })

  const stats = createMemo(() => {
    const records = filteredRecords()
    return {
      total: records.length,
      present: records.filter(r => r.status === "present").length,
      late: records.filter(r => r.status === "late").length,
      absent: records.filter(r => r.status === "absent").length,
    }
  })

  const getTrainerName = (trainerId: string) => {
    const trainer = (trainersQuery.data || []).find((t: Trainer) => t.id === trainerId)
    return trainer?.name || trainerId
  }

  return (
    <div class="px-6 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Attendance</h1>
          <p class="text-sm text-gray-500 mt-1">Biometric time-in/out records</p>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Total Records</p>
          <p class="text-2xl text-gray-900">{attendanceQuery.isSuccess ? stats().total : "-"}</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Present</p>
          <p class="text-2xl text-green-700">{attendanceQuery.isSuccess ? stats().present : "-"}</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Late</p>
          <p class="text-2xl text-yellow-700">{attendanceQuery.isSuccess ? stats().late : "-"}</p>
        </div>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="text-sm text-gray-500 mb-1">Absent</p>
          <p class="text-2xl text-red-700">{attendanceQuery.isSuccess ? stats().absent : "-"}</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <div class="relative">
          <Icons.calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={filterDate()}
            onInput={e => setFilterDate(e.currentTarget.value)}
            class="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select
          value={filterTrainer()}
          onChange={e => setFilterTrainer(e.currentTarget.value)}
          class="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="all">All Trainers</option>
          <For each={trainersQuery.data || []}>
            {(t: Trainer) => <option value={t.id}>{t.name}</option>}
          </For>
        </select>
        <div class="flex gap-2">
          <For
            each={[
              { value: "all" as const, label: "All" },
              { value: "present" as const, label: "Present" },
              { value: "late" as const, label: "Late" },
              { value: "absent" as const, label: "Absent" },
            ]}
          >
            {item => (
              <button
                type="button"
                onClick={() => setFilterStatus(item.value)}
                class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus() === item.value ? "bg-primary text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}
              >
                {item.label}
              </button>
            )}
          </For>
        </div>
      </div>

      <QueryBoundary query={attendanceQuery}>
        {(_data: HrAttendance[]) => (
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Show
              when={filteredRecords().length > 0}
              fallback={
                <div class="py-16 text-center">
                  <Icons.clock class="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p class="text-sm font-medium text-gray-900">No attendance records</p>
                  <p class="text-sm text-gray-500 mt-1">Try adjusting your filters.</p>
                </div>
              }
            >
              <table class="w-full">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Trainer
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Time In
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Time Out
                    </th>
                    <th class="py-4 px-6 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Hours
                    </th>
                    <th class="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={filteredRecords()}>
                    {(record: HrAttendance) => (
                      <tr class="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td class="py-4 px-6">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Icons.user class="w-4 h-4 text-primary" />
                            </div>
                            <p class="text-sm text-gray-900">{getTrainerName(record.trainerId)}</p>
                          </div>
                        </td>
                        <td class="py-4 px-6 text-sm text-gray-900">{formatDate(record.date)}</td>
                        <td class="py-4 px-6 text-sm text-gray-600 font-mono">
                          {record.timeIn || "—"}
                        </td>
                        <td class="py-4 px-6 text-sm text-gray-600 font-mono">
                          {record.timeOut || "—"}
                        </td>
                        <td class="py-4 px-6 text-right text-sm text-gray-900">
                          {record.hoursWorked}
                        </td>
                        <td class="py-4 px-6">
                          <AttendanceStatusBadge status={record.status} />
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </Show>
          </div>
        )}
      </QueryBoundary>
    </div>
  )
}
