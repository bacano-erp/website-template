#!/usr/bin/env node
/**
 * Sets a new site up as a store or as an informational site.
 *
 * The template ships the whole store — cart, checkout, payment return, order
 * tracking — because most sites built on Bacano sell. A site that does not sell
 * must not carry it: dead routes, a cart button that leads nowhere, and code
 * nobody maintains. This removes all of it in one step, leaving the base:
 * preview, content locator, construction gate, catalogue pages, SEO.
 *
 *   pnpm setup:site --tipo=tienda   # keeps everything
 *   pnpm setup:site --tipo=sitio    # removes the store
 *   pnpm setup:site --tipo=sitio --dry-run
 *
 * Without --tipo it asks, when there is a terminal to ask in. An agent runs it
 * without one: then it stops and says to ask the person, because which kind
 * of site this is is their decision, not a default to guess.
 *
 * Buyer accounts are not asked here. They are switched on per website in
 * Bacano, at any time, without touching this repository.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";

/** Files and folders that exist only for the store. */
export const STORE_PATHS = [
  "src/features/commerce",
  "src/features/legal",
  "src/components/form",
  "src/components/AddToCart.tsx",
  "src/app/carrito",
  "src/app/checkout",
  "src/app/pago",
  "src/app/pedido",
  "src/app/commerce.css",
  "public/images/payment-methods",
  "docs/comercio.md",
  "tests/e2e/commerce.spec.ts",
  "tests/e2e/payment-adverse.spec.ts",
  "tests/unit/checkout-contact-validation.spec.ts",
  "tests/unit/delivery-estimate.spec.ts",
  "tests/unit/payment-policy.spec.ts",
  "tests/unit/payment-presentation.spec.ts",
  "tests/unit/payment-response.spec.ts",
  "tests/unit/purchasable-quantity.spec.ts",
  "tests/unit/serialized-task-queue.spec.ts",
];

/** Shared files with store-only blocks between `<commerce>` markers. */
export const MARKED_FILES = [
  "src/app/providers.tsx",
  "src/app/globals.css",
  "src/components/layout/SiteShell.tsx",
  "src/views/ProductView.tsx",
  "tests/e2e/static-storefront.spec.ts",
  "scripts/test-static.mjs",
  "docs/README.md",
];

/** Dependencies only the store uses. */
export const STORE_DEPENDENCIES = ["zod", "react-phone-number-input"];

// A marker is a whole line holding only the tag, in its file's comment syntax:
// a `//` comment, a JSX `{/* … */}` comment, a CSS comment, or an HTML comment
// in Markdown. Prose that merely mentions the tag is not a marker.
const marker = (tag) =>
  new RegExp(
    `^\\s*(?:\\/\\/\\s*${tag}|\\{\\/\\*\\s*${tag}\\s*\\*\\/\\}|\\/\\*\\s*${tag}\\s*\\*\\/|<!--\\s*${tag}\\s*-->)\\s*$`,
  );
const START = marker("<commerce>");
const END = marker("<\\/commerce>");

/**
 * The text with every marked block removed, marker lines included.
 *
 * Throws on an unbalanced marker rather than guessing where a block ends: a
 * half-removed provider tree is worse than a script that refuses.
 */
export function stripStoreBlocks(text, file = "text") {
  const kept = [];
  let open = 0;
  let openedAt = 0;

  text.split("\n").forEach((line, index) => {
    if (START.test(line)) {
      if (open) throw new Error(`${file}:${index + 1}: nested <commerce>`);
      open = 1;
      openedAt = index + 1;
      return;
    }
    if (END.test(line)) {
      if (!open)
        throw new Error(`${file}:${index + 1}: </commerce> without <commerce>`);
      open = 0;
      return;
    }
    if (!open) kept.push(line);
  });

  if (open) throw new Error(`${file}:${openedAt}: <commerce> is never closed`);
  return kept.join("\n");
}

async function askKind() {
  if (!process.stdin.isTTY) {
    console.error(
      "Falta --tipo. ¿Este sitio es una tienda (vende con carrito y checkout) o un sitio informativo?\n" +
        "Pregúntaselo a la persona y vuelve a correr:\n" +
        "  pnpm setup:site --tipo=tienda\n" +
        "  pnpm setup:site --tipo=sitio",
    );
    process.exit(2);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (
    await rl.question(
      "¿Este sitio es una tienda (vende con carrito y checkout) o un sitio informativo? [tienda/sitio] ",
    )
  )
    .trim()
    .toLowerCase();
  rl.close();
  return answer;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const kind =
    args.find((arg) => arg.startsWith("--tipo="))?.split("=")[1] ??
    (await askKind());

  if (kind === "tienda") {
    console.log(
      "Tienda: se conserva todo. Cuentas de comprador se activan en Bacano.",
    );
    return;
  }
  if (kind !== "sitio") {
    console.error(
      `Tipo desconocido: "${kind}". Usa --tipo=tienda o --tipo=sitio.`,
    );
    process.exit(2);
  }

  const edits = MARKED_FILES.map((file) => {
    const path = resolve(file);
    const before = readFileSync(path, "utf8");
    return { file, path, before, after: stripStoreBlocks(before, file) };
  });

  const removed = STORE_PATHS.filter((path) => existsSync(resolve(path)));

  if (dryRun) {
    console.log("Se borrarían:");
    for (const path of removed) console.log(`  ${path}`);
    console.log("Se limpiarían:");
    for (const { file, before, after } of edits) {
      if (after !== before) console.log(`  ${file}`);
    }
    console.log(
      `Dependencias que se quitarían: ${STORE_DEPENDENCIES.join(", ")}`,
    );
    return;
  }

  for (const { path, after } of edits) writeFileSync(path, after);
  for (const path of removed)
    rmSync(resolve(path), { recursive: true, force: true });

  execFileSync("pnpm", ["remove", ...STORE_DEPENDENCIES], { stdio: "inherit" });
  execFileSync("pnpm", ["exec", "biome", "check", "--write", "."], {
    stdio: "inherit",
  });

  console.log(
    "\nSitio informativo listo: se quitaron carrito, checkout, pago y pedido.\n" +
      "Revisa que todo compile con `pnpm verify:all` y haz commit del resultado.",
  );
}

// Imported by its tests, run as a script otherwise.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
