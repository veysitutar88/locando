# Locando

Multi-tenant SaaS for restaurant table reservations — a free alternative to Quandoo, Zenchef, and TheFork.

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Neon Postgres + Drizzle ORM
- **Auth:** Passport.js + Google OAuth + JWT
- **Email:** Resend
- **Deploy:** Vercel

## Quick start

```bash
git clone <repo>
cd locando
cp .env.example .env.local   # fill in your credentials
npm install
npm run dev                   # → http://localhost:3000
```

## Database setup

1. Create a project at [console.neon.tech](https://console.neon.tech)
   (region: AWS eu-central-1, Postgres 17)
2. Copy the **pooled** connection string into `.env.local`:
   ```
   DATABASE_URL=postgresql://...neon.tech/...?sslmode=require
   ```
3. Generate and apply the schema:
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```
4. Inspect the database with Drizzle Studio:
   ```bash
   npx drizzle-kit studio
   ```

`drizzle.config.ts` loads `.env.local` via `dotenv`. **Never** run `drizzle-kit push` — migrations are the only schema-change path. See [docs/DB_SCHEMA.md](docs/DB_SCHEMA.md) for table definitions and [docs/DECISIONS.md](docs/DECISIONS.md) for the migration policy (ADR #16).

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — multi-tenant model, module isolation, tech decisions
- [DB Schema](docs/DB_SCHEMA.md) — table definitions and relationships
- [Decisions](docs/DECISIONS.md) — ADR log (10 entries)
- [Roadmap](docs/ROADMAP.md) — 35 chunks across 6 phases

## Project context

See [BOOTSTRAP.md](BOOTSTRAP.md) for complete project context, working agreements, and phase breakdown.
