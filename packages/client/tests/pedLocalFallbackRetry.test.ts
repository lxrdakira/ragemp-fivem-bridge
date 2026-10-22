import { Entity as SharedEntity } from "@ragemp-fivem-bridge/shared";
import { CONSTRUCT, initPool } from "@ragemp-fivem-bridge/shared/internal";
import { setupPedPool } from "../src/internal/pools/pedPoolService";
import { atRemote, setupStreamingPool } from "../src/internal/pools/streamingService";
import { StreamingInternals } from "../src/internal/streamingInternals";

const netHandlers = new Map<string, (...args: any[]) => void>();
const eventHandlers = new Map<string, (...args: any[]) => void>();
const intervals = new Map<number, () => void>();
let nextIntervalId = 1;
let gameTime = 0;
let modelLoaded = false;
let requests = 0;
let creates = 0;
const liveHandles = new Set<number>();

(globalThis as any).onNet = (name: string, handler: (...args: any[]) => void) => netHandlers.set(name, handler);
(globalThis as any).on = (name: string, handler: (...args: any[]) => void) => eventHandlers.set(name, handler);
(globalThis as any).setInterval = (handler: () => void) => {
  const id = nextIntervalId++;
  intervals.set(id, handler);
  return id;
};
(globalThis as any).clearInterval = (id: number) => intervals.delete(id);
(globalThis as any).GetCurrentResourceName = () => "test-resource";
(globalThis as any).GetGameTimer = () => gameTime;
(globalThis as any).HasModelLoaded = () => modelLoaded;
(globalThis as any).RequestModel = () => { requests++; };
(globalThis as any).CreatePed = () => {
  const handle = 200 + creates++;
  liveHandles.add(handle);
  return handle;
};
(globalThis as any).DoesEntityExist = (handle: number) => liveHandles.has(handle);
(globalThis as any).GetEntityType = () => 1;
(globalThis as any).IsPedAPlayer = () => false;
(globalThis as any).SetEntityAsMissionEntity = () => {};
(globalThis as any).SetBlockingOfNonTemporaryEvents = () => {};
(globalThis as any).SetModelAsNoLongerNeeded = () => {};
(globalThis as any).SetEntityVisible = () => {};
(globalThis as any).DeleteEntity = (handle: number) => { liveHandles.delete(handle); };
(globalThis as any).mp = { events: { call: () => {} } };

class TestPed extends SharedEntity {
  constructor(id: number, handle: number | null) {
    super(CONSTRUCT, id, "ped", handle);
  }
  destroy(): void {}
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const pool = {};
initPool(pool);
setupStreamingPool(pool, "ped");
StreamingInternals.get(pool).makeEntity = (id, handle) => new TestPed(id, handle);
setupPedPool(pool);

const localCreate = netHandlers.get("ragemp:ped:localCreate");
assert(localCreate, "local ped creation event was not registered");
localCreate(17, 123, 10, 20, 31.12, 90, 0);
assert(requests === 1 && creates === 0, "missing model was not requested");
assert(intervals.size === 2, "retry timer was not retained alongside the protection timer");

gameTime = 31_000;
const retry = intervals.get(2);
assert(retry, "missing model retry interval was not registered");
retry();
assert(requests === 2 && intervals.has(2), "retry stopped after the old 30-second deadline");

modelLoaded = true;
retry();
assert(creates === 1, "late-loaded model did not create the NPC");
assert((atRemote(pool, 17) as TestPed | null)?.handle === 200, "late NPC lost its stable remote id");
assert(!intervals.has(2), "retry timer survived successful creation");
localCreate(17, 123, 10, 20, 31.12, 90, 0);
assert(creates === 1, "repeat snapshot duplicated a live NPC");
const protectionTimer = intervals.get(1);
assert(protectionTimer, "local NPC health timer was not registered");
liveHandles.delete(200);
for (let tick = 0; tick < 10; tick++) protectionTimer();
assert(creates === 2, "lost local NPC was not recreated without another server snapshot");
assert((atRemote(pool, 17) as TestPed | null)?.handle === 201, "automatic recovery lost the stable remote id");
localCreate(17, 123, 10, 20, 31.12, 90, 0);
assert(creates === 2, "repeat snapshot duplicated an automatically recovered NPC");
liveHandles.delete(201);
localCreate(17, 123, 10, 20, 31.12, 90, 0);
assert(creates === 3, "repeat snapshot did not recreate an NPC whose native handle vanished");
assert((atRemote(pool, 17) as TestPed | null)?.handle === 202, "snapshot recovery lost its stable remote id");

modelLoaded = false;
localCreate(18, 456, 10, 20, 31.12, 90, 0);
assert(intervals.has(3), "second NPC did not retain its retry timer");
netHandlers.get("ragemp:entity:destroy")?.("ped", 18);
assert(!intervals.has(3), "destroyed NPC kept retrying its model");
modelLoaded = true;
for (let tick = 0; tick < 10; tick++) protectionTimer();
assert(creates === 3, "destroyed NPC was recreated by the health check");

eventHandlers.get("onResourceStop")?.("test-resource");
assert(intervals.size === 0, "resource stop left NPC timers running");
console.log("PASS static NPC model retry, automatic recovery, snapshot recovery and timer cleanup");
