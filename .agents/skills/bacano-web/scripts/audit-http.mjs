#!/usr/bin/env node

const args = process.argv.slice(2);
const baseArg = args[0];

if (!baseArg || baseArg === "--help") {
  console.log(
    "Usage: node audit-http.mjs <origin-or-url> [--sitemap <url>] [--preview <path-or-url>] [--max <n>] [--delay <ms>]",
  );
  process.exit(baseArg ? 0 : 1);
}

function option(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const startUrl = new URL(baseArg);
const maxRoutes = Math.max(1, Number(option("--max", "500")) || 500);
const delayMs = Math.max(0, Number(option("--delay", "250")) || 0);
const explicitSitemap = option("--sitemap", null);
const explicitPreview = option("--preview", null);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchResult(url) {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "bacano-web-readiness/1" },
    });
    return {
      requestedUrl: url,
      finalUrl: response.url,
      status: response.status,
      durationMs: Date.now() - startedAt,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text(),
    };
  } catch (error) {
    return {
      requestedUrl: url,
      finalUrl: null,
      status: null,
      durationMs: Date.now() - startedAt,
      headers: {},
      body: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) =>
    match[1].replaceAll("&amp;", "&"),
  );
}

function pageUrls(html, base) {
  const urls = [];
  for (const match of html.matchAll(
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi,
  )) {
    try {
      const url = new URL(match[1], base);
      url.hash = "";
      if (url.origin === startUrl.origin) urls.push(url.href);
    } catch {
      // Ignore malformed or unsupported links.
    }
  }
  return urls;
}

function sameOrigin(url) {
  try {
    return new URL(url).origin === startUrl.origin;
  } catch {
    return false;
  }
}

function comparableRoute(url) {
  const parsed = new URL(url, startUrl);
  const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  return `${parsed.origin}${pathname}`;
}

function tagAttribute(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function findMeta(html, key, value) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const normalized = value.toLowerCase();
  for (const tag of tags) {
    if (tagAttribute(tag, key)?.toLowerCase() === normalized) {
      return tagAttribute(tag, "content");
    }
  }
  return null;
}

function findLink(html, rel) {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  const normalized = rel.toLowerCase();
  for (const tag of tags) {
    const rels = tagAttribute(tag, "rel")?.toLowerCase().split(/\s+/) ?? [];
    if (rels.includes(normalized)) return tagAttribute(tag, "href");
  }
  return null;
}

function stripMarkup(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function auditHtml(html) {
  const title =
    html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
  const visibleText = stripMarkup(html);
  const placeholders = [
    ...new Set(
      visibleText.match(
        /\[[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ0-9 ._/-]{2,}\]|\b(?:TODO|FIXME|LOREM IPSUM)\b/gi,
      ) ?? [],
    ),
  ].slice(0, 20);

  return {
    title,
    description: findMeta(html, "name", "description"),
    canonical: findLink(html, "canonical"),
    robots: findMeta(html, "name", "robots"),
    openGraphTitle: findMeta(html, "property", "og:title"),
    openGraphImage: findMeta(html, "property", "og:image"),
    twitterCard: findMeta(html, "name", "twitter:card"),
    h1Count: (html.match(/<h1\b/gi) ?? []).length,
    jsonLdCount: (
      html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>/gi) ??
      []
    ).length,
    visibleTextLength: visibleText.length,
    placeholders,
  };
}

const home = await fetchResult(startUrl.href);
const sitemapCandidates = explicitSitemap
  ? [new URL(explicitSitemap, startUrl).href]
  : [new URL("/sitemap.xml", startUrl).href];

const routes = new Set([startUrl.href]);
const sitemapPageUrls = new Set();
const sitemapReports = [];

for (const url of pageUrls(home.body, startUrl)) {
  if (routes.size < maxRoutes) routes.add(url);
}

const visitedSitemaps = new Set();
while (sitemapCandidates.length > 0) {
  const candidate = sitemapCandidates.shift();
  if (!candidate || visitedSitemaps.has(candidate)) continue;
  visitedSitemaps.add(candidate);
  const report = await fetchResult(candidate);
  sitemapReports.push({ url: candidate, status: report.status });
  if (report.status !== 200) continue;

  const urls = sitemapUrls(report.body);
  if (/<sitemapindex\b/i.test(report.body)) {
    for (const url of urls) {
      if (sameOrigin(url)) sitemapCandidates.push(url);
    }
    continue;
  }

  for (const url of urls) {
    if (!sameOrigin(url)) continue;
    sitemapPageUrls.add(url);
    if (routes.size < maxRoutes) routes.add(url);
  }
}

const pages = [];
for (const url of routes) {
  if (url === startUrl.href) {
    pages.push({
      url,
      finalUrl: home.finalUrl,
      status: home.status,
      durationMs: home.durationMs,
      error: home.error,
      html: auditHtml(home.body),
    });
  } else {
    if (delayMs) await sleep(delayMs);
    const report = await fetchResult(url);
    pages.push({
      url,
      finalUrl: report.finalUrl,
      status: report.status,
      durationMs: report.durationMs,
      error: report.error,
      html: auditHtml(report.body),
    });
  }
}

const requiredHeaders = [
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
];

let previewAudit = null;
if (explicitPreview) {
  const previewUrl = new URL(explicitPreview, startUrl).href;
  if (!sameOrigin(previewUrl)) {
    throw new Error("--preview must belong to the audited origin");
  }
  if (delayMs) await sleep(delayMs);
  const preview = await fetchResult(previewUrl);
  const html = auditHtml(preview.body);
  const robots = html.robots?.toLowerCase() ?? "";
  const sitemapRoutes = new Set(
    [...sitemapPageUrls].map((url) => comparableRoute(url)),
  );

  previewAudit = {
    url: previewUrl,
    finalUrl: preview.finalUrl,
    status: preview.status,
    error: preview.error,
    robots: html.robots,
    noindex: /(?:^|,)\s*noindex(?:\s|,|$)/.test(robots),
    nofollow: /(?:^|,)\s*nofollow(?:\s|,|$)/.test(robots),
    inSitemap: sitemapRoutes.has(comparableRoute(previewUrl)),
  };
}

const output = {
  auditedAt: new Date().toISOString(),
  origin: startUrl.origin,
  discoveredRoutes: routes.size,
  sitemapReports,
  previewAudit,
  summary: {
    successful: pages.filter((page) => page.status === 200).length,
    redirectsOrOther: pages.filter(
      (page) => page.status && page.status !== 200 && page.status < 400,
    ).length,
    failed: pages.filter((page) => !page.status || page.status >= 400).length,
    productRoutes: pages.filter((page) =>
      new URL(page.url).pathname.startsWith("/producto/"),
    ).length,
    missingTitle: pages.filter((page) => !page.html.title).length,
    missingDescription: pages.filter((page) => !page.html.description).length,
    missingCanonical: pages.filter((page) => !page.html.canonical).length,
    invalidH1Count: pages.filter((page) => page.html.h1Count !== 1).length,
    pagesWithPlaceholders: pages.filter(
      (page) => page.html.placeholders.length > 0,
    ).length,
  },
  homeSecurityHeaders: Object.fromEntries(
    requiredHeaders.map((header) => [header, home.headers[header] ?? null]),
  ),
  pages,
};

console.log(JSON.stringify(output, null, 2));
