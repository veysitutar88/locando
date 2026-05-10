---
name: locando-operational-workflow
description: Operational workflow guard for Locando — environment preflight, DB migration safety, git/merge rules, chunk sizing, stop conditions, verification requirements, authority order, and anti-scope-expansion. Invoke before every Locando chunk, merge gate, DB migration, or branch operation.
type: project
---

# locando-operational-workflow

**Activate before:** every Locando chunk, merge gate, DB migration, branch operation, or any task that could touch DB / main / production state. This skill prevents repeated operational mistakes — wrong environment, DB migration in sandbox, direct push to main, oversized chunks, unclear merge/apply status, silent workflow improvisation.

## 1. Environment preflight first

Before any meaningful action, report:

- `pwd`
- current branch (`git branch --show-current`)
- `git status`
- `git log --oneline -3`
- environment: **local Windows** or **cloud / sandbox**
- whether `.env.local` exists
- whether `DATABASE_URL` is needed for the task
- whether the task requires a DB action
- task classification: **code-only / DB / docs-only / merge-gate**

**Never assume the environment.** Always verify with read-only commands first.

## 2. DB rules

- Do **not** run `npx drizzle-kit migrate` in cloud / sandbox.
- Do **not** run DB diagnostics in cloud / sandbox if `.env.local` is missing.
- It IS allowed to **generate** migration files in a feature branch via `npx drizzle-kit generate` (works without a DB connection).
- Apply migrations **only** in a verified local / Neon environment.
- If DB apply cannot be verified from current environment, mark status as:
  > **"migration generated, DB apply pending local/Neon verification"**
- **Never** run `drizzle-kit push` as a fallback or otherwise.
- **Never** print `DATABASE_URL`, signing secrets, JWT secrets, or any other env-var values.
- If a step requires DB credentials and the sandbox does not have them, STOP and report.

## 3. Git / merge rules

- `main` is **PR-only by default**. Do not push directly to `main` unless Igor explicitly approves direct push for that specific operation.
- Feature branches **may** be pushed (`git push -u origin <feature-branch>`).
- Merge to `main` through the **PR path** (`mcp__github__create_pull_request` + `mcp__github__merge_pull_request`) unless explicitly told otherwise.
- If `git push` returns **HTTP 403** (or any auth/permission error), STOP immediately and report exact error. Do not retry blindly.
- Do **not** `git push --force` or `--force-with-lease`.
- Do **not** modify credentials, remote URLs, or `git config`.
- Do **not** change GitHub branch protection.
- Do **not** invent a PR / MCP workaround without Igor's approval, even if it "would work".

## 4. Chunk sizing rules

For **medium / high-risk infrastructure** work, prefer splitting along these natural seams:

1. Schema + migration
2. Repository + service layer
3. Docs + tests + merge gate

Do **not** create a single oversized chunk that mixes DB, service, UI, auth, docs, and deployment unless Igor explicitly approved a combined scope. If a spec arrives oversized, flag it before starting.

## 5. Stop conditions

STOP and report — do NOT improvise — if any of the following is true:

- Environment does not match task requirements (e.g. local task in cloud, or vice versa)
- `.env.local` is required but missing
- Branch is unexpectedly dirty
- Migration status is unclear (applied? generated? rolled back?)
- Direct push to `main` is blocked (HTTP 403 or similar)
- Repo state conflicts with the chunk spec
- Lint / test / build checks fail
- Authority sources conflict (see §7)

**After STOP, do not improvise fixes.** Surface the situation to Igor and wait.

## 6. Verification requirements

Every serious task must end with a structured report containing:

- Files changed (created / modified / deleted)
- Commands run (with exit status if non-zero)
- `npm run lint` / `npm test` / `npm run build` results, when applicable
- DB apply status (one of: not applicable / pending local apply / applied locally verified / applied prod verified)
- Migration status (one of: no migration / generated / generated + applied)
- Branch + commit hash(es)
- Pushed / not pushed
- Remaining risk
- Confidence 1–5
- Explicit "**Stop**" and what is awaited next

## 7. Authority order

When sources of truth disagree, use this order (top wins):

1. Current repo state on `main`
2. Accepted ADRs / docs (`docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/DB_SCHEMA.md`, `docs/ROADMAP.md`)
3. Igor-approved active task (current chat instructions)
4. GPT correction block, if provided
5. Current chunk spec
6. Older chat context

**If sources conflict, STOP and report** — do not pick silently.

## 8. No silent scope expansion

- Do **not** start the next chunk automatically. Wait for Igor's explicit go.
- Do **not** refactor unrelated code while "in the area".
- Do **not** update `docs/ROADMAP.md` or `docs/DECISIONS.md` unless the active chunk explicitly requires it.
- Do **not** add packages unless the chunk spec lists them.
- Do **not** modify `src/proxy.ts`, `src/shared/db/schema.ts`, `src/shared/auth/`, or UI files outside the active scope.
- Do **not** introduce AI-assistant-specific schemas, routes, or imports. External consumers (Chef's Mind OS, ChatMinds, personal AI assistants, Zapier/Make) consume Locando through documented webhook / API boundaries only; they are not coupled into the codebase.

## Activation checklist

Before answering a Locando task, run through this list silently and surface any "no" or "unclear" as a STOP:

- [ ] Environment identified and matches task requirements?
- [ ] `.env.local` requirement matches sandbox capability?
- [ ] DB action (if any) is allowed in this environment?
- [ ] Spec does not conflict with repo state / ADRs / ROADMAP?
- [ ] Push target is allowed (feature branch vs. direct `main`)?
- [ ] Chunk scope is reasonable (not mixing DB + service + UI + auth)?
- [ ] Authority order is unambiguous?

If any check fails — STOP and report. Do not improvise.
