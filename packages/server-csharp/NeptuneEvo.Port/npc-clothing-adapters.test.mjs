import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { adaptClothingSource as adaptGameplaySource, npcClothingAdapterFiles } from "./clothing-source-adapters.mjs";

const root = process.env.PLMP_LEGACY_GAME_ROOT;
assert.ok(root, "Set PLMP_LEGACY_GAME_ROOT to audit actual NPC presets");
for (const relative of npcClothingAdapterFiles) {
  const source = fs.readFileSync(path.join(root, "dotnet/resources/NeptuneEvo", relative), "utf8");
  const adapted = adaptGameplaySource(source, relative);
  assert.equal((adapted.match(/LegacyNpcClothing\.Translate\(/g) ?? []).length, 1, relative);
  assert.throws(() => adaptGameplaySource(source.replace('"pedClothes"', '"changedClothes"'), relative), /source shape/);
}
console.log("PASS all four legacy NPC preset adapter sites and source-drift guards");

const sourceRoot = path.join(root, "dotnet/resources/NeptuneEvo");
for (const [relative, name, legs, undershirt] of [
  ["Core/GovNumbersRoulette/GibddRouletteSystem.cs", "GibddNpcClothesJson", 258, 219],
  ["Fractions/PrisonVolunteerFsin.cs", "NpcClothesJson", 294, 15],
]) {
  const source = fs.readFileSync(path.join(sourceRoot, relative), "utf8");
  const match = source.match(new RegExp(`const string ${name} = "(.*)";`));
  assert.ok(match, `${relative}: preset declaration changed`);
  const preset = JSON.parse(JSON.parse(`"${match[1]}"`));
  assert.deepEqual(preset[4], [legs, 0], `${relative}: raw legs baseline`);
  assert.deepEqual(preset[8], [undershirt, 0], `${relative}: raw undershirt baseline`);
}
const femaleSites = new Set(["Fractions/Ems.cs", "World/LeaderNpc/Repository.cs"]);
let clothingSites = 0;
function auditDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["bin", "obj"].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { auditDirectory(file); continue; }
    if (!entry.name.endsWith(".cs")) continue;
    const source = fs.readFileSync(file, "utf8");
    if (!/\.SetSharedData\(\s*"ped(?:Clothes|Props)"/.test(source)) continue;
    const relative = path.relative(sourceRoot, file).replaceAll(path.sep, "/");
    clothingSites++;
    assert.ok(npcClothingAdapterFiles.has(relative) || femaleSites.has(relative), `Unreviewed NPC clothing site: ${relative}`);
    if (femaleSites.has(relative)) assert.ok(source.includes('"mp_f_freemode_01"'), `${relative}: review changed NPC model`);
  }
}
auditDirectory(sourceRoot);
assert.equal(clothingSites, 6, "NPC clothing inventory changed; review every new site");
const business = fs.readFileSync(path.join(sourceRoot, "Businesses/BusinessNpcManager.cs"), "utf8");
assert.equal((business.match(/clothesJson: GasShopClothesJson/g) ?? []).length, 6);
assert.equal((business.match(/clothesJson: SupermarketClothesJson/g) ?? []).length, 4);
console.log("PASS full server NPC clothing inventory: 6 publication sites, 6 gas station and 4 supermarket configurations");
