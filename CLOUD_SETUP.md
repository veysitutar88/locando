# Cloud Workflow Setup

## GitHub

- **Repository:** https://github.com/veysitutar88/locando
- **Visibility:** **Private** (contains business context, June Six specifics, future tenant data)
- **Default branch:** `main` (renamed from `master` per GitHub convention)

## Branch policy (MVP)

- `main` is the working branch
- No branch protection yet (single-developer, MVP velocity priority)
- First PR-based workflow expected in Chunk #16+ when multi-agent orchestration begins (see ADR #9)
- Force-push to `main` is implicitly allowed but should be avoided once Vercel is connected — preview deploys would be invalidated

## Claude Code on Web / Mobile

- Connect GitHub at [app.claude.com](https://app.claude.com) → Settings → GitHub
- Grant access to the `locando` repository (private repos require explicit grant)
- Sessions on Web/Mobile work against the **latest pushed commit on `main`**
- Local Claude Code sessions (Windows desktop) remain the source of truth — push frequently to keep cloud agents in sync
- If a local session has unpushed commits, cloud sessions will not see them

## Vercel deploy (post-MVP, Chunk #35)

- Connect repo to Vercel via GitHub integration
- `DATABASE_URL` lives in **Vercel Project → Settings → Environment Variables**, NOT in git
- Neon offers an official Vercel integration that auto-injects `DATABASE_URL` per environment (Preview / Production), and can also create a separate Neon branch per Vercel preview deploy
- `.env.local` is gitignored — it is a **local-development-only** file. Each environment provides its own:
  - **Local:** `.env.local` (manually created from `.env.example` + Neon connection string from console.neon.tech)
  - **Vercel Preview:** env vars from Vercel UI / Neon integration
  - **Vercel Production:** env vars from Vercel UI / Neon integration
  - **Claude Web/Mobile:** env vars provided through Claude's project settings (when running cloud agents that need DB access)

## Reminder: secrets hygiene

- Real `DATABASE_URL` lives **only** in `.env.local` (gitignored) and Vercel/Claude env settings
- `.env.example` ships placeholder values, not real credentials
- `.mcp.json` uses `${DATABASE_URL}` placeholders — never hardcoded values
- See ADR #12 in [docs/DECISIONS.md](docs/DECISIONS.md) for the postgres MCP placeholder strategy and the runtime resolution status (currently re-deferred per Chunk #2.5 verification)

## Environment recreation checklist

When setting up a new local clone or a new cloud environment:

1. Clone the repo
2. Run `npm install`
3. Copy `.env.example` to `.env.local`
4. Fill in `DATABASE_URL` from Neon dashboard ([console.neon.tech](https://console.neon.tech) → project → Connection string)
5. Fill in `JWT_SECRET` (`openssl rand -base64 32`)
6. Other vars (Google OAuth, Resend) — fill when reaching the corresponding chunk
7. Verify with `npm run build` and `npm run lint`
