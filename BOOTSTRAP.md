# Locando — Project Bootstrap

> This file contains everything you need to know about this project before
> doing any work. Read it fully before responding. Confirm you've read it
> when done. Do NOT start any work until explicitly told.

---

## 1. Who I am (the user)

- **Name:** Igor
- **Location:** Berlin, Germany
- **Languages:** Russian (primary), German, English. I use voice input often,
  so my Russian may have transcription artifacts — interpret intent, not literal words.
- **Stack expertise:** Full-stack web, AI agents, desktop apps. Experienced developer.
- **Hardware:** Mac + Windows (RTX 4060) + Microsoft Surface as local server.
- **Subscriptions:** Claude Max ×5, ChatGPT Plus, multiple Gmail accounts (for Antigravity).
- **Current focus when not coding:** Running June Six Bistro Bar
  (j6restaurant.de) in Berlin-Charlottenburg. 80-seat banquet venue
  pivoting to modernized Eastern European cuisine.

## 2. What we're building — Locando

**One-line description:** A multi-tenant SaaS for restaurant table reservations,
designed as a free/cheaper alternative to Quandoo/Zenchef/OpenTable/TheFork.

**Working name:** Locando (Italian gerund of "locare" — booking/letting in action).
Not yet purchased as domain. Will buy `locando.net` (€10.61/yr) when MVP is ready.
Backup: locando.de or locando.eu.

### MVP Feature Scope (locked)

**For guests (public widget on restaurant website):**
- Pick date and time
- Pick number of guests
- Enter name + email + phone
- Receive 6-digit OTP via email
- Confirm booking by entering code
- Cancel via emailed link

**For restaurant owner (admin dashboard):**
- List of bookings by day (today/tomorrow/week views)
- Status state machine: pending → confirmed → seated → no-show / cancelled
- Manually add/edit/delete bookings (for phone calls)
- CRUD for tables (number, capacity, zone)
- CRUD for opening hours

**For waiters (tablet-friendly view):**
- Today's bookings sorted by time
- One-tap: "arrived" → seated, "didn't show" → no-show

**Banquet inquiry form (separate from regular bookings):**
- Public form: date, guest count, phone, comment
- No availability check, no booking — just emails Igor
- Igor calls back to discuss individually (banquets are bespoke)

### What we're explicitly NOT building in MVP

- Floor plan with drag-and-drop (just a list of tables with capacity)
- Reserve with Google
- SMS notifications (email only initially)
- Waitlist
- Reviews/feedback
- Marketing email campaigns
- Native iOS/Android apps (PWA only)
- Stripe deposits (deferred to v2)

### Why multi-tenant from day 1

Igor wants the option to sell Locando as SaaS later. Adding multi-tenancy
to a single-tenant app later is painful. June Six is just the first tenant.

## 3. Tech stack — LOCKED, do not deviate

- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Neon Postgres (serverless)
- **ORM:** Drizzle ORM (NOT Prisma, NOT Supabase client)
- **Auth:** Passport.js + Google OAuth + JWT
  (NOT Supabase Auth — chosen for compatibility with Chef's Mind OS)
- **Validation:** Zod
- **Forms:** react-hook-form + @hookform/resolvers
- **Email:** Resend (3000/month free tier)
- **Deploy:** Vercel
- **Domain (later):** locando.net
- **i18n:** next-intl, languages DE/EN at minimum, RU optional
- **Icons:** lucide-react
- **State:** plain useState + Server Actions where appropriate

### Future-compatibility note

This project is designed to eventually merge into **Chef's Mind OS** —
Igor's larger agentic restaurant management platform that uses
TypeScript + Express + Next.js + Postgres + Drizzle + LangGraph.
Same stack on purpose.

### Related project: Chef's Eye

Igor has a separate app Chef's Eye (Vite + Upstash Redis + Gemini API)
for processing **banquet orders** (NOT bookings). Two different things,
two different storage backends, no direct integration in MVP. Later we may
add a "Chef's Daily Overview" view that reads from BOTH systems —
but that's post-MVP.

## 4. Architecture decisions

### Multi-tenant model

```sql
restaurants (id, name, slug, owner_email, ...)
tables (id, tenant_id, number, capacity, zone, ...)
reservations (id, tenant_id, table_id, guest_name, guest_email, ...)
staff_users (id, tenant_id, role, ...)
otp_codes (id, reservation_id, code, expires_at, ...)
```

**Every query MUST filter by tenant_id.** Multi-tenant middleware
should enforce this automatically — no manual `WHERE tenant_id = ?` in app code.

### Subdomain routing

- `j6.locando.net` → June Six (Igor's restaurant)
- `{slug}.locando.net` → other tenants
- `app.locando.net` → admin dashboard
- `locando.net` → marketing site (later)

### Module isolation

```
src/
├── modules/
│   ├── reservations/    # main module
│   │   ├── components/
│   │   ├── services/
│   │   └── lib/
│   └── banquets/        # banquet inquiry form
├── shared/
│   ├── auth/
│   ├── ui/              # Button, Input, Modal, Toast, StatusBadge
│   ├── layout/
│   └── db/              # Drizzle client, schema
└── app/
    ├── (public)/        # /book, /banquet
    └── (admin)/         # /admin/*
```

`modules/*` MUST NOT import from each other directly. They share via `shared/`.

### Webhook system from day 1

For future integration with Chef's Eye / Chef's Mind OS / Zapier:
- `POST /api/v1/reservations` — external systems can create
- `GET /api/v1/reservations?date=...` — external can read
- Outgoing webhooks: `reservation.confirmed`, `reservation.cancelled`, `reservation.no_show`
- Each restaurant gets API key + webhook URL config

### June Six specifics (the first tenant)

- **Address:** Knesebeckstraße 80, Berlin-Charlottenburg
- **Hours:** Tuesday–Sunday, 15:00–23:00 (Monday closed)
- **Booking step:** 30 minutes
- **Default booking duration:** 1.5 hours
- **Last booking slot:** ~21:30
- **Tables:** placeholder list to start (Igor will provide real list later):
  - 4× 2-seater
  - 5× 4-seater
  - 2× 6-seater
  - 1× 8-seater (large)

## 5. Working agreements

### How we work together

- **Chunked work:** Each task is a "chunk" of 1-2 hours of focused work.
  Each has explicit `do`, `do_not`, and `done_criteria` sections.
- **Stop after each chunk.** Don't auto-continue to next chunk.
  Wait for user review and approval.
- **No invented features.** If the chunk says implement X, implement only X.
  Don't add "while I'm at it..." features.
- **No silent rewrites.** Don't refactor existing code unless explicitly asked.
- **No dependency creep.** Don't add packages not listed in the chunk spec.
- **Question over assumption.** When ambiguous, ask. Don't guess.

### Communication style with Igor

- Igor speaks Russian primarily but understands English perfectly.
  **Reply in Russian** unless he switches to English.
- Be direct. Skip filler ("Great question!", "Of course!").
- If something will fail or is risky, say so before doing it.
- When you complete a chunk, output a brief summary and stop.
  Don't start the next chunk on your own.

### Quality bar — Opus 4.7 specific

You are Opus 4.7. You interpret instructions literally — that's good.
But when this BOOTSTRAP.md is unclear, **prefer asking** over guessing.
Igor noticed previous Claude Code sessions "drifted" by 5-10 iterations.
We mitigate by:
- Small chunks (max 2h each)
- Explicit `do_not` lists
- Stop-and-review between chunks
- If you're on iteration 3+ of the same problem, **STOP** and ask for guidance.
  Do not silently keep trying.

## 6. The other AI agents in our orchestra (later)

We will use these other tools for parallel work, starting from Chunk #16+:

- **Antigravity (Gemini 3.1 Pro):** parallel UI components, i18n, email templates,
  E2E browser tests via browser subagent, large-context audits.
  No MCP — code-only work.
- **Codex Desktop:** security audits via Codex Security, plan mode,
  cross-validation of complex logic.

For Chunks #1–#15, only YOU (Claude Code in Claude Desktop) work on the project.
Foundation must be set by one consistent voice.

## 7. Development phases (35 chunks total, ~80-90 hours)

### Phase 1 — Foundation (Chunks 1–8, ~19h)
Project setup, schema, multi-tenant middleware, base UI shared components.

### Phase 2 — Auth & Onboarding (Chunks 9–13, ~25h)
Passport.js, OAuth, role system, restaurant onboarding wizard, subdomain routing.

### Phase 3 — Public Booking Widget (Chunks 14–21, ~30h)
The /book public flow: date → time → guests → table allocation → OTP → confirm.

### Phase 4 — Owner Dashboard (Chunks 22–27, ~16h)
Reservations list, detail view, manual booking, table CRUD, hours CRUD.

### Phase 5 — Waiter View + Banquet Form (Chunks 28–30, ~7h)

### Phase 6 — Polish (Chunks 31–35, ~19h)
Webhooks, i18n, email templates, bug fixes, production deploy.

## 8. What to do RIGHT NOW

1. Read this file fully (you're doing that now).
2. Read CLAUDE.md if it exists in the repo root (it doesn't yet — will be
   created in Chunk #1).
3. Output a confirmation message:
   - "Прочитал BOOTSTRAP.md. Я понял проект Locando: [одно предложение]."
   - "Готов к Chunk #1."
4. **STOP. Do not start Chunk #1 until Igor explicitly says to start.**