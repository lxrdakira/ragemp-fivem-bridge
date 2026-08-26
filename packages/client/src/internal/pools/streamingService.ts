import { poolStore, poolAdd, poolRemove, EntityInternals, setEntityId, setEntityRemoteId, INVALID_REMOTE_ID } from "@ragemp-fivem-bridge/shared/internal";
import { onWorldScan } from "../../utils/worldScan";
import { safeGetNetworkId, safeGetEntityFromNetId } from "../../utils/netId";
import { subscribeEntityRegistry } from "../../utils/entityRegistry";
import {
  StreamingInternals,
  initStreamingInternals,
  streamEntityState,
  type StreamingInternalsRec,
} from "../streamingInternals";
import { hydrateSharedData } from "../../utils/sharedData";

export const LOCAL_STREAM_ID_BASE = 2_000_000_000;

export function setupStreamingPool(pool: object, netType: string | null): StreamingInternalsRec {
  return initStreamingInternals(pool, netType);
}

export function setStreamHandlers(
  pool: object,
  handlers: {
    onStreamIn?: (entity: any, handle: number, netId: number) => void;
    onStreamOut?: (entity: any) => void;
  },
): void {
  const rec = StreamingInternals.get(pool);
  if (handlers.onStreamIn) rec.onStreamIn = handlers.onStreamIn;
  if (handlers.onStreamOut) rec.onStreamOut = handlers.onStreamOut;
}

export function startNetworked(pool: object, makeEntity?: (id: number, handle: number) => any): void {
  const rec = StreamingInternals.get(pool);
  if (makeEntity) rec.makeEntity = makeEntity;
  subscribeRegistry(pool, rec);
  onWorldScan(() => refreshServerEntities(pool));
}

function refreshServerEntities(pool: object): void {
  const rec = StreamingInternals.get(pool);
  if (rec.byRemote.size === 0) return;
  for (const entity of Array.from(rec.byRemote.values())) {
    if (streamEntityState(entity).netId) refreshServerHandle(pool, entity);
  }
}

export function startStreaming(
  pool: object,
  getHandles: () => number[],
  makeEntity: (id: number, handle: number) => any,
  filter?: (handle: number) => boolean,
): void {
  const rec = StreamingInternals.get(pool);
  rec.makeEntity = makeEntity;
  rec.filter = filter ?? null;
  subscribeRegistry(pool, rec);
  onWorldScan(() => scan(pool, getHandles));
}

function createEntity(rec: StreamingInternalsRec, remoteId: number, handle: number | null): any {
  const localId = rec.ids.allocate();
  const entity = rec.makeEntity!(localId, handle as any);
  setEntityRemoteId(entity, remoteId);
  rec.byLocal.set(localId, entity);
  return entity;
}

export function registerLocalStreamed(pool: object, entity: any): any {
  const rec = StreamingInternals.get(pool);
  setEntityRemoteId(entity, INVALID_REMOTE_ID);
  setEntityId(entity, rec.ids.allocate());
  rec.byLocal.set(entity.id, entity);
  poolAdd(pool, entity);
  return entity;
}

function dropEntity(rec: StreamingInternalsRec, entity: any): void {
  rec.byLocal.delete(entity.id);
  rec.ids.free(entity.id);
}

function subscribeRegistry(pool: object, rec: StreamingInternalsRec): void {
  if (!rec.netType) return;
  subscribeEntityRegistry(rec.netType, {
    create: (remoteId: number, data: any) => onServerCreate(pool, remoteId, data),
    netid: (remoteId: number, netId: number) => onServerNetId(pool, remoteId, netId),
    destroy: (remoteId: number) => onServerDestroy(pool, remoteId),
  });
}

function onServerCreate(pool: object, remoteId: number, data: any): void {
  const rec = StreamingInternals.get(pool);
  let entity = rec.byRemote.get(remoteId);
  if (!entity) {
    entity = createEntity(rec, remoteId, null);
    rec.byRemote.set(remoteId, entity);
  }
  const state = streamEntityState(entity);
  state.isServer = true;
  state.serverModel = data?.model ?? 0;
  state.serverPos = { x: data?.x ?? 0, y: data?.y ?? 0, z: data?.z ?? 0 };
  state.serverDimension = data?.dimension ?? 0;
}

function onServerNetId(pool: object, remoteId: number, netId: number): void {
  if (!netId) return;
  const rec = StreamingInternals.get(pool);
  let entity = rec.byRemote.get(remoteId);
  if (!entity) {
    onServerCreate(pool, remoteId, {});
    entity = rec.byRemote.get(remoteId);
  }
  const state = streamEntityState(entity);
  if (state.netId && state.netId !== netId) {
    rec.netIdToRemote.delete(state.netId);
  }
  state.netId = netId;
  rec.netIdToRemote.set(netId, remoteId);
  refreshServerHandle(pool, entity);
}

function onServerDestroy(pool: object, remoteId: number): void {
  const rec = StreamingInternals.get(pool);
  const entity = rec.byRemote.get(remoteId);
  if (!entity) return;
  const state = streamEntityState(entity);
  rec.byRemote.delete(remoteId);
  if (state.netId) rec.netIdToRemote.delete(state.netId);
  if (entity.handle) {
    rec.handleToEntity.delete(entity.handle);
  }
  const entities = poolStore(pool).entities;
  if (entities.has(entity.id)) {
    globalThis.mp?.events?.call("entityStreamOut", entity);
    rec.onStreamOut?.(entity);
    poolRemove(pool, entity.id);
  }
  dropEntity(rec, entity);
  EntityInternals.get(entity).handle = null;
}

export function bindHandle(pool: object, remoteId: number, handle: number, netId: number): any {
  const rec = StreamingInternals.get(pool);
  let entity = rec.byRemote.get(remoteId);
  if (!entity) {
    entity = createEntity(rec, remoteId, handle);
    streamEntityState(entity).isServer = true;
    rec.byRemote.set(remoteId, entity);
  }

  const state = streamEntityState(entity);
  const entities = poolStore(pool).entities;
  const occupant = rec.handleToEntity.get(handle);
  if (occupant && occupant !== entity) {
    rec.handleToEntity.delete(handle);
    if (entities.has(occupant.id)) poolRemove(pool, occupant.id);
  }

  state.isServer = true;
  if (netId) state.netId = netId;
  if (entity.handle && entity.handle !== handle) {
    rec.handleToEntity.delete(entity.handle);
  }
  EntityInternals.get(entity).handle = handle;
  rec.handleToEntity.set(handle, entity);
  try { hydrateSharedData(entity, globalThis.Entity(handle).state); } catch (_) {}
  if (!entities.has(entity.id)) {
    poolAdd(pool, entity);
    globalThis.mp?.events?.call("entityStreamIn", entity);
    rec.onStreamIn?.(entity, handle, netId);
  }
  return entity;
}

export function refreshServerHandle(pool: object, entity: any): any {
  if (!entity) return entity;
  const rec = StreamingInternals.get(pool);
  const state = streamEntityState(entity);
  if (!state.isServer || !state.netId) return entity;
  const handle = safeGetEntityFromNetId(state.netId);
  const valid = !!handle;
  const entities = poolStore(pool).entities;
  if (valid) {
    if (entity.handle !== handle || !entities.has(entity.id)) {
      bindHandle(pool, entity.remoteId, handle, state.netId);
    }
  } else if (entity.handle) {
    rec.handleToEntity.delete(entity.handle);
    if (entities.has(entity.id)) {
      globalThis.mp?.events?.call("entityStreamOut", entity);
      rec.onStreamOut?.(entity);
      poolRemove(pool, entity.id);
    }
    EntityInternals.get(entity).handle = null;
  }
  return entity;
}

export function resolveHandle(pool: object, handle: number): any {
  const rec = StreamingInternals.get(pool);
  if (rec.filter && !rec.filter(handle)) return null;
  if (!handle || !DoesEntityExist(handle)) return null;

  const existing = rec.handleToEntity.get(handle);
  if (existing) return existing;

  const netId = safeGetNetworkId(handle);
  const remoteId = netId ? rec.netIdToRemote.get(netId) : undefined;

  if (remoteId !== undefined) {
    return bindHandle(pool, remoteId, handle, netId);
  }

  const entity = createEntity(rec, INVALID_REMOTE_ID, handle);
  poolAdd(pool, entity);
  rec.handleToEntity.set(handle, entity);
  globalThis.mp?.events?.call("entityStreamIn", entity);
  rec.onStreamIn?.(entity, handle, netId);
  return entity;
}

function scan(pool: object, getHandles: () => number[]): void {
  const rec = StreamingInternals.get(pool);
  const handles = getHandles();
  const activeSet = rec.activeSet;
  activeSet.clear();

  for (const handle of handles) {
    const entity = resolveHandle(pool, handle);
    if (entity) activeSet.add(entity.id);
  }

  const entities = poolStore(pool).entities;
  for (const [handle, entity] of rec.handleToEntity) {
    if (activeSet.has(entity.id)) continue;
    rec.handleToEntity.delete(handle);
    poolRemove(pool, entity.id);
    globalThis.mp?.events?.call("entityStreamOut", entity);
    rec.onStreamOut?.(entity);
    if (streamEntityState(entity).isServer) {
      EntityInternals.get(entity).handle = null;
    } else {
      dropEntity(rec, entity);
    }
  }
}

export function atLocal(pool: object, id: number): any {
  const rec = StreamingInternals.get(pool);
  const entity = rec.byLocal.get(id);
  if (!entity) return null;
  if (streamEntityState(entity).isServer) return refreshServerHandle(pool, entity);
  return entity;
}

export function atRemote(pool: object, remoteId: number): any {
  const entity = StreamingInternals.get(pool).byRemote.get(remoteId);
  if (entity) return refreshServerHandle(pool, entity);
  return null;
}

export function atHandle(pool: object, handle: number): any {
  return StreamingInternals.get(pool).handleToEntity.get(handle) ?? null;
}

export function atNetId(pool: object, netId: number): any {
  if (!netId) return null;
  const rec = StreamingInternals.get(pool);
  const remoteId = rec.netIdToRemote.get(netId);
  if (remoteId !== undefined) {
    const entity = rec.byRemote.get(remoteId);
    if (entity) return refreshServerHandle(pool, entity);
  }
  const handle = safeGetEntityFromNetId(netId);
  if (!handle) return null;
  return rec.handleToEntity.get(handle) ?? null;
}

export function existsRemote(pool: object, entity: any): boolean {
  const rec = StreamingInternals.get(pool);
  if (typeof entity === "number") {
    return rec.byLocal.has(entity);
  }
  if (!entity || typeof entity !== "object") return false;
  return rec.byLocal.has(entity.id);
}

export function removeFromStreamingPool(pool: object, id: number): void {
  const rec = StreamingInternals.get(pool);
  const entity = rec.byLocal.get(id) ?? poolStore(pool).entities.get(id);
  if (entity) {
    if (entity.handle) rec.handleToEntity.delete(entity.handle);
    const state = streamEntityState(entity);
    if (state.netId) rec.netIdToRemote.delete(state.netId);
    if (entity.remoteId !== INVALID_REMOTE_ID) rec.byRemote.delete(entity.remoteId);
    dropEntity(rec, entity);
    poolRemove(pool, entity.id);
    return;
  }
  poolRemove(pool, id);
}
