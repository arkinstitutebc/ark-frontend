import { api } from "@ark/api-client"
import {
  type CreateMutationResult,
  type CreateQueryResult,
  createMutation,
  createQuery,
  useQueryClient,
} from "@tanstack/solid-query"
import { toast } from "../feedback/app-toaster"

/**
 * Factory for the standard 5 CRUD hooks (list / one / create / update / delete).
 *
 * Replaces ~150 LOC of duplicated `createQuery`+`createMutation` boilerplate
 * across 10+ domain hook files. Each domain still keeps its bespoke mutations
 * (e.g. useApprovePr, useRecordPayment, useAdjustStock) inline — only plain
 * CRUD goes through this factory.
 *
 * Defaults assume:
 *   - List endpoint: GET `${basePath}` with optional `?key=value` query string
 *   - Detail endpoint: GET `${basePath}/${id}`
 *   - Create endpoint: POST `${basePath}`
 *   - Update endpoint: PUT `${basePath}/${id}` (id stripped from body)
 *   - Delete endpoint: DELETE `${basePath}/${id}` (returns 204; api() handles it)
 *
 * QueryKeys default to `[domain, "list", filters]`, `[domain, "detail", id]`.
 * Invalidation on every mutation: `[domain]`. Pass `queryKeys.all` etc. via
 * the optional override if your hook file already exports a queryKeys factory.
 */

export interface CrudConfig<TList, TOne, TCreate, TUpdate, TListQuery> {
  /** Resource base path, e.g. "/api/training/students" */
  basePath: string
  /** Domain key for query caching + invalidation, e.g. "students" */
  domain: string
  /** Display label for default toast messages, e.g. "Student" */
  label?: string
  /** Override or silence individual toasts. `false` to skip. */
  messages?: {
    create?: string | false
    update?: string | false
    delete?: string | false
  }
  /**
   * Build the list URL from a filter object. Default: any truthy values are
   * appended as `?k=v` pairs.
   */
  buildListUrl?: (q: TListQuery | undefined) => string
  /** Optional override of the queryKey factory. Default uses `[domain, ...]`. */
  queryKeys?: {
    all: readonly unknown[]
    list: (q: TListQuery | undefined) => readonly unknown[]
    detail: (id: string) => readonly unknown[]
  }
  // The 5 generics are reflected on the public API; these keys are not used at runtime.
  _types?: {
    list?: TList
    one?: TOne
    create?: TCreate
    update?: TUpdate
    listQuery?: TListQuery
  }
}

interface CrudHooks<TList, TOne, TCreate, TUpdate, TListQuery> {
  useList: (query?: () => TListQuery | undefined) => CreateQueryResult<TList[]>
  useOne: (id: () => string) => CreateQueryResult<TOne>
  useCreate: () => CreateMutationResult<TOne, Error, TCreate>
  useUpdate: () => CreateMutationResult<TOne, Error, TUpdate & { id: string }>
  useDelete: () => CreateMutationResult<void, Error, string>
}

function defaultBuildListUrl<Q>(basePath: string, q: Q | undefined): string {
  if (!q || typeof q !== "object") return basePath
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(q as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export function createCrudHooks<
  TList,
  TOne = TList,
  TCreate = Partial<TList>,
  TUpdate = Partial<TList>,
  TListQuery = void,
>(
  config: CrudConfig<TList, TOne, TCreate, TUpdate, TListQuery>
): CrudHooks<TList, TOne, TCreate, TUpdate, TListQuery> {
  const { basePath, domain, label } = config
  const labelText = label ?? domain.charAt(0).toUpperCase() + domain.slice(1)
  const buildList =
    config.buildListUrl ?? ((q: TListQuery | undefined) => defaultBuildListUrl(basePath, q))
  const keys = config.queryKeys ?? {
    all: [domain] as const,
    list: (q: TListQuery | undefined) => [domain, "list", q] as const,
    detail: (id: string) => [domain, "detail", id] as const,
  }
  const successMsg = (kind: "create" | "update" | "delete"): string | null => {
    const override = config.messages?.[kind]
    if (override === false) return null
    if (typeof override === "string") return override
    if (kind === "create") return `${labelText} created`
    if (kind === "update") return `${labelText} updated`
    return `${labelText} deleted`
  }

  function useList(query?: () => TListQuery | undefined) {
    return createQuery(() => {
      const q = query?.()
      return {
        queryKey: keys.list(q),
        queryFn: () => api<TList[]>(buildList(q)),
      }
    })
  }

  function useOne(id: () => string) {
    return createQuery(() => ({
      queryKey: keys.detail(id()),
      queryFn: () => api<TOne>(`${basePath}/${id()}`),
      enabled: !!id(),
    }))
  }

  function useCreate() {
    const qc = useQueryClient()
    return createMutation(() => ({
      mutationFn: (data: TCreate) =>
        api<TOne>(basePath, { method: "POST", body: JSON.stringify(data) }),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: keys.all })
        const msg = successMsg("create")
        if (msg) toast.success(msg)
      },
      onError: (err: Error) => toast.error(err.message),
    }))
  }

  function useUpdate() {
    const qc = useQueryClient()
    return createMutation(() => ({
      mutationFn: ({ id, ...data }: TUpdate & { id: string }) =>
        api<TOne>(`${basePath}/${id}`, { method: "PUT", body: JSON.stringify(data) }),
      onSuccess: (_data, variables) => {
        qc.invalidateQueries({ queryKey: keys.all })
        if (variables.id) qc.invalidateQueries({ queryKey: keys.detail(variables.id) })
        const msg = successMsg("update")
        if (msg) toast.success(msg)
      },
      onError: (err: Error) => toast.error(err.message),
    }))
  }

  function useDelete() {
    const qc = useQueryClient()
    return createMutation(() => ({
      mutationFn: (id: string) => api<void>(`${basePath}/${id}`, { method: "DELETE" }),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: keys.all })
        const msg = successMsg("delete")
        if (msg) toast.success(msg)
      },
      onError: (err: Error) => toast.error(err.message),
    }))
  }

  return { useList, useOne, useCreate, useUpdate, useDelete }
}
