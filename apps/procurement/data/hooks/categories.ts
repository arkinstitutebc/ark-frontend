import { createCrudHooks } from "@ark/ui"
import type { ProcurementCategory } from "@data/types"

interface CreateCategoryInput {
  name: string
  notes?: string
}

interface UpdateCategoryInput {
  name?: string
  notes?: string
  active?: boolean
}

const crud = createCrudHooks<
  ProcurementCategory,
  ProcurementCategory,
  CreateCategoryInput,
  UpdateCategoryInput,
  void
>({
  basePath: "/api/procurement/categories",
  domain: "procurement-categories",
  label: "Category",
  messages: {
    create: "Category added",
    delete: "Category removed",
  },
})

export const useCategories = crud.useList
export const useCreateCategory = crud.useCreate
export const useUpdateCategory = crud.useUpdate
export const useDeleteCategory = crud.useDelete
