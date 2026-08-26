import { StreamingPool } from "./StreamingPool";
import { Vector3 } from "@ragemp-fivem-bridge/shared";
import { EntityInternals, CONSTRUCT } from "@ragemp-fivem-bridge/shared/internal";
import { VehicleMp } from "../Entities/VehicleMp";
import { getVehiclePool } from "../utils/worldScan";
import { StreamingInternals } from "../internal/streamingInternals";
import {
  setupVehiclePool,
  fireVehicleStreamIn,
} from "../internal/pools/vehiclePoolService";
import { startStreaming, setStreamHandlers, registerLocalStreamed, removeFromStreamingPool } from "../internal/pools/streamingService";
import { applyVehicleColorOption } from "../utils/vehicleSync";
import { registerNativeDimensionEntity } from "../utils/nativeEntityDimension";
import { enableDeferredNativeActions, flushDeferredNativeActions } from "../utils/nativeEntityReady";

export class VehicleMpPool extends StreamingPool<VehicleMp> {
  constructor() {
    super("vehicle");
    setupVehiclePool(this);
    startStreaming(this, getVehiclePool, (netId: number, handle: number) => new VehicleMp(CONSTRUCT, netId, handle));
    setStreamHandlers(this, {
      onStreamIn: (entity: VehicleMp, handle: number, netId: number) => fireVehicleStreamIn(this, entity, handle, netId),
    });
  }

  new(model: number | string, position: Vector3, options: {
    alpha?: number;
    color?: [number, number] | [[number, number, number], [number, number, number]];
    dimension?: number;
    engine?: boolean;
    heading?: number;
    locked?: boolean;
    numberPlate?: string;
  } = {}): VehicleMp {
    const hash = typeof model === "string" ? GetHashKey(model) : model;
    const vehicle = new VehicleMp(CONSTRUCT, 0, 0);
    enableDeferredNativeActions(vehicle);
    registerLocalStreamed(this, vehicle);

    const finish = (): void => {
      const handle = CreateVehicle(hash, position.x, position.y, position.z, options.heading ?? 0, false, false);
      if (!handle) {
        removeFromStreamingPool(this, vehicle.id);
        return;
      }
      EntityInternals.get(vehicle).handle = handle;
      StreamingInternals.get(this).handleToEntity.set(handle, vehicle);
      SetEntityAsMissionEntity(handle, true, true);
      SetModelAsNoLongerNeeded(hash);

      if (options.dimension !== undefined) vehicle.dimension = options.dimension;
      if (options.alpha !== undefined) vehicle.alpha = options.alpha;
      if (options.engine !== undefined) vehicle.engine = options.engine;
      if (options.locked !== undefined) vehicle.locked = options.locked;
      if (options.numberPlate !== undefined) vehicle.numberPlate = options.numberPlate;
      if (options.color !== undefined) applyVehicleColorOption(handle, options.color);

      registerNativeDimensionEntity(vehicle);
      flushDeferredNativeActions(vehicle);

      globalThis.mp?.events?.call("entityStreamIn", vehicle);
    };

    if (HasModelLoaded(hash)) {
      finish();
    } else {
      RequestModel(hash);
      const startedAt = GetGameTimer();
      const tick = setTick(() => {
        if (HasModelLoaded(hash)) {
          clearTick(tick);
          finish();
        } else if (GetGameTimer() - startedAt > 30000) {
          clearTick(tick);
          removeFromStreamingPool(this, vehicle.id);
          console.warn(`[ragemp-bridge] mp.vehicles.new: model ${hash} failed to load after 30s — vehicle not created.`);
        } else {
          RequestModel(hash);
        }
      });
    }

    return vehicle;
  }
}
