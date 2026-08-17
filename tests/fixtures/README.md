# Fixtures

Recorded gateway responses. The test suite builds the storefront against these,
which is what makes it fast, credential-free and reproducible.

- `api.json` — a store with one product
- `api-empty.json` — a store with none, which is every store on its first day

## Two rules, both learned the hard way

**Recorded, never handwritten.** A mock invented from the type definitions
drifts from the gateway in ways nobody notices, and the suite then passes
against a contract that does not exist.

**Sanitised before committing.** This repository is public. Identifiers, store
names, domains, prices and timestamps come out; the *shape* stays exactly as the
gateway sends it. Sanitising is where fidelity gets lost by accident — the first
version of `api.json` flattened a rich-text document and dropped its `attrs`, so
every test exercised a structure production never emits.

## Checking they are still accurate

Nothing in CI can detect drift, because CI has no store to ask. So do it
occasionally, against a real one:

```bash
BACANO_API_URL=… BACANO_WEBSITE_SLUG=… pnpm check:fixtures
```

It builds the storefront through a recording proxy, then compares **shapes** —
keys and types, recursively — rather than values, which change constantly and
prove nothing. It reports and never rewrites: a fixture is updated deliberately,
by someone who reads the diff and strips the identifiers again.

A field the gateway has and the fixture lacks means the tests cover less than
the build does. A field the fixture has and the gateway lacks means a build
reading it would break.
