import { createCrudHooks } from "@ark/ui"
import type { ProcurementCategory } from "@data/types"
import { queryKeys } from "../query-keys"

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
  queryKeys: {
    all: queryKeys.categories.all,
    list: () => queryKeys.categories.all,
    detail: id => queryKeys.categories.detail(id),
  },
})

export const useCategories = crud.useList
export const useCreateCategory = crud.useCreate
export const useUpdateCategory = crud.useUpdate
export const useDeleteCategory = crud.useDelete
