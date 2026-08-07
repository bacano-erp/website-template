# AGENTS.md

Instructions for AI coding agents working in this repository. Humans: the
[README](./README.md) is the friendlier version of the same material.

This is a **customer storefront** built on the Bacano ERP through
[`@bacano/sdk`](https://www.npmjs.com/package/@bacano/sdk). It is a Next.js
**static export** served from S3 behind CloudFront. There is no server at
runtime.

Most of what follows is about that last sentence. The constraints here are not
style preferences — they are the difference between a store that sells and a
store that quietly does not.

---

## The one thing to understand first

| | Baked into HTML at build | Fetched live in the browser |
| --- | --- | --- |
| Catalogue, product copy, images, categories | ✅ | |
| **Display prices** | ✅ | |
| **Stock availability** | | ✅ |
| **Cart** | | ✅ |
| **Final price at checkout** | | ✅ (validated by the ERP) |

**The rule:** if being a few hours stale would cost money or mislead a shopper,
fetch it in the browser. Otherwise bake it.

A display price may lag until the next publish — that is intentional and safe,
because the ERP re-validates the real price at checkout. Stock may **never** lag:
selling something that is out of stock is a real-world failure, not a UI bug.

---

## Hard rules

Breaking any of these produces a **green build and a broken store**. That is why
they are listed rather than left to judgement.

### 1. Never remove `output: 'export'` from `next.config.ts`

The whole deployment depends on it. Without it, `next build` emits a server, the
deploy uploads nothing usable, and the site 404s while the pipeline reports
success.

This means the following are **unavailable** — if a task seems to need one, the
task needs redesigning, not the config:

- API routes / route handlers (`app/**/route.ts`)
- Server Actions
- `middleware.ts`
- ISR, `revalidate`, `dynamic = 'force-dynamic'`
- `next/image` optimization (`images.unoptimized` is required)

Server Components here run **at build time only**. Anything needing per-shopper
or real-time data must be a client component.

### 2. Never bake stock, cart, or checkout state into HTML

Use the SDK's client hooks (`useAvailability`, `useCart`) inside
`"use client"` components. Do not move these to build time to "reduce requests".

### 3. Never query the Bacano GraphQL API directly

Everything goes through `@bacano/sdk`. Direct queries break on every schema
change and bypass the permission model. If the SDK appears to be missing
something, **stop and tell the user to ask Bacano to add it** — do not work
around it.

### 4. No secrets in this repository

Everything here ships to the browser. Only `NEXT_PUBLIC_*` values exist. A Clerk
*publishable* key is fine; a Clerk **secret** key never belongs here. If a task
seems to require a secret key, that task cannot be done in this repo.

### 5. Do not edit `.github/workflows/deploy.yml`

It is managed by Bacano and its configuration is injected as repository
variables. Changing it will break publishing. `ci.yml` is likewise standard.

### 6. Dynamic routes need `generateStaticParams`

A static export cannot render a path that was not enumerated at build time. See
`src/app/producto/[slug]/page.tsx`.

### 7. Keep `trailingSlash: true`

S3 serves `/about/index.html` for `/about/` but 404s for `/about`. Turning this
off produces links that work in `next dev` and 404 in production — the worst
possible failure mode.

---

## How to work here

```bash
pnpm install
cp .env.example .env.local     # placeholders only; ask the user for real values
pnpm dev
```

**Before claiming any change is done:**

```bash
pnpm verify      # typecheck + biome + eslint — exactly what CI runs
```

To check a change the way production will serve it — which catches
trailing-slash and static-export mistakes that `pnpm dev` hides:

```bash
pnpm build && pnpm start
```

`pnpm build` needs a reachable Bacano API and a valid website slug. If it fails
on missing catalogue data, that is configuration, not code — surface it rather
than stubbing the data out.

Formatting is Biome (`pnpm check:fix`). ESLint covers Next.js-specific rules
Biome cannot express. Both run in CI; do not disable rules to make them pass.

---

## Data access patterns

Build time (catalogue content, crawlable):

```tsx
import { getBuildClient } from "@/lib/bacano";

export default async function Page() {
  const client = await getBuildClient();
  const products = await client.catalog.getProducts({ limit: 20 });
  return <>{/* ... */}</>;
}
```

Client side (stock, cart, anything per-shopper):

```tsx
"use client";
import { useCart, useProducts } from "@bacano/sdk/react";
```

Building many static routes? Use `client.catalog.getStaticCatalogSnapshot()`
once and index the result. Do **not** call `getProductBySlug()` per route in the
same build — that is one network round trip per product.

---

## Styling

The template ships deliberately **unstyled and neutral**. When applying a
customer's visual identity, get the store working first, then style. Do not
introduce a component library or CSS framework beyond what is already here
without asking — it is a long-lived decision for someone else's codebase.

---

## Stop and ask the user when

- A task appears to require SSR, an API route, or a server secret
- The SDK seems to be missing a capability you need
- A change would touch `deploy.yml`, `next.config.ts` invariants, or add a
  runtime dependency on anything other than the Bacano API and Clerk
- Catalogue data is missing and the fix would be to hardcode or mock products

Inventing a workaround for any of these is worse than stopping. They all
indicate a mismatch between the task and the architecture, and the human needs
to know that.
