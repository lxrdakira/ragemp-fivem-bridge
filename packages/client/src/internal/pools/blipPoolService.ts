import { Vector3 } from "@ragemp-fivem-bridge/shared";
import { CONSTRUCT } from "@ragemp-fivem-bridge/shared/internal";
import { addNetworked, addLocal } from "./clientPool";
import { BlipMp } from "../../Entities/BlipMp";
import { BlipInternals } from "../blipInternals";
import { applyBlipName } from "../../utils/blipName";
import { isVisibleHere, onDimensionChange } from "../../utils/dimension";
import { onWorldScan } from "../../utils/worldScan";
import { setupNetworkedReceiver } from "./networkedReceiverService";
import type { BlipMpPool } from "../../Pools/BlipMpPool";

export function applyBlipVisibility(blip: BlipMp, playerPosition?: number[]): void {
  if (!blip.handle || !DoesBlipExist(blip.handle)) return;
  const rec = BlipInternals.get(blip);
  let shown = isVisibleHere(rec.dimension);
  if (shown && rec.drawDistance > 0) {
    const player = playerPosition ?? GetEntityCoords(PlayerPedId(), true);
    const position = GetBlipCoords(blip.handle);
    const dx = player[0] - position[0];
    const dy = player[1] - position[1];
    const dz = player[2] - position[2];
    shown = dx * dx + dy * dy + dz * dz <= rec.drawDistance * rec.drawDistance;
  }
  SetBlipAlpha(blip.handle, shown ? rec.alpha : 0);
}

function createFromData(pool: BlipMpPool, data: any): BlipMp {
  const handle = AddBlipForCoord(data.x, data.y, data.z);
  SetBlipSprite(handle, data.sprite);
  SetBlipColour(handle, data.color);
  SetBlipScale(handle, data.scale);
  SetBlipAsShortRange(handle, data.shortRange);
  applyBlipName(handle, data.name);

  const blip = new BlipMp(CONSTRUCT, data.id, handle);
  const rec = BlipInternals.get(blip);
  rec.name = data.name;
  rec.shortRange = data.shortRange;
  rec.scale = data.scale;
  rec.alpha = data.alpha ?? 255;
  rec.drawDistance = data.drawDistance ?? 0;
  rec.rotation = data.rotation ?? 0;
  rec.dimension = data.dimension ?? 0;
  if (rec.rotation) SetBlipRotation(handle, Math.round(rec.rotation));
  applyBlipVisibility(blip);
  addNetworked(pool, blip as any);

  if (data.name) {
    setTimeout(() => {
      if (blip.handle && DoesBlipExist(blip.handle)) {
        applyBlipName(blip.handle, BlipInternals.get(blip).name);
      }
    }, 1500);
  }

  return blip;
}

export function setupBlipPool(pool: BlipMpPool): void {
  onDimensionChange(() => pool.forEach(((blip: BlipMp) => applyBlipVisibility(blip)) as any));
  onWorldScan(() => {
    const position = GetEntityCoords(PlayerPedId(), true);
    pool.forEach(((blip: BlipMp) => applyBlipVisibility(blip, position)) as any);
  });

  setupNetworkedReceiver(pool, {
    createEvent: "ragemp:blipCreate",
    syncAllEvent: "ragemp:blipSyncAll",
    updateEvent: "ragemp:blipUpdate",
    destroyEvent: "ragemp:blipDestroy",
    create: (p, data) => createFromData(p, data),
    update: (p, id, data) => {
      const existing = p.atRemoteId(id) as unknown as BlipMp | null;
      if (existing) {
        existing.position = new Vector3(data.x, data.y, data.z);
        existing.sprite = data.sprite;
        existing.color = data.color;
        existing.scale = data.scale;
        BlipInternals.get(existing).alpha = data.alpha ?? 255;
        existing.drawDistance = data.drawDistance ?? 0;
        existing.rotation = data.rotation ?? 0;
        existing.shortRange = data.shortRange;
        existing.dimension = data.dimension ?? 0;
        if (data.name) existing.name = data.name;
      }
    },
    destroy: (p, id) => {
      const existing = p.atRemoteId(id) as unknown as BlipMp | null;
      if (existing) existing.destroy();
    },
  });

  onNet("ragemp:blipRoute", (id: number, state: boolean, color: number | null | undefined, _scale: number) => {
    const existing = pool.atRemoteId(id) as unknown as BlipMp | null;
    if (existing) {
      SetBlipRoute(existing.handle, state);
      if (state && color !== undefined && color !== null) {
        SetBlipRouteColour(existing.handle, color);
      }
    }
  });
}

export function createBlip(pool: BlipMpPool, sprite: number, position: { x: number; y: number; z: number }, options: any): BlipMp {
  const radius = Math.max(0, Number(options.radius) || 0);
  const handle = radius > 0
    ? AddBlipForRadius(position.x, position.y, position.z, radius)
    : AddBlipForCoord(position.x, position.y, position.z);

  if (radius === 0) SetBlipSprite(handle, sprite);
  if (options.color !== undefined) SetBlipColour(handle, options.color);
  if (options.scale !== undefined) SetBlipScale(handle, options.scale);
  if (options.shortRange !== undefined) SetBlipAsShortRange(handle, options.shortRange);
  if (options.rotation !== undefined) SetBlipRotation(handle, Math.round(options.rotation));

  applyBlipName(handle, options.name);

  const blip = new BlipMp(CONSTRUCT, 0, handle);
  const rec = BlipInternals.get(blip);
  rec.name = options.name ?? "";
  rec.shortRange = options.shortRange ?? false;
  rec.scale = options.scale ?? 1.0;
  rec.alpha = options.alpha ?? 255;
  rec.drawDistance = Math.max(0, Number(options.drawDistance) || 0);
  rec.rotation = Number(options.rotation) || 0;
  rec.radius = radius;
  rec.dimension = options.dimension ?? 0;
  applyBlipVisibility(blip);
  addLocal(pool, blip as any);

  return blip;
}
