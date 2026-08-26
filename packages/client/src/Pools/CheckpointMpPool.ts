import { Pool } from "@ragemp-fivem-bridge/shared";
import { CheckpointMp } from "../Entities/CheckpointMp";
import { setupCheckpointPool, createCheckpoint } from "../internal/pools/checkpointPoolService";

export class CheckpointMpPool extends Pool<CheckpointMp> {
  constructor() {
    super();
    setupCheckpointPool(this);
  }

  new(
    type: number,
    position: { x: number; y: number; z: number },
    radiusOrNextPosition: number | { x: number; y: number; z: number } | null | undefined,
    optionsOrRadius: any = {},
    legacyOptions: any = {},
  ): CheckpointMp {
    if (typeof radiusOrNextPosition === "number") {
      const options = optionsOrRadius && typeof optionsOrRadius === "object" ? optionsOrRadius : {};
      return createCheckpoint(this, type, position, options.direction, radiusOrNextPosition, options);
    }

    // Retain the bridge's earlier explicit-next-position overload for callers
    // that already adopted it, while matching RAGE:MP's public API above.
    return createCheckpoint(this, type, position, radiusOrNextPosition, Number(optionsOrRadius) || 0, legacyOptions ?? {});
  }
}
