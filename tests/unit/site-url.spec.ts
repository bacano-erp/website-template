import { expect, test } from "@playwright/test";
import { browserSiteUrl, requireSiteUrl } from "@/lib/site-url";

/**
 * The address the store claims to live at.
 *
 * Before this existed, a build with no `NEXT_PUBLIC_SITE_URL` succeeded and
 * published canonical tags, a sitemap and a payment return URL all pointing at
 * `localhost` — silently, and with a green pipeline.
 */

const withEnv = (
  value: string | undefined,
  nodeEnv: string,
  body: () => void,
) => {
  const previousUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const previousEnv = process.env.NODE_ENV;

  if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = value;
  // NODE_ENV is readonly in the types, not at runtime.
  (process.env as Record<string, string>).NODE_ENV = nodeEnv;

  try {
    body();
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previousUrl;
    (process.env as Record<string, string>).NODE_ENV = previousEnv ?? "test";
  }
};

test("a production build refuses to guess the address", () => {
  withEnv(undefined, "production", () => {
    expect(() => requireSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL is not set/);
  });
});

test("an empty variable counts as missing", () => {
  // An unset GitHub Actions variable arrives as an empty string, which `??`
  // would pass straight through.
  withEnv("", "production", () => {
    expect(() => requireSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL is not set/);
  });
});

test("development still has a usable default", () => {
  withEnv(undefined, "development", () => {
    expect(requireSiteUrl()).toBe("http://localhost:3000");
  });
});

test("a trailing slash never doubles up in a built URL", () => {
  withEnv("https://tienda.example.com/", "production", () => {
    expect(requireSiteUrl()).toBe("https://tienda.example.com");
  });
});

test("the browser prefers the configured address", () => {
  withEnv("https://tienda.example.com", "production", () => {
    expect(browserSiteUrl()).toBe("https://tienda.example.com");
  });
});

test("without one, the browser falls back to where it is served from", () => {
  // Right by construction, and it keeps a store usable on a preview host or on
  // a domain attached after the last build.
  const globals = globalThis as { window?: { location: { origin: string } } };
  globals.window = { location: { origin: "https://served-from.example.com" } };

  try {
    withEnv(undefined, "production", () => {
      expect(browserSiteUrl()).toBe("https://served-from.example.com");
    });
  } finally {
    globals.window = undefined;
  }
});
