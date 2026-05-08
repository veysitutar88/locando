# Project: Locando

## Overview

Locando is a multi-tenant SaaS platform for restaurant table reservations — a free/cheaper alternative to Quandoo, Zenchef, OpenTable, and TheFork. The first tenant is June Six Bistro Bar in Berlin-Charlottenburg (j6restaurant.de), operated by the project owner.

Locando is a **booking engine**, not a restaurant website. Restaurants integrate it via a hosted booking page or iframe embed. The restaurant's own website remains separate and independent.

## Core Features (MVP)

**Guest-facing (public booking widget):**
- Pick date, time, number of guests
- Enter name, email, phone
- Receive 6-digit OTP via email to confirm
- Cancel via emailed link

**Owner dashboard (admin):**
- Reservations list: today / tomorrow / week views
- Status state machine: pending → confirmed → seated → no-show / cancelled
- Manually add / edit / delete reservations (for phone bookings)
- CRUD for tables (number, capacity, zone)
- CRUD for opening hours

**Waiter view (tablet-friendly):**
- Today's reservations sorted by time
- One-tap: arrived → seated, didn't show → no-show

**Banquet inquiry form (separate flow):**
- Public form: date, guest count, phone, comment
- No availability check — just notifies owner via email
- Owner calls back to discuss individually

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript (strict)
- **Styling:** Tailwind CSS 4
- **Database:** Neon Postgres (serverless)
- **ORM:** Drizzle ORM (NOT Prisma, NOT Supabase client)
- **Auth:** Passport.js + Google OAuth + JWT (NOT Supabase Auth)
- **Validation:** Zod
- **Forms:** react-hook-form + @hookform/resolvers
- **Email:** Resend (3000/month free tier)
- **Deploy:** Vercel
- **Icons:** lucide-react

## Architecture Notes

### Multi-tenant model

Every database table carries `tenant_id`. Tenant isolation is enforced at the **application level** via Next.js middleware — NOT via PostgreSQL RLS. Middleware extracts the current tenant from the subdomain and stores it in the request context. Every repository function receives `tenant_id` as a parameter.

### Subdomain routing

- `j6.locando.net` → June Six (first tenant)
- `{slug}.locando.net` → other tenants
- `app.locando.net` → admin dashboard
- `locando.net` → marketing site (post-MVP)

### Module isolation

```
src/modules/reservations/   ← main booking module
src/modules/banquets/       ← banquet inquiry module
src/shared/                 ← cross-module utilities only
```

Modules MUST NOT import from each other directly. They communicate only through `src/shared/`.

### Webhook-first API

Designed for future integration with Chef's Mind OS, Chef's Eye, and Zapier:
- `POST /api/v1/reservations` — external creation
- `GET /api/v1/reservations?date=...` — external read
- Outgoing: `reservation.confirmed`, `reservation.cancelled`, `reservation.no_show`

### Future-compatibility

This stack (TypeScript + Next.js + Postgres + Drizzle) intentionally mirrors Chef's Mind OS to enable eventual merge.

## Non-Functional Requirements

- Logging: structured (JSON), configurable via LOG_LEVEL
- Error handling: structured error responses with proper HTTP codes
- Security: input validation via Zod at all boundaries, tenant isolation enforced in middleware
- Performance: Neon serverless handles cold starts; Drizzle minimal overhead
- i18n: DE / EN (post-MVP, Chunk #32 via next-intl)
