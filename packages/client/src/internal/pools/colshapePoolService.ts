import { defineInternals, removeFromPool, CONSTRUCT } from "@ragemp-fivem-bridge/shared/internal";
import { addNetworked, addLocal, freeClientId } from "./clientPool";
import { Vector3 } from "@ragemp-fivem-bridge/shared";
import { ColshapeMp } from "../../Entities/ColshapeMp";
import { ColshapeInternals } from "../colshapeInternals";
import { onWorldScan } from "../../utils/worldScan";
import { isVisibleHere } from "../../utils/dimension";
import type { ColshapeMpPool } from "../../Pools/ColshapeMpPool";

interface ColshapePoolRec {
  inside: Set<number>;
  warned: boolean;
}

const RAGE_GROUND_Z_COMPENSATION = 1.12;

function containsWithLegacyZCompatibility(colshape: ColshapeMp, point: Vector3): boolean {
  if (colshape.isPointWithin(point)) return true;

  // Old content contains both pre-corrected ground coordinates and raw
  // player-origin coordinates saved about 1.12 m higher. Check only the
  // vertical alternatives so the horizontal interaction radius is unchanged.
  return colshape.isPointWithin(new Vector3(point.x, point.y, point.z - RAGE_GROUND_Z_COMPENSATION))
    || colshape.isPointWithin(new Vector3(point.x, point.y, point.z + RAGE_GROUND_Z_COMPENSATION));
}

const ColshapePoolInternals = defineInternals<ColshapePoolRec>();

function createFromData(pool: ColshapeMpPool, data: any): ColshapeMp {
  const position = new Vector3(data.position.x, data.position.y, data.position.z);
  const colshape = new ColshapeMp(CONSTRUCT, data.id, data.shapeType, position, data.params, data.dimension ?? 0);
  ColshapeInternals.get(colshape).origin = "server";
  addNetworked(pool, colshape as any);
  return colshape;
}

function report(pool: ColshapeMpPool, colshape: ColshapeMp, _local: any, entering: boolean): void {
  if (ColshapeInternals.get(colshape).origin === "server") {
    emitNet(entering ? "ragemp:colshape:enter" : "ragemp:colshape:exit", colshape.remoteId);
    return;
  }
  try {
    globalThis.mp.events.call(
      entering ? "playerEnterColshape" : "playerExitColshape",
      colshape
    );
  } catch (e) {
    console.error(`[bridge:colshape] handler error (${entering ? "enter" : "exit"} #${colshape.id}):`, e);
  }
}

function scan(pool: ColshapeMpPool): void {
  const mp = globalThis.mp;
  const local = mp?.players?.local;
  if (!local) return;

  let localPos;
  try {
    localPos = local.position;
  } catch (e) {
    return;
  }
  if (!localPos) return;

  const poolRec = ColshapePoolInternals.get(pool);

  for (const entity of pool.toArray()) {
    const colshape = entity as unknown as ColshapeMp;
    const rec = ColshapeInternals.get(colshape);
    let inside: boolean;
    try {
      inside = isVisibleHere(rec.dimension) && containsWithLegacyZCompatibility(colshape, localPos);
    } catch (e) {
      if (!poolRec.warned) {
        poolRec.warned = true;
        console.error(`[bridge:colshape] check failed for #${colshape?.id} (${rec?.shapeType}):`, e);
      }
      continue;
    }

    const wasInside = poolRec.inside.has(colshape.id);
    if (inside === wasInside) continue;

    if (inside) {
      poolRec.inside.add(colshape.id);
      report(pool, colshape, local, true);
    } else {
      poolRec.inside.delete(colshape.id);
      report(pool, colshape, local, false);
    }
  }
}

export function setupColshapePool(pool: ColshapeMpPool): void {
  ColshapePoolInternals.init(pool, { inside: new Set(), warned: false });

  onNet("ragemp:colshapeCreate", (data: any) => {
    if (data && !pool.atRemoteId(data.id)) createFromData(pool, data);
  });

  onNet("ragemp:colshapeSyncAll", (shapes: any[]) => {
    if (!Array.isArray(shapes)) return;
    for (const data of shapes) {
      if (data && !pool.atRemoteId(data.id)) createFromData(pool, data);
    }
  });

  onNet("ragemp:colshapeUpdate", (id: number, data: any) => {
    const existing = pool.atRemoteId(id) as unknown as ColshapeMp | null;
    if (!existing) {
      if (data) createFromData(pool, data);
      return;
    }
    const rec = ColshapeInternals.get(existing);
    rec.position = new Vector3(data.position.x, data.position.y, data.position.z);
    rec.params = data.params ?? {};
    rec.dimension = data.dimension ?? 0;
  });

  onNet("ragemp:colshapeDestroy", (id: number) => {
    const existing = pool.atRemoteId(id) as unknown as ColshapeMp | null;
    if (existing) removeFromColshapePool(pool, existing.id);
  });

  onWorldScan(() => scan(pool));
}

export function createLocalColshape(pool: ColshapeMpPool, shapeType: string, position: Vector3, params: Record<string, any>, dimension: number = 0): ColshapeMp {
  const colshape = new ColshapeMp(CONSTRUCT, 0, shapeType, position, params, dimension);
  ColshapeInternals.get(colshape).origin = "local";
  addLocal(pool, colshape as any);
  return colshape;
}

export function removeFromColshapePool(pool: ColshapeMpPool, id: number): void {
  ColshapePoolInternals.get(pool).inside.delete(id);
  freeClientId(pool, id);
  removeFromPool(pool, id);
}
