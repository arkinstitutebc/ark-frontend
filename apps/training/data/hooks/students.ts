import { createCrudHooks } from "@ark/ui"
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
})

export const useStudents = crud.useList
export const useStudent = crud.useOne
export const useCreateStudent = crud.useCreate
export const useUpdateStudent = crud.useUpdate
export const useDeleteStudent = crud.useDelete
