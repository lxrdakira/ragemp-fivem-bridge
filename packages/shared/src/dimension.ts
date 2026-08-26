export const GLOBAL_DIMENSION = 4294967295;

export function normalizeDimension(value: number | null | undefined): number {
  if (value === undefined || value === null) return 0;
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  // RAGE:MP uses -1 on the client and uint.MaxValue on the server for an
  // entity that is visible in every dimension. Keep both spellings aligned.
  return n < 0 ? GLOBAL_DIMENSION : Math.floor(n);
}

export function isGlobalDimension(value: number | null | undefined): boolean {
  return normalizeDimension(value) === GLOBAL_DIMENSION;
}

export function dimensionsMatch(entityDimension: number | null | undefined, observerDimension: number | null | undefined): boolean {
  const e = normalizeDimension(entityDimension);
  if (e === GLOBAL_DIMENSION) return true;
  return e === normalizeDimension(observerDimension);
}
