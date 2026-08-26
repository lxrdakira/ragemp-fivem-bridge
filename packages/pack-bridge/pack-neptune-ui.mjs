#!/usr/bin/env node
import { cp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const bridgeRoot = resolve(here, "../..");
const sourceRoot = resolve(bridgeRoot, "..");
const clientPackages = join(sourceRoot, "client_packages");
const outDir = resolve(bridgeRoot, "dist/neptuneevo-ui-dev");
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

// The checked-in client package is almost 10 GB. Junctions keep the local
// smoke resource instant and ensure every UI asset stays byte-for-byte equal.
const assetDirs = ["interface", "cef", "soundapi", "sounds", "game", "game_resources"];
for (const name of assetDirs) {
  const source = join(clientPackages, name);
  if (existsSync(source)) {
    await symlink(source, join(outDir, name), process.platform === "win32" ? "junction" : "dir");
  }
}

const manifest = `fx_version 'cerulean'
game 'gta5'

name 'neptuneevo-ui-dev'
description 'NeptuneEvo original client and CEF smoke resource'
version '0.1.0'

client_scripts {
    '@ragemp-fivem-bridge/client.js',
    'rage-rpc.min.js',
    'main.js',
    'client/dev-bootstrap.js'
}

ui_page 'ui/host.html'

files {
    'ui/host.html',
    'ui/_bridge.js',
    'interface/**/*',
    'cef/**/*',
    'soundapi/**/*',
    'sounds/**/*',
    'game/**/*',
    'game_resources/**/*'
}
`;

await writeFile(join(outDir, "fxmanifest.lua"), manifest, "utf8");
console.log(`[neptune-ui] Development resource ready: ${outDir}`);
console.log("[neptune-ui] Start ragemp-fivem-bridge first, then neptuneevo-ui-dev; use /neptuneui in game.");
