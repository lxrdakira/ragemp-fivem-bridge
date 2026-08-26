import fs from "node:fs";
import path from "node:path";

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

function portSource(source) {
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
    fs.writeFileSync(destination, portSource(fs.readFileSync(path.join(sourceRoot, nextRelative), "utf8")), "utf8");
    copied++;
  }
}

copyDirectory();
if (startupCaptures !== 1) throw new Error(`expected one Neptune main-thread capture, found ${startupCaptures}`);
if (threadChecks === 0) throw new Error("no legacy Neptune main-thread checks were adapted");
process.stdout.write(`[neptune-port] generated ${copied} C# sources; adapted ${threadChecks} main-thread checks\n`);
