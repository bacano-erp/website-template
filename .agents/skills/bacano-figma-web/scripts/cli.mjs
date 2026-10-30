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
import { connect } from "node:net";
import { dirname, relative, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { validateSnapshot } from "./snapshot.mjs";

const skillName = "bacano-figma-web";
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const sourceSkill = resolve(scriptDirectory, "..");
const projectRoot = process.cwd();
const canonicalSkill = resolve(projectRoot, ".agents", "skills", skillName);

const adapterPaths = {
  antigravity: canonicalSkill,
  claude: resolve(projectRoot, ".claude", "skills", skillName),
  codex: resolve(projectRoot, ".codex", "skills", skillName),
};

function usage() {
  console.log(`Bacano Figma Web

Uso:
  bacano-figma-web install [--agent antigravity|claude|codex|all] [--force]
  bacano-figma-web check
  bacano-figma-web doctor [--json]
  bacano-figma-web validate-snapshot <ruta/manifest.json>

La copia canónica vive en .agents/skills/${skillName}.
Claude y Codex reciben enlaces a esa misma copia.`);
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function relativeDisplay(path) {
  const value = relative(projectRoot, path);
  return value || ".";
}

function listFiles(directory, base = directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return listFiles(path, base);
      if (!entry.isFile()) return [];
      return [{ path, name: relative(base, path) }];
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function skillDigest(directory) {
  const hash = createHash("sha256");
  for (const file of listFiles(directory)) {
    hash.update(file.name);
    hash.update("\0");
    hash.update(readFileSync(file.path));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function isSkillDirectory(directory) {
  return existsSync(resolve(directory, "SKILL.md"));
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

  if (isSkillDirectory(canonicalSkill)) {
    if (skillDigest(canonicalSkill) === skillDigest(sourceSkill)) return;
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

async function installSkill() {
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

  console.log("Skill Bacano Figma Web instalada.");
  console.log(`Fuente canónica: ${relativeDisplay(canonicalSkill)}`);
  if (agent === "claude" || agent === "all") {
    console.log(`Claude Code: ${relativeDisplay(adapterPaths.claude)}`);
  }
  if (agent === "codex" || agent === "all") {
    console.log(`Codex: ${relativeDisplay(adapterPaths.codex)}`);
  }
  console.log("Ejecuta bacano-figma-web doctor para revisar la conexión.");
}

function checkPath(name, path) {
  if (!existsSync(path)) {
    return { name, path: relativeDisplay(path), status: "missing" };
  }
  if (!isSkillDirectory(path)) {
    return { name, path: relativeDisplay(path), status: "invalid" };
  }
  return {
    name,
    path: relativeDisplay(path),
    status:
      skillDigest(path) === skillDigest(sourceSkill) ? "current" : "outdated",
    link: lstatSync(path).isSymbolicLink(),
  };
}

function skillStatus() {
  const results = [
    checkPath("canonical", canonicalSkill),
    checkPath("antigravity", adapterPaths.antigravity),
    checkPath("claude", adapterPaths.claude),
    checkPath("codex", adapterPaths.codex),
  ];
  return results.filter(
    (result, index) =>
      results.findIndex((candidate) => candidate.path === result.path) ===
      index,
  );
}

function check() {
  const results = skillStatus();
  console.table(results);
  if (results[0]?.status !== "current") {
    console.error(
      "Bacano Figma Web no está instalada o está desactualizada. Ejecuta bacano-figma-web install.",
    );
    process.exitCode = 1;
    return;
  }
  if (results.slice(1).some((result) => result.link === false)) {
    console.warn(
      "Hay copias físicas en adaptadores. Reinstala con --force para evitar divergencias.",
    );
  }
  if (results.some((result) => result.status === "outdated")) {
    process.exitCode = 1;
  }
}

function canConnect(port, timeout = 250) {
  return new Promise((finish) => {
    const socket = connect({ host: "127.0.0.1", port });
    const close = (available) => {
      socket.destroy();
      finish(available);
    };
    socket.setTimeout(timeout);
    socket.once("connect", () => close(true));
    socket.once("timeout", () => close(false));
    socket.once("error", () => close(false));
  });
}

async function doctor() {
  const bridgeChecks = await Promise.all(
    Array.from({ length: 10 }, (_, index) => 9223 + index).map(
      async (port) => ({
        port,
        available: await canConnect(port),
      }),
    ),
  );
  const report = {
    skill: skillStatus()[0]?.status ?? "missing",
    officialRemoteMcp: "verify-in-agent",
    officialDesktopMcp: (await canConnect(3845))
      ? "detected-on-127.0.0.1:3845"
      : "not-detected",
    communityBridgePorts: bridgeChecks
      .filter((result) => result.available)
      .map((result) => result.port),
    restToken: process.env.FIGMA_ACCESS_TOKEN ? "configured" : "not-configured",
  };

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log("Diagnóstico Bacano Figma Web");
  console.table([
    { control: "Skill instalada", result: report.skill },
    {
      control: "MCP remoto oficial",
      result: "Verificar OAuth y whoami dentro del agente",
    },
    { control: "MCP local oficial", result: report.officialDesktopMcp },
    {
      control: "Desktop Bridge comunitario",
      result: report.communityBridgePorts.length
        ? `Puerto(s) detectado(s): ${report.communityBridgePorts.join(", ")}`
        : "No detectado",
    },
    { control: "Token REST (solo presencia)", result: report.restToken },
  ]);
  console.log(
    "Este diagnóstico no lee secretos ni puede certificar el OAuth del cliente MCP.",
  );
}

const command = process.argv[2] ?? "help";

try {
  if (command === "install") await installSkill();
  else if (command === "check") check();
  else if (command === "doctor") await doctor();
  else if (command === "validate-snapshot")
    validateSnapshot(process.argv[3], projectRoot);
  else usage();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
