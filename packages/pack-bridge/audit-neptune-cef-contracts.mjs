#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const bridgeRoot = resolve(import.meta.dirname, "../..");
const projectRoot = resolve(bridgeRoot, "..");
const cefBundlePath = resolve(projectRoot, "client_packages/interface/build/bundle.js");
const clientBundlePath = resolve(projectRoot, "client_packages/main.js");
const clientRpcPath = resolve(projectRoot, "client_packages/rage-rpc.min.js");
const clientCompatPath = resolve(bridgeRoot, "packages/pack-bridge/neptune-client-compat.js");

for (const required of [cefBundlePath, clientBundlePath, clientRpcPath, clientCompatPath]) {
  if (!existsSync(required)) throw new Error(`required Neptune contract input is missing: ${required}`);
}

const stripComments = (source) => source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
const cefBundle = stripComments(readFileSync(cefBundlePath, "utf8"));
const clientBundle = readFileSync(clientBundlePath, "utf8");
const clientRpc = readFileSync(clientRpcPath, "utf8");
const clientCompat = readFileSync(clientCompatPath, "utf8");

function collect(source, expression) {
  return new Set([...source.matchAll(expression)].map((match) => match[1]));
}

function collectDirect(source, expression) {
  return new Set([...source.matchAll(expression)]
    .filter((match) => !/^\s*\+/.test(source.slice(match.index + match[0].length)))
    .map((match) => match[1])
    .filter((name) => !name.includes("${")));
}

const cefClientEvents = new Set([
  ...collectDirect(cefBundle, /\bexecuteClient(?:WithCallback)?\(\s*["']([^"']+)["']/g),
  ...collectDirect(cefBundle, /\b(?:window\.)?mp\.trigger\(\s*["']([^"']+)["']/g),
]);
const clientEvents = new Set([
  ...collect(clientBundle, /\b(?:gm|mp)\.events\.add\(\s*["']([^"']+)["']/g),
  ...collect(clientCompat, /["']?([A-Za-z0-9_.:-]+)["']?\s*:\s*(?:async\s*)?\(/g),
]);

// rage-rpc is a separate client_script loaded before main.js. Its minified
// browser registration handlers use variable names, not string literals in
// gm.events.add(...), so the generic collector cannot see them.
for (const name of ["__rpc:browserRegister", "__rpc:browserUnregister"]) {
  const binding = new RegExp(`\\b([A-Za-z_$][\\w$]*)=["']${name}["']`).exec(clientRpc)?.[1];
  if (binding && new RegExp(`\\b(?:gm|mp)\\.events\\.add\\(\\s*${binding}\\s*,`).test(clientRpc)) {
    clientEvents.add(name);
  }
}

// These five controls are visible in the current CEF bundle but have no
// implementation in either the original RAGE client or server. Keep them as a
// strict upstream baseline: new gaps fail, and implemented/stale entries fail.
const upstreamMissingCefEvents = new Set([
  "Faction-EditEquipment",
  "Faction-GetRankEquip",
  "FactionState-GetGpsList",
  "FactionState-SetGpsTarget",
  "FactionState-TurnOffGps",
]);
const missing = [...cefClientEvents]
  .filter((name) => !clientEvents.has(name) && !upstreamMissingCefEvents.has(name))
  .sort();
const staleBaseline = [...upstreamMissingCefEvents]
  .filter((name) => !cefClientEvents.has(name) || clientEvents.has(name))
  .sort();

console.log(`[neptune-cef-contracts] ${cefClientEvents.size} CEF -> client literal events`);
console.log(`[neptune-cef-contracts] ${clientEvents.size} client literal event handlers`);
console.log(`[neptune-cef-contracts] ${missing.length} unmatched CEF -> client events`);
for (const name of missing) console.log(`  unmatched: ${name}`);
for (const name of staleBaseline) console.log(`  stale upstream baseline: ${name}`);

if (missing.length || staleBaseline.length) process.exitCode = 1;
