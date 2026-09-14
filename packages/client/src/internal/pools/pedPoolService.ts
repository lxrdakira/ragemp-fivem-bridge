import { safeGetEntityFromNetId } from "../../utils/netId";
import { atHandle, atRemote, bindLocalFallbackHandle, setStreamHandlers } from "./streamingService";
import { PedInternals } from "../pedInternals";
import type { PedMp } from "../../Entities/PedMp";
import { registerNativeDimensionEntity } from "../../utils/nativeEntityDimension";

const RAGE_GROUND_Z_COMPENSATION = 1.12;

export function setupPedPool(pool: object): void {
  const pending = new Map<number, [boolean, boolean, boolean, boolean]>();
  const pendingByRemote = new Map<number, [boolean, boolean, boolean, boolean]>();
  const localFallbacks = new Set<number>();

  const apply = (handle: number, state: [boolean, boolean, boolean, boolean]): boolean => {
    SetEntityDynamic(handle, state[0]);
    SetEntityInvincible(handle, state[1]);
    FreezeEntityPosition(handle, state[2]);
    SetBlockingOfNonTemporaryEvents(handle, state[3]);
    const ped = atHandle(pool, handle) as PedMp | null;
    if (ped) {
      const rec = PedInternals.get(ped);
      rec.dynamic = state[0];
      rec.invincible = state[1];
    }
    return !!ped;
  };

  onNet("ragemp:ped:batch", (netId: number, dynamic: boolean, invincible: boolean, frozen: boolean, controlLocked: boolean, remoteId?: number) => {
    const state: [boolean, boolean, boolean, boolean] = [!!dynamic, !!invincible, !!frozen, !!controlLocked];
    const remotePed = Number.isInteger(remoteId) && remoteId! > 0
      ? atRemote(pool, remoteId!) as PedMp | null
      : null;
    const handle = remotePed?.handle || safeGetEntityFromNetId(netId);
    if (handle && apply(handle, state)) return;
    if (remoteId && remoteId > 0) pendingByRemote.set(remoteId, state);
    else if (netId > 0) pending.set(netId, state);
  });

  setStreamHandlers(pool, {
    onStreamIn: (_ped: PedMp, handle: number, netId: number) => {
      const state = pendingByRemote.get(_ped.remoteId) ?? pending.get(netId);
      if (!state) return;
      pending.delete(netId);
      pendingByRemote.delete(_ped.remoteId);
      apply(handle, state);
    },
  });

  onNet("ragemp:ped:localCreate", (
    remoteId: number,
    model: number,
    x: number,
    y: number,
    z: number,
    heading: number,
    dimension: number,
  ) => {
    if (!Number.isInteger(remoteId) || remoteId <= 0 || localFallbacks.has(remoteId)) return;
    localFallbacks.add(remoteId);
    const finish = () => {
      const existing = atRemote(pool, remoteId) as PedMp | null;
      if (existing?.handle && DoesEntityExist(existing.handle)) return;
      const handle = CreatePed(
        4,
        model,
        x,
        y,
        z - RAGE_GROUND_Z_COMPENSATION,
        heading,
        false,
        false,
      );
      if (!handle) {
        localFallbacks.delete(remoteId);
        return;
      }
      SetEntityAsMissionEntity(handle, true, true);
      SetBlockingOfNonTemporaryEvents(handle, true);
      const ped = bindLocalFallbackHandle(pool, remoteId, handle, { model, x, y, z, dimension }) as PedMp | null;
      if (!ped) {
        DeleteEntity(handle);
        localFallbacks.delete(remoteId);
        return;
      }
      registerNativeDimensionEntity(ped);
      SetModelAsNoLongerNeeded(model);
    };

    if (HasModelLoaded(model)) {
      finish();
      return;
    }
    RequestModel(model);
    const startedAt = GetGameTimer();
    const tick = setTick(() => {
      if (HasModelLoaded(model)) {
        clearTick(tick);
        finish();
      } else if (GetGameTimer() - startedAt > 30_000) {
        clearTick(tick);
        localFallbacks.delete(remoteId);
        console.warn(`[ragemp:ped] local fallback model ${model} failed to load for #${remoteId}`);
      } else {
        RequestModel(model);
      }
    });
  });

  onNet("ragemp:entity:destroy", (type: string, remoteId: number) => {
    if (type === "ped") localFallbacks.delete(remoteId);
  });

  onNet("ragemp:pedInvincible", (netId: number, value: boolean) => {
    const handle = safeGetEntityFromNetId(netId);
    if (handle) {
      SetEntityInvincible(handle, value);
      const ped = atHandle(pool, handle) as PedMp | null;
      if (ped) {
        PedInternals.get(ped).invincible = value;
      }
    }
  });
}
