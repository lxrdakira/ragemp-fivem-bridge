import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const resource = resolve(import.meta.dirname, "../../dist/neptuneevo-ui-dev");

test("legacy CSS root URLs are delivered by the UI resource", () => {
  const manifest = readFileSync(resolve(resource, "fxmanifest.lua"), "utf8");
  assert.match(manifest, /'interface\/src\/assets\/\*\*\/\*'/);
  assert.match(manifest, /'interface\/src\/popups\/\*\*\/\*'/);
  assert.match(manifest, /'images\/phone\/\*\*\/\*'/);

  for (const bundle of ["build", "buildru"]) {
    const css = readFileSync(resolve(resource, "interface", bundle, "bundle.css"), "utf8");
    assert.doesNotMatch(css, /url\(\/?src\/popups\//);
    const urls = [...css.matchAll(/url\((?:["'])?(\/(?:interface\/src\/(?:popups|assets)|images\/phone)\/[^'"\)]+)(?:["'])?\)/g)]
      .map((match) => match[1]);
    assert.ok(urls.length >= 55, `${bundle}: expected popup icons, avia and phone images`);
    for (const url of urls) {
      const file = resolve(resource, `.${url}`);
      assert.ok(existsSync(file), `${bundle}: missing ${url}`);
    }
  }
});

test("Vue CSS notification and bank assets resolve through published resources", () => {
  const manifest = readFileSync(resolve(resource, "fxmanifest.lua"), "utf8");
  const common = resolve(import.meta.dirname, "../../dist/neptuneevo-ui-assets-common");
  const commonManifest = readFileSync(resolve(common, "fxmanifest.lua"), "utf8");
  assert.match(commonManifest, /'src\/views\/\*\*\/\*'/);

  const assets = resolve(resource, "interface/cef_vue/assets");
  const css = readdirSync(assets)
    .filter((name) => name.endsWith(".css"))
    .map((name) => readFileSync(resolve(assets, name), "utf8"))
    .join("\n");
  assert.ok(!/url\(\/?images\/notify\//.test(css), "raw notification URLs remain");
  const notifyUrls = [...css.matchAll(/url\(https:\/\/cfx-nui-neptuneevo-ui-assets-common\/src\/views\/assets\/images\/notify\/([^'"\)]+)\)/g)];
  assert.ok(notifyUrls.length >= 12, "expected all notification icons");
  for (const [, name] of notifyUrls) {
    assert.ok(existsSync(resolve(common, "src/views/assets/images/notify", name)), name);
  }

  for (const path of [
    "interface/cef_vue/images/bank/buyCard/bg.png",
    "interface/cef_vue/images/bank/mainBank/mainBank.svg",
    "interface/cef_vue/images/menuServer/rating/bg.png",
    "interface/cef_vue/images/menuServer/battlepass/tasks/tasks.png",
  ]) {
    assert.ok(manifest.includes(`'${path}'`), `manifest omits ${path}`);
    assert.ok(existsSync(resolve(resource, path)), `missing ${path}`);
  }
});

test("JavaScript image roots use split resources and local fallbacks", () => {
  const manifest = readFileSync(resolve(resource, "fxmanifest.lua"), "utf8");
  const playerPrefix = "https://cfx-nui-neptuneevo-ui-assets-player/src/views/player/serverMenu/src/assets/pictures/";
  const commonPrefix = "https://cfx-nui-neptuneevo-ui-assets-common/src/views/assets/images/";
  const scripts = [
    "interface/build/bundle.js",
    "interface/buildru/bundle.js",
    ...readdirSync(resolve(resource, "interface/inventory_vue/assets"))
      .filter((name) => /^index-[^/]+\.js$/.test(name))
      .map((name) => `interface/inventory_vue/assets/${name}`),
    ...readdirSync(resolve(resource, "interface/cef_vue/assets"))
      .filter((name) => name.endsWith(".js"))
      .map((name) => `interface/cef_vue/assets/${name}`),
  ];
  const scriptText = scripts.map((path) => readFileSync(resolve(resource, path), "utf8")).join("\n");
  assert.ok(!/(["'`])\/images\/(?:inventory|tablet|policeTablet|property)\//.test(scriptText),
    "an unpatched image root remains in JavaScript");
  for (const prefix of [`${playerPrefix}inventory/`, `${playerPrefix}tablet/`, `${playerPrefix}policeTablet/`, `${commonPrefix}property/`]) {
    assert.ok(scriptText.includes(prefix), `missing rewrite: ${prefix}`);
  }

  for (const path of [
    "images/docs/person.png",
    "images/container/default.png",
    "images/inventory/items/monetapetra.png",
  ]) {
    assert.ok(manifest.includes(`'${path}'`), `manifest omits ${path}`);
    assert.ok(existsSync(resolve(resource, path)), `missing fallback ${path}`);
  }
});

test("weapon shop renders are available in the published player asset resource", () => {
  const player = resolve(import.meta.dirname, "../../dist/neptuneevo-ui-assets-player");
  const manifest = readFileSync(resolve(player, "fxmanifest.lua"), "utf8");
  assert.match(manifest, /'src\/views\/\*\*\/\*'/);

  const weaponRoot = resolve(player, "src/views/player/serverMenu/src/assets/pictures/weapons");
  const weaponFiles = readdirSync(weaponRoot, { recursive: true })
    .filter((entry) => entry.toLowerCase().endsWith(".png"));
  assert.ok(weaponFiles.length >= 100, "expected the complete legacy weapon render set");
  for (const path of ["pistols/Pistol.png", "melee/Knuckledusters.png", "assault/assaultrifle.png"]) {
    assert.ok(existsSync(resolve(weaponRoot, path)), `missing weapon render ${path}`);
  }
  const ammoRoot = resolve(player, "src/views/player/serverMenu/src/assets/pictures/inventory/items");
  for (const path of ["9mm.png", "7.62mm.png", "12gauge.png"]) {
    assert.ok(existsSync(resolve(ammoRoot, path)), `missing ammo icon ${path}`);
  }

  const ruBundle = readFileSync(resolve(resource, "interface/buildru/bundle.js"), "utf8");
  const playerBase = "https://cfx-nui-neptuneevo-ui-assets-player/src/views/player/serverMenu/src/assets/pictures/";
  for (const path of ["weapons/pistols/Pistol.png", "weapons/melee/Knuckledusters.png",
    "inventory/items/9mm.png", "inventory/items/7.62mm.png", "inventory/items/12gauge.png"]) {
    assert.ok(ruBundle.includes(`${playerBase}${path}`), `unpublished CEF URL for ${path}`);
  }
});

test("weapon shop category icons resolve beside the Svelte document", () => {
  const iconRoot = resolve(resource, "interface/images/ammi");
  for (const name of ["pistols.png", "sg.png", "pp.png", "rf.png", "amm.png"]) {
    assert.ok(existsSync(resolve(iconRoot, name)), `missing weapon category icon ${name}`);
  }

  for (const variant of ["build", "buildru"]) {
    const bundle = readFileSync(resolve(resource, `interface/${variant}/bundle.js`), "utf8");
    assert.ok(bundle.includes("images/ammi/"), `${variant}: category image path missing`);
    assert.ok(!bundle.includes("/images/ammi/"), `${variant}: root-relative category image path remains`);
    assert.ok(!bundle.includes("cloud/images/ammi/"), `${variant}: broken cloud fallback remains`);
  }
});
