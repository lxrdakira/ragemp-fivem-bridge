import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { patchFactionClothing, maleFactionOffsets } from "./faction-clothing-patch.mjs";
import { adaptClothingSource as adaptGameplaySource } from "./clothing-source-adapters.mjs";

const root = process.env.PLMP_LEGACY_GAME_ROOT;
assert.ok(root, "Set PLMP_LEGACY_GAME_ROOT");
const dir = path.join(root, "dotnet/resources/NeptuneEvo");
const relative = "Fractions/Models/FractionClothingSetsData.cs";
const source = fs.readFileSync(path.join(dir, relative), "utf8");
const patched = adaptGameplaySource(source, relative);
const reversedRosgvardiaSource = source.replace(
  /new ClothingSetData\(([01]), Fractions\.roska, ClothesComponent\.(\w+), (\d+), (\d+)\)/g,
  (_match, gender, component, drawable, texture) =>
    `new ClothingSetData(${gender === "0" ? "1" : "0"}, Fractions.roska, ClothesComponent.${component}, ${drawable}, ${texture})`,
);
assert.equal(patchFactionClothing(reversedRosgvardiaSource), patched);
const pattern = /new ClothingSetData\(([01]), (Fractions\.\w+), ClothesComponent\.(\w+), (\d+), (\d+)\)/g;
const before = [...source.matchAll(pattern)];
const after = [...patched.matchAll(pattern)];
assert.equal(before.length, 1090);
assert.equal(after.length, before.length);
const flipRosgvardiaGender = before[977][1] === "1";
const changed = {};
for (let i = 0; i < before.length; i++) {
  const [, rawGender, fraction, component, drawable, texture] = before[i];
  const gender = fraction === "Fractions.roska" && flipRosgvardiaGender ? (rawGender === "0" ? "1" : "0")
    : i >= 990 && i <= 1001 ? (i <= 995 ? "0" : "1") : rawGender;
  const range = maleFactionOffsets[component];
  const expected = gender === "0" && range && +drawable >= range[0] && +drawable < range[0] + range[1]
    ? +drawable + range[2] : +drawable;
  assert.deepEqual(after[i].slice(1), [gender, fraction, component, String(expected), texture]);
  if (expected !== +drawable) changed[component] = (changed[component] || 0) + 1;
}
assert.ok(changed.Tops > 0 && changed.Accessories > 0 && changed.Undershort > 0 && changed.Hat > 0);
assert.throws(() => patchFactionClothing(""), /Rosgvardia/);
assert.throws(() => patchFactionClothing(source + before[0][0]), /entries/);
const apply = adaptGameplaySource(fs.readFileSync(path.join(dir, "Fractions/FractionClothingSets.cs"), "utf8"), "Fractions/FractionClothingSets.cs");
assert.ok(apply.includes("{ 752, 0 }, { 753, 6 }, { 754, 0 }"));
assert.ok(apply.includes("{ 767, 0 }, { 768, 5 }, { 769, 0 }"));
assert.ok(apply.includes("topsDict.Values.FirstOrDefault(item => item.Variation == availableSet.Variation)"));
assert.deepEqual(after.slice(990, 996).map(row => row.slice(1)), [
  ["0", "Fractions.POLICE", "Hat", "284", "0"],
  ["0", "Fractions.POLICE", "Tops", "736", "0"],
  ["0", "Fractions.POLICE", "Legs", "291", "0"],
  ["0", "Fractions.POLICE", "Shoes", "25", "0"],
  ["0", "Fractions.POLICE", "Accessories", "369", "0"],
  ["0", "Fractions.POLICE", "Masks", "261", "0"],
]);
assert.deepEqual(after.slice(996, 1002).map(row => row.slice(1)), before.slice(996, 1002).map(row => ["1", ...row.slice(2)]));
const accessory = apply.indexOf("// Apply explicitly declared uniform accessories");
assert.ok(accessory > apply.indexOf("int ShoulderStrapId = strapTuple.Item1;"));
assert.ok(accessory < apply.indexOf("ClothesComponents.UpdateClothes(player);", accessory));
assert.ok(apply.includes("(item.Gender == 0) == gender && item.Component == ClothesComponent.Accessories"));
assert.ok(apply.includes("if (fracid == (int)Models.Fractions.roska || fracid == (int)Models.Fractions.FIB ||"));
assert.ok(apply.includes("item.Fraction == (Models.Fractions)fracid"));
// Accept both legacy reversed labels and the already-corrected source labels.
for (let i = 0; i < before.length; i++) {
  if (before[i][2] !== "Fractions.roska") continue;
  assert.equal(after[i][1], flipRosgvardiaGender ? (before[i][1] === "0" ? "1" : "0") : before[i][1], `Rosgvardia list gender ${i}`);
}
for (const [index, gender, drawable] of [
  [976,"0",703], [977,"0",705], [978,"0",707],
  [965,"0",275], [966,"0",276], [967,"0",277],
  [969,"0",267], [970,"0",268], [971,"0",269],
  [928,"1",725], [929,"1",727], [930,"1",728], [931,"1",730],
  [921,"1",284], [922,"1",285], [923,"1",286],
]) {
  assert.equal(after[index][1], gender);
  assert.equal(+after[index][4], drawable);
}
console.log("PASS wardrobe: 1090 stable indices, female/standard/textures preserved; translated entries", changed);
for (let texture = 0; texture < 6; texture++) {
  for (const [start, gender, component, drawable] of [
    [1024,"0","Tops",753], [1048,"0","Tops",752],
    [1031,"0","Legs",299], [1038,"0","Shoes",211],
    [1054,"1","Tops",767], [1060,"1","Tops",768],
    [1067,"1","Legs",313], [1073,"1","Legs",299],
    [1080,"1","Shoes",206],
  ]) assert.deepEqual(after[start + texture].slice(1), [gender,"Fractions.EMS",component,String(drawable),String(texture)]);
}
for (const [index, gender, component, drawable] of [
  [310,"0","Tops",663], [311,"0","Tops",685], [312,"0","Tops",686],
  [353,"1","Tops",701], [355,"1","Tops",716], [357,"1","Tops",717],
  [294,"0","Hat",257], [299,"0","Legs",241], [300,"0","Legs",242],
]) assert.deepEqual(after[index].slice(1,5), [gender,"Fractions.FIB",component,String(drawable)]);
assert.ok(apply.includes("return HospitalShoesIndexByTexture.TryGetValue(normalizedTexture.Value, out clothingIndex);"));
assert.ok(apply.includes("HospitalShoesIndexByTexture.TryGetValue(texture.Value, out var shoes)"));
console.log("PASS hospital 6-color male/female components and FSB catalog-confirmed service tops; selected shoe texture follows uniform");
