---
name: locando-domain
description: Locando domain knowledge — restaurant reservations SaaS, multi-tenant model, OTP flow, booking status machine, June Six specifics. Invoke when working on reservations, tables, booking logic, tenant isolation, or OTP.
type: project
---

# locando-domain

**Activate when:** working on reservations, tables, booking logic, OTP flow, tenant isolation, banquet inquiries, or any booking-related business rules.

## Domain Context

Locando is a **booking engine** (not a restaurant website). Restaurants integrate via a hosted page (`{slug}.locando.net/book`) or iframe embed. June Six Bistro Bar (Berlin-Charlottenburg) is the first tenant.

## Core Domain Entities

### `restaurants` (tenants)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | e.g. "June Six Bistro Bar" |
| slug | text | UNIQUE, used in subdomain, e.g. "j6" |
| owner_email | text | Google OAuth email |
| settings | jsonb | booking_step, default_duration, last_slot |
| created_at | timestamp | |

### `tables`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK → restaurants.id, NOT NULL |
| number | integer | table number shown to staff |
| capacity | integer | max guests |
| zone | text | nullable, e.g. "terrace", "main hall" |

### `reservations`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK → restaurants.id, NOT NULL |
| table_id | uuid | FK → tables.id, nullable (auto-assigned) |
| guest_name | text | |
| guest_email | text | |
| guest_phone | text | |
| date | date | |
| time | time | start time |
| duration | integer | minutes, default 90 |
| party_size | integer | number of guests |
| status | enum | pending → confirmed → seated → (no-show | cancelled) |
| created_at | timestamp | |
| updated_at | timestamp | |

### `staff_users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK → restaurants.id, NOT NULL |
| user_id | uuid | FK → auth users (Chunk #9) |
| role | enum | owner \| waiter |

### `otp_codes`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| reservation_id | uuid | FK → reservations.id |
| code | char(6) | 6-digit numeric OTP |
| expires_at | timestamp | now + 15 minutes |
| used_at | timestamp | nullable, set on successful verify |

## Business Rules

### Tenant Isolation
- **Every query MUST filter by tenant_id** — no exceptions
- Isolation is **application-level** (Next.js middleware + repository functions)
- PostgreSQL RLS is NOT used in v1
- Middleware extracts tenant from subdomain → repository receives tenant_id as param

### OTP Flow
1. Guest submits booking form → reservation created with status `pending`
2. 6-digit code generated → stored in `otp_codes` with 15-minute expiry
3. Code sent to guest email via Resend
4. Guest enters code → verified → reservation status → `confirmed`
5. Guest can cancel via unique link in confirmation email

### Status State Machine
```
pending → confirmed → seated → no-show
                    → cancelled
pending → cancelled  (guest cancels before confirming)
```
Transitions are one-way. No going backward.

### June Six Specifics (first tenant)
- Opening hours: Tuesday–Sunday, 15:00–23:00 (Monday closed)
- Booking step: 30 minutes
- Default booking duration: 90 minutes
- Last booking slot: ~21:30 (leaves time before close)
- Tables: 4× 2-seat, 5× 4-seat, 2× 6-seat, 1× 8-seat

### Table Assignment
- Tables auto-assigned based on party_size and availability
- No manual table selection by guests in MVP
- Owner can manually reassign in dashboard

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `reservation-card.tsx` |
| Components | PascalCase, named export | `export function ReservationCard` |
| Functions/vars | camelCase | `getAvailableSlots` |
| DB tables | snake_case plural | `otp_codes`, `staff_users` |
| Barrel files | FORBIDDEN | No `index.ts` re-exports |
| Cross-module imports | FORBIDDEN | `modules/A` cannot import `modules/B` |

## Module Structure

```
src/modules/reservations/
  components/   ← UI components for this module
  services/     ← Business logic, calls to shared/db
  lib/          ← Pure utilities: slot calculation, availability

src/modules/banquets/
  components/
  services/
  lib/

src/shared/db/  ← Drizzle client + schema (single source of truth)
```

## What NOT to do

- DO NOT query without `tenant_id` filter
- DO NOT import modules from each other
- DO NOT bypass OTP for guest bookings
- DO NOT add features not specified in the current chunk
- DO NOT use Supabase Auth or Prisma
