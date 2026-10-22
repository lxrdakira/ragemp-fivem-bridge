export const pendingComponentPreloads = new Map<string, number>();

export function hasPendingClothingPreloads(ped: number): boolean {
  for (let component = 0; component < 12; component++) {
    if (pendingComponentPreloads.has(`${ped}:${component}`)) return true;
  }
  return false;
}
