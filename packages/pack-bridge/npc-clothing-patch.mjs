export const legacyInstructorPreset = "head:[0,0],0:[282,2],3:[0,0],4:[258,0],6:[10,0],8:[219,0],11:[655,0],7:[279,10]";
export const currentInstructorPreset = "head:[0,0],0:[274,2],3:[0,0],4:[263,0],6:[10,0],8:[223,0],11:[669,0],7:[281,10]";

export function patchNpcClothing(source) {
  const count = source.split(legacyInstructorPreset).length - 1;
  if (count !== 1) throw new Error(`Expected one legacy instructor preset, found ${count}`);
  return source.replace(legacyInstructorPreset, currentInstructorPreset);
}
