import { Vector3 } from "@ragemp-fivem-bridge/shared";

type VecLike = { x?: number; y?: number; z?: number; [0]?: number; [1]?: number; [2]?: number } | null | undefined;
type EntityLike = { handle?: number; id?: number } | number | null | undefined;

interface RaycastResult {
  hit: boolean;
  position: Vector3;
  surfaceNormal: Vector3;
  entity: any;
}

function num(v: unknown): number {
  const n = +(v as number);
  return Number.isFinite(n) ? n : 0;
}

function vx(p: VecLike): number {
  return p == null ? 0 : num(p.x ?? p[0]);
}
function vy(p: VecLike): number {
  return p == null ? 0 : num(p.y ?? p[1]);
}
function vz(p: VecLike): number {
  return p == null ? 0 : num(p.z ?? p[2]);
}

function entityHandle(e: EntityLike): number {
  if (e == null) return 0;
  if (typeof e === "number") return e;
  return e.handle ?? e.id ?? 0;
}

function resolveEntity(handle: number): any {
  if (!handle) return 0;

  const mp = (globalThis as any).mp;
  try {
    if (IsEntityAVehicle(handle)) {
      return mp?.vehicles?.atHandle?.(handle) ?? handle;
    }
    if (IsEntityAPed(handle)) {
      return (IsPedAPlayer(handle)
        ? mp?.players?.atHandle?.(handle)
        : mp?.peds?.atHandle?.(handle)) ?? handle;
    }
    if (IsEntityAnObject(handle)) {
      return mp?.objects?.atHandle?.(handle) ?? handle;
    }
  } catch (_) {}

  return handle;
}

function nearestVehicleOnRay(startPos: VecLike, endPos: VecLike, flags?: number): any | null {
  const mask = flags == null ? -1 : flags;
  if ((mask & 2) === 0) return null;

  const mp = (globalThis as any).mp;
  const vehicles = mp?.vehicles?.streamed ?? mp?.vehicles?.toArray?.() ?? [];
  const sx = vx(startPos), sy = vy(startPos), sz = vz(startPos);
  const dx = vx(endPos) - sx, dy = vy(endPos) - sy, dz = vz(endPos) - sz;
  const lengthSquared = dx * dx + dy * dy + dz * dz;
  if (lengthSquared < 0.001) return null;

  let best: any | null = null;
  let bestAlong = Number.POSITIVE_INFINITY;
  for (const vehicle of vehicles) {
    try {
      if (!vehicle || !vehicle.handle || !vehicle.doesExist()) continue;
      const p = vehicle.position;
      const px = p.x - sx, py = p.y - sy, pz = p.z - sz;
      const along = (px * dx + py * dy + pz * dz) / lengthSquared;
      if (along < 0 || along > 1 || along >= bestAlong) continue;
      const cx = sx + dx * along, cy = sy + dy * along, cz = sz + dz * along;
      const ox = p.x - cx, oy = p.y - cy, oz = p.z - cz;
      // A vehicle ray should hit its collision, but custom streamed models can
      // report no hit for a frame. A 2.4 m cone is a conservative car width.
      if (ox * ox + oy * oy + oz * oz > 2.4 * 2.4) continue;
      best = vehicle;
      bestAlong = along;
    } catch (_) {}
  }
  return best;
}

export function testPointToPoint(startPos: VecLike, endPos: VecLike, ignoreEntity: EntityLike, flags?: number): RaycastResult {
  // mp.raycasting.testPointToPoint is synchronous. StartShapeTestRay is not:
  // reading it immediately commonly returns state 1 with entity 0. Use the
  // synchronous LOS probe so legacy callers receive the hit in this call.
  const handle = StartExpensiveSynchronousShapeTestLosProbe(
    vx(startPos),
    vy(startPos),
    vz(startPos),
    vx(endPos),
    vy(endPos),
    vz(endPos),
    flags || -1,
    entityHandle(ignoreEntity),
    0
  );
  const [, hit, endCoords, surfaceNormal, entityHit] = GetShapeTestResult(handle);
  const entity = resolveEntity(entityHit);
  const fallbackVehicle = (!entity || typeof entity === "number")
    ? nearestVehicleOnRay(startPos, endPos, flags)
    : null;
  return {
    hit: !!hit,
    position: fallbackVehicle?.position ?? new Vector3(endCoords[0], endCoords[1], endCoords[2]),
    surfaceNormal: new Vector3(surfaceNormal[0], surfaceNormal[1], surfaceNormal[2]),
    entity: fallbackVehicle ?? entity,
  };
}

export function testCapsule(startPos: VecLike, endPos: VecLike, radius: number, ignoreEntity: EntityLike, flags?: number): RaycastResult {
  const handle = StartShapeTestCapsule(
    vx(startPos),
    vy(startPos),
    vz(startPos),
    vx(endPos),
    vy(endPos),
    vz(endPos),
    radius,
    flags || -1,
    entityHandle(ignoreEntity),
    7
  );
  const [, hit, endCoords, surfaceNormal, entityHit] = GetShapeTestResult(handle);
  return {
    hit: !!hit,
    position: new Vector3(endCoords[0], endCoords[1], endCoords[2]),
    surfaceNormal: new Vector3(surfaceNormal[0], surfaceNormal[1], surfaceNormal[2]),
    entity: resolveEntity(entityHit),
  };
}
