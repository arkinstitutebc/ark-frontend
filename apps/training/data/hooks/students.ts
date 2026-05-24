import { createCrudHooks } from "@ark/ui"
import { queryKeys } from "../query-keys"
import type { Student } from "../types"

interface StudentListQuery {
  batchId?: string
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

export const useStudents = crud.useList
export const useStudent = crud.useOne
export const useCreateStudent = crud.useCreate
export const useUpdateStudent = crud.useUpdate
export const useDeleteStudent = crud.useDelete
