import { safeGetEntityFromNetId } from "../../utils/netId";
import { atHandle, atRemote, bindLocalFallbackHandle, setStreamHandlers } from "./streamingService";
import { PedInternals } from "../pedInternals";
import type { PedMp } from "../../Entities/PedMp";
import { registerNativeDimensionEntity } from "../../utils/nativeEntityDimension";
import { applyServerPedState, type ServerPedState } from "../../utils/serverPedState";

const RAGE_GROUND_Z_COMPENSATION = 1.12;

export function setupPedPool(pool: object): void {
  const pending = new Map<number, ServerPedState>();
  const statesByRemote = new Map<number, ServerPedState>();
  const localFallbacks = new Set<number>();
  const pendingLocalFallbackTimers = new Map<number, ReturnType<typeof setInterval>>();
  const localFallbackCreators = new Map<number, () => void>();
  const stationaryHandles = new Map<number, ServerPedState>();

  const stopLocalFallbackRetry = (remoteId: number) => {
    const timer = pendingLocalFallbackTimers.get(remoteId);
    if (timer !== undefined) clearInterval(timer);
    pendingLocalFallbackTimers.delete(remoteId);
  };

  const apply = (handle: number, state: ServerPedState): boolean => {
    const invincible = applyServerPedState(handle, state, stationaryHandles.has(handle));
    if (state[2] && !state[0]) stationaryHandles.set(handle, state);
    else stationaryHandles.delete(handle);
    const ped = atHandle(pool, handle) as PedMp | null;
    if (ped) {
      const rec = PedInternals.get(ped);
      rec.dynamic = state[0];
      rec.invincible = invincible;
    }
    return !!ped;
  };

  onNet("ragemp:ped:batch", (netId: number, dynamic: boolean, invincible: boolean, frozen: boolean, controlLocked: boolean, remoteId?: number) => {
    const state: ServerPedState = [!!dynamic, !!invincible, !!frozen, !!controlLocked];
    if (remoteId && remoteId > 0) statesByRemote.set(remoteId, state);
    const remotePed = Number.isInteger(remoteId) && remoteId! > 0
      ? atRemote(pool, remoteId!) as PedMp | null
      : null;
    const handle = remotePed?.handle || safeGetEntityFromNetId(netId);
    if (handle && apply(handle, state)) return;
    if (!remoteId && netId > 0) pending.set(netId, state);
  });

  setStreamHandlers(pool, {
    onStreamOut: (ped: PedMp) => { stationaryHandles.delete(ped.handle); },
    onStreamIn: (_ped: PedMp, handle: number, netId: number) => {
      const state = statesByRemote.get(_ped.remoteId) ?? pending.get(netId);
      if (!state) return;
      pending.delete(netId);
      apply(handle, state);
    },
  });

  // Native ownership can change without a stream-in event. Reassert only
  // currently streamed stationary NPCs, never the entire server entity pool.
  let protectionTicks = 0;
  const protectionTimer = setInterval(() => {
    for (const [handle, state] of stationaryHandles) {
      const ped = atHandle(pool, handle) as PedMp | null;
      if (!ped || !DoesEntityExist(handle) || !statesByRemote.has(ped.remoteId)) {
        stationaryHandles.delete(handle);
        continue;
      }
      applyServerPedState(handle, state, true);
    }
    if (++protectionTicks % 10 === 0) {
      for (const [remoteId, recreate] of localFallbackCreators) {
        if (!localFallbacks.has(remoteId) || pendingLocalFallbackTimers.has(remoteId)) continue;
        const ped = atRemote(pool, remoteId) as PedMp | null;
        if (!ped?.handle || !DoesEntityExist(ped.handle)) recreate();
      }
    }
  }, 500);
  on("onResourceStop", (resource: string) => {
    if (resource === GetCurrentResourceName()) {
      clearInterval(protectionTimer);
      for (const remoteId of pendingLocalFallbackTimers.keys()) stopLocalFallbackRetry(remoteId);
      localFallbackCreators.clear();
    }
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
    if (!Number.isInteger(remoteId) || remoteId <= 0) return;
    const current = atRemote(pool, remoteId) as PedMp | null;
    if (localFallbacks.has(remoteId) && current?.handle && DoesEntityExist(current.handle)) return;
    localFallbacks.add(remoteId);
    const finish = (): boolean => {
      const existing = atRemote(pool, remoteId) as PedMp | null;
      if (existing?.handle && DoesEntityExist(existing.handle)) return true;
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
        return false;
      }
      SetEntityAsMissionEntity(handle, true, true);
      SetBlockingOfNonTemporaryEvents(handle, true);
      const ped = bindLocalFallbackHandle(pool, remoteId, handle, { model, x, y, z, dimension }) as PedMp | null;
      if (!ped) {
        DeleteEntity(handle);
        return false;
      }
      registerNativeDimensionEntity(ped);
      SetModelAsNoLongerNeeded(model);
      const state = statesByRemote.get(remoteId);
      if (state) apply(handle, state);
      return true;
    };

    const startedAt = GetGameTimer();
    let warned = false;
    const tryCreate = () => {
      if (!localFallbacks.has(remoteId)) {
        stopLocalFallbackRetry(remoteId);
        return;
      }
      if (HasModelLoaded(model)) {
        if (finish()) {
          stopLocalFallbackRetry(remoteId);
          return;
        }
      } else {
        RequestModel(model);
      }
      if (!warned && GetGameTimer() - startedAt > 30_000) {
        warned = true;
        console.warn(`[ragemp:ped] local fallback model ${model} still unavailable for #${remoteId}; retrying`);
      }
    };
    localFallbackCreators.set(remoteId, tryCreate);
    tryCreate();
    if (!pendingLocalFallbackTimers.has(remoteId) && localFallbacks.has(remoteId)) {
      const existing = atRemote(pool, remoteId) as PedMp | null;
      if (!existing?.handle || !DoesEntityExist(existing.handle))
        pendingLocalFallbackTimers.set(remoteId, setInterval(tryCreate, 1000));
    }
  });

  onNet("ragemp:entity:destroy", (type: string, remoteId: number) => {
    if (type === "ped") {
      const ped = atRemote(pool, remoteId) as PedMp | null;
      if (ped) stationaryHandles.delete(ped.handle);
      stopLocalFallbackRetry(remoteId);
      localFallbacks.delete(remoteId);
      localFallbackCreators.delete(remoteId);
      statesByRemote.delete(remoteId);
    }
  });

  onNet("ragemp:pedInvincible", (netId: number, value: boolean) => {
    const handle = safeGetEntityFromNetId(netId);
    if (handle) {
      const ped = atHandle(pool, handle) as PedMp | null;
      const state = ped ? statesByRemote.get(ped.remoteId) : undefined;
      if (state) {
        state[1] = !!value;
        apply(handle, state);
        return;
      }
      SetEntityInvincible(handle, value);
      if (ped) {
        PedInternals.get(ped).invincible = value;
      }
    }
  });
}
