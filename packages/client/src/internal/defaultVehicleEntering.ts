import { isNuiInputCaptured } from "../utils/nuiFocus";

const KEY_F = 70;
const MAX_ENTRY_DISTANCE = 5.5;
const LEGACY_HANDLER_GRACE_MS = 150;
const WARP_FALLBACK_MS = 2200;

let attemptSerial = 0;
let warpTimer: ReturnType<typeof setTimeout> | null = null;

function distanceSquared(a: number[], b: number[]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}

function canAcceptWorldInput(): boolean {
  if (isNuiInputCaptured()) return false;
  if (typeof IsPauseMenuActive === "function" && IsPauseMenuActive()) return false;
  const ped = PlayerPedId();
  return ped !== 0 && !IsEntityDead(ped) && !IsPedInAnyVehicle(ped, false);
}

function isUnlockedForWarp(vehicle: number): boolean {
  try {
    const wrapper = globalThis.mp?.vehicles?.atHandle?.(vehicle);
    const replicatedLock = wrapper?.getVariable?.("vLock");
    if (replicatedLock !== undefined && replicatedLock !== null) {
      return replicatedLock === false || replicatedLock === 0 || replicatedLock === "0";
    }
  } catch (_) {}
  const status = GetVehicleDoorLockStatus(vehicle);
  return status === 0 || status === 1;
}

function isNearbyVehicle(vehicle: number, pedPosition: number[]): boolean {
  if (!vehicle || !DoesEntityExist(vehicle) || IsEntityDead(vehicle)) return false;

  const center = GetEntityCoords(vehicle, false);
  if (distanceSquared(center, pedPosition) <= MAX_ENTRY_DISTANCE * MAX_ENTRY_DISTANCE) return true;

  // The entity origin of long vehicles may be farther away than the driver's
  // door, so also compare against the left/front door area.
  const driverDoor = GetOffsetFromEntityInWorldCoords(vehicle, -1.0, 0.5, 0.0);
  return distanceSquared(driverDoor, pedPosition) <= MAX_ENTRY_DISTANCE * MAX_ENTRY_DISTANCE;
}

function findNearestDriverVehicle(ped: number): number {
  const pedPosition = GetEntityCoords(ped, false);
  let nearest = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  const handles = new Set<number>();

  // Prefer the bridge pool because it is the authoritative RAGE streaming
  // view. Some BestMP builds briefly return an empty native CVehicle pool even
  // though the same OneSync handles are already bound in mp.vehicles.
  try {
    globalThis.mp.vehicles.forEachInStreamRange((vehicle: any) => {
      if (vehicle?.handle) handles.add(vehicle.handle);
    });
  } catch (_) {}
  try {
    for (const vehicle of GetGamePool("CVehicle") as number[]) handles.add(vehicle);
  } catch (_) {}

  for (const vehicle of handles) {
    if (!isNearbyVehicle(vehicle, pedPosition)) continue;
    const driverDoor = GetOffsetFromEntityInWorldCoords(vehicle, -1.0, 0.5, 0.0);
    const dist = Math.min(
      distanceSquared(GetEntityCoords(vehicle, false), pedPosition),
      distanceSquared(driverDoor, pedPosition),
    );
    if (dist < nearestDistance) {
      nearest = vehicle;
      nearestDistance = dist;
    }
  }

  return nearest;
}

function report(stage: string, vehicle: number): void {
  try {
    const netId = NetworkGetEntityIsNetworked(vehicle) ? NetworkGetNetworkIdFromEntity(vehicle) : 0;
    const lock = vehicle ? GetVehicleDoorLockStatus(vehicle) : -1;
    const driver = vehicle ? GetPedInVehicleSeat(vehicle, -1) : -1;
    console.log(`[ragemp-bridge] vehicle-entry ${stage} handle=${vehicle} net=${netId} lock=${lock} driver=${driver}`);
  } catch (_) {}
}

function beginCompatibilityEntry(serial: number): void {
  if (serial !== attemptSerial || !canAcceptWorldInput()) return;

  const ped = PlayerPedId();
  // The legacy Neptune handler remains authoritative. Only take over when it
  // did not create a GTA entry task during the grace period.
  if (GetVehiclePedIsTryingToEnter(ped) !== 0 || GetIsTaskActive(ped, 160)) return;

  const vehicle = findNearestDriverVehicle(ped);
  if (!vehicle) {
    report("no-target", 0);
    return;
  }

  TaskEnterVehicle(ped, vehicle, 10000, -1, 1.0, 1, 0);
  report("task", vehicle);

  if (warpTimer) clearTimeout(warpTimer);
  warpTimer = setTimeout(() => {
    warpTimer = null;
    if (serial !== attemptSerial || !canAcceptWorldInput()) return;
    if (IsPedInAnyVehicle(ped, false)) return;

    const pedPosition = GetEntityCoords(ped, false);
    const tryingVehicle = GetVehiclePedIsTryingToEnter(ped);
    if (tryingVehicle !== 0 && tryingVehicle !== vehicle) return;
    if (!isNearbyVehicle(vehicle, pedPosition)) return;
    if (!isUnlockedForWarp(vehicle)) {
      report("warp-blocked-locked", vehicle);
      return;
    }
    if (GetPedInVehicleSeat(vehicle, -1) !== 0 && !IsVehicleSeatFree(vehicle, -1)) {
      report("warp-blocked-occupied", vehicle);
      return;
    }

    // FiveM occasionally leaves TASK_ENTER_VEHICLE pending forever for a
    // freshly streamed OneSync entity. RAGE:MP completed that transition
    // internally, so emulate it only after the normal animation timed out.
    SetPedIntoVehicle(ped, vehicle, -1);
    report("warp", vehicle);
  }, WARP_FALLBACK_MS);
}

export function installDefaultVehicleEnteringCompatibility(): void {
  globalThis.mp.keys.bind(KEY_F, false, () => {
    if (globalThis.mp.game.controls.useDefaultVehicleEntering !== false) return;
    const serial = ++attemptSerial;
    setTimeout(() => beginCompatibilityEntry(serial), LEGACY_HANDLER_GRACE_MS);
  });

  on("onResourceStop", (name: string) => {
    if (name !== GetCurrentResourceName()) return;
    attemptSerial++;
    if (warpTimer) clearTimeout(warpTimer);
    warpTimer = null;
  });
}
