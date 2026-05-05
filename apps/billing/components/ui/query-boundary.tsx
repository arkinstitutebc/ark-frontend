import type { UseQueryResult } from "@tanstack/solid-query"
import { type JSX, Match, Switch } from "solid-js"

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T, Error>
  loadingFallback?: JSX.Element
  errorFallback?: (error: Error, retry: () => void) => JSX.Element
  children: (data: T) => JSX.Element
}

export function QueryBoundary<T>(props: QueryBoundaryProps<T>) {
  return (
    <Switch>
      <Match when={props.query.isPending}>{props.loadingFallback ?? <DefaultSkeleton />}</Match>
      <Match when={props.query.isError}>
        {props.errorFallback?.(props.query.error!, () => props.query.refetch()) ?? (
          <DefaultError error={props.query.error!} retry={() => props.query.refetch()} />
        )}
      </Match>
      <Match when={props.query.isSuccess}>{props.children(props.query.data!)}</Match>
    </Switch>
  )
}

function DefaultSkeleton() {
  return (
    <div class="animate-pulse space-y-3">
      <div class="h-8 bg-gray-200 rounded w-1/3" />
      <div class="h-64 bg-gray-200 rounded" />
    </div>
  )
}

function DefaultError(props: { error: Error; retry: () => void }) {
  return (
    <div class="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
      <p class="text-sm text-gray-600 mb-3">{props.error.message}</p>
      <button
        type="button"
        onClick={props.retry}
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Retry
      </button>
    </div>
  )
}
