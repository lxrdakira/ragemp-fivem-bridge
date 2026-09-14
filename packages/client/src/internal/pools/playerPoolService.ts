import { poolStore, removeFromPool, CONSTRUCT } from "@ragemp-fivem-bridge/shared/internal";
import { addNetworked, addLocal, attachRemoteId, freeClientId } from "./clientPool";
import { defineInternals } from "@ragemp-fivem-bridge/shared/internal";
import { rageHealthToGtaPed } from "@ragemp-fivem-bridge/shared";
import { onWorldScan } from "../../utils/worldScan";
import { PlayerMp } from "../../Entities/PlayerMp";
import { PlayerInternals, setPlayerNetworkIdentity } from "../playerInternals";
import type { PlayerMpPool } from "../../Pools/PlayerMpPool";
import { hydrateSharedData, notifySharedDataValue } from "../../utils/sharedData";
import { EntityInternals } from "@ragemp-fivem-bridge/shared/internal";

interface PlayerPoolState {
  serverIdToRemote: Map<number, number>;
  remoteToServerId: Map<number, number>;
  activeByServerId: Map<number, number>;
}

const Store = defineInternals<PlayerPoolState>();

export function serverIdToRemoteId(pool: object, serverId: number): number | undefined {
  return Store.get(pool).serverIdToRemote.get(serverId);
}

export function remoteIdToServerId(pool: object, remoteId: number): number | undefined {
  return Store.get(pool).remoteToServerId.get(remoteId);
}

export function playerByServerId(serverId: number): any {
  const pool = globalThis.mp?.players;
  if (!pool) return null;
  const remoteId = serverIdToRemoteId(pool, serverId);
  return remoteId === undefined ? null : pool.atRemoteId(remoteId);
}

export function setupPlayerPool(pool: PlayerMpPool): void {
  Store.init(pool, {
    serverIdToRemote: new Map(),
    remoteToServerId: new Map(),
    activeByServerId: new Map(),
  });
  setupIdentitySync(pool);
  setupLocal(pool);
  setupStreaming(pool);
  setupServerSync(pool);
}

function setLocalRemoteId(pool: PlayerMpPool, remoteId: number): void {
  const local = pool.local;
  if (!local || (local.remoteId === remoteId && pool.atRemoteId(remoteId) === local)) return;
  const duplicate = pool.atRemoteId(remoteId);
  if (duplicate && duplicate !== local) {
    removeFromPool(pool, duplicate.id);
    freeClientId(pool, duplicate.id);
  }
  const remoteIndex = poolStore(pool).remoteIndex;
  if (remoteIndex.get(local.remoteId) === local) remoteIndex.delete(local.remoteId);
  attachRemoteId(pool, local, remoteId);
}

function refreshLocalIdentity(pool: PlayerMpPool, playerIndex: number, serverId: number, created = false): void {
  if (!pool.local || !Number.isInteger(serverId) || serverId < 1) return;
  const local = pool.local;
  const previous = PlayerInternals.get(local);
  const changedServer = previous.serverId > 0 && previous.serverId !== serverId;
  const changedIdentity = previous.serverId !== serverId || previous.playerIndex !== playerIndex;
  const remoteId = Store.get(pool).serverIdToRemote.get(serverId);
  const changedMapping = remoteId !== undefined &&
    (local.remoteId !== remoteId || pool.atRemoteId(remoteId) !== local);
  const duplicate = remoteId !== undefined ? pool.atRemoteId(remoteId) : null;
  const promotedData = duplicate && duplicate !== local
    ? [...EntityInternals.get(duplicate).variables.entries()] : [];
  setPlayerNetworkIdentity(local, playerIndex, serverId);
  if (remoteId !== undefined) setLocalRemoteId(pool, remoteId);
  if (changedServer) {
    // Never carry old-session privileges/custom properties into a new identity.
    // Notify only after repairing the local mapping so identity-filtered legacy
    // handlers see the same stable local wrapper with its current remoteId.
    for (const key of [...EntityInternals.get(local).variables.keys()]) notifySharedDataValue(local, key, null);
  }
  if (created || changedIdentity || changedMapping) {
    // Preserve already-delivered data-handler values when removing an early
    // duplicate. Native state-bag proxies need not enumerate their keys.
    for (const [key, value] of promotedData) notifySharedDataValue(local, key, value);
    try { hydrateSharedData(local, globalThis.Player(serverId).state); } catch (_) {}
  }
}

function addRemotePlayer(pool: PlayerMpPool, remoteId: number, playerIndex: number, serverId: number): void {
  const existing = pool.atRemoteId(remoteId);
  if (existing) {
    setPlayerNetworkIdentity(existing, playerIndex, serverId);
    return;
  }
  const player = addNetworked(pool, new PlayerMp(CONSTRUCT, remoteId, playerIndex, serverId));
  try { hydrateSharedData(player, globalThis.Player(serverId).state); } catch (_) {}
  globalThis.mp?.voiceChat?.muteUntilEnabled(player);
}

function setupLocal(pool: PlayerMpPool): void {
  const createOrRefresh = (): boolean => {
    try {
      const playerIndex = PlayerId();
      const serverId = GetPlayerServerId(playerIndex);
      // The PiterLive TU 2026 adapter deliberately does not start Rockstar's
      // legacy P2P host. During the first client-resource tick FiveM therefore
      // has a perfectly valid local ped/player index while the Rockstar native
      // still reports server id 0. RAGE:MP exposes mp.players.local
      // synchronously, and Neptune captures it while its bundle is evaluated,
      // so postponing creation leaves global.localplayer undefined forever.
      const created = !pool.local;
      if (created) {
        pool.local = new PlayerMp(CONSTRUCT, 0, playerIndex, serverId);
        addLocal(pool, pool.local);
      }

      if (!serverId || serverId < 1) return false;
      refreshLocalIdentity(pool, playerIndex, serverId, created);
      return true;
    } catch (e) {
      return false;
    }
  };
  if (!createOrRefresh()) {
    const tick = setTick(() => {
      if (createOrRefresh()) clearTick(tick);
    });
  }
  // On in-process reconnect the first native ID may still be the old positive
  // ID, so the initial ready tick alone is insufficient. Reconcile on the
  // existing world scan; unchanged identity does not replay any shared data.
  onWorldScan(() => { createOrRefresh(); });
}

function setupStreaming(pool: PlayerMpPool): void {
  onWorldScan((cache: { players: number[]; vehicles: number[]; peds: number[] }) => {
    const st = Store.get(pool);
    const localIndex = PlayerId();
    st.activeByServerId.clear();

    for (const playerIndex of cache.players) {
      if (playerIndex === localIndex) continue;
      const serverId = GetPlayerServerId(playerIndex);
      if (!serverId || serverId === -1) continue;
      st.activeByServerId.set(serverId, playerIndex);

      const remoteId = st.serverIdToRemote.get(serverId);
      if (remoteId === undefined) continue;
      addRemotePlayer(pool, remoteId, playerIndex, serverId);
    }

    for (const [, entity] of poolStore<PlayerMp>(pool).entities) {
      if (pool.local && entity === pool.local) continue;
      const serverId = st.remoteToServerId.get(entity.remoteId);
      if (serverId !== undefined && !st.activeByServerId.has(serverId)) setPlayerNetworkIdentity(entity, -1, serverId);
    }
  });
}

function applyMap(pool: PlayerMpPool, source: number, remoteId: number): void {
  if (source == null || remoteId == null) return;
  const st = Store.get(pool);
  const prev = st.serverIdToRemote.get(source);
  if (prev !== undefined && prev !== remoteId) st.remoteToServerId.delete(prev);
  st.serverIdToRemote.set(source, remoteId);
  st.remoteToServerId.set(remoteId, source);

  try {
    if (pool.local && GetPlayerServerId(PlayerId()) === source) {
      refreshLocalIdentity(pool, PlayerId(), source);
      return;
    }
  } catch (e) {}

  const playerIndex = st.activeByServerId.get(source) ?? GetPlayerFromServerId(source);
  addRemotePlayer(pool, remoteId, playerIndex >= 0 ? playerIndex : -1, source);
}

function applyUnmap(pool: PlayerMpPool, source: number): void {
  const st = Store.get(pool);
  if (source > 0) {
    globalThis.mp?.voiceChat?.forgetPlayer(source);
  }
  const remoteId = st.serverIdToRemote.get(source);
  st.serverIdToRemote.delete(source);
  st.activeByServerId.delete(source);
  if (remoteId === undefined) return;
  st.remoteToServerId.delete(remoteId);
  if (pool.local && pool.local.remoteId === remoteId) return;
  const entity = pool.atRemoteId(remoteId);
  if (entity) {
    removeFromPool(pool, entity.id);
    freeClientId(pool, entity.id);
  }
}

function setupIdentitySync(pool: PlayerMpPool): void {
  onNet("ragemp:player:map", (source: number, remoteId: number) => applyMap(pool, source, remoteId));
  onNet("ragemp:player:unmap", (source: number) => applyUnmap(pool, source));
  onNet("ragemp:player:snapshot", (list: [number, number][]) => {
    if (!Array.isArray(list)) return;
    for (const entry of list) {
      if (Array.isArray(entry)) applyMap(pool, entry[0], entry[1]);
    }
  });
}

function setupServerSync(pool: PlayerMpPool): void {
  onNet("ragemp:setPosition", (x: number, y: number, z: number) => {
    if (![x, y, z].every(Number.isFinite)) return;
    SetEntityCoordsNoOffset(PlayerPedId(), x, y, z, true, true, true);
  });

  onNet("ragemp:setRotation", (x: number, y: number, z: number) => {
    if (![x, y, z].every(Number.isFinite)) return;
    SetEntityRotation(PlayerPedId(), x, y, z, 2, true);
  });

  onNet("ragemp:setHealth", (value: number) => {
    SetEntityHealth(PlayerPedId(), rageHealthToGtaPed(value));
  });

  onNet("ragemp:setArmour", (value: number) => {
    SetPedArmour(PlayerPedId(), value);
  });

  onNet("ragemp:setAlpha", (value: number) => {
    SetEntityAlpha(PlayerPedId(), value, false);
  });

  onNet("ragemp:enableVoiceTo", (remoteId: number) => {
    const voiceChat = globalThis.mp?.voiceChat;
    const target = pool.atRemoteId(remoteId);
    const serverId = remoteIdToServerId(pool, remoteId);
    if (voiceChat && (target || serverId !== undefined)) voiceChat.listenTo(target ?? serverId!);
  });

  onNet("ragemp:disableVoiceTo", (remoteId: number) => {
    const voiceChat = globalThis.mp?.voiceChat;
    const target = pool.atRemoteId(remoteId);
    const serverId = remoteIdToServerId(pool, remoteId);
    if (voiceChat && (target || serverId !== undefined)) voiceChat.stopListenTo(target ?? serverId!);
  });
}
