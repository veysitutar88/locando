# Architecture — Locando

## What Locando is (and isn't)

Locando is a **booking engine**, not a restaurant website. Restaurants plug it in via a hosted booking page (`https://{slug}.locando.net/book`) or an iframe embed. The restaurant's own website (e.g. j6restaurant.de) remains completely independent — a "Book a Table" button simply links to Locando. This separation keeps deployment simple, avoids coupling the SaaS to each tenant's frontend, and allows future introduction of a JS embed script without restructuring.

Integration modes:

1. **Hosted booking page** — `https://{slug}.locando.net/book` — the guest navigates to a Locando URL (MVP)
2. **Iframe embed** — `<iframe src="...">` on the restaurant's own site (MVP basic)
3. **JS embed script** — `<script src="...">` with shadow DOM widget (post-MVP)

June Six specifics: `j6restaurant.de` stays as-is. The booking button points to `https://j6.locando.net/book`.

---

## Multi-tenant Model

Every table in the database carries a `tenant_id` foreign key referencing `restaurants.id`. Tenant isolation is enforced at the **application level** — not via PostgreSQL RLS.

### How isolation works

```
HTTP request arrives
  ↓
Next.js middleware reads subdomain
  e.g. "j6" from "j6.locando.net"
  ↓
Middleware resolves tenant_id from database (by slug)
  ↓
tenant_id stored in request context (headers / AsyncLocalStorage)
  ↓
Every repository function receives tenant_id as an explicit parameter
  ↓
Every Drizzle query includes: .where(eq(table.tenantId, tenantId))
```

No raw SQL and no repository call is valid without a tenant_id filter. Enforced by code review; a future ESLint rule can automate this.

PostgreSQL RLS is deliberately **not** used in v1. Application-level isolation is simpler to reason about, debug, and test. RLS is reserved as a future hardening layer if a security audit requires it.

---

## Subdomain Routing Strategy

| Subdomain | Route | Purpose |
|-----------|-------|---------|
| `j6.locando.net` | tenant: j6 | June Six (first tenant) |
| `{slug}.locando.net` | tenant: {slug} | any other restaurant |
| `app.locando.net` | admin dashboard | owner + waiter views |
| `locando.net` | marketing site | post-MVP |

In development: `localhost:3000` maps to a default tenant. Subdomain simulation via hosts file or middleware config for local multi-tenant testing.

---

## Repository Pattern

Implemented in Chunk #4. All database access goes through hand-written
repositories — never directly via `db.query.*` from feature code. The
repository layer is the single chokepoint where `tenant_id` filtering
is enforced.

### Layout

| Repo | Path | Scope |
|------|------|-------|
| `restaurantsRepo` | `src/shared/db/restaurants-repo.ts` | non-scoped (the tenant root itself) |
| `reservationsRepo` | `src/modules/reservations/lib/reservations-repo.ts` | tenant-scoped (`tenantId` is first param) |
| `tablesRepo` | `src/modules/reservations/lib/tables-repo.ts` | tenant-scoped (`tenantId` is first param) |

Tenant-scoped repos take `tenantId: string` as the first argument of
every method. Update payload types omit `id`, `tenantId`, `createdAt`,
`updatedAt` so callers can't override fields the repository owns.

### Helpers and errors

- `withTimestamps()` (in `src/shared/db/helpers.ts`) — adds
  `updatedAt: new Date()` to update payloads. Per ADR #16. Type
  signature forbids passing `updatedAt` from the caller.
- `NotFoundError`, `UniqueConstraintError` (in `src/shared/db/errors.ts`)
  — thrown by repos when an entity is missing or a unique constraint is
  violated. `TenantMismatchError` is intentionally **not** added in
  Chunk #4 (YAGNI) — it will appear in the chunk that actually needs it.

### ESLint enforcement

`eslint.config.mjs` adds `no-restricted-imports` blocking imports of
`@/shared/db/client` and `@/shared/db/schema` everywhere except:

- `src/shared/db/**`
- `src/modules/**/lib/*repo.ts`

A missing `tenantId` filter is therefore caught at lint time rather
than runtime. The rule is a guard, not a guarantee — security still
relies on review and on the explicit `tenantId` parameter design.

### Why hand-written, not a generic factory

A `tenantScoped<T>()` factory was considered and rejected for now.
Drizzle's generic typing required broad `as never` casts that would
weaken the security guarantee the repository layer is meant to give.
For tenant isolation (a security boundary), explicit > abstract. A
factory may be extracted later when 3–4 stable repos exist (Chunk #15+).

---

## Module Isolation Rule

```
src/
├── modules/
│   ├── reservations/     ← booking domain
│   │   ├── components/
│   │   ├── services/
│   │   └── lib/
│   └── banquets/         ← banquet inquiry domain
│       ├── components/
│       ├── services/
│       └── lib/
├── shared/
│   ├── auth/             ← Passport.js, JWT helpers
│   ├── ui/               ← shared UI primitives
│   ├── layout/           ← Header, Footer, nav
│   └── db/               ← Drizzle client + schema
└── app/
    ├── (public)/         ← /book, /banquet
    └── (admin)/          ← /admin/*
```

**Dependency rule:** `modules/A` CANNOT import from `modules/B`. Both can import from `shared/`. This prevents the classic "big ball of mud" that happens when a second module appears and developers reach across boundaries for convenience.

---

## Stack Decisions and Rationale

### Next.js 16 App Router

Server Components allow data fetching without client-side JS, reducing bundle size and improving time-to-interactive for the public booking widget. Server Actions eliminate separate API endpoints for most form submissions. The App Router's route groups enable clean separation of `(public)` and `(admin)` layouts without duplicating wrapper code.

### Neon Postgres (serverless)

Neon's serverless driver (`@neondatabase/serverless`) works in Vercel Edge and Node.js runtimes without configuration changes. Connection pooling is handled externally, eliminating the connection limit problems that arise with traditional Postgres on serverless. No cold-start penalty for the DB client.

### Drizzle ORM

Drizzle is SQL-first: if you know SQL, you know Drizzle. It generates TypeScript types directly from schema definitions, catching column name mistakes at compile time. The query builder produces predictable SQL with no hidden N+1 queries. Bundle size is ~7.4kb. See `docs/DECISIONS.md` ADR #3 for the full Drizzle vs Prisma comparison.

### Passport.js + Google OAuth

Chosen for compatibility with Chef's Mind OS (the broader agentic restaurant management platform Locando will eventually merge into). Chef's Mind OS already uses Passport.js. Using the same auth layer avoids a rewrite at merge time. JWT tokens are issued after OAuth, stored in httpOnly cookies. See ADR #4.

### Zod + react-hook-form

Zod schemas serve double duty: runtime validation at API boundaries and compile-time types for TypeScript. react-hook-form integrates with Zod via `@hookform/resolvers` with zero boilerplate. This combination avoids duplicated validation logic between client and server.

### Resend

3,000 emails/month on the free tier — sufficient for MVP. Simple REST API, good Next.js examples, no SMTP configuration headaches. Used exclusively for OTP delivery and booking confirmations in MVP.

### Vercel

Natural pairing with Next.js: zero-config deployments, automatic preview environments per PR, built-in edge network. Neon's Vercel integration auto-injects `DATABASE_URL`. Cost is zero at MVP traffic levels.

---

## Webhook-First API Design

Every state change in the reservations system emits an outgoing webhook:

- `reservation.confirmed` — fired when guest verifies OTP
- `reservation.cancelled` — fired on any cancellation
- `reservation.no_show` — fired when status set to no-show

Incoming REST endpoints:

- `POST /api/v1/reservations` — external systems can create reservations
- `GET /api/v1/reservations?date=YYYY-MM-DD` — external read

Each tenant gets an API key + configurable webhook URL. This enables integration with Chef's Eye (banquet order processing), Chef's Mind OS, and future Zapier/Make connections without building a custom integration layer later.

---

## Website Integration Strategy

Locando is a booking engine, NOT each restaurant's website. Integration modes:

1. **Hosted page** `https://{slug}.locando.net/book` — the simplest integration. Guest is redirected to Locando's domain. No code changes required on the restaurant side.
2. **Iframe embed** — `<iframe src="https://{slug}.locando.net/book" ...>` — embed the booking form inside the restaurant's page. Basic CORS and frame-ancestors CSP headers required.
3. **JS embed script** — post-MVP. Shadow DOM widget injected via `<script>`. Requires separate packaging step.

June Six uses Mode 1: j6restaurant.de has a "Reservierung" button pointing to `https://j6.locando.net/book`. No hard coupling between Locando and the June Six website.

---

## Future-Compatibility with Chef's Mind OS

Chef's Mind OS (Igor's broader agentic platform) uses the same stack: TypeScript + Express + Next.js + Postgres + Drizzle + LangGraph. Locando's stack was locked to match this exactly, so that Locando can eventually be absorbed as a module into Chef's Mind OS without a rewrite. The auth layer (Passport.js + JWT) and ORM (Drizzle) choices were driven primarily by this compatibility requirement.
