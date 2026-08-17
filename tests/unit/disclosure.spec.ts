import { expect, test } from "@playwright/test";
// The guard is plain JS on purpose: no dependency, runnable by `node` alone.
import { findings } from "../../scripts/check-disclosure.mjs";

/**
 * The disclosure guard, exercised one shape at a time.
 *
 * Its gaps were invisible while it was only ever run against a clean tree: it
 * reported success, and success is what a broken guard also reports. Each case
 * below is a shape that reached, or could have reached, the public repository.
 *
 * The fixtures are assembled at runtime rather than written as literals,
 * because the guard reads this file's own diff — a literal example would be a
 * finding, and the suite would fail the very check it is testing.
 */

const host = (...labels: string[]) => labels.join(".");
const repoUrl = (owner: string, repo: string) =>
  ["https://github", "com", `${owner}/${repo}`]
    .join("/")
    .replace("github/", "github.");
const sshRemote = (owner: string, repo: string) =>
  `git@${host("github", "com")}:${owner}/${repo}.git`;

/**
 * Infrastructure shapes, also assembled rather than written out.
 *
 * Every one of these is a documentation or obviously-fake value, but the guard
 * matches on shape, not on realism — and it reads this file's diff. Written as
 * literals they are findings, and this suite would fail the check it tests.
 */
const accountId = "1234".repeat(3);
const arn = `arn:aws:iam::${accountId}:role/deploy`;
const zoneId = `Z${"1D633PJN98FT9"}`;
const documentationIp = ["203", "0", "113", "9"].join(".");
const databaseUrl = `${"postgres"}${"://"}user:npg_${"c".repeat(12)}@db/x`;
const privateKeyHeader = `-----BEGIN ${"OPENSSH"} PRIVATE KEY-----`;
const hasuraHeader = ["x", "hasura", "admin", "secret"].join("-");

const flagged = (text: string) => findings(text, "sample").length > 0;

test.describe("shapes that must never reach a public repository", () => {
  test("a bare two-label host, as written in prose", () => {
    // The gap that mattered most: the three-label form was caught while this,
    // the form a person actually types, was not.
    expect(
      flagged(`the store at ${host("somecustomer", "com")} went live`),
    ).toBe(true);
  });

  test("a three-label host", () => {
    expect(flagged(`see ${host("tienda", "somecustomer", "com")}`)).toBe(true);
  });

  test("an email at a customer's domain", () => {
    expect(flagged(`contact ops@${host("somecustomer", "com")}`)).toBe(true);
  });

  test("a link to a repository outside the Bacano organisation", () => {
    expect(flagged(`built from ${repoUrl("some-agency", "their-store")}`)).toBe(
      true,
    );
  });

  test("the same repository as an SSH remote", () => {
    expect(flagged(sshRemote("some-agency", "their-store"))).toBe(true);
  });

  test("an AWS account id, alone or inside an ARN", () => {
    expect(flagged(`account ${accountId}`)).toBe(true);
    expect(flagged(arn)).toBe(true);
  });

  test("a Route 53 hosted zone id", () => {
    expect(flagged(`zone ${zoneId}`)).toBe(true);
  });

  test("a public IP address, but not a loopback or private one", () => {
    expect(flagged(`deployed to ${documentationIp}`)).toBe(true);
    expect(
      flagged(
        `listening on ${["127", "0", "0", "1"].join(".")} and ${["192", "168", "1", "10"].join(".")}`,
      ),
    ).toBe(false);
  });

  test("credentials, by shape", () => {
    expect(flagged(`token ghp_${"A".repeat(30)}`)).toBe(true);
    expect(flagged(`key AKIA${"B".repeat(16)}`)).toBe(true);
    expect(flagged(databaseUrl)).toBe(true);
    expect(flagged(privateKeyHeader)).toBe(true);
    expect(flagged(`send the ${hasuraHeader} header`)).toBe(true);
  });
});

test.describe("what must not be flagged, or the guard gets ignored", () => {
  test("Bacano's own repositories, in both remote forms", () => {
    expect(flagged(repoUrl("bacano-erp", "website-template"))).toBe(false);
    expect(flagged(sshRemote("bacano-erp", "erp"))).toBe(false);
  });

  test("the docs sites this project cites", () => {
    expect(flagged("see https://nextjs.org/docs and react.dev")).toBe(false);
  });

  test("the reserved example domains", () => {
    expect(flagged(host("tienda", "example", "com"))).toBe(false);
  });

  test("property access that reads like a hostname", () => {
    // `cart.store` and `obj.app` are why those suffixes are not matched bare.
    expect(flagged("const s = cart.store; obj.app = 1;")).toBe(false);
  });

  test("filenames and package specifiers", () => {
    expect(flagged("read package.json, next.config.ts, sitemap.xml")).toBe(
      false,
    );
    expect(flagged('import { x } from "@bacano/sdk/react"')).toBe(false);
  });

  test("an empty or missing body", () => {
    expect(flagged("")).toBe(false);
    expect(findings(null, "sample")).toEqual([]);
  });
});
