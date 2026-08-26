import { EntityInternals, CONSTRUCT } from "@ragemp-fivem-bridge/shared/internal";
import { StreamingPool } from "./StreamingPool";
import { PedMp } from "../Entities/PedMp";
import { getPedPool } from "../utils/worldScan";
import { StreamingInternals } from "../internal/streamingInternals";
import { setupPedPool } from "../internal/pools/pedPoolService";
import { startStreaming, registerLocalStreamed, removeFromStreamingPool } from "../internal/pools/streamingService";
import { registerNativeDimensionEntity } from "../utils/nativeEntityDimension";

export class PedMpPool extends StreamingPool<PedMp> {
    constructor() {
        super("ped");
        setupPedPool(this);
        startStreaming(
            this,
            getPedPool,
            (netId: number, handle: number) => new PedMp(CONSTRUCT, netId, handle),
            (handle: number) => !IsPedAPlayer(handle)
        );
    }

    new(model: number | string, position: { x: number; y: number; z: number }, options: any = {}, dimensionOrCallback?: number | ((ped: PedMp) => void) | null): PedMp {
        let callback: ((ped: PedMp) => void) | null = null;
        if (typeof options === "number") {
            options = {
                heading: options,
                dimension: typeof dimensionOrCallback === "number" ? dimensionOrCallback : 0,
            };
            if (typeof dimensionOrCallback === "function") callback = dimensionOrCallback;
        } else if (typeof options === "function") {
            callback = options;
            options = {};
        } else if (typeof dimensionOrCallback === "function") {
            callback = dimensionOrCallback;
        }

        const hash = typeof model === "string" ? GetHashKey(model) : model;
        const ped = new PedMp(CONSTRUCT, 0, 0);
        registerLocalStreamed(this, ped);

        const finish = () => {
            const handle = CreatePed(
                options.type ?? 4,
                hash,
                position.x,
                position.y,
                position.z,
                options.heading ?? 0,
                false,
                false
            );
            if (!handle) {
                removeFromStreamingPool(this, ped.id);
                return;
            }
            EntityInternals.get(ped).handle = handle;
            StreamingInternals.get(this).handleToEntity.set(handle, ped);

            SetEntityAsMissionEntity(handle, true, true);

            SetBlockingOfNonTemporaryEvents(handle, true);
            FreezeEntityPosition(handle, options.frozen ? true : false);

            SetModelAsNoLongerNeeded(hash);

            ped.dimension = options.dimension ?? 0;
            registerNativeDimensionEntity(ped);

            if (callback) {
                try {
                    callback(ped);
                } catch (e) {
                    console.error(`[ragemp-bridge] mp.peds.new callback error: ${e}`);
                }
            }
            globalThis.mp?.events?.call("entityStreamIn", ped);
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
                    removeFromStreamingPool(this, ped.id);
                    console.warn(
                        `[ragemp-bridge] mp.peds.new: model ${hash} failed to load after 30s — ped not created.`
                    );
                } else {
                    RequestModel(hash);
                }
            });
        }

        return ped;
    }
}
