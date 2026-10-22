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
import { hydrateSharedData, notifySharedDataValue } from "../../utils/sharedData";
import { setNativeEntityDimension, unregisterNativeDimensionEntity } from "../../utils/nativeEntityDimension";
import { clearDeferredNativeActions } from "../../utils/nativeEntityReady";

export const LOCAL_STREAM_ID_BASE = 2_000_000_000;
const REMOTE_ID_STATE_KEY = "rmp:__bridgeRemoteId";
const resolveRequests = new Map<string, number>();
const carshareIdentityDiagnostics = new Set<string>();
const SERVER_HANDLE_MISSING_GRACE_MS = 10_000;
const VEHICLE_PLATE_FALLBACK_MAX_DISTANCE_SQUARED = 64;
const CARSHARE_RENT2114_MODEL = 2_741_568_832;
const IDENTITY_DIAGNOSTIC_BUILD = "vehicle-netid-fallback-20260901-1";
// The identity trace was temporary instrumentation used to validate the
// vehicle remapping fix. Keep it available for targeted debugging, but do not
// flood the client console and client_trycatch during normal play.
const IDENTITY_DIAGNOSTICS_ENABLED = false;

function reportIdentityPath(stage: string, rec: StreamingInternalsRec, entity: any, extra: Record<string, unknown> = {}): void {
  if (!IDENTITY_DIAGNOSTICS_ENABLED) return;
  if (rec.netType !== "vehicle" || !entity) return;
  const state = streamEntityState(entity);
  const payload = JSON.stringify({
    build: IDENTITY_DIAGNOSTIC_BUILD,
    stage,
    remoteId: Number(entity.remoteId ?? INVALID_REMOTE_ID),
    localId: Number(entity.id ?? -1),
    handle: Number(entity.handle ?? 0),
    netId: Number(state.netId ?? 0),
    isServer: !!state.isServer,
    poolHasExactEntity: rec.byLocal.get(entity.id) === entity,
    playerVehicleHandle: (() => {
      try {
        const ped = typeof PlayerPedId === "function" ? PlayerPedId() : 0;
        return ped ? GetVehiclePedIsIn(ped, false) : 0;
      } catch (_) { return 0; }
    })(),
    ...extra,
  });
  try { console.warn(`[BridgeIdentity] ${payload}`); } catch (_) {}
  try {
    globalThis.mp?.events?.callRemote?.("client_trycatch", "bridge-entity-identity", stage, payload);
  } catch (_) {}
}

function monotonicNow(): number {
  return typeof GetGameTimer === "function" ? GetGameTimer() : Date.now();
}

function isLocalPlayerVehicle(rec: StreamingInternalsRec, handle: number): boolean {
  if (rec.netType !== "vehicle" || !handle) return false;
  try {
    const ped = typeof PlayerPedId === "function" ? PlayerPedId() : 0;
    return !!ped && GetVehiclePedIsIn(ped, false) === handle;
  } catch (_) {
    return false;
  }
}

function retainMissingServerHandle(rec: StreamingInternalsRec, entity: any, handle: number): boolean {
  if (!streamEntityState(entity).isServer) return false;

  // During a BestMP ownership migration DoesEntityExist can briefly report
  // false for the very vehicle GTA already put the local player into. The
  // native handle is still authoritative in GetVehiclePedIsIn, so detaching it
  // here loses the stable RAGE remoteId and creates a 65535 wrapper later.
  if (isLocalPlayerVehicle(rec, handle)) {
    rec.missingHandleSince.delete(handle);
    return true;
  }

  const now = monotonicNow();
  const missingSince = rec.missingHandleSince.get(handle);
  if (missingSince === undefined) {
    rec.missingHandleSince.set(handle, now);
    return true;
  }
  return now - missingSince < SERVER_HANDLE_MISSING_GRACE_MS;
}

function normalizePlate(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, "").toUpperCase();
}

function unsignedModel(value: unknown): number {
  return Number(value ?? 0) >>> 0;
}

function nativePosition(handle: number): { x: number; y: number; z: number } {
  const value: any = GetEntityCoords(handle, true);
  return {
    x: Number(value?.x ?? value?.[0] ?? 0),
    y: Number(value?.y ?? value?.[1] ?? 0),
    z: Number(value?.z ?? value?.[2] ?? 0),
  };
}

function identityScore(
  rec: StreamingInternalsRec,
  entity: any,
  handle: number,
  allowPlatePositionFallback = false,
): number | null {
  const state = streamEntityState(entity);
  if (!state.isServer || entity.remoteId <= 0 || entity.remoteId >= INVALID_REMOTE_ID) return null;

  const serverModel = unsignedModel(state.serverModel);
  if (serverModel && unsignedModel(GetEntityModel(handle)) !== serverModel) return null;

  const position = nativePosition(handle);
  const dx = position.x - state.serverPos.x;
  const dy = position.y - state.serverPos.y;
  const dz = position.z - state.serverPos.z;
  const distanceSquared = dx * dx + dy * dy + dz * dz;

  if (rec.netType === "vehicle" && state.serverPlate) {
    let nativePlate = "";
    try { nativePlate = normalizePlate(GetVehicleNumberPlateText(handle)); } catch (_) {}
    const serverPlate = normalizePlate(state.serverPlate);
    if (nativePlate !== serverPlate) {
      // BestMP may materialize a server vehicle with a temporary/default plate
      // before the replicated plate batch is applied. Refusing that native
      // forever leaves the authoritative RAGE wrapper handle-less, so PETROL,
      // access and engine events subsequently target no physical vehicle.
      // Only the world scanner may use this fallback, only at the authoritative
      // spawn snapshot, and findServerIdentityMatch rejects equal-score ties.
      if (allowPlatePositionFallback && distanceSquared <= VEHICLE_PLATE_FALLBACK_MAX_DISTANCE_SQUARED) {
        const key = `plate-position-fallback:${entity.remoteId}:${handle}:${nativePlate}`;
        if (!carshareIdentityDiagnostics.has(key)) {
          carshareIdentityDiagnostics.add(key);
          reportIdentityPath("vehicle-plate-position-fallback", rec, entity, {
            serverPlate,
            nativePlate,
            nativeModel: unsignedModel(GetEntityModel(handle)),
            serverModel,
            distanceSquared,
          });
        }
        return 10_000 - distanceSquared;
      }
      return null;
    }
    // Model + an exact non-empty plate is stable even after the vehicle moves.
    return 1_000_000;
  }

  // Empty/default plates are not identifiers. For those (and for peds/objects)
  // require the same model near the authoritative snapshot position.
  if (distanceSquared > 64) return null;
  return 10_000 - distanceSquared;
}

function findServerIdentityMatch(rec: StreamingInternalsRec, handle: number): any | null {
  let best: any = null;
  let bestScore = -1;
  let tied = false;
  for (const candidate of rec.byRemote.values()) {
    const score = identityScore(rec, candidate, handle, true);
    if (score === null) continue;
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
      tied = false;
    } else if (score === bestScore && candidate !== best) {
      tied = true;
    }
  }
  // Never guess between duplicate model/plate signatures.
  return tied ? null : best;
}

function requestServerResolution(type: string | null, netId: number): void {
  if (!type || !netId || netId <= 0 || typeof emitNet !== "function") return;
  const key = `${type}:${netId}`;
  const now = typeof GetGameTimer === "function" ? GetGameTimer() : Date.now();
  const previous = resolveRequests.get(key) ?? -10000;
  // Resolution is only a last-resort repair path. State bags and the bootstrap
  // registry normally bind the entity; a short interval here used to flood the
  // server once per unknown ambient vehicle on every world scan.
  if (now - previous < 10000) return;
  resolveRequests.set(key, now);
  emitNet("ragemp:entity:resolve", type, netId);
}

function remoteIdFromStateBag(handle: number): number | undefined {
  try {
    const value = Number(globalThis.Entity(handle).state[REMOTE_ID_STATE_KEY]);
    // Server-side bridge ids start at 1. Treat zero exactly like the temporary
    // INVALID_REMOTE_ID wrapper: exposing either value to legacy gameplay makes
    // the C# dispatcher resolve the vehicle argument as null.
    if (Number.isInteger(value) && value > 0 && value < INVALID_REMOTE_ID) return value;
  } catch (_) {}
  return undefined;
}

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
    shared: (remoteId: number, key: string, value: any) => {
      const entity = rec.byRemote.get(remoteId);
      if (entity) notifySharedDataValue(entity, key, value);
    },
  });
}

export function onServerCreate(pool: object, remoteId: number, data: any): void {
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
  // Keep the public wrapper in the same world as its authoritative registry.
  setNativeEntityDimension(entity, state.serverDimension);
  state.serverPlate = data?.plate ?? "";
  if (rec.netType === "vehicle" && unsignedModel(state.serverModel) === CARSHARE_RENT2114_MODEL) {
    const key = `create:${remoteId}:${normalizePlate(state.serverPlate)}`;
    if (!carshareIdentityDiagnostics.has(key)) {
      carshareIdentityDiagnostics.add(key);
      reportIdentityPath("carshare-server-create", rec, entity, {
        serverPlate: normalizePlate(state.serverPlate),
        serverModel: unsignedModel(state.serverModel),
        serverPos: state.serverPos,
        serverDimension: state.serverDimension,
      });
    }
  }
}

function adoptPlaceholder(
  pool: object,
  rec: StreamingInternalsRec,
  placeholder: any,
  remoteId: number,
  netId: number,
): any {
  const stub = rec.byRemote.get(remoteId);
  if (stub && stub !== placeholder) {
    // Preserve the authoritative wrapper object. During a OneSync ownership
    // migration the world scanner can discover the native again before its
    // registry/state-bag identity is visible and create an INVALID_REMOTE_ID
    // placeholder. Replacing `stub` with that placeholder invalidates every
    // reference held by the legacy client (the captured object gets handle=0),
    // even though the physical vehicle and its RAGE remote id never changed.
    const entities = poolStore(pool).entities;
    const handle = Number(placeholder.handle ?? 0);
    const stubState = streamEntityState(stub);
    const placeholderState = streamEntityState(placeholder);
    const effectiveNetId = netId || placeholderState.netId || stubState.netId;

    if (entities.has(placeholder.id)) {
      globalThis.mp?.events?.call("entityStreamOut", placeholder);
      rec.onStreamOut?.(placeholder);
      poolRemove(pool, placeholder.id);
    }
    unregisterNativeDimensionEntity(placeholder);
    clearDeferredNativeActions(placeholder);
    if (handle && rec.handleToEntity.get(handle) === placeholder) {
      rec.handleToEntity.delete(handle);
    }
    EntityInternals.get(placeholder).handle = null;
    dropEntity(rec, placeholder);

    if (stub.handle && stub.handle !== handle && rec.handleToEntity.get(stub.handle) === stub) {
      rec.handleToEntity.delete(stub.handle);
    }
    setEntityRemoteId(stub, remoteId);
    stubState.isServer = true;
    if (stubState.netId && stubState.netId !== effectiveNetId) {
      rec.netIdToRemote.delete(stubState.netId);
    }
    stubState.netId = effectiveNetId;
    EntityInternals.get(stub).handle = handle;
    rec.byRemote.set(remoteId, stub);
    poolStore(pool).remoteIndex.set(remoteId, stub);
    if (handle) {
      rec.missingHandleSince.delete(handle);
      rec.handleToEntity.set(handle, stub);
    }
    if (effectiveNetId) {
      rec.netIdToRemote.set(effectiveNetId, remoteId);
      resolveRequests.delete(`${rec.netType}:${effectiveNetId}`);
    }

    reportIdentityPath("adopt-placeholder-preserve-stub", rec, stub, {
      discardedLocalId: Number(placeholder.id ?? -1),
      replacementHandle: handle,
    });

    let stateBag: any = null;
    if (handle) {
      try { stateBag = globalThis.Entity(handle).state; } catch (_) {}
    }
    if (!entities.has(stub.id)) {
      if (stateBag) hydrateSharedData(stub, stateBag, false);
      poolAdd(pool, stub);
      if (stateBag) hydrateSharedData(stub, stateBag, true);
      globalThis.mp?.events?.call("entityStreamIn", stub);
      rec.onStreamIn?.(stub, handle, effectiveNetId);
    } else if (stateBag) {
      hydrateSharedData(stub, stateBag);
    }
    return stub;
  }

  const targetState = streamEntityState(placeholder);
  setEntityRemoteId(placeholder, remoteId);
  targetState.isServer = true;
  targetState.netId = netId || targetState.netId;
  rec.byRemote.set(remoteId, placeholder);
  poolStore(pool).remoteIndex.set(remoteId, placeholder);
  if (targetState.netId) rec.netIdToRemote.set(targetState.netId, remoteId);
  resolveRequests.delete(`${rec.netType}:${targetState.netId}`);

  try { hydrateSharedData(placeholder, globalThis.Entity(placeholder.handle).state); } catch (_) {}

  // The first stream-in may have happened while remoteId was INVALID. Replay
  // it once after in-place promotion so legacy systems that index by remoteId
  // (rent, radial menu, keys) can register the authoritative entity.
  globalThis.mp?.events?.call("entityStreamIn", placeholder);
  rec.onStreamIn?.(placeholder, placeholder.handle, targetState.netId);
  return placeholder;
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
  if (rec.netType === "vehicle" && unsignedModel(state.serverModel) === CARSHARE_RENT2114_MODEL) {
    const resolvedHandle = safeGetEntityFromNetId(netId);
    reportIdentityPath("carshare-server-netid", rec, entity, {
      incomingNetId: netId,
      resolvedHandle,
      resolvedExists: !!resolvedHandle && DoesEntityExist(resolvedHandle),
      resolvedModel: resolvedHandle ? unsignedModel(GetEntityModel(resolvedHandle)) : 0,
    });
  }
  refreshServerHandle(pool, entity);
}

function onServerDestroy(pool: object, remoteId: number): void {
  const rec = StreamingInternals.get(pool);
  const entity = rec.byRemote.get(remoteId);
  if (!entity) return;
  const state = streamEntityState(entity);
  reportIdentityPath("server-destroy", rec, entity);
  rec.byRemote.delete(remoteId);
  if (state.netId) rec.netIdToRemote.delete(state.netId);
  if (entity.handle) {
    rec.missingHandleSince.delete(entity.handle);
    rec.handleToEntity.delete(entity.handle);
    if (state.isLocalFallback && DoesEntityExist(entity.handle)) {
      SetEntityAsMissionEntity(entity.handle, true, true);
      DeleteEntity(entity.handle);
    }
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
  const occupant = rec.handleToEntity.get(handle);

  if (occupant && occupant !== entity && occupant.remoteId === INVALID_REMOTE_ID) {
    entity = adoptPlaceholder(pool, rec, occupant, remoteId, netId);
  }
  if (!entity) {
    entity = createEntity(rec, remoteId, handle);
    streamEntityState(entity).isServer = true;
    rec.byRemote.set(remoteId, entity);
  }

  if (occupant && occupant !== entity) {
    const occupantState = streamEntityState(occupant);
    const stateBagRemoteId = remoteIdFromStateBag(handle);
    const occupantScore = occupantState.isServer ? identityScore(rec, occupant, handle) : null;
    const incomingScore = identityScore(rec, entity, handle);

    // Network ids are not stable across a BestMP ownership transfer. The same
    // GTA handle can briefly be resolved through another server stub, and the
    // old implementation unconditionally nulled the already-correct wrapper.
    // Keep the existing authoritative wrapper when its native identity still
    // matches. An explicit state-bag id may override it; otherwise continuity
    // wins ties (important for vehicles with duplicate/default plates).
    const keepOccupant = occupantState.isServer
      && occupant.remoteId > 0
      && occupant.remoteId < INVALID_REMOTE_ID
      && stateBagRemoteId !== remoteId
      && (stateBagRemoteId === occupant.remoteId
        || (stateBagRemoteId === undefined
          && occupantScore !== null
          && (incomingScore === null || occupantScore >= incomingScore)));

    if (keepOccupant) {
      if (netId) {
        if (occupantState.netId && occupantState.netId !== netId) {
          rec.netIdToRemote.delete(occupantState.netId);
        }
        occupantState.netId = netId;
        rec.netIdToRemote.set(netId, occupant.remoteId);
        resolveRequests.delete(`${rec.netType}:${netId}`);
      }
      rec.missingHandleSince.delete(handle);
      return occupant;
    }
  }

  const state = streamEntityState(entity);
  const entities = poolStore(pool).entities;
  if (occupant && occupant !== entity) {
    rec.handleToEntity.delete(handle);
    if (entities.has(occupant.id)) {
      globalThis.mp?.events?.call("entityStreamOut", occupant);
      rec.onStreamOut?.(occupant);
      poolRemove(pool, occupant.id);
    }

    // World scanning can see a OneSync entity before its registry/state-bag
    // metadata. Do not leave that INVALID_REMOTE_ID wrapper addressable after
    // the authoritative server wrapper is bound to the same native handle.
    const occupantState = streamEntityState(occupant);
    reportIdentityPath("bind-evict-occupant", rec, occupant, {
      incomingRemoteId: remoteId,
      incomingLocalId: Number(entity.id ?? -1),
      incomingNetId: netId,
      stateBagRemoteId: remoteIdFromStateBag(handle) ?? null,
      occupantIdentityScore: identityScore(rec, occupant, handle),
      incomingIdentityScore: identityScore(rec, entity, handle),
    });
    EntityInternals.get(occupant).handle = null;
    if (!occupantState.isServer) dropEntity(rec, occupant);
  }

  state.isServer = true;
  if (netId) state.netId = netId;
  if (netId) resolveRequests.delete(`${rec.netType}:${netId}`);
  if (entity.handle && entity.handle !== handle) {
    rec.handleToEntity.delete(entity.handle);
  }
  EntityInternals.get(entity).handle = handle;
  rec.missingHandleSince.delete(handle);
  rec.handleToEntity.set(handle, entity);
  if (!entities.has(entity.id)) {
    // Populate dynamic properties before entityCreated, then replay the same
    // state through addDataHandler only after pool existence checks can pass.
    let stateBag: any = null;
    try { stateBag = globalThis.Entity(handle).state; } catch (_) {}
    if (stateBag) hydrateSharedData(entity, stateBag, false);
    poolAdd(pool, entity);
    if (stateBag) hydrateSharedData(entity, stateBag, true);
    globalThis.mp?.events?.call("entityStreamIn", entity);
    rec.onStreamIn?.(entity, handle, netId);
  } else {
    try { hydrateSharedData(entity, globalThis.Entity(handle).state); } catch (_) {}
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
    rec.missingHandleSince.delete(handle);
    // BestMP may expose a different network-id namespace to the importing
    // client resource. Refuse a coincidental net-id collision with a vehicle
    // whose stable model/plate/position signature belongs to another entity.
    if (identityScore(rec, entity, handle) === null) return entity;
    if (entity.handle !== handle || !entities.has(entity.id)) {
      bindHandle(pool, entity.remoteId, handle, state.netId);
    }
  } else if (entity.handle) {
    // BestMP can temporarily stop resolving a valid OneSync network id while
    // the native entity is still alive (most often while entering a vehicle or
    // while ownership migrates). Detaching here used to turn an authoritative
    // RAGE vehicle into an INVALID_REMOTE_ID wrapper a few seconds later, so
    // every subsequent server action received a null vehicle. Keep the stable
    // handle until the native itself is genuinely gone; onServerDestroy remains
    // the authoritative immediate removal path.
    if (DoesEntityExist(entity.handle)) {
      rec.missingHandleSince.delete(entity.handle);
      return entity;
    }
    if (retainMissingServerHandle(rec, entity, entity.handle)) return entity;
    reportIdentityPath("refresh-detach", rec, entity, {
      nativeExists: DoesEntityExist(entity.handle),
    });
    rec.missingHandleSince.delete(entity.handle);
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
  if (!matchesPoolHandle(rec, handle)) return null;

  const existing = rec.handleToEntity.get(handle);
  if (existing) {
    if (existing.remoteId === INVALID_REMOTE_ID) {
      const stateRemoteId = remoteIdFromStateBag(handle);
      if (stateRemoteId !== undefined) {
        const existingNetId = safeGetNetworkId(handle);
        return adoptPlaceholder(pool, rec, existing, stateRemoteId, existingNetId);
      }
      const existingNetId = safeGetNetworkId(handle);
      const identity = findServerIdentityMatch(rec, handle);
      if (identity) return adoptPlaceholder(pool, rec, existing, identity.remoteId, existingNetId);
      if (existingNetId) requestServerResolution(rec.netType, existingNetId);
    }
    return existing;
  }

  const netId = safeGetNetworkId(handle);
  const mappedRemoteId = netId ? rec.netIdToRemote.get(netId) : undefined;
  const mappedEntity = mappedRemoteId !== undefined ? rec.byRemote.get(mappedRemoteId) : undefined;
  const validMappedRemoteId = mappedEntity && identityScore(rec, mappedEntity, handle) !== null
    ? mappedRemoteId
    : undefined;
  const identity = findServerIdentityMatch(rec, handle);
  const remoteId = validMappedRemoteId ?? remoteIdFromStateBag(handle) ?? identity?.remoteId;

  if (remoteId !== undefined) {
    if (netId) rec.netIdToRemote.set(netId, remoteId);
    return bindHandle(pool, remoteId, handle, netId);
  }

  if (netId) requestServerResolution(rec.netType, netId);

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
    if (entity) {
      rec.missingHandleSince.delete(handle);
      activeSet.add(entity.id);
    }
  }

  const entities = poolStore(pool).entities;
  for (const [handle, entity] of rec.handleToEntity) {
    if (activeSet.has(entity.id)) continue;
    // GetGamePool is only a snapshot and can omit a live network entity for a
    // pass during scope/ownership transitions. A native existence check is the
    // reliable boundary for stream-out; preserving the wrapper also preserves
    // its server remoteId across the transient gap.
    if (DoesEntityExist(handle)) {
      rec.missingHandleSince.delete(handle);
      activeSet.add(entity.id);
      continue;
    }
    if (retainMissingServerHandle(rec, entity, handle)) {
      activeSet.add(entity.id);
      continue;
    }
    reportIdentityPath("scan-detach", rec, entity, {
      scannedHandle: handle,
      nativeExists: DoesEntityExist(handle),
    });
    rec.missingHandleSince.delete(handle);
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
  const rec = StreamingInternals.get(pool);
  return matchesPoolHandle(rec, handle) ? rec.handleToEntity.get(handle) ?? null : null;
}

function matchesPoolHandle(rec: StreamingInternalsRec, handle: number): boolean {
  if (!handle || !DoesEntityExist(handle)) return false;
  const type = GetEntityType(handle);
  if (rec.netType === "vehicle" && type !== 2) return false;
  if (rec.netType === "object" && type !== 3) return false;
  if (rec.netType === "ped" && (type !== 1 || IsPedAPlayer(handle))) return false;
  return !rec.filter || rec.filter(handle);
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
  return rec.byLocal.get(entity.id) === entity;
}

/**
 * Attach a client-owned native to an authoritative server stub. This is used
 * for static NPCs when the custom runtime refuses to allocate another OneSync
 * ped. The entity still keeps its stable RAGE remote id/shared data and follows
 * the normal stream-in/destroy lifecycle.
 */
export function bindLocalFallbackHandle(
  pool: object,
  remoteId: number,
  handle: number,
  data: { model: number; x: number; y: number; z: number; dimension: number },
): any {
  if (!handle || !DoesEntityExist(handle)) return null;
  const rec = StreamingInternals.get(pool);
  let entity = rec.byRemote.get(remoteId);
  if (!entity) {
    entity = createEntity(rec, remoteId, null);
    rec.byRemote.set(remoteId, entity);
  }
  const state = streamEntityState(entity);
  state.isServer = true;
  state.isLocalFallback = true;
  state.netId = 0;
  state.serverModel = data.model ?? 0;
  state.serverPos = { x: data.x ?? 0, y: data.y ?? 0, z: data.z ?? 0 };
  state.serverDimension = data.dimension ?? 0;

  if (entity.handle && entity.handle !== handle) {
    rec.handleToEntity.delete(entity.handle);
    if (DoesEntityExist(entity.handle)) DeleteEntity(entity.handle);
  }
  EntityInternals.get(entity).handle = handle;
  EntityInternals.get(entity).dimension = data.dimension ?? 0;
  rec.handleToEntity.set(handle, entity);
  poolStore(pool).remoteIndex.set(remoteId, entity);

  const entities = poolStore(pool).entities;
  if (!entities.has(entity.id)) {
    poolAdd(pool, entity);
    globalThis.mp?.events?.call("entityStreamIn", entity);
    rec.onStreamIn?.(entity, handle, 0);
  }
  return entity;
}

export function removeFromStreamingPool(pool: object, id: number): void {
  const rec = StreamingInternals.get(pool);
  const entity = rec.byLocal.get(id) ?? poolStore(pool).entities.get(id);
  if (entity) {
    reportIdentityPath("explicit-remove", rec, entity, { requestedLocalId: id });
    unregisterNativeDimensionEntity(entity);
    clearDeferredNativeActions(entity);
    if (entity.handle) rec.handleToEntity.delete(entity.handle);
    const state = streamEntityState(entity);
    if (entity.handle) rec.missingHandleSince.delete(entity.handle);
    if (state.netId) rec.netIdToRemote.delete(state.netId);
    if (entity.remoteId !== INVALID_REMOTE_ID) rec.byRemote.delete(entity.remoteId);
    dropEntity(rec, entity);
    poolRemove(pool, entity.id);
    return;
  }
  poolRemove(pool, id);
}
