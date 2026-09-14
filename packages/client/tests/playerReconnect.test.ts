import "./vehicleNativeStubs";
import { PlayerMpPool } from "../src/Pools/PlayerMpPool";
import { playerByServerId } from "../src/internal/pools/playerPoolService";
import { applySharedDataValue, setSharedDataChangeSink } from "../src/utils/sharedData";

const globals = globalThis as any;
const handlers = new Map<string, Function>();
const intervals: Function[] = [];
const ticks: Function[] = [];
let source = 14;
const bags: Record<number, any> = {
  14: { "rmp:ALVL": 8, "rmp:__bridgeName": "Old_Name", "rmp:oldOnly": true },
  15: { "rmp:ALVL": 8, "rmp:__bridgeName": "Artem_Akirov", "rmp:UUID": 26 },
  16: { "rmp:__bridgeName": "Regular_Player", "rmp:UUID": 27 },
};
globals.PlayerId = () => 0;
globals.GetPlayerServerId = () => source;
globals.GetPlayerFromServerId = (id: number) => id === source ? 0 : -1;
globals.GetActivePlayers = () => [0];
globals.GetGamePool = () => [];
globals.PlayerPedId = () => 741890;
globals.GetPlayerPed = () => 741890;
globals.Player = (id: number) => ({ state: bags[id] ?? {} });
globals.onNet = (event: string, fn: Function) => handlers.set(event, fn);
globals.on = () => {};
globals.setInterval = (fn: Function) => { intervals.push(fn); return intervals.length; };
globals.setTick = (fn: Function) => { ticks.push(fn); return ticks.length; };
globals.clearTick = () => {};
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
const pool = new PlayerMpPool();
globals.mp = { players: pool };
const capturedLocal = pool.local; // Neptune captures this while evaluating its bundle.
let admin = 0;
let notifications = 0;
setSharedDataChangeSink((entity, key, value) => {
  applySharedDataValue(entity, key, value);
  notifications++;
  if (entity === capturedLocal && key === "ALVL") admin = Number(value) || 0;
});
const snapshot = (id: number) => handlers.get("ragemp:player:snapshot")!([[id, id]]);
snapshot(14);
// New snapshot arrives while native still reports the previous valid source.
snapshot(15);
assert(pool.atRemoteId(15) !== capturedLocal, "test must first create the early duplicate");
source = 15;
for (const fn of intervals) fn();
assert(pool.local === capturedLocal, "local wrapper must remain stable for legacy captures");
assert(pool.atRemoteId(15) === capturedLocal, "reconnect left a duplicate instead of the local player");
assert(playerByServerId(15) === capturedLocal, "shared data events route to the wrong wrapper");
assert(pool.atRemoteId(14) !== capturedLocal, "old remote index still aliases local player");
assert(capturedLocal.netId === 15 && capturedLocal.remoteId === 15, "stale identity after reconnect");
assert(capturedLocal.name === "Artem_Akirov", "name must come from the new state bag");
assert(admin === 8, "admin data was not replayed after local promotion");
assert(capturedLocal.getVariable("oldOnly") === undefined, "old session variables leaked");
const afterRecovery = notifications;
for (let i = 0; i < 20; i++) for (const fn of intervals) fn();
assert(notifications === afterRecovery, "unchanged world scans spam data handlers");
source = 0;
for (const fn of intervals) fn();
assert(capturedLocal.remoteId === 15, "transient zero must not attach to another player");
// Subsequent session has no admin data: stale privilege must be cleared.
source = 16;
snapshot(16);
for (const fn of intervals) fn();
assert(pool.atRemoteId(16) === capturedLocal && capturedLocal.netId === 16, "second reconnect failed");
assert(admin === 0 && capturedLocal.getVariable("ALVL") == null, "old admin state leaked to new session");
// Native proxies may expose keyed reads without Object.keys enumeration.
// Preserve the new wrapper's already received events when promoting local.
bags[17] = Object.create(null);
Object.defineProperty(bags[17], "rmp:ALVL", { value: 8, enumerable: false });
Object.defineProperty(bags[17], "rmp:__bridgeName", { value: "Restored_Name", enumerable: false });
snapshot(17);
const early = pool.atRemoteId(17)!;
applySharedDataValue(early, "ALVL", 8);
applySharedDataValue(early, "__bridgeName", "Restored_Name");
source = 17;
for (const fn of intervals) fn();
assert(pool.atRemoteId(17) === capturedLocal && admin === 8, "promotion lost cached replicated values");
assert(capturedLocal.name === "Restored_Name", "promoted name lost on non-enumerable bag");
console.log("PASS player reconnect: delayed native ID, duplicate promotion, stable local object, name/admin hydration, stale-data removal, no repeated events");
