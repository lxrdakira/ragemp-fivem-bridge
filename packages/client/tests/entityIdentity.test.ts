import { Entity as SharedEntity, sanitizeForNet } from "@ragemp-fivem-bridge/shared";
import {
  CONSTRUCT,
  EntityInternals,
  initPool,
  INVALID_REMOTE_ID,
  setEntityRemoteId,
} from "@ragemp-fivem-bridge/shared/internal";
import {
  atRemote,
  bindHandle,
  bindLocalFallbackHandle,
  resolveHandle,
  setupStreamingPool,
} from "../src/internal/pools/streamingService";
import { StreamingInternals, streamEntityState } from "../src/internal/streamingInternals";
import { safeGetEntityFromNetId } from "../src/utils/netId";
import {
  BrowserInternals,
  initBrowserInternals,
  setHeadlessBrowser,
  setHeadlessBrowserActive,
} from "../src/internal/browserInternals";

const bags = new Map<number, Record<string, unknown>>();
const emitted: unknown[][] = [];
const streamed: unknown[] = [];
let networkResolutionAvailable = true;
let networkAdvisoryAvailable = true;
let nativeHandlesAvailable = true;
let localVehicleHandle = 0;
let gameTimer = 5000;
let networkResolverCalls = 0;

(globalThis as any).DoesEntityExist = (handle: number) => nativeHandlesAvailable && (handle === 100 || handle === 101 || handle === 102);
(globalThis as any).NetworkGetEntityIsNetworked = () => true;
(globalThis as any).NetworkGetNetworkIdFromEntity = (handle: number) => handle === 102 ? 903 : handle === 101 ? 902 : 901;
(globalThis as any).NetworkGetEntityFromNetworkId = (netId: number) => {
  networkResolverCalls++;
  return !networkResolutionAvailable
    ? 0
    : netId === 901 ? 100 : netId === 902 ? 101 : netId === 903 ? 102 : 0;
};
(globalThis as any).NetworkDoesNetworkIdExist = (netId: number) => networkAdvisoryAvailable && networkResolutionAvailable
  && (netId === 901 || netId === 902 || netId === 903);
(globalThis as any).GetEntityFromStateBagName = (name: string) => {
  const netId = Number(name.replace(/^entity:/, ""));
  return networkResolutionAvailable && netId === 901 ? 100 : 0;
};
(globalThis as any).GetEntityModel = () => 123456;
(globalThis as any).GetEntityCoords = (handle: number) => handle === 102 ? [40, 50, 60] : handle === 101 ? [10, 20, 30] : [0, 0, 0];
(globalThis as any).GetVehicleNumberPlateText = (handle: number) => handle === 102 ? "TEMP89" : handle === 101 ? " RENT 002 " : "RENT001";
(globalThis as any).GetGameTimer = () => gameTimer;
(globalThis as any).PlayerPedId = () => 500;
(globalThis as any).GetVehiclePedIsIn = () => localVehicleHandle;
(globalThis as any).emitNet = (...args: unknown[]) => emitted.push(args);
(globalThis as any).Entity = (handle: number) => ({ state: bags.get(handle) ?? {} });
(globalThis as any).mp = { events: { call: (...args: unknown[]) => streamed.push(args) } };

class TestVehicle extends SharedEntity {
  constructor(id: number, handle: number | null) {
    super(CONSTRUCT, id, "vehicle", handle);
    const internals = EntityInternals.get(this);
    internals.stateBag = () => bags.get(this.handle) ?? {};
    internals.stateBagReady = () => this.handle !== 0;
  }

  get netId(): number { return this.handle ? 901 : 0; }
  destroy(): void {}
}

class TestPed extends SharedEntity {
  constructor(id: number, handle: number | null) {
    super(CONSTRUCT, id, "ped", handle);
  }
  destroy(): void {}
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// BestMP's advisory existence native can lag while the state-bag registry
// already exposes the live handle. Prefer that silent path to the noisy native.
networkAdvisoryAvailable = false;
const callsBeforeStateBagResolution = networkResolverCalls;
assert(safeGetEntityFromNetId(901) === 100, "false network-id advisory blocked a live vehicle handle");
assert(networkResolverCalls === callsBeforeStateBagResolution, "state-bag resolution unnecessarily called the noisy resolver");

// A stale id may be touched from several per-frame compatibility paths. The
// noisy native must never be called after the silent advisory rejects it.
networkResolutionAvailable = false;
const callsBeforeMissingProbe = networkResolverCalls;
assert(safeGetEntityFromNetId(65321) === 0, "missing network id unexpectedly resolved");
assert(safeGetEntityFromNetId(65321) === 0, "cached missing network id unexpectedly resolved");
assert(networkResolverCalls === callsBeforeMissingProbe, "missing network id reached the noisy resolver");
networkResolutionAvailable = true;
networkAdvisoryAvailable = true;

const pool = {};
initPool(pool);
setupStreamingPool(pool, "vehicle");
StreamingInternals.get(pool).makeEntity = (id, handle) => new TestVehicle(id, handle);
bags.set(100, {});

const placeholder = resolveHandle(pool, 100) as TestVehicle;
assert(placeholder.id === 0, "first scanned wrapper should receive local id 0");
assert(placeholder.remoteId === INVALID_REMOTE_ID, "first scanned wrapper must be temporary");
assert(emitted.length === 1 && emitted[0][0] === "ragemp:entity:resolve", "missing server resolver request");

bags.get(100)!["rmp:__bridgeRemoteId"] = 77;
const serializedBeforePromotion = sanitizeForNet(placeholder) as Record<string, unknown>;
assert(serializedBeforePromotion.id === 77, "serializer did not recover authoritative id from state bag");
assert(serializedBeforePromotion.netId === 901, "serializer dropped network id");

const promoted = resolveHandle(pool, 100) as TestVehicle;
assert(promoted === placeholder, "placeholder must be promoted in place for legacy references");
assert(promoted.remoteId === 77, "promoted vehicle did not receive authoritative remote id");
assert(atRemote(pool, 77) === placeholder, "remote pool index does not point to promoted vehicle");
assert(streamed.some((entry: any) => entry[0] === "entityStreamIn" && entry[1] === placeholder),
  "authoritative stream-in was not replayed");

// BestMP can remap the server's network id. The snapshot stub must still bind
// to the streamed native vehicle through its stable model + plate identity.
const rec = StreamingInternals.get(pool);
const signatureStubId = rec.ids.allocate();
const signatureStub = new TestVehicle(signatureStubId, null);
setEntityRemoteId(signatureStub, 88);
const signatureState = streamEntityState(signatureStub);
signatureState.isServer = true;
signatureState.serverModel = 123456;
signatureState.serverPos = { x: 10, y: 20, z: 30 };
signatureState.serverPlate = "RENT002";
rec.byLocal.set(signatureStubId, signatureStub);
rec.byRemote.set(88, signatureStub);

const signatureMatched = resolveHandle(pool, 101) as TestVehicle;
assert(signatureMatched === signatureStub, "scanner promotion replaced the authoritative server wrapper");
assert(signatureMatched.remoteId === 88, "stable vehicle signature did not recover bridge id");
assert(signatureMatched.handle === 101, "signature match did not bind the streamed native handle");
assert(atRemote(pool, 88) === signatureMatched, "signature match did not repair the remote index");

// BestMP can expose a temporary plate during the first streamed frame. A
// unique same-model native at the authoritative spawn position must still be
// promoted so the following PETROL/access/engine batches reach the vehicle.
const fallbackHandle = 102;
const fallbackStubId = rec.ids.allocate();
const fallbackStub = new TestVehicle(fallbackStubId, null);
setEntityRemoteId(fallbackStub, 89);
const fallbackState = streamEntityState(fallbackStub);
fallbackState.isServer = true;
fallbackState.serverModel = 123456;
fallbackState.serverPos = { x: 40, y: 50, z: 60 };
fallbackState.serverPlate = "SERVER89";
rec.byLocal.set(fallbackStubId, fallbackStub);
rec.byRemote.set(89, fallbackStub);

const fallbackMatched = resolveHandle(pool, fallbackHandle) as TestVehicle;
assert(fallbackMatched === fallbackStub, "spawn-position fallback did not preserve the server wrapper");
assert(fallbackMatched.remoteId === 89, "spawn-position fallback lost the authoritative bridge id");
assert(fallbackMatched.handle === fallbackHandle, "spawn-position fallback did not bind the native handle");

// A remapped BestMP network id can transiently point another server stub at
// the same native handle. The already-bound matching wrapper must win instead
// of being nulled and replaced with an INVALID_REMOTE_ID wrapper next scan.
const competingStubId = rec.ids.allocate();
const competingStub = new TestVehicle(competingStubId, null);
setEntityRemoteId(competingStub, 99);
const competingState = streamEntityState(competingStub);
competingState.isServer = true;
competingState.serverModel = 123456;
competingState.serverPos = { x: 10, y: 20, z: 30 };
competingState.serverPlate = "RENT002";
competingState.netId = 999;
rec.byLocal.set(competingStubId, competingStub);
rec.byRemote.set(99, competingStub);
const retainedAcrossConflictingBind = bindHandle(pool, 99, 101, 999) as TestVehicle;
assert(retainedAcrossConflictingBind === signatureMatched, "conflicting network-id bind replaced the authoritative wrapper");
assert(signatureMatched.handle === 101, "conflicting network-id bind nulled the authoritative handle");
assert(signatureMatched.remoteId === 88, "conflicting network-id bind changed the stable remote id");
assert(rec.netIdToRemote.get(999) === 88, "remapped network id was not repaired to the retained wrapper");

// Ownership migration can briefly make a valid network id unresolvable even
// though the GTA native is still alive. The bridge must not discard the RAGE
// remote id during that gap.
networkResolutionAvailable = false;
const retainedDuringMigration = atRemote(pool, 88) as TestVehicle;
assert(retainedDuringMigration === signatureMatched, "network-id gap replaced the server wrapper");
assert(retainedDuringMigration.handle === 101, "live native handle was detached during network-id gap");
assert(retainedDuringMigration.remoteId === 88, "remote id was lost during network-id gap");
networkResolutionAvailable = true;

// Some BestMP ownership transfers temporarily hide the native from
// DoesEntityExist after GTA has already seated the local player in it. The
// authoritative wrapper and remote id must survive that contradictory frame.
networkResolutionAvailable = false;
nativeHandlesAvailable = false;
localVehicleHandle = 101;
const retainedWhileOccupied = atRemote(pool, 88) as TestVehicle;
assert(retainedWhileOccupied.handle === 101, "occupied vehicle lost its native handle during ownership migration");
assert(retainedWhileOccupied.remoteId === 88, "occupied vehicle lost its stable remote id");

// Once it is no longer the local player's vehicle, still allow a bounded
// migration gap; after the grace period a genuinely streamed-out native is
// detached normally.
localVehicleHandle = 0;
const retainedDuringGrace = atRemote(pool, 88) as TestVehicle;
assert(retainedDuringGrace.handle === 101, "server vehicle was detached before the migration grace period");
gameTimer += 10_001;
const detachedAfterGrace = atRemote(pool, 88) as TestVehicle;
assert(detachedAfterGrace.handle === 0, "genuinely missing vehicle was not detached after the grace period");

// A static NPC whose server-native creation fails must retain an authoritative
// RAGE id even though each client owns its fallback native locally.
nativeHandlesAvailable = true;
const pedPool = {};
initPool(pedPool);
setupStreamingPool(pedPool, "ped");
StreamingInternals.get(pedPool).makeEntity = (id, handle) => new TestPed(id, handle);
const fallbackPed = bindLocalFallbackHandle(
  pedPool,
  321,
  100,
  { model: 123456, x: 1, y: 2, z: 3, dimension: 7 },
) as TestPed;
assert(fallbackPed.remoteId === 321, "local NPC fallback lost its authoritative remote id");
assert(fallbackPed.handle === 100, "local NPC fallback did not bind its native handle");
assert(fallbackPed.dimension === 7, "local NPC fallback lost its dimension");
assert(streamEntityState(fallbackPed).isLocalFallback, "local NPC fallback was not marked for local cleanup");
assert(atRemote(pedPool, 321) === fallbackPed, "local NPC fallback is absent from the remote pool index");

// World-marker render loops repeat `browser.active = true` every frame. A
// pending DUI activation must survive those idempotent assignments.
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;
let nextTimerId = 1;
const activeTimers = new Set<number>();
(globalThis as any).setTimeout = (_callback: Function, _delay: number) => {
  const id = nextTimerId++;
  activeTimers.add(id);
  return id;
};
(globalThis as any).clearTimeout = (id: number) => activeTimers.delete(id);
const headlessBrowser = {} as any;
initBrowserInternals(headlessBrowser, "http://package/cef/test.html");
setHeadlessBrowser(headlessBrowser, {
  dui: 0,
  resolvedUrl: "https://cfx-nui-test/cef/test.html",
  textureDict: "",
  textureName: "test",
  width: 256,
  height: 256,
  surfaceGeneration: 0,
  readyTimer: null,
  activationTimer: null,
  idleTimer: null,
  pendingPayloads: [],
  replayPayloads: [],
});
BrowserInternals.get(headlessBrowser).active = true;
setHeadlessBrowserActive(headlessBrowser, true);
setHeadlessBrowserActive(headlessBrowser, true);
assert(activeTimers.size === 1, "repeated headless activation reset/rearmed the DUI timer");
BrowserInternals.get(headlessBrowser).active = false;
setHeadlessBrowserActive(headlessBrowser, false);
assert(activeTimers.size === 0, "headless activation timer survived deactivation");
(globalThis as any).setTimeout = originalSetTimeout;
(globalThis as any).clearTimeout = originalClearTimeout;

console.log("PASS client identity, local NPC fallback, and headless DUI activation");
