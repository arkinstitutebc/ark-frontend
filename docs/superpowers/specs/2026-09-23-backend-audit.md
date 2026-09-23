# Cross-Repo Audit — 2026-09-23

Seven sweeps over `ark-services` and `ark-frontend`, each targeting a bug class
actually hit during the performance work rather than a generic checklist.

| # | Class | Result |
|---|---|---|
| 1 | Module-level mutable state in SSR code | 1 real (already fixed); 3 false positives |
| 2 | Build-time env inlining | clean (fixed earlier); frontend has none |
| 3 | Unvalidated params reaching SQL | **20 real gaps — fixed** |
| 4 | Raw `sql` fragments + param binding | clean — the earlier bug was a one-off |
| 5 | Range/boundary correctness | clean — income statement already correct |
| 6 | Route guard coverage | clean — 34/35 GET routes require auth |
| 7 | Error handling that leaks or swallows | clean — no swallowed errors |

## Sweep 1 — module-level state

`grep` found four module-level mutable bindings in shared packages. Only the
`QueryClient` was a real cross-request leak (fixed separately). The others are
client-only in practice and were left alone:

- `modal.tsx` `scrollLockCount` / `previousBodyOverflow` — touched only inside
  `createEffect`, which never runs during SSR.
- `app-toaster.tsx` `nextId` and its module-level signal — `show()` is only
  called from client event handlers.

Changing working code on a theoretical risk would have been churn.

## Sweep 3 — date params (the real finding)

`drizzle-zod` maps a Postgres `date()` column to a bare `z.string()`, so no
insert schema validated date format anywhere. Rather than guess which schemas
were affected, every exported schema was introspected and probed with
`"banana"`, `"2026-02-31"` and `"31/12/2026"`.

**40 hits, ~20 genuinely input-facing** (the rest were `select*` output schemas).
Fixed by adding `src/types/common.ts`:

```ts
export const dateString = z.string().date();
```

applied via explicit field declarations and `createInsertSchema` refinements
across `training`, `procurement`, `reimbursement`, `hr`, `billing`, `finance`
and `asset`.

Two verification steps that mattered:

- The first refinement attempt used `(schema) => schema.date()`, which **drops
  `.optional()`** and made nullable columns required. `tsc` caught it; the fix
  is `.date().nullish()`.
- A before/after diff of every schema's required-field set proved **no field
  changed optionality**.

`tests/types/date-validation.test.ts` enumerates schemas rather than listing
fields, so a date column added later is covered automatically. Known limitation:
it only sees schemas exported from `src/types/`, so an inline schema in a route
file is not covered — one such case existed and is noted below.

### Severity was higher than first assumed

`src/middleware/error.ts` maps `22P02` to 400, which initially looked like it
already covered bad dates. It does not — the live database reports:

```
'banana'::date      -> SQLSTATE 22007  (invalid_datetime_format)
'2026-02-31'::date  -> SQLSTATE 22008  (datetime_field_overflow)
```

Neither was mapped, so both produced 500s. Added both to `PG_ERROR_MAP` as
defense in depth behind the edge validation.

## Sweep 6 — route guards

All 35 parameterless GET routes were probed unauthenticated against production.
34 returned 401. The one public route, `/api/content/posts`, is
`listPublishedPosts()` — public by design. Mutations on publicly-mounted routers
were audited by hand: `content` mutations live in `admin-routes.ts` behind
`requireAuth + requireAdmin`, and `auth` correctly guards `/me`, `/me/avatar`
and `/change-password`.

Only GETs were probed against production deliberately: had a guard been missing,
an unauthenticated POST would have mutated real data.

### Public endpoints were unthrottled

`/api/public/training` is unauthenticated by design (the enrolment form behind
`forms.arkinstitutebc.com`), but had no rate limit, while the codebase already
uses `express-rate-limit` elsewhere. Two of the three endpoints mint **Cloudinary
upload signatures**, so anyone could mint signatures and upload at will, or
insert student rows in bulk.

Added `uploadSignatureLimiter` (30 / 15 min) and `enrollmentLimiter`
(10 / 15 min), matching the existing limiter style. Verified live:
`ratelimit-policy: 30;w=900`.

`publicStudentEnrollmentSchema` is declared inline in `public-routes.ts`, so the
schema probe missed it. Its `dateOfBirth` flowed straight into
`students.date_of_birth` unvalidated on a public, unauthenticated endpoint — now
`dateString`. A follow-up grep confirmed it was the only inline schema with a
date field; the others validate uuids and slugs.
