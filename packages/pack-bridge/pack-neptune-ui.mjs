#!/usr/bin/env node
import { cp, mkdir, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { patchNpcClothing } from "./npc-clothing-patch.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const bridgeRoot = resolve(here, "../..");
const sourceRoot = resolve(bridgeRoot, "..");
const clientPackages = join(sourceRoot, "client_packages");
const legacyCefSource = join(sourceRoot, "src_cef");
const inventoryVuePublic = join(sourceRoot, "src_cef_new", "public");
const portable = process.argv.includes("--portable");
const resourceName = portable ? "neptuneevo-ui" : "neptuneevo-ui-dev";
const outDir = resolve(bridgeRoot, `dist/${resourceName}`);
const commonAssetsResourceName = "neptuneevo-ui-assets-common";
const playerAssetsResourceName = "neptuneevo-ui-assets-player";
const commonAssetsOutDir = resolve(bridgeRoot, `dist/${commonAssetsResourceName}`);
const playerAssetsOutDir = resolve(bridgeRoot, `dist/${playerAssetsResourceName}`);
const bridgeCef = resolve(bridgeRoot, "packages/cef/dist/index.js");

for (const required of [
  join(clientPackages, "main.js"),
  join(clientPackages, "rage-rpc.min.js"),
  join(clientPackages, "interface"),
  bridgeCef,
  legacyCefSource,
  inventoryVuePublic,
]) {
  if (!existsSync(required)) throw new Error(`Required build output is missing: ${required}`);
}

if (existsSync(outDir)) await rm(outDir, { recursive: true, force: true });
if (existsSync(commonAssetsOutDir)) await rm(commonAssetsOutDir, { recursive: true, force: true });
if (existsSync(playerAssetsOutDir)) await rm(playerAssetsOutDir, { recursive: true, force: true });
await mkdir(join(outDir, "ui"), { recursive: true });
await mkdir(join(outDir, "client"), { recursive: true });

await writeFile(join(outDir, "main.js"), patchNpcClothing(await readFile(join(clientPackages, "main.js"), "utf8")), "utf8");
await cp(join(clientPackages, "rage-rpc.min.js"), join(outDir, "rage-rpc.min.js"));
await cp(bridgeCef, join(outDir, "ui/_bridge.js"));
await cp(join(here, "neptune-ui-host.html"), join(outDir, "ui/host.html"));
await cp(join(here, "neptune-ui-dev.js"), join(outDir, "client/dev-bootstrap.js"));
await cp(join(here, "neptune-client-compat.js"), join(outDir, "client/neptune-compat.js"));

const patchedInterfaceFiles = new Set([
  "local.html",
  "cloud.html",
  "index.html",
  "cef_vue/index.html",
  "inventory_vue/index.html",
  "build/bundle.css",
  "build/bundle.js",
  "buildru/bundle.css",
  "buildru/bundle.js",
]);

function shouldPatchInterfaceFile(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  return patchedInterfaceFiles.has(normalized) ||
    /^inventory_vue\/assets\/index-[^/]+\.js$/i.test(normalized) ||
    /^cef_vue\/assets\/[^/]+\.(?:css|js)$/i.test(normalized);
}

function directoryMayContainPatchedFile(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  return [...patchedInterfaceFiles].some((path) => path.startsWith(`${normalized}/`)) ||
    "inventory_vue/assets".startsWith(normalized) ||
    normalized.startsWith("inventory_vue/assets") ||
    "cef_vue/assets".startsWith(normalized);
}

function patchInterfaceSource(source, relativePath) {
  let patched = source;
  const commonAssetsBase = `https://cfx-nui-${commonAssetsResourceName}/src/views/`;
  const playerAssetsBase = `https://cfx-nui-${playerAssetsResourceName}/src/views/player/`;
  const notifyAssetsBase = `${commonAssetsBase}assets/images/notify/`;
  const playerImagesBase = `${playerAssetsBase}serverMenu/src/assets/pictures/`;
  const commonImagesBase = `${commonAssetsBase}assets/images/`;

  // Keep large legacy image trees in separate resources. A single 1.9 GiB
  // resource.rpf cannot be materialized reliably by the FiveM cache. Only
  // emitted public URLs are rewritten; webpack module identifiers begin with
  // "./src/views" and therefore remain untouched.
  patched = patched
    .replace(/__webpack_require__\.p \+ (["'])src\/views\/player\//g, `$1${playerAssetsBase}`)
    .replace(/(["'])\/src\/views\/player\//g, `$1${playerAssetsBase}`)
    .replace(/url\(\/src\/views\/player\//g, `url(${playerAssetsBase}`)
    .replace(/__webpack_require__\.p \+ (["'])src\/views\//g, `$1${commonAssetsBase}`)
    .replace(/(["'])\/src\/views\//g, `$1${commonAssetsBase}`)
    .replace(/url\(\/src\/views\//g, `url(${commonAssetsBase}`)
    // Webpack emits the smaller shared asset tree as root-relative /src/assets.
    // In the FiveM resource it lives below interface/, next to the CEF bundle.
    .replace(/(["'])\/src\/assets\//g, `$1/interface/src/assets/`)
    .replace(/url\(\/src\/assets\//g, `url(/interface/src/assets/`)
    // Popup icons are emitted as root-relative URLs by the legacy CSS bundle.
    .replace(/(["'])\/src\/popups\//g, `$1/interface/src/popups/`)
    .replace(/url\(\/src\/popups\//g, `url(/interface/src/popups/`)
    // Vue notifications reuse the already-published shared icon directory.
    .replace(/(["'])\/images\/notify\//g, `$1${notifyAssetsBase}`)
    .replace(/url\(\/images\/notify\//g, `url(${notifyAssetsBase}`);
  const imageBase = (category) => category === "property"
    ? `${commonImagesBase}${category}/`
    : `${playerImagesBase}${category}/`;
  patched = patched
    .replace(/(["'`])\/images\/(inventory|tablet|policeTablet|property)\//g,
      (_match, quote, category) => `${quote}${imageBase(category)}`)
    .replace(/url\(\/images\/(inventory|tablet|policeTablet|property)\//g,
      (_match, category) => `url(${imageBase(category)}`);
  if (relativePath.toLowerCase().endsWith(".html")) {
    patched = patched.replace(
      /((?:src|href)\s*=\s*["'])package:\/\/([^"']+)/gi,
      (_match, prefix, packagePath) => `${prefix}/${packagePath}`,
    );
  }
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

function patchBrowserAssetSource(source, relativePath) {
  let patched = patchInterfaceSource(source, relativePath);
  const normalizedPath = relativePath.replace(/\\/g, "/").toLowerCase();
  if (normalizedPath === "sounds/index.html") {
    const from = "      if (!url) return '';";
    const to = "      if (!url) return '';\n      if (url.startsWith('local://')) url = 'package://' + url.slice('local://'.length);";
    const returnFrom = "      return url;\n    }\n\n    function clampVolume";
    const returnTo = "      return url.startsWith('package://') ? window.__ragempResolvePackageUrl(url) : url;\n    }\n\n    function clampVolume";
    if (!patched.includes(from) || !patched.includes(returnFrom))
      throw new Error("Expected legacy sounds URL contract is missing");
    return patched.replace(from, to).replace(returnFrom, returnTo);
  }
  if (normalizedPath !== "soundapi/index.js") return patched;

  const replacements = [
    [
      '__localBase="package://soundapi/../"',
      '__localBase=window.__ragempResolvePackageUrl("package://soundapi/../")',
    ],
    [
      'if(n.startsWith("local://"))return"package://"+n.slice(8);',
      'if(n.startsWith("local://"))return window.__ragempResolvePackageUrl("package://"+n.slice(8));',
    ],
    [
      'if(n.startsWith("package://")||n.startsWith("http://")||n.startsWith("https://"))return n;',
      'if(n.startsWith("package://")||n.startsWith("http://")||n.startsWith("https://"))return n.startsWith("package://")?window.__ragempResolvePackageUrl(n):n;',
    ],
  ];
  for (const [from, to] of replacements) {
    if (!patched.includes(from)) throw new Error(`Expected sound API URL contract is missing: ${from}`);
    patched = patched.replace(from, to);
  }
  return patched;
}

async function createInterfaceOverlay(sourceRoot, targetRoot, relativeDir = "") {
  await mkdir(targetRoot, { recursive: true });
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  for (const entry of entries) {
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
    const source = join(sourceRoot, entry.name);
    const target = join(targetRoot, entry.name);
    if (entry.isDirectory()) {
      const containsPatch = directoryMayContainPatchedFile(relativePath);
      if (containsPatch) await createInterfaceOverlay(source, target, relativePath);
      else if (portable) await cp(source, target, { recursive: true });
      else await symlink(source, target, process.platform === "win32" ? "junction" : "dir");
      continue;
    }

    if (shouldPatchInterfaceFile(relativePath)) {
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
    // DUI pages do not have the manager iframe available to inject the bridge
    // at runtime, so browser HTML entry points receive the bridge tag in the
    // generated resource. Non-HTML files are copied byte-for-byte.
    const copyBrowserAssets = async (from, to, relative = name) => {
      await mkdir(to, { recursive: true });
      for (const entry of await readdir(from, { withFileTypes: true })) {
        const entrySource = join(from, entry.name);
        const entryTarget = join(to, entry.name);
        const entryRelative = `${relative}/${entry.name}`;
        if (entry.isDirectory()) await copyBrowserAssets(entrySource, entryTarget, entryRelative);
        else if (entry.isFile() && [".html", ".js"].some((extension) => entry.name.toLowerCase().endsWith(extension)))
          await writeFile(entryTarget, patchBrowserAssetSource(await readFile(entrySource, "utf8"), entryRelative), "utf8");
        else if (entry.isFile()) await cp(entrySource, entryTarget);
      }
    };
    await copyBrowserAssets(source, join(outDir, name));
  }
}

// The legacy Svelte/Vue bundles contain root-relative /src/views URLs. Stage
// the complete tree in two resources so every original image is available,
// while each resulting packfile remains comfortably below the cache limit.
const legacyViewsRoot = join(legacyCefSource, "src/views");
for (const entry of await readdir(legacyViewsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const targetRoot = entry.name === "player" ? playerAssetsOutDir : commonAssetsOutDir;
  const source = join(legacyViewsRoot, entry.name);
  const target = join(targetRoot, "src/views", entry.name);
  await mkdir(dirname(target), { recursive: true });
  if (portable) await cp(source, target, { recursive: true });
  else await symlink(source, target, process.platform === "win32" ? "junction" : "dir");
}

const legacyPublicDirs = [
  [join(legacyCefSource, "public/images/waitCircle"), "images/waitCircle"],
  [join(legacyCefSource, "public/images/clothingshop"), "images/clothingshop"],
  [join(legacyCefSource, "public/images/phone"), "images/phone"],
  [join(inventoryVuePublic, "images/menuServer"), "images/menuServer"],
];

for (const [source, relativeTarget] of legacyPublicDirs) {
  if (!existsSync(source)) throw new Error(`Required legacy CEF asset directory is missing: ${source}`);
  const target = join(outDir, relativeTarget);
  await mkdir(dirname(target), { recursive: true });
  if (portable) await cp(source, target, { recursive: true });
  else await symlink(source, target, process.platform === "win32" ? "junction" : "dir");
}

// These existing local images are fallbacks used by the client/CEF when a
// character photo or container preview is unavailable. Keep the aliases small
// instead of copying the full legacy image trees into this resource.
const fallbackImages = [
  [join(legacyCefSource, "src/views/player/menu/img/person.png"), "images/docs/person.png"],
  [join(legacyCefSource, "src/views/player/serverMenu/src/assets/pictures/container/zag.png"), "images/container/default.png"],
  [join(legacyCefSource, "src/views/player/serverMenu/src/assets/pictures/inventory/items/monetapetra.png"), "images/inventory/items/monetapetra.png"],
];
for (const [source, relativeTarget] of fallbackImages) {
  if (!existsSync(source)) throw new Error(`Required fallback image is missing: ${source}`);
  const target = join(outDir, relativeTarget);
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target);
}

const manifest = `fx_version 'cerulean'
game 'gta5'

name '${resourceName}'
description 'NeptuneEvo original client and CEF resource for FiveM'
version '0.1.0'

dependencies {
    'ragemp-fivem-bridge',
    '${commonAssetsResourceName}',
    '${playerAssetsResourceName}'
}

client_scripts {
    '@ragemp-fivem-bridge/client.js',
    'rage-rpc.min.js',
    'client/neptune-compat.js',
    'main.js'${portable ? "" : ",\n    'client/dev-bootstrap.js'"}
}

ui_page 'ui/host.html'

files {
    'ui/host.html',
    'ui/_bridge.js',
    'interface/*.html',
    'interface/*.png',
    'interface/*.svg',
    'interface/build/**/*',
    -- The legacy Svelte bundle emits fonts and a small set of CSS icons under
    -- interface/src. Keep the large views tree unpublished. Linux resource
    -- paths are case-sensitive.
    'interface/src/**/*.eot',
    'interface/src/**/*.ttf',
    'interface/src/**/*.TTF',
    'interface/src/**/*.woff',
    'interface/src/**/*.woff2',
    'interface/src/assets/**/*',
    'interface/src/popups/**/*',
    'interface/buildru/bundle.css',
    'interface/buildru/bundle.js',
    'interface/cef_vue/index.html',
    'interface/cef_vue/assets/**/*',
    'interface/cef_vue/data/**/*',
    'interface/cef_vue/sounds/**/*',
    'interface/cef_vue/images/bank/buyCard/bg.png',
    'interface/cef_vue/images/bank/mainBank/mainBank.svg',
    'interface/cef_vue/images/menuServer/rating/bg.png',
    'interface/cef_vue/images/menuServer/battlepass/tasks/tasks.png',
    'interface/inventory_vue/index.html',
    'interface/inventory_vue/assets/**/*',
    'interface/inventory_vue/data/**/*',
    'interface/inventory_vue/sounds/**/*',
    'interface/inventory_vue/images/authorization/**/*',
    'interface/inventory_vue/images/bank/**/*',
    'interface/inventory_vue/images/fishingShop/logo.png',
    'interface/inventory_vue/images/fishingShop/rods.svg',
    'interface/inventory_vue/images/fishingShop/reels.svg',
    'interface/inventory_vue/images/fishingShop/lines.svg',
    'interface/inventory_vue/images/fishingShop/hooks.svg',
    'interface/inventory_vue/images/fishingShop/baits.svg',
    'interface/inventory_vue/images/fishingShop/lures.svg',
    'interface/inventory_vue/images/fishingShop/buyer.svg',
    'interface/inventory_vue/images/menuServer/**/*',
    'interface/inventory_vue/images/phone/**/*',
    'interface/inventory_vue/images/transport_all/**/*',
    'images/menuServer/**/*',
    'images/waitCircle/**/*',
    'images/clothingshop/**/*',
    'images/phone/**/*',
    'images/docs/person.png',
    'images/container/default.png',
    'images/inventory/items/monetapetra.png',
    'cef/**/*',
    'soundapi/**/*',
    'sounds/**/*'
}
`;

await writeFile(join(outDir, "fxmanifest.lua"), manifest, "utf8");
const assetsManifest = (name, description) => `fx_version 'cerulean'
game 'gta5'

name '${name}'
description '${description}'
version '0.1.0'

files {
    'src/views/**/*'
}
`;
await writeFile(
  join(commonAssetsOutDir, "fxmanifest.lua"),
  assetsManifest(commonAssetsResourceName, "NeptuneEvo shared legacy CEF assets"),
  "utf8",
);
await writeFile(
  join(playerAssetsOutDir, "fxmanifest.lua"),
  assetsManifest(playerAssetsResourceName, "NeptuneEvo player legacy CEF assets"),
  "utf8",
);
console.log(`[neptune-ui] ${portable ? "Portable" : "Development"} resource ready: ${outDir}`);
console.log(`[neptune-ui] Asset resources ready: ${commonAssetsOutDir}, ${playerAssetsOutDir}`);
console.log(`[neptune-ui] Start ragemp-fivem-bridge first, then ${resourceName}.${portable ? "" : " Use /neptuneui for the standalone UI smoke view."}`);
