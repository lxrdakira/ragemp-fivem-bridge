import fs from "node:fs";
import path from "node:path";
import { adaptStagingSource, entryGuards } from "./staging-source-adapters.mjs";
import { adaptClothingSource, clothingAdapterFiles } from "./clothing-source-adapters.mjs";

const [sourceRootArg, outputRootArg] = process.argv.slice(2);
if (!sourceRootArg || !outputRootArg) throw new Error("source and output roots are required");

const sourceRoot = path.resolve(sourceRootArg);
const outputRoot = path.resolve(outputRootArg);
if (!fs.existsSync(sourceRoot)) throw new Error(`Neptune source root does not exist: ${sourceRoot}`);

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

let copied = 0;
let threadChecks = 0;
let startupCaptures = 0;
let runtimePathAdapters = 0;
let assemblyLocationAdapters = 0;
let databaseProviderAdapters = 0;
let databaseBackupAdapters = 0;
let shutdownAdapters = 0;
let redisEndpointAdapters = 0;
let redisPasswordAdapters = 0;
const stagingFiles = new Set(Object.keys(entryGuards));
const clothingFiles = new Set(clothingAdapterFiles);

function portSource(source, relative) {
  const normalized = relative.replaceAll(path.sep, "/");
  source = adaptStagingSource(source, normalized);
  stagingFiles.delete(normalized);
  source = adaptClothingSource(source, normalized);
  clothingFiles.delete(normalized);
  if (normalized === "Utils/Redis/Repository.cs") {
    source = source.replaceAll('"127.0.0.1:6379"', () => {
      redisEndpointAdapters++;
      return "NeptuneEvo.PortCompatibility.RedisConnection.Endpoint";
    });
    source = source.replace('Password = ""', () => {
      redisPasswordAdapters++;
      return "Password = NeptuneEvo.PortCompatibility.RedisConnection.Password";
    });
  }
  source = source.replace(
    'MainThreadGuard.MarkMainThread("Main.onResourceStart");',
    'MainThreadGuard.MarkMainThread("Main.onResourceStart"); NeptuneEvo.PortCompatibility.FiveMThreadGuard.Capture();',
  );
  if (source.includes("FiveMThreadGuard.Capture()")) startupCaptures++;

  source = source.replace(/Thread\.CurrentThread\.Name\s*==\s*"Main"/g, () => {
    threadChecks++;
    return "NeptuneEvo.PortCompatibility.FiveMThreadGuard.IsMainThread";
  });
  source = source.replace(/Thread\.CurrentThread\.Name\s*!=\s*"Main"/g, () => {
    threadChecks++;
    return "!NeptuneEvo.PortCompatibility.FiveMThreadGuard.IsMainThread";
  });
  source = source.replace(
    /Thread\.CurrentThread\.Name\s*=\s*"Main"\s*;/g,
    'if (Thread.CurrentThread.Name == null) Thread.CurrentThread.Name = "Main";',
  );
  source = source.replace(
    /Path\.Combine\(AppDomain\.CurrentDomain\.BaseDirectory, "\.\.", "\.\.", "client_packages", "audio_cache"\)/g,
    () => {
      runtimePathAdapters++;
      return 'Path.Combine(Directory.GetCurrentDirectory(), "audio_cache")';
    },
  );
  source = source.replace(
    /new FileInfo\(Assembly\.GetExecutingAssembly\(\)\.Location\)\.LastWriteTime/g,
    () => {
      assemblyLocationAdapters++;
      return "NeptuneEvo.PortCompatibility.RuntimeAssemblyInfo.GetCompileDate(Assembly.GetExecutingAssembly())";
    },
  );
  source = source.replace(/"MySql\.Data\.MySqlClient"/g, () => {
    databaseProviderAdapters++;
    return '"MySqlConnector"';
  });
  source = source.replace("Timers.StartOnceTask(0, BackupSql.Backup);", () => {
    databaseBackupAdapters++;
    return "NeptuneEvo.PortCompatibility.FiveMDatabaseCompatibility.SkipLegacyBackup();";
  });
  if (source.includes('Log.Write("stopServer: forcing process exit", nLog.Type.Warn);')) {
    source = source.replace(
      /Log\.Write\("stopServer: forcing process exit", nLog\.Type\.Warn\);\s*Environment\.Exit\(0\);/g,
      () => {
        shutdownAdapters++;
        return 'Log.Write("stopServer: requesting FXServer quit", nLog.Type.Warn);\n                            NeptuneEvo.PortCompatibility.FiveMShutdown.RequestQuit();';
      },
    );
  }
  return source;
}

function copyDirectory(relative = "") {
  const current = path.join(sourceRoot, relative);
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    if (entry.name === "bin" || entry.name === "obj") continue;
    const nextRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(nextRelative);
      continue;
    }
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".cs") continue;
    const destination = path.join(outputRoot, nextRelative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, portSource(fs.readFileSync(path.join(sourceRoot, nextRelative), "utf8"), nextRelative), "utf8");
    copied++;
  }
}

copyDirectory();
if (stagingFiles.size) throw new Error("Missing staging adapter inputs: " + [...stagingFiles].join(", "));
if (clothingFiles.size) throw new Error("Missing clothing adapter inputs: " + [...clothingFiles].join(", "));
if (redisEndpointAdapters !== 3 || redisPasswordAdapters !== 1) throw new Error("unexpected Neptune Redis connection source shape");
if (startupCaptures !== 1) throw new Error(`expected one Neptune main-thread capture, found ${startupCaptures}`);
if (threadChecks === 0) throw new Error("no legacy Neptune main-thread checks were adapted");
if (runtimePathAdapters !== 2) throw new Error(`expected two Neptune audio-cache path adapters, found ${runtimePathAdapters}`);
if (assemblyLocationAdapters !== 1) throw new Error(`expected one Neptune assembly-location adapter, found ${assemblyLocationAdapters}`);
if (databaseProviderAdapters !== 3) throw new Error(`expected three Neptune database-provider adapters, found ${databaseProviderAdapters}`);
if (databaseBackupAdapters !== 1) throw new Error(`expected one Neptune database-backup adapter, found ${databaseBackupAdapters}`);
if (shutdownAdapters !== 1) throw new Error(`expected one Neptune shutdown adapter, found ${shutdownAdapters}`);
process.stdout.write(`[neptune-port] generated ${copied} C# sources; adapted ${threadChecks} main-thread checks, ${runtimePathAdapters} runtime paths, ${assemblyLocationAdapters} assembly path, ${databaseProviderAdapters} database providers and ${databaseBackupAdapters} backup hook\n`);
