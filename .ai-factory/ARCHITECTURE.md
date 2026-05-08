# Architecture: Locando

## Pattern

**Multi-tenant SaaS with Next.js App Router, subdomain-based tenant resolution, and module isolation.**

## Folder Structure

```
src/
├── app/
│   ├── (public)/           # /book, /banquet — public guest-facing pages
│   ├── (admin)/            # /admin/* — owner and waiter dashboards
│   ├── api/
│   │   └── v1/             # Webhook-compatible REST endpoints
│   └── layout.tsx
├── modules/
│   ├── reservations/       # Booking flow: date → time → OTP → confirm
│   │   ├── components/     # ReservationForm, OTPInput, ConfirmationCard...
│   │   ├── services/       # reservationService.ts (business logic)
│   │   └── lib/            # Pure utilities: availability, slot calc
│   └── banquets/           # Banquet inquiry form
│       ├── components/
│       ├── services/
│       └── lib/
└── shared/
    ├── auth/               # Passport.js setup, JWT helpers (Chunk #9)
    ├── ui/                 # Button, Input, Modal, Toast, StatusBadge
    ├── layout/             # Header, Footer, nav wrappers
    └── db/                 # Drizzle client, schema (Chunk #3)
```

## Dependency Rules

```
app/* → modules/* → shared/*      ← allowed
modules/A → modules/B             ← FORBIDDEN
shared/* → modules/*              ← FORBIDDEN
```

Enforce with ESLint import plugin (Chunk #4 or later).

## Tenant Isolation

```
Request hits Next.js middleware
  → extract subdomain (e.g. "j6" from "j6.locando.net")
  → resolve tenant_id from database (or cache)
  → attach to request context / headers
  → every repository function receives tenant_id as argument
  → every DB query includes WHERE tenant_id = ?
```

No raw SQL without `tenant_id` filter is valid. This is enforced by code review and later by ESLint rule.

## Server vs Client Components

- **Default:** Server Component
- **Use `"use client"` only when:** event handlers, browser APIs, `useState`, `useEffect`, form submission
- **Pattern:** Page = Server Component → passes data to Client leaf components

## Form Pattern

```typescript
// Server Action (app/actions/)
async function createReservation(formData: FormData) {
  "use server";
  const data = reservationSchema.parse(Object.fromEntries(formData));
  // ...
}

// Client Component (modules/reservations/components/)
"use client";
const { register, handleSubmit } = useForm({ resolver: zodResolver(reservationSchema) });
```

## Database Access Pattern

```typescript
// src/shared/db/client.ts — single Drizzle instance
export const db = drizzle(neon(process.env.DATABASE_URL!));

// Repositories — always receive tenantId
export async function getReservations(tenantId: string, date: Date) {
  return db.select().from(reservations)
    .where(and(eq(reservations.tenantId, tenantId), eq(reservations.date, date)));
}
```

## Key Conventions

| Convention | Rule |
|-----------|------|
| Exports | Named only. No default exports for components. |
| Barrel files | FORBIDDEN. No `index.ts` re-exports. |
| File names | kebab-case |
| Component names | PascalCase |
| Function/var names | camelCase |
| DB columns | snake_case |
| Env vars | SCREAMING_SNAKE_CASE |
