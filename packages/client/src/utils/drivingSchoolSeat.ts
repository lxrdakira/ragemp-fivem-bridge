import { hasPendingClothingPreloads } from "./clothingPreloads";

const INSTRUCTOR_CLOTHES: Record<string, number[]> = {
  head: [0, 0], "0": [274, 2], "3": [0, 0], "4": [263, 0],
  "6": [10, 0], "8": [223, 0], "11": [669, 0], "7": [281, 10],
};

export function installDrivingSchoolSeat(): void {
  let generation = 0;
  let driverGeneration = 0;
  const pendingInstructors = new Map<number, object>();
  mp.events.add("driving_school.clear_checkpoints", () => {
    generation++;
    driverGeneration++;
    pendingInstructors.clear();
  });
  mp.events.add("plmp:drivingSchoolSeat", (remoteId: number) => {
    beginInstructor(remoteId, INSTRUCTOR_CLOTHES);
    const request = ++driverGeneration;
    let attempts = 0;
    const seat = () => {
      if (request !== driverGeneration) return;
      const vehicle = mp.vehicles.atRemoteId(remoteId);
      const handle = vehicle?.handle ?? 0;
      const ped = PlayerPedId();
      if (handle && DoesEntityExist(handle) && vehicle.dimension === mp.players.local.dimension) {
        if (GetPedInVehicleSeat(handle, -1) === ped) return;
        SetPedIntoVehicle(ped, handle, -1);
        if (GetPedInVehicleSeat(handle, -1) === ped) return;
      }
      if (++attempts < 80) setTimeout(seat, 250);
      else console.warn(`[driving-school] driver placement timed out remote=${remoteId} handle=${handle} vehicleDimension=${vehicle?.dimension} playerDimension=${mp.players.local.dimension}`);
    };
    seat();
  });
  const beginInstructor = (remoteId: number, clothes: Record<string, number[]>) => {
    if (pendingInstructors.has(remoteId)) return;
    const token = {};
    pendingInstructors.set(remoteId, token);
    const request = generation;
    let attempts = 0;
    let dressedHandle = 0;
    let instructor: any;
    let lastState = "";
    const finish = () => {
      if (pendingInstructors.get(remoteId) === token) pendingInstructors.delete(remoteId);
      if (instructor?.handle && DoesEntityExist(instructor.handle)) instructor.setAlpha(255);
    };
    const seat = () => {
      if (request !== generation) { finish(); return; }
      const vehicle = mp.vehicles.atRemoteId(remoteId);
      instructor = mp.peds.toArray().find((ped: any) =>
        Number(ped.getVariable?.("EXAM_PASSENGER_VEHICLE")) === remoteId);
      const handle = instructor?.handle ?? 0;
      const state = !vehicle?.handle ? "vehicle-pending"
        : !handle ? "instructor-pending"
        : vehicle.dimension !== mp.players.local.dimension ? "dimension-pending"
        : "instructor-ready";
      if (state !== lastState) {
        console.log(`[driving-school] instructor ${state} remote=${remoteId} vehicleHandle=${vehicle?.handle ?? 0} pedHandle=${handle}`);
        lastState = state;
      }
      if (handle && DoesEntityExist(handle) && vehicle?.handle && DoesEntityExist(vehicle.handle)
        && vehicle.dimension === mp.players.local.dimension) {
        if (NetworkGetEntityIsNetworked(handle) && !NetworkHasControlOfEntity(handle)) {
          NetworkRequestControlOfEntity(handle);
        } else {
          if (dressedHandle !== handle) {
            instructor.setAlpha(0);
            for (const [key, value] of Object.entries(clothes)) {
              if (key === "head") instructor.setComponentVariation(0, value[0], value[1], 0);
              else if (key === "0") instructor.setPropIndex(0, value[0], value[1], true);
              else instructor.setComponentVariation(Number(key), value[0], value[1], 0);
            }
            dressedHandle = handle;
          }
          if (!hasPendingClothingPreloads(handle)) {
            FreezeEntityPosition(handle, false);
            SetPedIntoVehicle(handle, vehicle.handle, 0);
            if (GetPedInVehicleSeat(vehicle.handle, 0) === handle) {
              console.log(`[driving-school] instructor seated remote=${remoteId} handle=${handle}`);
              finish(); return;
            }
          }
        }
      }
      if (++attempts < 120) setTimeout(seat, 250);
      else {
        finish();
        console.warn(`[driving-school] instructor placement timed out remote=${remoteId} handle=${handle} dressed=${dressedHandle} state=${lastState}`);
      }
    };
    seat();
  };
  mp.events.add("plmp:drivingSchoolInstructor", beginInstructor);
}
