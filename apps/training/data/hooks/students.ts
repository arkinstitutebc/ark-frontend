import { createCrudHooks } from "@ark/ui"
import { createQuery } from "@tanstack/solid-query"
import { api } from "../api"
import { queryKeys } from "../query-keys"
import type { Student } from "../types"

interface StudentListQuery {
  batchId?: string
  page?: number
  limit?: number
  search?: string
}

export interface StudentListResponse {
  items: Student[]
  total: number
  page: number
  limit: number
}

const crud = createCrudHooks<
  Student,
  Student,
  Partial<Student>,
  Partial<Student>,
  StudentListQuery
>({
  basePath: "/api/training/students",
  domain: "students",
  label: "Student",
  messages: {
    create: "Student enrolled",
  },
  queryKeys: {
    all: queryKeys.students.all,
    list: q => queryKeys.students.filtered(q),
    detail: id => queryKeys.students.detail(id),
  },
})

export function useStudents(query?: () => StudentListQuery | undefined) {
  return createQuery(() => {
    const q = query?.()
    const params = new URLSearchParams()
    if (q?.batchId) params.set("batchId", q.batchId)
    if (q?.page) params.set("page", String(q.page))
    if (q?.limit) params.set("limit", String(q.limit))
    if (q?.search) params.set("search", q.search)
    const qs = params.toString()
    return {
      queryKey: queryKeys.students.filtered(q),
      queryFn: () => api<StudentListResponse>(`/api/training/students${qs ? `?${qs}` : ""}`),
    }
  })
}
export const useStudent = crud.useOne
export const useCreateStudent = crud.useCreate
export const useUpdateStudent = crud.useUpdate
export const useDeleteStudent = crud.useDelete
