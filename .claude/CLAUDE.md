# Locando — Project Context

## Stack (LOCKED)

- Next.js 16 (App Router) + TypeScript strict
- Tailwind CSS 4
- Drizzle ORM + Neon Postgres
- Passport.js + Google OAuth + JWT (NOT Supabase Auth)
- Zod + react-hook-form
- Resend для email
- Vercel deploy
- lucide-react icons

## Architecture rules

- Multi-tenant from day 1 — every DB query MUST filter by tenant_id
- Tenant isolation: **APPLICATION-LEVEL** via middleware + repository functions.
  PostgreSQL RLS is NOT used in v1 — reserved for future hardening if needed.
- Modules isolated — `modules/*` MUST NOT import from each other; share via `shared/`
- Subdomain routing: `{slug}.locando.net` per tenant, `app.locando.net` for admin
- Webhook-first API design (для будущей интеграции с Chef's Mind OS)
- Locando is a **booking engine**, NOT a restaurant website
  Integration: hosted page (`{slug}.locando.net/book`) or iframe embed
- **DO NOT modify `next.config.ts` `turbopack.root`** — it fixes a Windows-specific
  workspace root detection issue (parent dir has stray `package-lock.json`).
  See ADR #14 in `docs/DECISIONS.md`.

## Skills to invoke

| Когда | Какой скилл |
|---|---|
| Любая работа с UI компонентами | `frontend-design` |
| Database schema, queries, миграции | `drizzle-orm` |
| Routing, Server Actions, layouts, App Router | `nextjs-development` |
| Domain logic про reservations / tables / booking / OTP | `locando-domain` (custom) |
| Создание новых скиллов проекта | `aif-skill-generator` |
| Новые фичи, настройка проекта | `aif` |

**ВСЕГДА** invokай релевантный скилл перед началом работы по теме.
Если не уверен какой — спроси Игоря.

> **Note on `drizzle-orm` skill:** installed from `mindrally/skills`. Manual Level 2
> semantic review CLEAN; automated Python-based scan was NOT run (Python unavailable
> in Git Bash on Windows during Chunk #1). TODO: re-run automated scan in Chunk #2.
> See ADR #11 in `docs/DECISIONS.md`.

## Packages NOT installed in Chunk #1

Auth и email пакеты — часть locked стека, но устанавливаются в поздних чанках:

- `passport`, `passport-google-oauth20` → Chunk #9
- `jose` (JWT) → Chunk #9
- `resend` → Chunk #19

Database config:
- `drizzle.config.ts` → Chunk #2 (после настройки Neon)
- `src/shared/db/schema.ts` → Chunk #3

**НЕ устанавливай их ad-hoc.** Жди соответствующего чанка.

MCP config:
- `postgres` MCP → активировать в Chunk #2, после Neon setup
  Добавить в `.mcp.json`: `@modelcontextprotocol/server-postgres` с `DATABASE_URL`

## Code conventions

- TypeScript strict mode (see tsconfig.json)
- Server Components by default; `"use client"` только когда нужно (события, хуки, браузер API)
- Forms: react-hook-form + Zod валидация через `zodResolver`
- Database: Drizzle через `shared/db/` — НИКОГДА напрямую из компонентов
- Naming: PascalCase компоненты, camelCase функции, kebab-case файлы
- **Named exports для компонентов** (никаких `default export`)
- **Никаких barrel files** (никаких `index.ts` re-exports)

## Git push policy

GitHub is the active mobile synchronization channel for Locando.
Igor works across desktop and mobile, so push is part of the working flow.

Distinction:
- `git commit` = local project checkpoint
- `git push` = sync checkpoint to GitHub for mobile review / cross-device continuity
- `git push` is NOT a production deploy, NOT a release, NOT approval to continue automatically

Push allowed when ALL true:
1. Working tree contains only intended files
2. No secrets in staged/tracked files (verify `.env.local` absent)
3. build/lint/test pass if relevant to the chunk
4. Commit message describes the chunk accurately

After push:
- Show `git log --oneline -3`
- Show `git status` (must be clean)
- Stop and wait for Igor's review

Do NOT push when:
- `.env.local` or real secrets are staged/tracked
- build/lint/test failed and chunk requires them
- Commit contains unreviewed unrelated changes
- Igor explicitly said "commit only" or "do not push"

## Do-not rules

- DO NOT использовать Supabase Auth
- DO NOT использовать Prisma
- DO NOT смешивать модули (modules/A → modules/B)
- DO NOT добавлять пакеты без явного approval в chunk spec
- DO NOT auto-continue к следующему чанку — STOP и жди review
- DO NOT делать запросы к БД без фильтра по tenant_id
- DO NOT писать `default export` для компонентов
- DO NOT создавать barrel files (index.ts re-exports)

## Communication

- Отвечай по-русски (Игорь пишет на русском)
- Be direct, skip filler ("Конечно!", "Отличный вопрос!")
- Если что-то упадёт или есть риск — скажи ПЕРЕД тем как делать
- Stop после каждого chunk, не начинай следующий
- На итерации 3+ одной проблемы — STOP, спроси совета у Игоря
