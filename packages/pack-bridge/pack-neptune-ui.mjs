#!/usr/bin/env node
import { cp, mkdir, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const bridgeRoot = resolve(here, "../..");
const sourceRoot = resolve(bridgeRoot, "..");
const clientPackages = join(sourceRoot, "client_packages");
const portable = process.argv.includes("--portable");
const resourceName = portable ? "neptuneevo-ui" : "neptuneevo-ui-dev";
const outDir = resolve(bridgeRoot, `dist/${resourceName}`);
const bridgeCef = resolve(bridgeRoot, "packages/cef/dist/index.js");

for (const required of [
  join(clientPackages, "main.js"),
  join(clientPackages, "rage-rpc.min.js"),
  join(clientPackages, "interface"),
  bridgeCef,
]) {
  if (!existsSync(required)) throw new Error(`Required build output is missing: ${required}`);
}

if (existsSync(outDir)) await rm(outDir, { recursive: true, force: true });
await mkdir(join(outDir, "ui"), { recursive: true });
await mkdir(join(outDir, "client"), { recursive: true });

await cp(join(clientPackages, "main.js"), join(outDir, "main.js"));
await cp(join(clientPackages, "rage-rpc.min.js"), join(outDir, "rage-rpc.min.js"));
await cp(bridgeCef, join(outDir, "ui/_bridge.js"));
await cp(join(here, "neptune-ui-host.html"), join(outDir, "ui/host.html"));
await cp(join(here, "neptune-ui-dev.js"), join(outDir, "client/dev-bootstrap.js"));

const patchedInterfaceFiles = new Set([
  "local.html",
  "cloud.html",
  "index.html",
  "cef_vue/index.html",
  "inventory_vue/index.html",
  "buildru/bundle.js",
  "inventory_vue/assets/index-Dd7TP4Ai.js",
]);

function patchInterfaceSource(source, relativePath) {
  let patched = source;
  if (relativePath.toLowerCase().endsWith(".html") && !patched.includes("/ui/_bridge.js")) {
    const bridgeTag = '<script src="/ui/_bridge.js" data-ragemp-bridge="1"></script>';
    if (/<head(?:\s[^>]*)?>/i.test(patched)) {
      patched = patched.replace(/<head(?:\s[^>]*)?>/i, (head) => `${head}\n        ${bridgeTag}`);
    } else {
      patched = `${bridgeTag}\n${patched}`;
    }
  }

  // package:// is a RAGE:MP-only scheme. Keep the original assets untouched,
  // and translate only the few literals present in the generated FiveM view.
  return patched.replace(
    /(["'])package:\/\/interface(\/[^"']*)?\1/g,
    (_match, _quote, suffix = "") =>
      `window.__ragempResolvePackageUrl("package://interface${suffix}")`,
  );
}

async function createInterfaceOverlay(sourceRoot, targetRoot, relativeDir = "") {
  await mkdir(targetRoot, { recursive: true });
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  for (const entry of entries) {
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
    const source = join(sourceRoot, entry.name);
    const target = join(targetRoot, entry.name);
    if (entry.isDirectory()) {
      const containsPatch = [...patchedInterfaceFiles].some((path) =>
        path.startsWith(`${relativePath}/`),
      );
      if (containsPatch) await createInterfaceOverlay(source, target, relativePath);
      else if (portable) await cp(source, target, { recursive: true });
      else await symlink(source, target, process.platform === "win32" ? "junction" : "dir");
      continue;
    }

    if (patchedInterfaceFiles.has(relativePath)) {
      const contents = await readFile(source, "utf8");
      await writeFile(target, patchInterfaceSource(contents, relativePath), "utf8");
    } else {
      await cp(source, target);
    }
  }
}

// The checked-in client package is almost 10 GB. A shallow overlay patches
// only FiveM-incompatible entry files; junctions keep every other asset exact.
await createInterfaceOverlay(join(clientPackages, "interface"), join(outDir, "interface"));

// Game DLC/map archives are intentionally outside the migration scope. Keep
// only browser-facing files required by the original CEF and sound UI.
const assetDirs = ["cef", "soundapi", "sounds"];
for (const name of assetDirs) {
  const source = join(clientPackages, name);
  if (existsSync(source)) {
    if (portable) await cp(source, join(outDir, name), { recursive: true });
    else await symlink(source, join(outDir, name), process.platform === "win32" ? "junction" : "dir");
  }
}

const manifest = `fx_version 'cerulean'
game 'gta5'

name '${resourceName}'
description 'NeptuneEvo original client and CEF resource for FiveM'
version '0.1.0'

dependency 'ragemp-fivem-bridge'

client_scripts {
    '@ragemp-fivem-bridge/client.js',
    'rage-rpc.min.js',
    'main.js'${portable ? "" : ",\n    'client/dev-bootstrap.js'"}
}

ui_page 'ui/host.html'

files {
    'ui/host.html',
    'ui/_bridge.js',
    'interface/**/*',
    'cef/**/*',
    'soundapi/**/*',
    'sounds/**/*'
}
`;

await writeFile(join(outDir, "fxmanifest.lua"), manifest, "utf8");
console.log(`[neptune-ui] ${portable ? "Portable" : "Development"} resource ready: ${outDir}`);
console.log(`[neptune-ui] Start ragemp-fivem-bridge first, then ${resourceName}.${portable ? "" : " Use /neptuneui for the standalone UI smoke view."}`);
