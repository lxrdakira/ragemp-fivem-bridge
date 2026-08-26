#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const bridgeRoot = resolve(here, "../..");
const projectRoot = resolve(bridgeRoot, "..");
const clientBundlePath = resolve(projectRoot, "client_packages/main.js");
const clientSourceRoot = resolve(projectRoot, "src_client");
const serverSourceRoot = resolve(projectRoot, "dotnet/resources/NeptuneEvo");
const portSourceRoot = resolve(bridgeRoot, "packages/server-csharp/NeptuneEvo.Port");
const hostSourcePath = resolve(bridgeRoot, "packages/server-csharp/RageMP.FiveM.Bridge.Host/FiveMBridgeScript.cs");

// These calls are present in the shipped RAGE:MP client but have no handler in
// the deployed RAGE:MP server assembly either. They are obsolete UI routes or
// features deliberately removed upstream, so FiveM parity must not resurrect
// them as empty handlers. Any new unmatched event still fails this audit.
const upstreamDeadRemoteEvents = new Set([
  "atmOpenBiz",
  "metro.server.buyTicket", "metro.server.exit",
  "newchar",
  "server.admin.quickAction",
  "server.businessmanage.cancelOrder", "server.businessmanage.changePrice",
  "server.businessmanage.fillStocks", "server.businessmanage.gethistory",
  "server.businessmanage.makeOrder", "server.businessmanage.sellBiz",
  "server.donate.roulette.load",
  "server.help.waypoint",
  "server.policecomputer.take",
  "server.sapper.bet", "server.sapper.end",
  "server.table.accessadd", "server.table.accessdelete", "server.table.call",
  "server.table.createrank", "server.table.defaultrank", "server.table.defaultvrank",
  "server.table.dellorg", "server.table.dellrank", "server.table.dfracad",
  "server.table.editrank", "server.table.evacuation", "server.table.event",
  "server.table.fracad", "server.table.gethistory", "server.table.gps",
  "server.table.invite", "server.table.irank", "server.table.leave",
  "server.table.rank", "server.table.reprimand", "server.table.sellcar",
  "server.table.tuning", "server.table.ufracad", "server.table.uninvite",
  "server.table.upgrade", "server.table.vrank",
  "Snake", "wshop", "wshopammo",
  // Dynamic routes retained by old client modules but absent from active CEF.
  "server.frac.main.buyUpgrate", "server.frac.main.createRank",
  "server.frac.main.getUpgrate", "server.frac.main.removeRank",
  "server.frac.main.updateRanksId",
]);

const requiredFiveMAdapters = new Set([
  "add_voice_listeners", "remove_voice_listeners",
  "FactionFamily-UnsetHouse", "server.LeaveFractionOrg",
  "server.notify", "server.phone.updStatus", "server.vehicle.rentend",
]);

function collectFiles(root, extension) {
  const result = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === "bin" || entry.name === "obj" || entry.name === "node_modules") continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && extname(entry.name).toLowerCase() === extension) result.push(path);
    }
  };
  visit(root);
  return result;
}

for (const required of [clientBundlePath, clientSourceRoot, serverSourceRoot, portSourceRoot, hostSourcePath]) {
  if (!existsSync(required)) throw new Error(`required Neptune contract input is missing: ${required}`);
}

const csharpFiles = [...collectFiles(serverSourceRoot, ".cs"), ...collectFiles(portSourceRoot, ".cs")];
const csharpSources = csharpFiles.map((path) => readFileSync(path, "utf8"));
const constantValues = new Map();
for (const source of csharpSources) {
  for (const match of source.matchAll(/\bconst\s+string\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"([^"]+)"\s*;/g)) {
    const values = constantValues.get(match[1]) ?? new Set();
    values.add(match[2]);
    constantValues.set(match[1], values);
  }
}

const serverRemoteEvents = new Set();
const unresolvedAttributes = [];
for (const source of csharpSources) {
  for (const match of source.matchAll(/\[RemoteEvent\s*\(\s*([^\)]+)\)\s*\]/g)) {
    const firstArgument = match[1].split(",", 1)[0].trim();
    const literal = /^"([^"]+)"$/.exec(firstArgument);
    if (literal) {
      serverRemoteEvents.add(literal[1]);
      continue;
    }
    const identifier = /([A-Za-z_][A-Za-z0-9_]*)$/.exec(firstArgument)?.[1];
    const values = identifier ? constantValues.get(identifier) : undefined;
    if (!values?.size) unresolvedAttributes.push(firstArgument);
    else for (const value of values) serverRemoteEvents.add(value);
  }
}

const clientRemoteEvents = new Set();
const bundle = readFileSync(clientBundlePath, "utf8");
for (const match of bundle.matchAll(/\.callRemote(?:Unreliable)?\(\s*["']([^"']+)["']/g)) {
  if (!match[1].endsWith(".")) clientRemoteEvents.add(match[1]);
}

const resolvedDynamicRemoteEvents = new Set();
for (const path of collectFiles(clientSourceRoot, ".js")) {
  const source = readFileSync(path, "utf8");
  const prefixes = new Map();
  // Handles both `const serverName = ...` and grouped declarations such as
  // `const clientName = ..., serverName = ...` used throughout Neptune.
  for (const match of source.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*=\s*["']([^"']+)["']/g))
    prefixes.set(match[1], match[2]);
  for (const match of source.matchAll(/\.callRemote(?:Unreliable)?\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\+\s*["']([^"']+)["']/g)) {
    const prefix = prefixes.get(match[1]);
    if (!prefix) continue;
    const name = prefix + match[2];
    clientRemoteEvents.add(name);
    resolvedDynamicRemoteEvents.add(name);
  }
}

const missingRemoteEvents = [...clientRemoteEvents]
  .filter((name) => !serverRemoteEvents.has(name) && !upstreamDeadRemoteEvents.has(name))
  .sort();
const staleAllowlistEntries = [...upstreamDeadRemoteEvents]
  .filter((name) => !clientRemoteEvents.has(name) || serverRemoteEvents.has(name))
  .sort();
const missingAdapters = [...requiredFiveMAdapters].filter((name) => !serverRemoteEvents.has(name)).sort();

const serverEvents = new Set();
for (const source of csharpSources) {
  for (const match of source.matchAll(/\[ServerEvent\s*\(\s*Event\.([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*\]/g))
    serverEvents.add(match[1]);
}
const hostSource = readFileSync(hostSourcePath, "utf8");
const emittedServerEvents = new Set();
for (const match of hostSource.matchAll(/DispatchServerAsync\(Event\.([A-Za-z_][A-Za-z0-9_]*)/g))
  emittedServerEvents.add(match[1]);
const missingServerEvents = [...serverEvents].filter((name) => !emittedServerEvents.has(name)).sort();

console.log(`[neptune-contracts] ${clientRemoteEvents.size} client remote events (${resolvedDynamicRemoteEvents.size} dynamic names)`);
console.log(`[neptune-contracts] ${serverRemoteEvents.size} resolved server remote events; ${unresolvedAttributes.length} unresolved attributes`);
console.log(`[neptune-contracts] ${missingRemoteEvents.length} unexpected missing remote events; ${staleAllowlistEntries.length} stale baseline entries`);
console.log(`[neptune-contracts] ${serverEvents.size} server lifecycle events; ${missingServerEvents.length} missing host emitters`);

for (const name of missingRemoteEvents) console.error(`  missing remote: ${name}`);
for (const name of missingAdapters) console.error(`  missing FiveM adapter: ${name}`);
for (const name of missingServerEvents) console.error(`  missing lifecycle emitter: Event.${name}`);
for (const name of staleAllowlistEntries) console.error(`  stale upstream-dead baseline entry: ${name}`);
for (const attribute of unresolvedAttributes) console.error(`  unresolved RemoteEvent attribute: ${attribute}`);

if (missingRemoteEvents.length || missingAdapters.length || missingServerEvents.length || staleAllowlistEntries.length || unresolvedAttributes.length)
  process.exitCode = 1;
