import { defineInternals } from "@ragemp-fivem-bridge/shared/internal";
import { safeGetEntityFromNetId } from "../../utils/netId";
import {
  applyVehicleProp,
  applyVehicleMod,
  applyVehicleRepair,
} from "../../utils/vehicleSync";
import type { VehicleMp } from "../../Entities/VehicleMp";
import { streamEntityState } from "../streamingInternals";

type StreamInHandler = (entity: VehicleMp, handle: number, netId: number) => void;

interface VehiclePoolState {
  streamInHandlers: Set<StreamInHandler>;
  pendingBatches: Map<number, [string, any[]][]>;
}

const Store = defineInternals<VehiclePoolState>();

const VEHICLE_DISPATCH: Record<string, (h: number, ...args: any[]) => void> = {
  "ragemp:vehicleEngine": (h: number, v: any) => applyVehicleProp(h, "engine", v),
  "ragemp:vehicleAlpha": (h: number, v: any) => applyVehicleProp(h, "alpha", v),
  "ragemp:vehicleLivery": (h: number, v: any) => applyVehicleProp(h, "livery", v),
  "ragemp:vehicleNumberPlateType": (h: number, v: any) => applyVehicleProp(h, "numberPlateType", v),
  "ragemp:vehicleWindowTint": (h: number, v: any) => applyVehicleProp(h, "windowTint", v),
  "ragemp:vehicleNeonEnabled": (h: number, v: any) => applyVehicleProp(h, "neonEnabled", v),
  "ragemp:vehicleCustomTires": (h: number, v: any) => applyVehicleProp(h, "customTires", v),
  "ragemp:vehicleWheelType": (h: number, v: any) => applyVehicleProp(h, "wheelType", v),
  "ragemp:vehicleEngineHealth": (h: number, v: any) => applyVehicleProp(h, "engineHealth", v),
  "ragemp:vehicleBodyHealth": (h: number, v: any) => applyVehicleProp(h, "bodyHealth", v),
  "ragemp:vehicleLocked": (h: number, v: any) => applyVehicleProp(h, "locked", v),
  "ragemp:vehicleNumberPlate": (h: number, v: any) => applyVehicleProp(h, "numberPlate", v),
  "ragemp:vehicleColor": (h: number, primary: number, secondary: number) => SetVehicleColours(h, primary, secondary),
  "ragemp:vehicleDashboardColor": (h: number, v: any) => applyVehicleProp(h, "dashboardColor", v),
  "ragemp:vehiclePearlescentColor": (h: number, v: any) => applyVehicleProp(h, "pearlescentColor", v),
  "ragemp:vehicleTaxiLights": (h: number, v: any) => applyVehicleProp(h, "taxiLights", v),
  "ragemp:vehicleTrimColor": (h: number, v: any) => applyVehicleProp(h, "trimColor", v),
  "ragemp:vehicleWheelColor": (h: number, v: any) => applyVehicleProp(h, "wheelColor", v),
  "ragemp:vehicleNeonColor": (h: number, r: number, g: number, b: number) => applyVehicleProp(h, "neonColor", [r, g, b]),
  "ragemp:vehicleColorRGB": (h: number, value: any) => applyVehicleProp(h, "colorRGB", value),
  "ragemp:vehicleMod": (h: number, modType: number, modIndex: number) => applyVehicleMod(h, modType, modIndex),
  "ragemp:vehicleExtra": (h: number, extraId: number, invertedState: boolean) => SetVehicleExtra(h, extraId, invertedState),
  "ragemp:vehicleExplode": (h: number) => NetworkExplodeVehicle(h, true, false, false),
  "ragemp:vehicleRepair": (h: number) => applyVehicleRepair(h),
};

export function setupVehiclePool(pool: object): void {
  Store.init(pool, { streamInHandlers: new Set(), pendingBatches: new Map() });

  onNet("ragemp:vehicle:batch", (netId: number, items: [string, any[]][]) => {
    const handle = safeGetEntityFromNetId(netId);
    if (!handle) {
      const pending = Store.get(pool).pendingBatches.get(netId) ?? [];
      pending.push(...(Array.isArray(items) ? items : []));
      if (pending.length > 256) pending.splice(0, pending.length - 256);
      Store.get(pool).pendingBatches.set(netId, pending);
      return;
    }
    applyBatch(handle, items);
  });
}

function applyBatch(handle: number, items: [string, any[]][]): void {
  if (!Array.isArray(items)) return;
  for (const [event, args] of items) {
    const fn = VEHICLE_DISPATCH[event];
    if (fn) fn(handle, ...(args || []));
  }
}

export function addVehicleStreamInHandler(pool: object, handler: StreamInHandler): () => void {
  const handlers = Store.get(pool).streamInHandlers;
  handlers.add(handler);
  return () => handlers.delete(handler);
}

export function fireVehicleStreamIn(pool: object, entity: VehicleMp, handle: number, netId: number): void {
  const state = Store.get(pool);
  if (netId && streamEntityState(entity).isServer) {
    const model = GetEntityModel(handle);
    emitNet("ragemp:vehicleClassReport", netId, GetVehicleClass(handle), GetDisplayNameFromVehicleModel(model) || "");
  }
  const pending = state.pendingBatches.get(netId);
  if (pending) {
    state.pendingBatches.delete(netId);
    applyBatch(handle, pending);
  }
  for (const handler of Store.get(pool).streamInHandlers) {
    try { handler(entity, handle, netId); } catch (e) {}
  }
}
