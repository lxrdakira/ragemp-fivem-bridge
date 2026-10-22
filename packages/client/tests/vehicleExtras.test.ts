import "./vehicleNativeStubs";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { VehicleMp } from "../src/Entities/VehicleMp";
import { applyVehicleExtra } from "../src/utils/vehicleSync";

const calls: Array<[number, number, boolean]> = [];
(globalThis as any).SetVehicleExtra = (handle: number, id: number, disabled: boolean) => {
  calls.push([handle, id, disabled]);
};
const vehicle = {
  id: 42,
  handle: 100,
  setExtra: VehicleMp.prototype.setExtra,
  getExtraColours: VehicleMp.prototype.getExtraColours,
  getMaxBraking: VehicleMp.prototype.getMaxBraking,
  setWindowTint: VehicleMp.prototype.setWindowTint,
};

(globalThis as any).GetVehicleExtraColours = (handle: number) => {
  assert.equal(handle, vehicle.handle);
  return [12, 34];
};
(globalThis as any).GetVehicleMaxBraking = (handle: number) => {
  assert.equal(handle, vehicle.handle);
  return 0.85;
};
assert.deepEqual(vehicle.getExtraColours(), { pearlescentColor: 12, wheelColor: 34 });
assert.equal(vehicle.getMaxBraking(), 0.85);
(globalThis as any).SetVehicleWindowTint = (handle: number, tint: number) => {
  assert.equal(handle, vehicle.handle);
  assert.equal(tint, 3);
};
vehicle.setWindowTint(3);

// RAGE's CLIENT API accepts `disabled`, unlike its server API's enabled state.
for (const disabled of [false, true, 0, 1]) {
  vehicle.setExtra(3, disabled as any);
  assert.deepEqual(calls.pop(), [100, 3, Boolean(disabled)]);
}
for (const enabled of [false, true]) {
  applyVehicleExtra(100, 3, enabled);
  assert.deepEqual(calls.pop(), [100, 3, !enabled]);
}

// Exercise the actual legacy country selector, not a copy of its mapping.
const source = readFileSync("../../../src_client/vehicle/vehiclesync.js", "utf8");
const selector = source.match(/const applyPlateExtras = \(vehicle, country\) => \{[\s\S]*?\n\};/);
assert.ok(selector, "legacy plate selector not found");
const locked = new Set<number>();
const applyPlateExtras = runInNewContext(`${selector[0]}\napplyPlateExtras;`, {
  mp: { vehicles: { exists: (entity: unknown) => entity === vehicle } },
  debugLockedPlateExtras: locked,
});
for (const [country, disabledPair] of [
  ["ru", [3, 4]],
  ["dubai", [1, 2]],
  ["police", [1, 2]],
  ["army", [5, 6]],
  [null, [3, 4]],
] as const) {
  calls.length = 0;
  applyPlateExtras(vehicle, country);
  assert.equal(calls.length, 10, `country ${country}: reset and pair expected`);
  const states = new Map(calls.map(([, id, disabled]) => [id, disabled]));
  for (let id = 1; id <= 8; id++) {
    assert.equal(states.get(id), (disabledPair as readonly number[]).includes(id),
      `country ${country}: extra ${id} differs from RAGE semantics`);
  }
}
calls.length = 0;
locked.add(vehicle.id);
applyPlateExtras(vehicle, "ru");
assert.equal(calls.length, 0, "debug override must remain untouched");
applyPlateExtras(null, "ru");
assert.equal(calls.length, 0, "missing vehicle must remain untouched");
console.log("PASS client/server extra semantics and legacy plate country variants");
