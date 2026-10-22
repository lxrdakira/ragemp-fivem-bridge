// These are raw legacy drawables, not item IDs or fraction_clothing_sets indices.
export const maleFactionOffsets = {
  Tops: [599, 153, 14], Accessories: [201, 172, 2],
  Hat: [255, 48, -8], Masks: [252, 29, -3], Undershort: [218, 8, 4],
};

export function patchFactionClothing(source) {
  const maleRosgvardiaTop = source.match(/new ClothingSetData\(([01]), Fractions\.roska, ClothesComponent\.Tops, 691, 0\)/);
  const femaleRosgvardiaTop = source.match(/new ClothingSetData\(([01]), Fractions\.roska, ClothesComponent\.Tops, 725, 0\)/);
  if (!maleRosgvardiaTop || !femaleRosgvardiaTop || maleRosgvardiaTop[1] === femaleRosgvardiaTop[1])
    throw new Error("Unexpected Rosgvardia source gender labels");
  const flipRosgvardiaGender = maleRosgvardiaTop[1] === "1";
  let entries = 0;
  const result = source.replace(
    /new ClothingSetData\(([01]), (Fractions\.\w+), ClothesComponent\.(\w+), (\d+), (\d+)\)/g,
    (original, gender, fraction, component, drawable, texture) => {
      const index = entries++;
      // The DB correctly selects male 990..995 and female 996..1001,
      // but the legacy list mislabeled both six-piece police special sets.
      const special = index >= 990 && index <= 1001;
      if (special) {
        const expected = index <= 995 ? "1" : "0";
        if (fraction !== "Fractions.POLICE" || gender !== expected)
          throw new Error(`Unexpected police special forces baseline at ${index}`);
        gender = index <= 995 ? "0" : "1";
        original = `new ClothingSetData(${gender}, ${fraction}, ClothesComponent.${component}, ${drawable}, ${texture})`;
      }
      // Rosgvardia labels are reversed too. The model-specific DB catalogs
      // identify 689/691/693 as male uniforms and 725/727/728/730 as female.
      if (fraction === "Fractions.roska" && flipRosgvardiaGender) {
        gender = gender === "0" ? "1" : "0";
        original = `new ClothingSetData(${gender}, ${fraction}, ClothesComponent.${component}, ${drawable}, ${texture})`;
      }
      const range = maleFactionOffsets[component];
      if (gender !== "0" || !range) return original;
      const value = Number(drawable);
      const [start, count, offset] = range;
      if (value < start || value >= start + count) return original;
      return `new ClothingSetData(${gender}, ${fraction}, ClothesComponent.${component}, ${value + offset}, ${texture})`;
    });
  if (entries !== 1090) throw new Error(`Unexpected faction wardrobe entries: ${entries}`);
  return result;
}
