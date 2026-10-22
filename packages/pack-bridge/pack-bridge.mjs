#!/usr/bin/env node
import { mkdir, writeFile, rm, cp, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGES_ROOT = resolve(__dirname, "..");
const PROJECT_ROOT = resolve(PACKAGES_ROOT, "../..");

function bridgeDist(pkg) {
  const monorepo = resolve(PACKAGES_ROOT, pkg, "dist", "index.js");
  if (existsSync(monorepo)) return monorepo;
  const nm = resolve(
    PACKAGES_ROOT, "..", "node_modules",
    "@ragemp-fivem-bridge", pkg, "dist", "index.js"
  );
  if (existsSync(nm)) return nm;
  throw new Error(
    `Bridge package "@ragemp-fivem-bridge/${pkg}" not built.\n` +
    `Run 'pnpm run build' in the monorepo first.`
  );
}

export function fxManifest({ withCsharp, withNeptune }) {
  const serverScripts = ["    'server.js'"];
  if (withCsharp) serverScripts.push("    'csharp/RageMP.FiveM.Bridge.Host.net.dll'");
  if (withNeptune) serverScripts.push("    'csharp/NeptuneEvo.Port.net.dll'");

  // Server assemblies are loaded from server_scripts and must not be sent
  // to players via the client files manifest.
  const files = ["    'ui/_bridge.js'"];

  return `fx_version 'cerulean'
game 'gta5'

name 'ragemp-fivem-bridge'
description 'Standalone RAGE:MP -> FiveM bridge. Exposes mp.* to other resources via @-imports.'
version '1.0.1'

ragemp_bridge 'library'

-- NeptuneEvo: allow a correct login/password to claim an unbound legacy
-- account for the player's stable FiveM license. Override in server.cfg with:
-- set ragemp_fivem_identity_claim false

-- FiveM Enhanced currently requires its legacy-Mumble compatibility switch
-- for Neptune's client-managed proximity/radio/phone voice bridge:
-- setr sv_mumble true

-- Optional plugins (disabled by default). Uncomment a line to enable:
-- bridge_world_vehicles 'yes' -- spawn server vehicles anywhere on the map (CreateVehicleServerSetter + retry queue)

server_scripts {
${serverScripts.join(',\n')}
}
client_script 'client.js'

files {
${files.join(',\n')}
}
`;
}

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--out" || arg === "-o") flags.out = argv[++i];
    else if (arg.startsWith("--out=")) flags.out = arg.slice(6);
    else if (arg === "--with-csharp") flags.withCsharp = true;
    else if (arg === "--with-neptune") flags.withNeptune = true;
  }
  return flags;
}

export async function packBridge(flags = {}) {
  const outDir = resolve(process.cwd(), flags.out ?? "dist/ragemp-fivem-bridge");

  console.log(`\n  Packaging standalone bridge resource...`);
  console.log(`  Output: ${relative(process.cwd(), outDir) || outDir}\n`);

  if (existsSync(outDir)) await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await mkdir(join(outDir, "ui"), { recursive: true });

  await cp(bridgeDist("server"), join(outDir, "server.js"));
  console.log("  + server.js");

  await cp(bridgeDist("client"), join(outDir, "client.js"));
  console.log("  + client.js");

  await cp(bridgeDist("cef"), join(outDir, "ui", "_bridge.js"));
  console.log("  + ui/_bridge.js");

  if (flags.withNeptune && !flags.withCsharp) {
    throw new Error("--with-neptune requires --with-csharp");
  }

  if (flags.withCsharp) {
    const csharpDir = join(outDir, "csharp");
    const hostDir = resolve(PACKAGES_ROOT, "server-csharp", "RageMP.FiveM.Bridge.Host", "bin", "Release", "netstandard2.0");
    await mkdir(csharpDir, { recursive: true });
    for (const file of ["RageMP.FiveM.Bridge.Core.dll", "RageMP.FiveM.Bridge.Host.net.dll", "Newtonsoft.Json.dll"]) {
      const source = join(hostDir, file);
      if (!existsSync(source)) throw new Error(`C# bridge output not found: ${source}`);
      await cp(source, join(csharpDir, file));
      console.log(`  + csharp/${file}`);
    }
  }

  if (flags.withNeptune) {
    const sourceDir = resolve(PACKAGES_ROOT, "server-csharp", "NeptuneEvo.Port", "bin", "Release", "netstandard2.0");
    const assemblies = (await readdir(sourceDir)).filter((file) => file.endsWith(".dll"));
    if (!assemblies.includes("NeptuneEvo.Port.net.dll")) {
      throw new Error(`NeptuneEvo port output not found: ${sourceDir}`);
    }
    for (const file of assemblies) {
      await cp(join(sourceDir, file), join(outDir, "csharp", file));
      console.log(`  + csharp/${file}`);
    }

    const runtimeDir = join(outDir, "runtime");
    await mkdir(runtimeDir, { recursive: true });
    for (const name of ["settings", "marketPlace", "json"]) {
      const source = join(PROJECT_ROOT, name);
      if (!existsSync(source)) continue;
      await cp(source, join(runtimeDir, name), { recursive: true });
      console.log(`  + runtime/${name}/**`);
    }
  }

  await writeFile(join(outDir, "fxmanifest.lua"), fxManifest(flags), "utf8");
  console.log("  + fxmanifest.lua");

  console.log(`\n  Done. Drop '${relative(process.cwd(), outDir) || outDir}/' into your FiveM server's resources folder.`);
  console.log(`  Add 'add_ace resource.ragemp-fivem-bridge command.quit allow' to server.cfg for the scheduled restart path.`);
  console.log(`  Add 'ensure ragemp-fivem-bridge' to server.cfg before your gamemode.\n`);

  return outDir;
}

const invokedDirectly = resolve(process.argv[1] ?? "") === resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) {
  packBridge(parseFlags(process.argv.slice(2))).catch((err) => {
    console.error(`\n  pack-bridge failed: ${err.message}\n`);
    process.exit(1);
  });
}
