# Bacano Website Template

Starting point for a customer storefront built on the [Bacano ERP](https://api.bacanoerp.com) via [`@bacano/sdk`](https://www.npmjs.com/package/@bacano/sdk).

Next.js (static export) → S3 → CloudFront. No server, no cold starts, no runtime to patch.

This template is deliberately **unstyled and neutral**. Get the store working first, then apply the customer's visual identity — that order is much faster than fighting someone else's design.

---

## What is static vs live

This is the most important thing to understand before changing anything.

| | Where it comes from | When it updates |
| --- | --- | --- |
| Catalogue, product copy, images, categories | **Built into the HTML** at build time | On **Publish** |
| **Display prices** | **Built into the HTML** at build time | On **Publish** |
| **Stock availability** | Fetched **live in the browser** | Every page view |
| **Cart** | Fetched **live in the browser** | Every page view |
| **Final price at checkout** | Validated **live against the ERP** | At checkout |

Why the split: pages must be crawlable and instant, so catalogue content is baked in. But selling something that is out of stock — or charging a price that changed last week — is not acceptable, so stock and the authoritative price are always read live.

**The rule:** if being a few hours stale would cost money or mislead a shopper, fetch it in the browser. Otherwise bake it.

A display price can lag until the next Publish. That is intentional and safe, because the ERP re-validates the real price at checkout.

---

## Local development

```bash
pnpm install
cp .env.example .env.local   # then fill in the real values
pnpm dev
```

The site needs a website record in Bacano — a slug, a branch/chain, active products with public prices. Without a valid `NEXT_PUBLIC_BACANO_WEBSITE_SLUG` the build fails loudly rather than publishing an empty store.

```bash
pnpm build       # static export → out/
pnpm start       # serve out/ locally, exactly as CloudFront will
```

### Code quality

Two tools, deliberately — they do different jobs and neither replaces the other.

| | |
| --- | --- |
| **Biome** | Formatting, import ordering, Tailwind class sorting, general lint |
| **ESLint** | Next.js-specific rules (`next/core-web-vitals`) that Biome cannot express |

```bash
pnpm verify        # typecheck + biome + eslint — what CI runs
pnpm check:fix     # auto-fix formatting, imports and class order
pnpm typecheck
```

`.github/workflows/ci.yml` runs `verify` on every PR, so a change cannot reach the deploy pipeline without passing.

---

## Deployment

Handled by `.github/workflows/deploy.yml`; you should not need to touch it.

- **Code change** → push to `main`
- **Content change** → Bacano dispatches `bacano-publish` when someone hits **Publish** in the platform

Both run the same pipeline: build → sync to S3 → invalidate CloudFront.

**There are no AWS credentials in this repository.** The workflow assumes a per-site IAM role via GitHub OIDC, scoped to this site's bucket and distribution only. Every value it needs is injected as a repository *variable* by Bacano at provisioning time:

`BACANO_API_URL` · `BACANO_WEBSITE_SLUG` · `SITE_URL` · `SITE_NAME` · `CLERK_PUBLISHABLE_KEY` · `AWS_DEPLOY_ROLE_ARN` · `AWS_REGION` · `AWS_S3_BUCKET` · `AWS_CLOUDFRONT_DISTRIBUTION_ID`

---

## Structure

```
src/
├── app/
│   ├── layout.tsx              Shell, nav, metadata
│   ├── providers.tsx           Clerk + BacanoProvider  ("use client")
│   ├── page.tsx                Home — build time
│   ├── catalogo/page.tsx       Catalogue — build time
│   ├── producto/[slug]/        Product detail — build time + generateStaticParams
│   ├── carrito/page.tsx        Cart — fully client-side
│   ├── checkout/page.tsx       Checkout scaffold — finish this per store
│   ├── pago/respuesta/         Payment return — reconciles and waits for payment
│   └── pedido/page.tsx         Order detail for guests, by token
├── components/
│   ├── ProductCard.tsx         Static
│   ├── AddToCart.tsx           Live island: stock + cart
│   ├── LivePrice.tsx           Live island: price + discount
│   ├── PaymentReturn.tsx       Gateway return handling
│   └── OrderDetail.tsx         Public order lookup
├── config/bacano-lists.ts      Which category/attribute lists this store builds from
└── lib/
    ├── bacano.ts               Build-time client, browser client, price formatting
    ├── static-catalog.ts       Whole catalogue in one read, shared across the build
    └── order-return.ts         Return URL, gateway params, order storage
```

**Before the first build**, set the two list keys in `config/bacano-lists.ts` to the
ones this website uses in the ERP (Sitios web → Listas de categorías / de atributos).
They decide which categories and filters the site is generated with.

Server Components here run **at build time only** — there is no server at runtime. Anything needing live data must be a client component.

---

## Adding a page

Static (catalogue content, crawlable):

```tsx
import { getBuildClient } from "@/lib/bacano";

export default async function Page() {
  const client = await getBuildClient();
  const products = await client.catalog.getProducts({ limit: 20 });
  return <>{/* ... */}</>;
}
```

Live (stock, cart, anything per-shopper):

```tsx
"use client";
import { useProducts, useCart } from "@bacano/sdk/react";
```

Dynamic routes need `generateStaticParams` — static export cannot render a path that was not enumerated at build time. See `producto/[slug]/page.tsx`.

---

## House rules

These exist because breaking them is expensive later.

- **Never query GraphQL directly.** Everything goes through `@bacano/sdk`. If the SDK is missing something, ask Bacano to add it rather than reaching around it — direct queries break on every schema change and bypass the permission model.
- **Never bake stock into the HTML.** See the table above.
- **No secrets in this repo.** Everything here ships to the browser. Clerk's *publishable* key is fine; a secret key never is. Read [`AUTHENTICATION.md`](https://www.npmjs.com/package/@bacano/sdk) in the SDK before touching auth.
- **Keep `output: 'export'`.** The deploy pipeline expects `out/`; switching to SSR silently breaks it.
- **Use the Bacano CDN for product images.** Static export has no image optimizer, so `next/image` cannot resize on demand.
- **Keep the slug single-label** (no dots). It becomes `<slug>.sites.bacanoerp.com`, covered by a wildcard certificate that only spans one level.

---

## Updating the SDK

```bash
pnpm add @bacano/sdk@latest
```

The SDK follows semver: a major bump means breaking changes — read the release notes. Generated sites do not receive template updates automatically; that is a deliberate trade-off for per-customer independence.
