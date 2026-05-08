# Database Schema — Locando

> Source of truth: `src/shared/db/schema.ts` (Drizzle).
> This document is a human-readable mirror — kept in sync after every schema change.

---

## Tenant Isolation Strategy

All tables except `restaurants` carry a `tenant_id` column that references `restaurants.id`. Isolation is enforced at the **application level**:

1. Next.js middleware reads the subdomain from the incoming request (Chunk #4)
2. Middleware resolves the `tenant_id` by looking up `restaurants.slug`
3. `tenant_id` is stored in request context (header or AsyncLocalStorage)
4. Every repository function accepts `tenantId` as an explicit parameter
5. Every Drizzle query includes `.where(eq(table.tenantId, tenantId))`

PostgreSQL RLS is **NOT used in v1**. Application-level isolation is simpler to debug and test. RLS is reserved for future hardening if a security audit requires it.

All timestamps are `timestamp with time zone` (timestamptz). All UUIDs use `defaultRandom()` (Postgres `gen_random_uuid()`) — no `uuid-ossp` extension required.

---

## Table: `restaurants` (tenants)

Primary entity. Each row represents one restaurant and acts as the tenant root.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | defaultRandom() | PK |
| slug | varchar(63) | NO | — | UNIQUE. Used in subdomain. 63 = DNS label limit |
| name | varchar(255) | NO | — | e.g. "June Six Bistro Bar" |
| owner_email | varchar(255) | NO | — | Google OAuth email of the owner |
| timezone | varchar(63) | NO | 'Europe/Berlin' | IANA timezone for date/time interpretation |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | Updated via repository helper (ADR #16) |

**Indexes:** `uniqueIndex("restaurants_slug_unique")` on `slug`

---

## Table: `tables`

Physical tables in the restaurant. Each table belongs to exactly one tenant.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | defaultRandom() | PK |
| tenant_id | uuid | NO | — | FK → restaurants.id, ON DELETE CASCADE |
| number | varchar(10) | NO | — | Table number/label, e.g. "1", "12A" |
| capacity | integer | NO | — | Maximum guests |
| zone | varchar(63) | YES | NULL | e.g. "terrace", "main hall", "bar" |
| notes | text | YES | NULL | Internal staff notes |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Indexes:**
- `uniqueIndex("tables_tenant_number_unique")` on `(tenant_id, number)`
- `index("tables_tenant_idx")` on `(tenant_id)`

**June Six initial data (not seeded in Chunks #1–#2):**
- 4× capacity 2
- 5× capacity 4
- 2× capacity 6
- 1× capacity 8

---

## Table: `reservations`

Core table. One row per booking.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | defaultRandom() | PK |
| tenant_id | uuid | NO | — | FK → restaurants.id, ON DELETE CASCADE |
| table_id | uuid | YES | NULL | FK → tables.id, ON DELETE SET NULL |
| guest_name | varchar(255) | NO | — | |
| guest_email | varchar(255) | NO | — | Used for OTP delivery and cancellation link |
| guest_phone | varchar(63) | YES | NULL | Phone, optional |
| party_size | integer | NO | — | Number of guests |
| reservation_date | date | NO | — | Booking date |
| reservation_time | time | NO | — | Booking start time |
| duration_minutes | integer | NO | 90 | Duration in minutes |
| status | reservation_status (enum) | NO | 'pending' | See state machine below |
| notes | text | YES | NULL | Internal staff notes |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |
| confirmed_at | timestamptz | YES | NULL | Set when guest verifies OTP |
| seated_at | timestamptz | YES | NULL | Set when waiter marks "arrived" |
| cancelled_at | timestamptz | YES | NULL | Set on any cancellation path |

**Enum `reservation_status`:** `pending`, `confirmed`, `seated`, `no_show`, `cancelled`

**Indexes:**
- `index("reservations_tenant_date_idx")` on `(tenant_id, reservation_date)` — daily list query
- `index("reservations_tenant_status_idx")` on `(tenant_id, status)` — status filtering
- `index("reservations_tenant_email_idx")` on `(tenant_id, guest_email)` — guest history (per-tenant, NOT global)

**Status state machine:**
```
pending ──────────────────────────────► cancelled
   │                                         ▲
   ▼                                         │
confirmed ────────────────────────────► cancelled
   │
   ▼
seated ──────────────────────────────► no_show
```
Transitions are one-way. No rollback. Transition timestamps (`confirmed_at`, `seated_at`, `cancelled_at`) are set when the corresponding transition fires.

---

## Table: `staff_users`

Links Google-authenticated users to tenants with a role.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | defaultRandom() | PK |
| tenant_id | uuid | NO | — | FK → restaurants.id, ON DELETE CASCADE |
| email | varchar(255) | NO | — | Google account email — linking key until OAuth runs |
| google_user_id | varchar(255) | YES | NULL | Set after first OAuth login (Chunk #9) |
| role | staff_role (enum) | NO | — | `owner` or `waiter` |
| name | varchar(255) | YES | NULL | Display name (from Google) |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Enum `staff_role`:** `owner`, `waiter`

**Indexes:**
- `uniqueIndex("staff_users_tenant_email_unique")` on `(tenant_id, email)`
- `uniqueIndex("staff_users_google_user_id_unique")` on `(google_user_id)` **WHERE `google_user_id IS NOT NULL`** (partial unique — allows multiple NULLs while OAuth is pending)

**Notes:**
- `owner` can do everything: manage tables, hours, view all reservations, invite staff
- `waiter` can only view today's reservations and update status (arrived → seated, didn't show → no_show)
- Email is the pre-OAuth linking key; `google_user_id` is filled when the user first logs in via Google (Chunk #9)

---

## Table: `otp_codes`

Short-lived codes for guest booking verification. One active code per reservation.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | defaultRandom() | PK |
| reservation_id | uuid | NO | — | FK → reservations.id, ON DELETE CASCADE |
| code | varchar(6) | NO | — | 6-digit numeric string |
| expires_at | timestamptz | NO | — | Set to `now() + 15 minutes` on insert |
| used_at | timestamptz | YES | NULL | Set when guest verifies |
| attempts | integer | NO | 0 | Incremented on each failed attempt |
| created_at | timestamptz | NO | now() | |

**Indexes:**
- `index("otp_codes_reservation_idx")` on `(reservation_id)`
- `index("otp_codes_code_expires_idx")` on `(code, expires_at)` — verification lookup

**OTP lifecycle:**
1. Reservation created → `otp_codes` row inserted, Resend API called (Chunk #19)
2. Guest enters code → check `code = ?` AND `expires_at > now()` AND `used_at IS NULL`
3. Valid → set `used_at = now()`, update reservation `status = 'confirmed'`, set `confirmed_at = now()`
4. Invalid → increment `attempts`. Block further attempts after 5 failures — guest must request resend
5. Expired → guest requests resend → new `otp_codes` row inserted

---

## Relationships Summary

```
restaurants (1)
  ├─── (N) tables          ON DELETE CASCADE
  ├─── (N) reservations    ON DELETE CASCADE
  │         └─── (N) otp_codes   ON DELETE CASCADE
  │         └─── (1) tables      ON DELETE SET NULL (table_id)
  └─── (N) staff_users     ON DELETE CASCADE
```

All tenant-scoped child tables cascade delete when a restaurant is deleted. `reservations.table_id` uses `SET NULL` instead — deleting a table preserves historical reservations.

In practice, deletion won't happen in MVP (no tenant offboarding flow), but the constraints ensure referential integrity.

---

## Migrations Strategy

Managed by Drizzle Kit:
- `drizzle-kit generate` → produces SQL migration file in `drizzle/`
- `drizzle-kit migrate` → applies pending migrations to the database

The `drizzle.config.ts` lives in the project root and loads `.env.local` via `dotenv` (so `DATABASE_URL` is read consistently for both CLI and runtime).

**`drizzle-kit push` is NEVER used** — not as a normal flow, not as a fallback when `migrate` fails. If `migrate` fails, the agent stops and reports the error rather than reaching for `push`. `push` may be considered later as an explicit dev-reset action only, with explicit approval.

---

## Deferred fields

Speculative fields that were considered for v1 but deferred to a later chunk:

| Field / Table | Reason for deferral | Target chunk |
|---|---|---|
| `restaurants.settings` (JSONB: booking_step, default_duration, last_slot) | Not yet needed; June Six values can be hardcoded for MVP | Separate config chunk if/when multi-tenant config UI is built |
| `reservations.cancel_token` (UUID) | Cancellation flow not yet implemented | Chunk #20 (cancellation flow) |
| `tables.is_active` (boolean) | Soft-disable not needed in MVP — owner can delete | Future, if soft-disable becomes a UX need |
| `staff_users.invited_at` / `accepted_at` | Staff invitation flow not yet implemented | Chunk #13 (staff invitation flow) |
| `opening_hours` table | Hours stored in JSONB on restaurant, or hardcoded for MVP | Chunk #26 (hours CRUD) |
| `otp_codes.tenant_id` | Possible future optimization for cross-tenant uniqueness checks or denormalized indexing. Not part of Chunk #2; not implemented until a concrete use-case appears | TBD |
| `webhook_deliveries` table | Webhook infrastructure | Chunk #6 (webhook system) |
