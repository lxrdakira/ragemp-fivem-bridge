import { poolStore, removeFromPool, CONSTRUCT } from "@ragemp-fivem-bridge/shared/internal";
import { addNetworked, addLocal, attachRemoteId, freeClientId } from "./clientPool";
import { defineInternals } from "@ragemp-fivem-bridge/shared/internal";
import { rageHealthToGtaPed } from "@ragemp-fivem-bridge/shared";
import { onWorldScan } from "../../utils/worldScan";
import { PlayerMp } from "../../Entities/PlayerMp";
import type { PlayerMpPool } from "../../Pools/PlayerMpPool";

interface PlayerPoolState {
  serverIdToRemote: Map<number, number>;
  remoteToServerId: Map<number, number>;
  activeByServerId: Map<number, number>;
}

const Store = defineInternals<PlayerPoolState>();

export function serverIdToRemoteId(pool: object, serverId: number): number | undefined {
  return Store.get(pool).serverIdToRemote.get(serverId);
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
  if (!local || local.remoteId === remoteId) return;
  attachRemoteId(pool, local, remoteId);
}

function addRemotePlayer(pool: PlayerMpPool, remoteId: number, playerIndex: number): void {
  if (pool.atRemoteId(remoteId)) return;
  addNetworked(pool, new PlayerMp(CONSTRUCT, remoteId, playerIndex));
}

function setupLocal(pool: PlayerMpPool): void {
  const create = (): boolean => {
    try {
      const playerIndex = PlayerId();
      const serverId = GetPlayerServerId(playerIndex);
      if (!serverId) return false;
      pool.local = new PlayerMp(CONSTRUCT, 0, playerIndex);
      addLocal(pool, pool.local);
      const remoteId = Store.get(pool).serverIdToRemote.get(serverId);
      if (remoteId !== undefined) setLocalRemoteId(pool, remoteId);
      return true;
    } catch (e) {
      return false;
    }
  };
  if (!create()) {
    const tick = setTick(() => {
      if (create()) clearTick(tick);
    });
  }
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
      addRemotePlayer(pool, remoteId, playerIndex);
    }

    for (const [localId, entity] of poolStore(pool).entities) {
      if (pool.local && entity === pool.local) continue;
      const serverId = st.remoteToServerId.get(entity.remoteId);
      if (serverId === undefined || !st.activeByServerId.has(serverId)) {
        removeFromPool(pool, localId);
        freeClientId(pool, localId);
      }
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
      setLocalRemoteId(pool, remoteId);
      return;
    }
  } catch (e) {}

  const playerIndex = st.activeByServerId.get(source);
  if (playerIndex !== undefined) addRemotePlayer(pool, remoteId, playerIndex);
}

function applyUnmap(pool: PlayerMpPool, source: number): void {
  const st = Store.get(pool);
  if (source > 0) {
    MumbleSetVolumeOverrideByServerId(source, -1);
    MumbleRemoveVoiceTargetPlayerByServerId(31, source);
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
    SetEntityCoords(PlayerPedId(), x, y, z, false, false, false, false);
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
    if (voiceChat && target) voiceChat.listenTo(target);
  });

  onNet("ragemp:disableVoiceTo", (remoteId: number) => {
    const voiceChat = globalThis.mp?.voiceChat;
    const target = pool.atRemoteId(remoteId);
    if (voiceChat && target) voiceChat.stopListenTo(target);
  });
}
