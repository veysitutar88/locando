<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — Locando Project Map

> Project map for AI agents. Keep this file up-to-date as the project evolves.

## Project Overview

Locando is a multi-tenant SaaS for restaurant table reservations — a booking engine (not a restaurant website) designed as a free alternative to Quandoo/TheFork. The first tenant is June Six Bistro Bar in Berlin.

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript strict
- **Styling:** Tailwind CSS 4
- **Database:** Neon Postgres (serverless)
- **ORM:** Drizzle ORM
- **Auth:** Passport.js + Google OAuth + JWT (Chunk #9)
- **Validation:** Zod + react-hook-form
- **Email:** Resend (Chunk #19)
- **Deploy:** Vercel

## Project Structure

```
locando/
├── src/
│   ├── app/
│   │   ├── (public)/       # Guest-facing pages: /book, /banquet
│   │   ├── (admin)/        # Owner/waiter dashboard: /admin/*
│   │   └── api/v1/         # Webhook REST endpoints (Chunk #6)
│   ├── modules/
│   │   ├── reservations/   # Booking flow (date → OTP → confirm)
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── lib/
│   │   └── banquets/       # Banquet inquiry form
│   │       ├── components/
│   │       ├── services/
│   │       └── lib/
│   └── shared/
│       ├── auth/           # Passport.js, JWT helpers
│       ├── ui/             # Button, Input, Modal, Toast, StatusBadge
│       ├── layout/         # Header, Footer, nav wrappers
│       └── db/             # Drizzle client + schema
├── docs/
│   ├── ARCHITECTURE.md     # Multi-tenant model, module isolation, decisions
│   ├── DB_SCHEMA.md        # Table definitions (docs, not code)
│   ├── DECISIONS.md        # ADR log (10 entries)
│   └── ROADMAP.md          # 35 chunks across 6 phases
├── .ai-factory/
│   ├── DESCRIPTION.md      # Project specification
│   └── ARCHITECTURE.md     # Architecture patterns
├── .claude/
│   ├── CLAUDE.md           # Claude Code instructions + skill mapping
│   └── skills/
│       └── locando-domain/ # Custom domain skill: reservations, OTP, tenant
├── .mcp.json               # MCP servers: filesystem, playwright
│                           # NOTE: postgres MCP — activate in Chunk #2
├── BOOTSTRAP.md            # Full project context for new sessions
├── .env.example            # Required environment variables
└── package.json
```

## Key Entry Points

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout |
| `src/app/page.tsx` | Landing page (default Next.js) |
| `src/shared/db/` | Database client and schema (Chunk #3) |
| `BOOTSTRAP.md` | Read first in any new session |
| `.claude/CLAUDE.md` | Skill invocation rules and code conventions |

## Documentation

| Document | Path | Description |
|----------|------|-------------|
| Bootstrap | BOOTSTRAP.md | Complete project context, working agreements |
| Architecture | docs/ARCHITECTURE.md | Multi-tenant model, module isolation |
| DB Schema | docs/DB_SCHEMA.md | Table definitions and relationships |
| Decisions | docs/DECISIONS.md | ADR log (10 entries) |
| Roadmap | docs/ROADMAP.md | 35-chunk delivery plan |

## AI Context Files

| File | Purpose |
|------|---------|
| AGENTS.md | This file — project structure map |
| .ai-factory/DESCRIPTION.md | Project specification and tech stack |
| .ai-factory/ARCHITECTURE.md | Architecture patterns and folder conventions |
| .claude/CLAUDE.md | Claude Code instructions and skill mapping |
| BOOTSTRAP.md | Full context: user, stack, agreements, phases |

## Critical Rules for AI Agents

1. **ALWAYS read BOOTSTRAP.md first** in a new session
2. **ALWAYS invoke the relevant skill** before starting work (see `.claude/CLAUDE.md`)
3. **Never query the DB without tenant_id** — application-level tenant isolation is mandatory
4. **Never import across modules** — `modules/A` cannot import from `modules/B`
5. **Stop after each chunk** — do not auto-continue to the next chunk
