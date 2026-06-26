# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run typecheck    # TypeScript check (no emit)
npm run format       # Prettier write
npm run format:check # Prettier check

npm run test                  # Vitest (unit/integration)
npm run test:ui               # Vitest with browser UI
npm run test:coverage         # Coverage report
npm run test:e2e              # Playwright end-to-end
npm run test:e2e:ui           # Playwright with UI
```

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SENTRY_DSN=   # optional, errors only in production
```

## Architecture

**Next.js 15 App Router** with the following top-level directories:

- `app/` — pages and API routes (App Router)
- `components/` — React components (`ui/` for primitives, `forms/`, `layout/`)
- `lib/` — utilities, Supabase clients, Zod schemas, error classes
- `types/index.ts` — all shared TypeScript types

### Multi-Tenant Data Model

The hierarchy is: **Organization → Clinics / Companies → Employees**

- `Organization` owns `Clinic[]` and `Company[]`; `Company` owns `Employee[]`
- Every authenticated user belongs to one `organizationId`; API routes enforce this by fetching `users.organization_id` from Supabase before any data query
- Supabase Row Level Security (RLS) enforces data isolation between tenants at the DB layer

### Supabase Client Usage

There are **two different Supabase client factories** — use the right one:

| Context                        | Import                                      | Usage                                             |
| ------------------------------ | ------------------------------------------- | ------------------------------------------------- |
| Browser / Client Component     | `lib/supabase/client.ts` → `supabase`       | auth helpers `createBrowserClient`                |
| Server Component / API Route   | `lib/supabase/server.ts` → `createClient()` | `@supabase/ssr` `createServerClient` with cookies |
| Auth utilities (login, signup) | `lib/supabase/auth.ts` → `authClient`       | thin wrappers over `supabase.auth.*`              |

`lib/supabase.ts` is a legacy file using the raw `createClient`; prefer the files above.

### API Routes Pattern

All routes in `app/api/` follow the same pattern:

1. `createClient()` from `lib/supabase/server`
2. Authenticate via `supabase.auth.getUser()` — throw `AuthenticationError` if missing
3. Fetch `users` row to get `organization_id` (and `role` when write access needed)
4. Run the business query scoped to `organization_id`
5. Return `{ success: true, data }` or catch and call `getErrorResponse(error)`

Role check for mutations: only `role === 'admin'` can create/update/delete; throw `AuthorizationError` otherwise.

### Error Handling

Custom error hierarchy in `lib/errors.ts`:

- `AppError` (base) → `ValidationError` (400), `AuthenticationError` (401), `AuthorizationError` (403), `NotFoundError` (404), `ConflictError` (409), `InternalServerError` (500)
- `getErrorResponse(error)` converts any thrown value to `{ statusCode, code, message }`

### Middleware

`middleware.ts` runs on all non-API, non-static routes:

- Unauthenticated requests to `/dashboard/*` → redirect to `/auth/login`
- Authenticated requests to `/auth/*` → redirect to `/dashboard`
- Adds security headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.)

### Validation

Zod schemas in `lib/validations/` are shared between API routes (`.parse(body)`) and form resolvers via `@hookform/resolvers/zod`.

### Path Aliases

`@/*` maps to the repo root. Use `@/lib/...`, `@/components/...`, `@/types/...` etc. in imports.

### UI Components

`components/ui/` holds shadcn-style primitives (`button`, `card`, `input`, `dialog`, `form`, `label`, `table`) built with Radix UI + Tailwind. Utility `cn()` from `lib/utils.ts` merges class names.

State management: **Zustand** for global state; **TanStack Query v5** for server state / data fetching; **react-hook-form** for forms.

### Monitoring

- **Sentry**: initialized in `app/providers.tsx`, only active in `production` when `NEXT_PUBLIC_SENTRY_DSN` is set
- `lib/performance.ts` contains Web Vitals helpers
- `app/analytics.tsx` wires up analytics reporting
