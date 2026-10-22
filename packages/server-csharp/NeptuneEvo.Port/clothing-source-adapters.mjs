// Restores the clothing-only portions of the September integration branch.
// Do not import the whole historical gameplay adapter: its other fixes may
// already be implemented differently in the current gameplay source tree.
import { patchFactionClothing } from "./faction-clothing-patch.mjs";

export const npcClothingAdapterFiles = new Set([
  "Businesses/BusinessNpcManager.cs",
  "Core/DrivingSchool.cs",
  "Fractions/PrisonVolunteerFsin.cs",
  "Core/GovNumbersRoulette/GibddRouletteSystem.cs",
]);
export const clothingAdapterFiles = new Set([
  ...npcClothingAdapterFiles,
  "Fractions/Models/FractionClothingSetsData.cs",
  "Fractions/FractionClothingSets.cs",
  "Fractions/FractionCommands.cs",
]);

function replaceOnce(source, pattern, replacement, label) {
  let count = 0;
  const result = source.replace(pattern, (...args) => {
    count++;
    return typeof replacement === "function" ? replacement(...args) : replacement;
  });
  if (count !== 1) throw new Error(`Unexpected clothing adapter source shape: ${label}; found ${count}`);
  return result;
}

export function adaptClothingSource(source, relative) {
  if (relative === "Fractions/Models/FractionClothingSetsData.cs")
    source = patchFactionClothing(source);
  if (relative === "Fractions/FractionClothingSets.cs") {
    source = replaceOnce(source,
      /return HospitalDoctorLegsIndexByTexture\.TryGetValue\(normalizedTexture\.Value, out clothingIndex\);/g,
      `return HospitalDoctorLegsIndexByTexture.TryGetValue(normalizedTexture.Value, out clothingIndex);
                    case ClothesComponent.Shoes:
                        return HospitalShoesIndexByTexture.TryGetValue(normalizedTexture.Value, out clothingIndex);`,
      `${relative}: doctor shoes follow selected uniform color`);
    source = replaceOnce(source,
      "// Синхронизируем одежду с другими игроками (без LoadAccessories, чтобы не перезаписать фракционную одежду инвентарными предметами)",
      `// Apply explicitly declared uniform accessories after top/shoulder straps.
                    if (fracid == (int)Models.Fractions.roska || fracid == (int)Models.Fractions.FIB ||
                        (fracid == (int)Models.Fractions.POLICE &&
                        setname == "\u0421\u043f\u0435\u0446\u043d\u0430\u0437 \u041c\u0412\u0414"))
                    {
                        var accessorySet = clothingList
                            .Select(item => FractionClothingSetsData.AvailableSets[item.ClothingIndex])
                            .LastOrDefault(item => item.Fraction == (Models.Fractions)fracid &&
                                (item.Gender == 0) == gender && item.Component == ClothesComponent.Accessories);
                        if (accessorySet != null)
                            ClothesComponents.SetSpecialClothes(player, 7, accessorySet.Variation, accessorySet.Color);
                    }

                    // Синхронизируем одежду с другими игроками (без LoadAccessories, чтобы не перезаписать фракционную одежду инвентарными предметами)`,
      `${relative}: special forces explicit accessory after shoulder straps`);
    source = replaceOnce(source,
      "{ true, new Dictionary<int, int> { { 738, 0 }, { 739, 6 }, { 740, 0 } } }",
      "{ true, new Dictionary<int, int> { { 752, 0 }, { 753, 6 }, { 754, 0 } } }",
      `${relative}: male uniform torso override drawables`);
    source = replaceOnce(source, /topsDict\.TryGetValue\(availableSet\.Variation, out var variationData\) &&/g,
      "(topsDict.Values.FirstOrDefault(item => item.Variation == availableSet.Variation) is var variationData) &&",
      `${relative}: catalog keys are item IDs, not drawables`);
  }
  if (relative === "Fractions/FractionCommands.cs")
    source = replaceOnce(source, /ClothesComponents\.SetSpecialClothes\(player, 11, 726, 0\); \/\/ top/g,
      "ClothesComponents.SetSpecialClothes(player, 11, 740, 0); // top: legacy 726 + catalog offset 14",
      `${relative}: male prison uniform top`);
  if (npcClothingAdapterFiles.has(relative))
    source = replaceOnce(source, /(\w+)\.SetSharedData\("pedClothes", ([\w.]+)\);/g,
      (_match, ped, clothes) => `${ped}.SetSharedData("pedClothes", NeptuneEvo.PortCompatibility.LegacyNpcClothing.Translate(${ped}.Model, ${clothes}));`,
      `${relative}: legacy NPC clothes`);
  return source;
}
