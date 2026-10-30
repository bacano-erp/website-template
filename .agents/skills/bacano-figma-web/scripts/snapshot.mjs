import { existsSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";

function object(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateFrame(frame, path, errors) {
  if (!object(frame)) {
    errors.push(`${path} debe ser un objeto.`);
    return;
  }
  if (typeof frame.nodeId !== "string" && typeof frame.url !== "string") {
    errors.push(`${path} requiere nodeId o url.`);
  }
}

function inspectSecrets(value, errors, path = "manifest") {
  const secretNames = new Set([
    "accesstoken",
    "authorization",
    "cookie",
    "password",
    "personalaccesstoken",
    "secret",
  ]);
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      inspectSecrets(item, errors, `${path}[${index}]`),
    );
    return;
  }
  if (!object(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (secretNames.has(key.toLowerCase())) {
      errors.push(`${path}.${key} no puede contener secretos.`);
    }
    inspectSecrets(child, errors, `${path}.${key}`);
  }
}

export function validateManifest(manifest) {
  const errors = [];
  const adapters = new Set([
    "figma-official",
    "figma-desktop",
    "desktop-bridge",
    "rest-snapshot",
  ]);
  const capabilities = new Set(["available", "partial", "missing"]);
  const pageStatuses = new Set([
    "pending",
    "extracted",
    "implemented",
    "validated",
  ]);

  if (!object(manifest)) return ["El manifiesto debe ser un objeto JSON."];
  if (manifest.schemaVersion !== 1) errors.push("schemaVersion debe ser 1.");
  if (typeof manifest.project !== "string" || !manifest.project.trim()) {
    errors.push("project es obligatorio.");
  }
  if (!object(manifest.source)) {
    errors.push("source es obligatorio.");
  } else {
    if (!adapters.has(manifest.source.adapter)) {
      errors.push("source.adapter no es compatible.");
    }
    if (
      typeof manifest.source.extractedAt !== "string" ||
      Number.isNaN(Date.parse(manifest.source.extractedAt))
    ) {
      errors.push("source.extractedAt debe ser una fecha ISO válida.");
    }
  }
  if (manifest.capabilities !== undefined) {
    if (!object(manifest.capabilities)) {
      errors.push("capabilities debe ser un objeto.");
    } else {
      for (const [name, status] of Object.entries(manifest.capabilities)) {
        if (!capabilities.has(status)) {
          errors.push(`capabilities.${name} no tiene un estado válido.`);
        }
      }
    }
  }
  if (!Array.isArray(manifest.pages) || manifest.pages.length === 0) {
    errors.push("pages requiere al menos una página.");
  } else {
    const routes = new Set();
    manifest.pages.forEach((page, index) => {
      const path = `pages[${index}]`;
      if (!object(page)) {
        errors.push(`${path} debe ser un objeto.`);
        return;
      }
      if (typeof page.route !== "string" || !page.route.startsWith("/")) {
        errors.push(`${path}.route debe comenzar por /.`);
      } else if (routes.has(page.route)) {
        errors.push(`${path}.route está duplicada.`);
      } else {
        routes.add(page.route);
      }
      if (typeof page.name !== "string" || !page.name.trim()) {
        errors.push(`${path}.name es obligatorio.`);
      }
      if (!pageStatuses.has(page.status)) {
        errors.push(`${path}.status no es válido.`);
      }
      if (!page.desktop && !page.mobile) {
        errors.push(`${path} requiere un frame desktop o mobile.`);
      }
      if (page.desktop) validateFrame(page.desktop, `${path}.desktop`, errors);
      if (page.mobile) validateFrame(page.mobile, `${path}.mobile`, errors);
    });
  }
  inspectSecrets(manifest, errors);
  return errors;
}

export function validateSnapshot(path, projectRoot) {
  if (!path) throw new Error("Indica la ruta de manifest.json.");
  const manifestPath = resolve(projectRoot, path);
  if (!existsSync(manifestPath) || !statSync(manifestPath).isFile()) {
    throw new Error(`No existe el manifiesto: ${path}`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const errors = validateManifest(manifest);
  if (errors.length) {
    console.error("Snapshot inválido:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Snapshot válido: ${relative(projectRoot, manifestPath)}`);
  console.log(
    `${manifest.pages.length} página(s), fuente ${manifest.source.adapter}.`,
  );
}
