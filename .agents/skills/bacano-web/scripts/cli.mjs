#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const sourceSkill = resolve(scriptDirectory, "..");
const projectRoot = process.cwd();
const canonicalSkill = resolve(projectRoot, ".agents", "skills", "bacano-web");

const adapterPaths = {
  antigravity: canonicalSkill,
  claude: resolve(projectRoot, ".claude", "skills", "bacano-web"),
  codex: resolve(projectRoot, ".codex", "skills", "bacano-web"),
};

function usage() {
  console.log(`Bacano Web readiness skill

Usage:
  bacano-web install [--agent antigravity|claude|codex|all] [--force]
  bacano-web check

The canonical project copy lives at .agents/skills/bacano-web.
Claude and Codex receive links to that same copy.`);
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function skillFingerprint(directory) {
  const digest = createHash("sha256");

  function visit(current, prefix = "") {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort(
      (first, second) => first.name.localeCompare(second.name),
    )) {
      const name = prefix ? `${prefix}/${entry.name}` : entry.name;
      const path = resolve(current, entry.name);
      if (entry.isDirectory()) {
        visit(path, name);
      } else if (entry.isFile()) {
        digest.update(name).update("\0").update(readFileSync(path));
      } else if (entry.isSymbolicLink()) {
        digest.update(name).update("\0").update(readlinkSync(path));
      }
    }
  }

  visit(directory);
  return digest.digest("hex");
}

function skillFile(directory) {
  return resolve(directory, "SKILL.md");
}

function relativeDisplay(path) {
  const value = relative(projectRoot, path);
  return value || ".";
}

function removeExisting(path, force) {
  if (!existsSync(path)) return;
  if (!force) {
    throw new Error(
      `${relativeDisplay(path)} ya existe. Usa --force para reemplazarlo.`,
    );
  }
  rmSync(path, { recursive: true, force: true });
}

function installCanonical(force) {
  if (resolve(sourceSkill) === canonicalSkill) return;

  if (existsSync(skillFile(canonicalSkill))) {
    if (skillFingerprint(canonicalSkill) === skillFingerprint(sourceSkill))
      return;
    removeExisting(canonicalSkill, force);
  } else if (existsSync(canonicalSkill)) {
    removeExisting(canonicalSkill, force);
  }

  mkdirSync(dirname(canonicalSkill), { recursive: true });
  cpSync(sourceSkill, canonicalSkill, { recursive: true });
}

function installAdapter(agent, force) {
  const target = adapterPaths[agent];
  if (!target || target === canonicalSkill) return;

  if (existsSync(target)) {
    const stat = lstatSync(target);
    if (stat.isSymbolicLink()) {
      const resolvedLink = resolve(dirname(target), readlinkSync(target));
      if (resolvedLink === canonicalSkill) return;
    }
    removeExisting(target, force);
  }

  mkdirSync(dirname(target), { recursive: true });
  const targetReference =
    process.platform === "win32"
      ? canonicalSkill
      : relative(dirname(target), canonicalSkill);
  symlinkSync(
    targetReference,
    target,
    process.platform === "win32" ? "junction" : "dir",
  );
}

async function chooseAgent() {
  const explicit = option("--agent");
  if (explicit) return explicit;

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      "Indica --agent antigravity, --agent claude, --agent codex o --agent all.",
    );
  }

  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await prompt.question(
    "¿Qué agente usará la skill? [1] Antigravity [2] Claude Code [3] Codex [4] Todos: ",
  );
  prompt.close();

  return (
    { 1: "antigravity", 2: "claude", 3: "codex", 4: "all" }[answer.trim()] ??
    answer.trim().toLowerCase()
  );
}

function validateAgent(agent) {
  if (!["antigravity", "claude", "codex", "all"].includes(agent)) {
    throw new Error(`Agente no reconocido: ${agent || "(vacío)"}.`);
  }
}

async function install() {
  const agent = await chooseAgent();
  validateAgent(agent);
  const force = process.argv.includes("--force");

  installCanonical(force);
  if (agent === "all") {
    installAdapter("claude", force);
    installAdapter("codex", force);
  } else {
    installAdapter(agent, force);
  }

  console.log("Skill Bacano Web instalada.");
  console.log(`Fuente canónica: ${relativeDisplay(canonicalSkill)}`);
  if (agent === "claude" || agent === "all") {
    console.log(`Claude Code: ${relativeDisplay(adapterPaths.claude)}`);
  }
  if (agent === "codex" || agent === "all") {
    console.log(`Codex: ${relativeDisplay(adapterPaths.codex)}`);
  }
  console.log("Ejecuta bacano-web check para verificarla.");
}

function checkPath(name, path) {
  if (!existsSync(path))
    return { name, path: relativeDisplay(path), status: "missing" };
  const file = skillFile(path);
  if (!existsSync(file)) {
    return { name, path: relativeDisplay(path), status: "invalid" };
  }
  return {
    name,
    path: relativeDisplay(path),
    status:
      skillFingerprint(path) === skillFingerprint(sourceSkill)
        ? "current"
        : "outdated",
    link: lstatSync(path).isSymbolicLink(),
  };
}

function check() {
  const results = [
    checkPath("canonical", canonicalSkill),
    checkPath("antigravity", adapterPaths.antigravity),
    checkPath("claude", adapterPaths.claude),
    checkPath("codex", adapterPaths.codex),
  ];
  const unique = results.filter(
    (result, index) =>
      results.findIndex((candidate) => candidate.path === result.path) ===
      index,
  );

  console.table(unique);
  const canonical = results[0];
  if (canonical.status !== "current") {
    console.error(
      "Bacano Web no está instalada o está desactualizada. Ejecuta bacano-web install.",
    );
    process.exitCode = 1;
    return;
  }

  const adapters = results
    .slice(2)
    .filter((result) => result.status !== "missing");
  if (adapters.some((result) => !result.link)) {
    console.warn(
      "Se detectaron copias físicas en adaptadores. Reinstala con --force para evitar divergencias.",
    );
  }
  if (unique.some((result) => result.status === "outdated"))
    process.exitCode = 1;
}

const command = process.argv[2] ?? "help";

try {
  if (command === "install") await install();
  else if (command === "check") check();
  else usage();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
