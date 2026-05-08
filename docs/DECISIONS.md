# Architecture Decision Records — Locando

> ADR log. Decisions are recorded chronologically. Format: Problem → Options → Decision → Consequences.

---

## ADR #1 — Multi-tenant from day 1

**Date:** 2026-05-08
**Status:** Accepted

**Problem:** June Six Bistro Bar needs a booking system now. Should we build single-tenant first and add multi-tenancy later, or design for multiple tenants from the start?

**Options:**
1. Single-tenant first, refactor later
2. Multi-tenant from day 1

**Decision:** Multi-tenant from day 1.

**Reasoning:** Adding multi-tenancy to an existing single-tenant codebase is one of the most disruptive refactors possible — it touches every database query, every access control check, and every data model. Doing it right from the start costs roughly 10% more upfront and saves an estimated 40% of total effort if the SaaS pivot happens. June Six is just the first tenant; the product will eventually be offered to other restaurants.

**Consequences:**
- Every table carries `tenant_id`
- Middleware must resolve tenant on every request
- Slightly more complex local development (subdomain simulation)
- Accepted overhead for single-tenant operation: every query carries
  tenant_id filter, middleware resolves tenant on every request, slightly
  more complex local dev. This overhead is the price for keeping the SaaS
  pivot path open without a future rewrite.

---

## ADR #2 — Neon Postgres over Supabase Postgres

**Date:** 2026-05-08
**Status:** Accepted

**Problem:** We need a managed Postgres database. Supabase and Neon both offer hosted Postgres. Which fits our stack better?

**Options:**
1. Supabase Postgres (with Supabase ecosystem)
2. Neon Postgres (serverless, standalone)
3. PlanetScale (MySQL — rejected immediately, wrong dialect)

**Decision:** Neon Postgres.

**Reasoning:** Supabase Postgres is excellent but comes with Supabase's authentication, realtime, and storage ecosystem — all of which create lock-in. Since we're NOT using Supabase Auth (see ADR #4), using Supabase only for the database feels wasteful and creates an inconsistency between what we use and what we pay for. Neon provides serverless Postgres with a generous free tier and an official Next.js integration.

Portability remains high if we avoid Neon-specific features (e.g., Neon's branching, serverless-specific connection patterns beyond the standard driver, `@neondatabase/serverless` edge optimizations that don't have direct equivalents elsewhere). For standard Postgres usage — vanilla SQL, standard pooling, no branching workflows — switching to another managed Postgres (RDS, Supabase Postgres, self-hosted) is a connection-string-and-driver change. We will flag any decision that introduces Neon-specific lock-in.

**Consequences:**
- Clean vendor boundary: Neon for data, Vercel for hosting, Resend for email
- No Supabase client library in the project (reduces confusion)
- Neon's serverless driver (`@neondatabase/serverless`) works in Edge runtimes

---

## ADR #3 — Drizzle ORM over Prisma

**Date:** 2026-05-08
**Status:** Accepted

**Problem:** We need a TypeScript ORM or query builder for Postgres. Prisma and Drizzle are the two leading options.

**Options:**
1. Prisma — the industry-standard TypeScript ORM
2. Drizzle ORM — newer, SQL-first, lightweight
3. Kysely — query builder only, no schema management

**Decision:** Drizzle ORM.

**Reasoning:** Prisma requires a separate schema language (`.prisma`) and generates a fat client (~15MB+). It abstracts SQL in ways that make complex queries hard to reason about. Drizzle uses TypeScript as the schema language, generates queries that are readable and predictable, and has a runtime footprint of ~7.4kb. Most importantly, Chef's Mind OS already uses Drizzle — using the same ORM ensures that when Locando merges into Chef's Mind OS, the database layer requires no changes.

**Consequences:**
- Schema defined in TypeScript → full type safety, no code generation step at build time
- SQL-like query syntax → easy to reason about performance
- `drizzle-kit` for migrations — standard workflow
- Slightly steeper learning curve than Prisma for developers new to SQL

---

## ADR #4 — Passport.js + Google OAuth over Supabase Auth and Auth.js

**Date:** 2026-05-08
**Status:** Accepted

**Problem:** We need authentication for restaurant owners and staff. Multiple options exist, ranging from fully managed to self-implemented.

**Options:**
1. Supabase Auth — fully managed, built-in with Supabase
2. Auth.js v5 (NextAuth) — popular Next.js auth library
3. Passport.js + Google OAuth + JWT — classic, configurable

**Decision:** Passport.js + Google OAuth + JWT.

**Reasoning:** This decision is driven primarily by Chef's Mind OS compatibility. Chef's Mind OS uses Passport.js + Google OAuth + JWT. Using the same auth layer means the auth code can be shared or merged without a rewrite. Auth.js v5 was seriously considered — it has excellent Next.js App Router support and would be the best standalone choice — but was rejected for stack consistency reasons. Supabase Auth was rejected because we're not using Supabase (see ADR #2), and mixing Supabase Auth with Neon Postgres creates unnecessary complexity. **Note: Passport.js is not the "best" standalone choice — Auth.js v5 would be — but consistency with Chef's Mind OS is the deciding factor.**

**Consequences:**
- Auth implemented in Chunk #9 — not a simple plug-in
- JWT tokens in httpOnly cookies — good security default
- Google OAuth only in MVP — email/password flow not planned

---

## ADR #5 — OTP via email over SMS and magic links

**Date:** 2026-05-08
**Status:** Accepted

**Problem:** Guests need to verify their booking. How do we confirm their identity?

**Options:**
1. OTP via email
2. OTP via SMS (e.g., Twilio)
3. Magic link via email
4. No verification — trust the email address

**Decision:** 6-digit OTP via email.

**Reasoning:** SMS (Twilio) costs ~$0.0075 per message and requires phone verification setup; for a free product this is a non-trivial cost. Magic links require the guest to open their email client, click a link, and get redirected — on mobile this often breaks if the browser session doesn't match. A 6-digit OTP is a familiar UX pattern (used by every bank and most SaaS apps), works entirely within the booking page, and requires only a free Resend account. No verification at all would allow spam bookings.

**Consequences:**
- Resend free tier: 3,000 emails/month — sufficient for MVP at June Six (max ~200 bookings/month expected)
- OTP expires in 15 minutes — short window reduces abuse
- Guest must have access to their email at the time of booking (acceptable UX requirement)

---

## ADR #6 — Subdomain routing over path-based tenant routing

**Date:** 2026-05-08
**Status:** Accepted

**Problem:** Multi-tenant routing can be path-based (`/restaurant/j6/book`) or subdomain-based (`j6.locando.net/book`). Which is better for a restaurant SaaS?

**Options:**
1. Path-based: `locando.net/restaurant/j6/book`
2. Subdomain-based: `j6.locando.net/book`

**Decision:** Subdomain-based routing.

**Reasoning:** Subdomains are the standard for B2B SaaS (Shopify, Notion, Linear all use subdomains). They allow each tenant to have a "clean" URL that can be bookmarked and shared without the platform slug in the path. Subdomain routing makes future custom domain support cleaner and more natural. A tenant can point `book.j6restaurant.de` via CNAME directly to their subdomain, and the platform sees the same Host-based tenant resolution flow. With path-based routing, custom domains are technically possible but require URL rewriting at the edge to map `/` to `/restaurant/j6/`, adding complexity. The tradeoff is more complex local development (requires hosts file or middleware config), but this is a one-time setup cost.

**Consequences:**
- Next.js middleware reads `Host` header to resolve tenant on every request
- Local development: use `localhost:3000` with a dev tenant config or use `j6.localhost:3000` via hosts file
- Custom domains possible in post-MVP: tenant sets CNAME, Vercel handles SSL

---

## ADR #7 — Webhook system from day 1

**Date:** 2026-05-08
**Status:** Accepted

**Problem:** Locando will eventually need to integrate with Chef's Eye (banquet orders), Chef's Mind OS (the AI management platform), and possibly Zapier/Make. Should we build webhooks now or add them later?

**Options:**
1. Add webhooks when integration is needed (post-MVP)
2. Build the webhook infrastructure in Phase 1 (Chunk #6)

**Decision:** Webhook system from day 1 (Phase 1, Chunk #6).

**Reasoning:** Adding webhooks to an existing system is straightforward if the events are emitted from a central point. If we add business logic first and webhooks later, we risk missing events or having to audit all state transitions retrospectively. The webhook infrastructure (event emitter, delivery table, retry logic) is a small upfront cost (~4-6 hours) with large future payoff. Chef's Eye integration is already planned for post-MVP, making this a known future requirement.

**Consequences:**
- Each reservation state change emits an event (`reservation.confirmed`, etc.)
- Each tenant can configure a webhook URL and API key in their settings
- Webhook delivery is async (queue-based or background job — design TBD in Chunk #6)

---

## ADR #8 — Module isolation rule

**Date:** 2026-05-08
**Status:** Accepted

**Problem:** How should we organize code across the `reservations` and `banquets` domains? Should they be allowed to import from each other?

**Options:**
1. Feature folders — flat structure, cross-imports allowed
2. Module isolation — explicit boundaries, cross-imports forbidden

**Decision:** Module isolation: `modules/A` cannot import from `modules/B`.

**Reasoning:** In every project that starts with "just a couple of features," cross-module imports accumulate silently. By the time it's a problem, untangling them is a major refactor. Explicit isolation from day 1 forces the right behavior: shared utilities go into `shared/`, not into another module. The `reservations` module will grow significantly (date picker, OTP flow, admin list, status management) — keeping it cleanly separated from `banquets` (which is intentionally simpler) prevents bleed.

**Consequences:**
- `modules/reservations` cannot import from `modules/banquets` and vice versa
- Shared types, DB access, and UI primitives live in `shared/`
- Slight overhead when genuinely shared logic must be extracted to `shared/`
- ESLint import plugin can enforce this automatically (future)

---

## ADR #9 — Multi-agent orchestration approach

**Date:** 2026-05-08
**Status:** Accepted

**Problem:** The project spans ~35 chunks (~80-90 hours). How do we orchestrate AI-assisted development?

**Options:**
1. Single AI agent (Claude Code) for all chunks
2. Multi-agent from day 1 (Claude + Antigravity + Codex)
3. Single agent for foundation, multi-agent from Chunk #16+

**Decision:** Claude Desktop Code as primary for Chunks #1–#15; add Antigravity (Gemini 3.1 Pro) and Codex Desktop from Chunk #16+.

**Reasoning:** The foundation (Chunks #1–#15) must be architecturally consistent. Having multiple agents write overlapping foundation code risks contradictory patterns. Once the foundation is solid, parallelism is safe: Antigravity handles UI components, i18n, and E2E tests (large-context work); Codex Desktop handles security audits and cross-validation of complex logic. From Chunk #16, Claude Code orchestrates the other agents.

**Consequences:**
- Chunks #1–#15: only Claude Code writes code
- Chunk #16+: Antigravity and Codex Desktop participate in parallel
- Orchestration patterns documented in each chunk spec from Chunk #16

---

## ADR #10 — Website integration via hosted page and iframe, not per-tenant widget

**Date:** 2026-05-08
**Status:** Accepted

**Problem:** How does a restaurant's existing website integrate the Locando booking flow? Options range from a redirected hosted page to a custom widget embedded per tenant.

**Options:**
1. Hosted page: guest redirected to `{slug}.locando.net/book`
2. Iframe embed: `<iframe src="...">` on restaurant's own site
3. Full JS widget: `<script>` tag with shadow DOM, booking UI injected inline
4. Each tenant gets a custom-branded widget builder

**Decision:** Hosted page (primary, MVP) + iframe embed (secondary, MVP basic). JS widget is post-MVP. No per-tenant widget builder.

Custom domains (e.g., `book.j6restaurant.de` pointing directly to Locando) are explicitly post-MVP. The subdomain routing chosen in ADR #6 keeps this path open for future implementation without architectural changes.

**Reasoning:** The hosted page requires zero technical work on the restaurant's side — just add a link. It's the fastest path to a working integration and keeps Locando's UI under our control for consistency. Iframe embed satisfies restaurants that want the booking form to appear "on their website" without a redirect. A JS widget adds significant complexity (CSS isolation, shadow DOM, message passing) with limited incremental value in MVP. A per-tenant widget builder is out of scope entirely.

**Consequences:**
- June Six: `j6restaurant.de` has a "Reservierung" button → `https://j6.locando.net/book`
- MVP supports `{slug}.locando.net` subdomains only. Custom domain support deferred to post-MVP; subdomain architecture (ADR #6) keeps this addition straightforward when prioritized.
- iframe embed requires proper CSP headers (`frame-ancestors`)
- JS widget deferred to post-MVP Phase 6 or beyond

---

## ADR #11 — Drizzle-orm skill: security scan transparency

**Date:** 2026-05-08 (Chunk #1.5 cleanup); resolved 2026-05-08 (Chunk #2)
**Status:** Resolved (automated scan CLEAN)

**Problem:** The `aif` workflow mandates a Python-based automated security scan of every external skill installed from skills.sh. We installed `mindrally/skills@drizzle-orm` but the local Python interpreter is unavailable in Git Bash on this Windows machine (only the Microsoft Store alias is registered). The automated scan could not be executed.

**Options:**
1. Block the skill until Python is installed
2. Skip the skill entirely (use manually-written guidelines instead)
3. Install with manual review only, document the gap, accept residual risk

**Decision:** Install with manual review only, document the gap, accept residual risk.

**Reasoning and accepted risk profile:**
- **Automated Python-based scan:** NOT RUN (Python unavailable in Git Bash on Windows during Chunk #1)
- **Manual Level 2 semantic review:** CLEAN — read the entire SKILL.md; only contains technical Drizzle ORM examples (schema definitions, queries, migrations). No instructions that change agent behavior, access secrets, or perform unrelated actions.
- **Source vetting:** mindrally/skills (447 installs on skills.sh)
- **Third-party scoring:** Socket 0 alerts, Snyk Low Risk (reported by skills.sh CLI at install time)
- **Skill nature:** read-only documentation — the file is a Markdown SKILL.md with no executable code, no scripts, no hooks
- **Residual risk:** Low

**Resolution (Chunk #2, 2026-05-08):**
- Python 3.10.11 located at `C:\Users\rixdo\AppData\Local\Programs\Python\Python310\` (system install, not Microsoft Store stub)
- Scan script located at `C:\Projects\.claude\skills\aif-skill-generator\scripts\security-scan.py`
- Executed: `python <script> C:\Users\rixdo\.claude\skills\drizzle-orm`
- Result: **CLEAN** — 0 critical, 0 warnings, 1 file scanned, exit code 0
- Manual Level 2 conclusion confirmed by automated scan. Verification debt closed.

**Consequences:**
- The Drizzle ORM skill is active and used by the agent
- This ADR documents the security gap explicitly so the next session can verify
- Future external skill installs follow the same protocol: prefer automated scan, but accept manual Level 2 with explicit ADR if blocked

---

## ADR #12 — Postgres MCP intentionally deferred to Chunk #2

**Date:** 2026-05-08 (Chunk #1.5 cleanup)
**Status:** Accepted

**Problem:** The `aif` workflow recommends adding the `postgres` MCP server to `.mcp.json` for projects that use Postgres. However, the `postgres` MCP requires a `DATABASE_URL` environment variable, and Locando does not yet have a Neon project (creation is the first task of Chunk #2).

**Options:**
1. Add postgres MCP to `.mcp.json` with placeholder `DATABASE_URL` (broken until Neon exists)
2. Skip postgres MCP silently (next agent has no signal it's planned)
3. Defer with explicit configuration and ADR

**Decision:** Defer with explicit configuration. Created `.mcp.json.todo` containing the planned postgres MCP block. `.mcp.json` itself contains only working entries (filesystem, playwright).

**Reasoning:** Adding a broken MCP entry would cause connection errors on every session start. Silent omission would lose information. A sidecar `.mcp.json.todo` file makes the deferral explicit, gives Chunk #2 a copy-paste-ready block to merge, and keeps the active `.mcp.json` clean.

**Consequences:**
- `.mcp.json.todo` is committed alongside `.mcp.json`
- Chunk #2 first task: create Neon project → set `DATABASE_URL` → merge `.mcp.json.todo` content into `.mcp.json` → delete `.mcp.json.todo`

---

## ADR #13 — Node.js version: 22 LTS

**Date:** 2026-05-08 (Chunk #1.5 cleanup)
**Status:** Accepted

**Problem:** The local development machine had Node 24.13.0 installed system-wide. Vercel's default Node version and the broader ecosystem default to Node 22 LTS. We need a single source of truth for the Node version.

**Options:**
1. Pin to Node 24 (latest, but EOL faster, fewer hosting platforms support it)
2. Pin to Node 20 LTS (older, approaching EOL in 2026)
3. Pin to Node 22 LTS (Vercel default, current LTS, broad support)

**Decision:** Node 22 LTS.

**Reasoning:** Node 24 entered LTS in late 2025 and Vercel's default runtime is now 24.x. Both Node 22 and Node 24 are valid LTS choices for this project. We pin to Node 22 LTS as a conservative choice: Node 22 has been LTS longer, has wider deployment maturity across hosting platforms, and is sufficient for our needs (Next.js 16, Drizzle, Resend, Passport — all supported). Migration to Node 24 is a low-risk future change if needed; revisit when Node 22 approaches its 2027 EOL.

**Consequences:**
- `.nvmrc` contains `22`
- Local development verified on Node v22.22.2 via `fnm`
- Vercel deploys will use Node 22 (matches `.nvmrc`)
- Igor's machine: `fnm` installed via winget; system Node v24 still present but `fnm` switches to v22 in this project directory

---

## ADR #14 — Turbopack root override in next.config.ts

**Date:** 2026-05-08 (Chunk #1.5 cleanup)
**Status:** Accepted

**Problem:** During the first `npm run build`, Turbopack failed with: "We detected multiple lockfiles and selected the directory of `C:\Projects\package-lock.json` as the root directory." This caused module resolution to look for packages in `C:\Projects\` instead of `C:\Projects\locando\`, breaking the build.

**Options:**
1. Delete `C:\Projects\package-lock.json` (unknown what it belongs to — risky)
2. Add `turbopack.root` to `next.config.ts` to explicitly pin the workspace root
3. Move the project to a directory where no parent contains a lockfile

**Decision:** Add `turbopack.root: path.resolve(__dirname)` to `next.config.ts`.

**Reasoning:** Option 1 is destructive and may break unrelated work in the parent directory. Option 3 (moving the project) is invasive. The `turbopack.root` override is exactly the documented mechanism for resolving this ambiguity. It's a one-time, low-risk config addition that makes the build deterministic.

**Consequences:**
- `next.config.ts` contains `turbopack.root` — DO NOT REMOVE this setting
- Future agents must understand this is a Windows-specific environment fix, not a project preference
- Documented in `.claude/CLAUDE.md` as a "do not modify" rule

---

## ADR #15 — Git repository initialized despite --no-git flag

**Date:** 2026-05-08 (Chunk #1.5 cleanup)
**Status:** Documented

**Problem:** `npx create-next-app@latest . --no-git ...` was expected to skip git initialization. However, create-next-app v16.2.6 created a `.git/` directory anyway and reported "Initialized a git repository." This is the observed behavior of create-next-app v16.2.6 in this environment; whether intentional or a regression has not been verified upstream.

**Options:**
1. Delete `.git/` and stay un-versioned until ready
2. Keep the auto-initialized `.git/` and just avoid commits
3. File a bug report with the create-next-app team (out of scope here)

**Decision:** Keep the auto-initialized `.git/`. No commits have been made yet. First commit will happen at the end of Chunk #2 after the database schema is locked.

**Reasoning:** The `.git/` directory is benign as long as no commits are made. Deleting it and re-initializing later wastes effort. The chunk specs were "no commit" not "no .git" — keeping the empty repo aligns with the spirit of the rule.

**Consequences:**
- `.git/` exists but has no commits
- Chunk #2 closes with the first commit (after Neon setup, schema, drizzle.config.ts)
- An issue report to vercel/next.js can be filed post-MVP if the behavior persists in newer versions

---

## ADR #16 — `updated_at` strategy: repository-layer helper

**Date:** 2026-05-08 (Chunk #2)
**Status:** Accepted

**Problem:** Every table (except `otp_codes`) has an `updated_at timestamptz` column with `defaultNow()`. Postgres applies the default on INSERT but does **not** auto-update it on UPDATE. We need a strategy to keep `updated_at` accurate without forgetting it on every callsite.

**Options considered:**
1. Postgres trigger (per-table function + trigger that sets `updated_at = now()` on UPDATE)
2. Repository-layer helper that includes `updated_at: new Date()` in every UPDATE
3. ORM-level callback (Drizzle middleware / hooks)

**Decision:** Repository-layer helper (option 2).

**Reasoning:**
- Triggers make the database "magical" — debugging unexpected `updated_at` values requires knowing about hidden triggers, which is exactly the kind of friction the agent and human reviewers should avoid.
- A repository helper is **explicit, visible in code review**, and works the same regardless of DB backend (still works if we ever migrate from Neon to RDS or self-hosted Postgres).
- ORM-level callbacks couple us to Drizzle's hook implementation, which has historically been unstable across versions.

**Implementation (Chunk #4):** Introduce a `withTimestamps()` helper in `src/shared/db/`. All repository UPDATE functions either use the helper or explicitly set `updatedAt: new Date()` in the `set()` clause.

**Consequences:**
- Every update path must use the helper or set `updatedAt` explicitly. Code review enforces this.
- Direct SQL updates outside the repository layer leave `updated_at` stale — this is acceptable because direct SQL is a deliberate escape hatch (e.g., one-off migrations, ops fixes), not a normal app flow.
- If we add a sixth table that needs `updated_at`, we add the column once and the repository pattern handles it — no DB migration for triggers.
