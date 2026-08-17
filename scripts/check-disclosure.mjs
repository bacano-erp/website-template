#!/usr/bin/env node
/**
 * Stops private information reaching a public repository.
 *
 * This template is public. Its code gets reviewed; the prose around a change —
 * commit messages, and the pull request title and body — does not, and it is
 * published just as widely. So this reads the same three surfaces a stranger
 * can read: the changed lines, the commit messages, and the pull request text.
 *
 * It is deliberately structural rather than a list of things not to say. Such a
 * list, committed here, would itself be the disclosure. So instead: known-good
 * hosts are allowlisted, secrets are matched by shape, and anything else that
 * looks like somebody's infrastructure is reported.
 *
 * Usage: `node scripts/check-disclosure.mjs`, or `pnpm check:disclosure`.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Hosts a public storefront template is expected to mention: Bacano's own
 * public endpoints, the registries and docs a reader is sent to, and the
 * reserved example domains.
 *
 * Adding to this list is a deliberate act. If a host belongs to one customer,
 * it does not belong here — describe it by role instead.
 */
const ALLOWED_HOSTS = new Set([
  "bacanoerp.com",
  "example.com",
  "example.org",
  "localhost",
  "github.com",
  "githubusercontent.com",
  "npmjs.com",
  "nextjs.org",
  "react.dev",
  "nodejs.org",
  "playwright.dev",
  "biomejs.dev",
  "tailwindcss.com",
  "clerk.com",
  "heroui.com",
  "schema.org",
  "sitemaps.org",
  "w3.org",
  "mozilla.org",
  "typescriptlang.org",
  // Commit trailers carry `noreply@anthropic.com`.
  "anthropic.com",
]);

/** Only this organisation's repositories may be linked by URL. */
const ALLOWED_GITHUB_OWNER = "bacano-erp";

const SECRET_PATTERNS = [
  [/\bghp_[A-Za-z0-9]{20,}/, "GitHub personal access token"],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}/, "GitHub fine-grained token"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key id"],
  [/\bnpg_[A-Za-z0-9]{10,}/, "Neon database password"],
  [/\bpostgres(?:ql)?:\/\/[^\s"']+/, "Postgres connection string"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, "JSON Web Token"],
  [/\bx-hasura-admin-secret\b/i, "Hasura admin secret"],
];

const INFRA_PATTERNS = [
  // Twelve digits, but not a slice of something longer: the last segment of a
  // UUID is often twelve digits, and reading a UUID's tail as an account id
  // makes the guard cry wolf over ordinary test fixtures.
  [/(?<![0-9a-fA-F-])\d{12}(?![0-9a-fA-F-])/, "an AWS account id"],
  [/\bZ[A-Z0-9]{12,}\b/, "a Route 53 hosted zone id"],
  [/\barn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:/, "an AWS ARN with an account id"],
];

/** Loopback and documentation ranges are fine; anything else is somebody's box. */
const PUBLIC_IP =
  /\b(?!127\.|0\.0\.0\.0|10\.|192\.168\.|255\.)\d{1,3}(?:\.\d{1,3}){3}\b/;

const HOST = /\bhttps?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi;
/**
 * Hosts written without a scheme, which is how a domain usually appears in
 * prose: "the store at shop.example.com".
 *
 * Two labels are enough. An earlier version required three and therefore missed
 * exactly the shape it exists to catch. The suffix list is deliberately short:
 * `.app`, `.co` and `.store` read the same as ordinary property access
 * (`cart.store`), and those are still caught when written as a URL.
 */
const BARE_HOST =
  /\b([a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|io|net|dev|shop))\b/gi;

/** Both remote forms: `github.com/<owner>/<repo>` and `git@github.com:<owner>/<repo>`. */
const GITHUB_REPO = /github\.com[/:]([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)/g;

function registrableDomain(host) {
  const parts = host.toLowerCase().replace(/\.$/, "").split(".");
  return parts.slice(-2).join(".");
}

/**
 * Everything reportable in one piece of text.
 *
 * Exported so the rules can be tested directly — the gaps this once had (a bare
 * two-label domain, an SSH remote) were invisible until something exercised
 * them one by one.
 */
export function findings(text, where) {
  const found = [];
  if (!text) return found;

  for (const [pattern, what] of SECRET_PATTERNS) {
    if (pattern.test(text)) found.push(`${where}: contains ${what}`);
  }

  for (const [pattern, what] of INFRA_PATTERNS) {
    const match = pattern.exec(text);
    if (match) found.push(`${where}: contains ${what} (${match[0]})`);
  }

  const ip = PUBLIC_IP.exec(text);
  if (ip) found.push(`${where}: contains a public IP address (${ip[0]})`);

  for (const match of text.matchAll(GITHUB_REPO)) {
    const [, owner, repo] = match;
    if (owner.toLowerCase() !== ALLOWED_GITHUB_OWNER) {
      found.push(
        `${where}: links a repository outside ${ALLOWED_GITHUB_OWNER} (${owner}/${repo}) — ` +
          `if it is a customer's, describe it by role instead`,
      );
    }
  }

  for (const regex of [HOST, BARE_HOST]) {
    for (const match of text.matchAll(regex)) {
      const domain = registrableDomain(match[1]);
      if (!ALLOWED_HOSTS.has(domain)) {
        found.push(
          `${where}: mentions the host "${match[1]}" — allowlist it in ` +
            `scripts/check-disclosure.mjs if it is public, or remove it`,
        );
      }
    }
  }

  return found;
}

/**
 * Runs git, returning null instead of throwing when the command fails.
 *
 * Silences stderr: the failures here are expected probes — a ref that is not
 * present, histories with no merge base — and a `fatal:` in the log of a
 * passing build teaches people to ignore the log.
 */
function tryGit(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

function has(ref) {
  return tryGit(["rev-parse", "--verify", "--quiet", ref]) !== null;
}

/**
 * The commit this change departs from.
 *
 * CI checks out one commit deep, so the base branch usually is not there and
 * has to be fetched. Returns null when it cannot be established — the caller
 * then scans everything rather than nothing, because a guard that fails open
 * is worse than one that is briefly noisy.
 */
function baseRef() {
  const branch = process.env.GITHUB_BASE_REF;
  const candidates = branch
    ? [`origin/${branch}`, branch]
    : ["origin/main", "main"];

  for (const candidate of candidates) {
    if (has(candidate)) return candidate;
  }

  if (branch) {
    try {
      tryGit([
        "fetch",
        "--no-tags",
        "--depth=50",
        "origin",
        `${branch}:refs/remotes/origin/${branch}`,
      ]);
      if (has(`origin/${branch}`)) return `origin/${branch}`;
    } catch {
      // Offline, or no permission to fetch. Handled by the caller.
    }
  }

  return has("HEAD~1") ? "HEAD~1" : null;
}

function main() {
  const base = baseRef();
  const problems = [];

  // 1. The change itself, added lines only: existing content is not this pull
  //    request's to answer for. Three dots first; two dots when the histories
  //    share no merge base, which is what a shallow CI checkout looks like.
  const diff = base
    ? (tryGit(["diff", `${base}...HEAD`, "--unified=0"]) ??
      tryGit(["diff", base, "HEAD", "--unified=0"]))
    : null;

  if (diff !== null) {
    for (const line of diff.split("\n")) {
      if (!line.startsWith("+") || line.startsWith("+++")) continue;
      problems.push(...findings(line.slice(1), "diff"));
    }

    /**
     * Work that is not committed yet.
     *
     * Without this, running the guard before committing examines the previous
     * change and reports success about the one you are holding — which is
     * exactly when somebody runs it, and exactly the false confidence this
     * whole check exists to remove. `git diff HEAD` covers staged and unstaged
     * together.
     */
    const uncommitted = tryGit(["diff", "HEAD", "--unified=0"]) ?? "";
    for (const line of uncommitted.split("\n")) {
      if (!line.startsWith("+") || line.startsWith("+++")) continue;
      problems.push(...findings(line.slice(1), "uncommitted change"));
    }

    // 2. Commit messages, which are published with the code.
    const log =
      tryGit(["log", `${base}..HEAD`, "--format=%B"]) ??
      tryGit(["log", "-20", "--format=%B"]) ??
      "";
    problems.push(...findings(log, "commit message"));
  } else {
    // No usable base: check every tracked file and the recent log instead. A
    // superset of the change, so it cannot miss what the diff would catch — a
    // guard that fails open is worse than one that is briefly noisy.
    console.warn("No comparable base — scanning the whole tree.");
    problems.push(
      ...findings(
        tryGit(["log", "-20", "--format=%B"]) ?? "",
        "commit message",
      ),
    );
    const tracked = (tryGit(["ls-files"]) ?? "").split("\n").filter(Boolean);
    for (const file of tracked) {
      try {
        problems.push(...findings(readFileSync(file, "utf8"), file));
      } catch {
        // Binary or unreadable. Nothing to read means nothing to disclose.
      }
    }
  }

  // 3. The pull request title and body — the surface nobody reviews.
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (eventPath) {
    try {
      const event = JSON.parse(readFileSync(eventPath, "utf8"));
      const pr = event.pull_request;
      if (pr) {
        problems.push(...findings(pr.title, "pull request title"));
        problems.push(...findings(pr.body, "pull request body"));
      }
    } catch {
      // No event payload (a manual run). The diff and commits are still checked.
    }
  }

  const unique = [...new Set(problems)];

  if (unique.length === 0) {
    console.log("No disclosure risks found.");
    return;
  }

  console.error("This repository is public. Found:\n");
  for (const problem of unique) console.error(`  • ${problem}`);
  console.error(
    '\nCite sources by role — "a store already in production" — never by name,' +
      "\nlink, customer domain or internal address. If a finding is a false" +
      "\npositive, allowlist it in scripts/check-disclosure.mjs with a reason.",
  );
  process.exit(1);
}

/**
 * Only when run as a command: importing this from a test must not scan the repo.
 *
 * Compared as resolved paths, not by string-building a `file://` URL. A path
 * needing any encoding — a space is enough, and macOS home directories often
 * have one — made that comparison fail, and the guard then exited 0 having done
 * nothing at all. A check that silently disables itself based on where the
 * repository was cloned is worse than no check.
 */
function samePath(a, b) {
  try {
    // Through symlinks: Node resolves a module URL to its real path, while
    // argv[1] is whatever the shell passed. On macOS a temporary directory is
    // `/var/folders/...` pointing at `/private/var/folders/...`, so comparing
    // the two spellings fails and the guard would once again do nothing.
    return realpathSync(a) === realpathSync(b);
  } catch {
    return resolve(a) === resolve(b);
  }
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  samePath(process.argv[1], fileURLToPath(import.meta.url));

if (invokedDirectly) main();
