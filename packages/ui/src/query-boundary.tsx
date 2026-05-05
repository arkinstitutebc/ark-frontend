import type { UseQueryResult } from "@tanstack/solid-query"
import { type JSX, Match, Switch } from "solid-js"

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T, Error>
  loadingFallback?: JSX.Element
  errorFallback?: (error: Error, retry: () => void) => JSX.Element
  children: (data: T) => JSX.Element
}

export function QueryBoundary<T>(props: QueryBoundaryProps<T>) {
  // Inside <Match when={isError}>, error is non-null. Same for data inside isSuccess.
  // We narrow via local helpers and cast once each — TS can't track this through `props`.
  const error = () => props.query.error as Error
  const data = () => props.query.data as T

  return (
    <Switch>
      <Match when={props.query.isPending}>{props.loadingFallback ?? <DefaultSkeleton />}</Match>
      <Match when={props.query.isError}>
        {props.errorFallback?.(error(), () => props.query.refetch()) ?? (
          <DefaultError error={error()} retry={() => props.query.refetch()} />
        )}
      </Match>
      <Match when={props.query.isSuccess}>{props.children(data())}</Match>
    </Switch>
  )
}

function DefaultSkeleton() {
  return (
    <div class="animate-pulse space-y-3">
      <div class="h-8 bg-surface-muted rounded w-1/3" />
      <div class="h-64 bg-surface-muted rounded" />
    </div>
  )
}

function DefaultError(props: { error: Error; retry: () => void }) {
  return (
    <div class="rounded-lg border border-border bg-surface-muted p-8 text-center">
      <p class="text-sm text-muted mb-3">{props.error.message}</p>
      <button
        type="button"
        onClick={props.retry}
        class="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-muted transition-colors"
      >
        Retry
      </button>
    </div>
  )
}
