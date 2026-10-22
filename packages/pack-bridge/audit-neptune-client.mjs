#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const bridgeRoot = resolve(here, "../..");
const projectRoot = resolve(bridgeRoot, "..");
const bundlePath = resolve(projectRoot, "client_packages/main.js");
const gameRoot = resolve(bridgeRoot, "packages/client/src/Game");
const clientRoot = resolve(bridgeRoot, "packages/client/src");
const sharedRoot = resolve(bridgeRoot, "packages/shared/src");

const aliases = new Map([
  ["controls", "pad"], ["time", "clock"], ["gameplay", "misc"],
  ["ui", "hud"], ["ai", "task"], ["rope", "physics"],
  ["recorder", "recording"],
]);

// Neptune explicitly feature-detects playSound3D/notifications and has a
// native fallback. The other two are writable extension flags, not calls.
const optionalExtensions = new Set([
  "mp.game.audio.playSound3D",
  "mp.game.graphics.bloodVfxMode",
  "mp.game.ui.notifications",
  "mp.game.vehicle.defaultEngineBehaviour",
]);

// These APIs are installed by Neptune itself after the bridge has exposed mp.
const neptuneExtensions = new Set([
  "mp._events.add",
  "mp.attachments.addFor", "mp.attachments.addLocal", "mp.attachments.attachments",
  "mp.attachments.clearLocal", "mp.attachments.initFor", "mp.attachments.register",
  "mp.attachments.normalizeId",
  "mp.attachments.removeFor", "mp.attachments.removeLocal", "mp.attachments.shutdownFor",
  "mp.browsers.hideHud", "mp.browsers.showHud",
  "mp.configs.pokerDebug",
  "mp.gui.emmit", "mp.gui.emmitSafe", "mp.gui.json",
  "mp.keys.bind_0x45", // only occurs in an error-context string
  "mp.objects.forEachInStreamRangeItems",
  "mp.peds.newLegacy", "mp.vehicles.newLegacy",
  "mp.polygons.add", "mp.polygons.isPositionWithinPolygon", "mp.polygons.pool",
]);

const poolBase = [resolve(sharedRoot, "Pool.ts")];
const streamingBase = [...poolBase, resolve(clientRoot, "Pools/StreamingPool.ts")];
const rootSources = new Map([
  ["blips", [...poolBase, resolve(clientRoot, "Pools/BlipMpPool.ts")]],
  ["browsers", [...poolBase, resolve(clientRoot, "Pools/BrowserMpPool.ts")]],
  ["cameras", [...poolBase, resolve(clientRoot, "Pools/CameraMpPool.ts")]],
  ["checkpoints", [...poolBase, resolve(clientRoot, "Pools/CheckpointMpPool.ts")]],
  ["colshapes", [...poolBase, resolve(clientRoot, "Pools/ColshapeMpPool.ts")]],
  ["console", [resolve(clientRoot, "Console.ts")]],
  ["discord", [resolve(clientRoot, "Discord.ts")]],
  ["events", [resolve(sharedRoot, "EventEmitter.ts"), resolve(clientRoot, "Events/EventManager.ts")]],
  ["game", [resolve(gameRoot, "index.ts")]],
  ["gui", [resolve(clientRoot, "Gui.ts")]],
  ["keys", [resolve(clientRoot, "Keys/KeyManager.ts")]],
  ["labels", [...poolBase, resolve(clientRoot, "Pools/TextLabelMpPool.ts")]],
  ["markers", [...poolBase, resolve(clientRoot, "Pools/MarkerMpPool.ts")]],
  ["nametags", [resolve(clientRoot, "Nametags.ts")]],
  ["objects", [...streamingBase, resolve(clientRoot, "Pools/ObjectMpPool.ts")]],
  ["peds", [...streamingBase, resolve(clientRoot, "Pools/PedMpPool.ts")]],
  ["players", [...poolBase, resolve(clientRoot, "Pools/PlayerMpPool.ts")]],
  ["raycasting", [resolve(clientRoot, "Raycasting.ts")]],
  ["vehicles", [...streamingBase, resolve(clientRoot, "Pools/VehicleMpPool.ts")]],
  ["version", [resolve(clientRoot, "Mp.ts")]],
  ["voiceChat", [resolve(clientRoot, "VoiceChat.ts")]],
]);
const localPlayerSources = [
  resolve(sharedRoot, "Entity.ts"),
  resolve(clientRoot, "Entities/EntityMpBase.ts"),
  resolve(clientRoot, "Entities/PedMpBase.ts"),
  resolve(clientRoot, "Entities/PlayerMp.ts"),
];
const dynamicLocalPlayerProperties = new Set(["isFaint", "isJailed"]);

if (!existsSync(bundlePath)) throw new Error(`Neptune client bundle is missing: ${bundlePath}`);
const bundle = await readFile(bundlePath, "utf8");
const calls = new Set(bundle.match(/mp\.game\.[A-Za-z0-9_]+\.[A-Za-z0-9_]+/g) ?? []);
const unresolved = [];

for (const call of calls) {
  if (optionalExtensions.has(call)) continue;
  const [, , namespace, member] = call.split(".");
  const file = aliases.get(namespace) ?? namespace;
  const sourcePath = resolve(gameRoot, `${file}.ts`);
  if (!existsSync(sourcePath)) {
    unresolved.push(`${call} (namespace ${file})`);
    continue;
  }
  const source = await readFile(sourcePath, "utf8");
  const escaped = member.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!new RegExp(`\\b${escaped}\\s*(?:\\(|[:=])`, "m").test(source)) unresolved.push(call);
}

const rootCalls = new Set(bundle.match(/mp\.[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*/g) ?? []);
const sourceCache = new Map();
async function readSource(path) {
  if (!sourceCache.has(path)) sourceCache.set(path, await readFile(path, "utf8"));
  return sourceCache.get(path);
}

const unresolvedRoot = [];
for (const call of rootCalls) {
  if (call.startsWith("mp.game.") || neptuneExtensions.has(call)) continue;
  const [, namespace, member] = call.split(".");
  const sources = rootSources.get(namespace);
  if (!sources) {
    unresolvedRoot.push(`${call} (namespace ${namespace})`);
    continue;
  }
  const escaped = member.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const declaration = new RegExp(`\\b${escaped}\\s*(?:\\(|[!?:=])`, "m");
  let found = false;
  for (const path of sources) {
    if (existsSync(path) && declaration.test(await readSource(path))) {
      found = true;
      break;
    }
  }
  if (!found) unresolvedRoot.push(call);
}

const localPlayerCalls = new Set(bundle.match(/mp\.players\.local\.[A-Za-z_][A-Za-z0-9_]*/g) ?? []);
const unresolvedLocalPlayer = [];
for (const call of localPlayerCalls) {
  const member = call.split(".").at(-1);
  if (dynamicLocalPlayerProperties.has(member)) continue;
  const escaped = member.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const declaration = new RegExp(`\\b${escaped}\\s*(?:\\(|[!?:=])`, "m");
  let found = false;
  for (const path of localPlayerSources) {
    if (declaration.test(await readSource(path))) {
      found = true;
      break;
    }
  }
  if (!found) unresolvedLocalPlayer.push(call);
}

console.log(`[neptune-audit] ${calls.size} unique mp.game calls; ${unresolved.length} unresolved`);
console.log(`[neptune-audit] ${rootCalls.size} unique root mp calls; ${unresolvedRoot.length} unresolved`);
console.log(`[neptune-audit] ${localPlayerCalls.size} unique local-player calls; ${unresolvedLocalPlayer.length} unresolved`);
if (unresolved.length || unresolvedRoot.length || unresolvedLocalPlayer.length) {
  for (const item of unresolved) console.error(`  - ${item}`);
  for (const item of unresolvedRoot) console.error(`  - ${item}`);
  for (const item of unresolvedLocalPlayer) console.error(`  - ${item}`);
  process.exitCode = 1;
}
