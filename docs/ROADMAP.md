# Roadmap — Locando

~34 chunks across 6 phases. Each chunk is 1–2.5 hours of focused work.
Total estimate: ~80–90 hours.

> **Numbering note:** the original plan had 35 chunks. Chunks #2 (Neon
> + Drizzle config) and #3 (Database schema) of that plan were executed
> as a single Chunk #2 in practice, so Phase 1 numbering shifts by −1
> from #3 onward. Phases 2–6 will be renumbered as their chunks come up.

---

## Phase 1 — Foundation (Chunks 1–7, ~19h)

Project setup, database schema, multi-tenant middleware, base UI shared components.

| Chunk | Name | Est. | Description |
|-------|------|------|-------------|
| #1 | Project Foundation | 2.5h | Next.js scaffold, aif setup, .claude/ context, docs/, module structure (DONE) |
| #2 | Neon + Drizzle + Schema | 4.5h | Neon project, drizzle.config.ts, DATABASE_URL, schema.ts (5 tables + relations), first migration (DONE; merges original #2 and #3) |
| #3 | Tenant Resolution Proxy | 3h | `src/proxy.ts` (Next 16 file convention; supersedes `middleware.ts`) parses Host → `x-tenant-slug`; `getTenant()` Server-side DB lookup; reserved subdomains; `DEV_TENANT_SLUG` for local dev; `TenantNotFound` page; June Six seed |
| #4 | Shared UI Components | 3h | Button, Input, Modal, Toast, StatusBadge — Tailwind 4 styled |
| #5 | Webhook Infrastructure | 2h | webhook_deliveries table, event emitter, outgoing HTTP delivery, retry |
| #6 | Email Templates | 2h | OTP email, confirmation email, cancellation email (Resend + React Email) |
| #7 | Error Handling Layer | 2h | Global error boundary, structured errors, 404/500 pages, logging setup |

---

## Phase 2 — Auth & Onboarding (Chunks 9–13, ~25h)

Passport.js, Google OAuth, JWT, role system, restaurant onboarding wizard, subdomain routing for admin.

| Chunk | Name | Est. | Description |
|-------|------|------|-------------|
| #9 | Passport.js + Google OAuth | 5h | Install passport, configure Google strategy, JWT issuance, httpOnly cookie |
| #10 | Role-based Access Control | 3h | owner / waiter roles, middleware guards, role check HOCs |
| #11 | Restaurant Onboarding Wizard | 5h | New tenant signup: name, slug, hours setup, first table seed |
| #12 | Admin Layout + Nav | 4h | app.locando.net layout, sidebar, responsive nav, role-aware menu |
| #13 | Staff Invitation Flow | 4h | Owner invites waiter by email, accept link, role assignment |

---

## Phase 3 — Public Booking Widget (Chunks 14–21, ~30h)

The `/book` public flow: date → time → guest count → OTP → confirmation.

| Chunk | Name | Est. | Description |
|-------|------|------|-------------|
| #14 | Booking Page Shell | 2h | `{slug}.locando.net/book` route, layout, tenant branding basics |
| #15 | Date + Time Picker | 4h | Calendar grid, time slots (30-min step), availability check against DB |
| #16 | Guest Count + Table Assignment | 3h | Party size picker, auto table assignment logic, capacity check |
| #17 | Guest Details Form | 3h | Name, email, phone form, Zod validation, react-hook-form |
| #18 | OTP Send + UI | 3h | Generate OTP, send via Resend, 6-digit input UI, 15-min timer |
| #19 | OTP Verification + Confirm | 4h | Verify OTP, update reservation status → confirmed, confirmation page |
| #20 | Cancellation Flow | 3h | Cancel link in email, cancel page, status → cancelled, confirmation |
| #21 | Booking Widget E2E Testing | 4h | Playwright tests for full happy path + OTP expiry + cancellation |

---

## Phase 4 — Owner Dashboard (Chunks 22–27, ~16h)

Reservations list, detail view, manual booking, table CRUD, hours CRUD.

| Chunk | Name | Est. | Description |
|-------|------|------|-------------|
| #22 | Reservations List View | 3h | Today/tomorrow/week tabs, status badges, real-time count |
| #23 | Reservation Detail + Status | 3h | Detail modal/page, status transitions (owner can set any), notes field |
| #24 | Manual Booking (Admin) | 2h | Owner creates booking for phone calls, no OTP required |
| #25 | Table CRUD | 3h | List tables, add/edit/delete, capacity/zone, soft-disable |
| #26 | Opening Hours CRUD | 3h | Day-of-week hours, closed days, holiday overrides |
| #27 | Dashboard Analytics (basic) | 2h | Today's count, week total, no-show rate — server-rendered |

---

## Phase 5 — Waiter View + Banquet Form (Chunks 28–30, ~7h)

Tablet-friendly waiter view and separate banquet inquiry form.

| Chunk | Name | Est. | Description |
|-------|------|------|-------------|
| #28 | Waiter View | 3h | Today's reservations sorted by time, one-tap status update (arrived / no-show) |
| #29 | Banquet Inquiry Form | 2h | Public form: date, guests, phone, comment → email to owner |
| #30 | Banquet Admin View | 2h | List of banquet inquiries in dashboard, mark as contacted |

---

## Phase 6 — Polish (Chunks 31–35, ~19h)

i18n, email polish, production hardening, bug fixes, go-live.

| Chunk | Name | Est. | Description |
|-------|------|------|-------------|
| #31 | Production Hardening | 4h | CSP headers, rate limiting (OTP endpoint), audit logs, env validation |
| #32 | i18n: DE / EN | 5h | next-intl setup, DE and EN translations for all public-facing text |
| #33 | Email Template Polish | 3h | Branded HTML emails, text fallbacks, unsubscribe footer |
| #34 | Bug Fix Sprint | 4h | Collect issues from June Six test usage, fix top 5–10 |
| #35 | Production Deploy | 3h | Vercel prod domain, Neon prod branch, smoke tests, go-live |

---

## Milestones

| Milestone | After Chunk | Description |
|-----------|-------------|-------------|
| Scaffold complete | #1 | Project structure ready for development |
| DB ready | #3 | Schema migrated, connection verified |
| Auth working | #9 | Owner can sign in with Google |
| Booking flow demo | #19 | Full end-to-end guest booking with OTP |
| Owner dashboard demo | #27 | Full admin functionality |
| June Six go-live | #35 | j6.locando.net in production |

---

## Agent Orchestration

- **Chunks #1–#15:** Claude Desktop Code only
- **Chunk #16+:** Claude Code (orchestrator) + Antigravity (UI, i18n, E2E) + Codex Desktop (security, cross-validation)
