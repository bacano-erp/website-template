# `src/views/`

The pages' markup, separated from where their data comes from.

A route under `src/app/` fetches from the build snapshot
(`lib/static-catalog.ts`) and renders one of these. That is the only thing a
route does now.

The separation exists so the same markup can be rendered from a **live** read
instead of the build snapshot, which is what authenticated preview needs: the
storefront is a static export, so a price or product changed in Bacano does not
appear until the site is published again. Preview renders these same views
against a live catalogue read, so the change is visible immediately.

Two rules keep that honest:

- **A view takes data and returns markup. No fetching, and nothing from
  `next/navigation`.** `notFound()` in particular is a routing concern and stays
  in the route — preview renders client-side and has no route to fail.
- **Any rule that decides *what* is shown lives in `view-models.ts`, not in the
  view or the route.** `homeFeatured` is the example: "the home page shows eight
  products" has to be one fact, or preview and the built page disagree about it
  and nobody notices, because both look plausible.
