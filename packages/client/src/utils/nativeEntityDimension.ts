import { normalizeDimension } from "@ragemp-fivem-bridge/shared";
import { EntityInternals } from "@ragemp-fivem-bridge/shared/internal";
import { isVisibleHere, onDimensionChange } from "./dimension";

interface NativeDimensionEntity {
  handle: number;
  dimension: number;
}

interface VisibilityState {
  explicitVisible: boolean;
}

const tracked = new Map<NativeDimensionEntity, VisibilityState>();
const pendingVisibility = new WeakMap<object, boolean>();

function apply(entity: NativeDimensionEntity, state: VisibilityState): void {
  const handle = entity.handle;
  if (!handle || !DoesEntityExist(handle)) return;
  SetEntityVisible(handle, state.explicitVisible && isVisibleHere(entity.dimension), false);
}

onDimensionChange(() => {
  for (const [entity, state] of tracked) apply(entity, state);
});

export function registerNativeDimensionEntity(entity: NativeDimensionEntity): void {
  let state = tracked.get(entity);
  if (!state) {
    state = { explicitVisible: pendingVisibility.get(entity as object) ?? true };
    tracked.set(entity, state);
  }
  apply(entity, state);
}

export function unregisterNativeDimensionEntity(entity: NativeDimensionEntity): void {
  tracked.delete(entity);
  pendingVisibility.delete(entity as object);
}

export function setNativeEntityDimension(entity: NativeDimensionEntity, value: number): void {
  EntityInternals.get(entity as any).dimension = normalizeDimension(value);
  const state = tracked.get(entity);
  if (state) apply(entity, state);
}

export function setNativeEntityVisible(entity: NativeDimensionEntity, visible: boolean): void {
  const state = tracked.get(entity);
  if (!state) {
    pendingVisibility.set(entity as object, !!visible);
    if (entity.handle && DoesEntityExist(entity.handle)) SetEntityVisible(entity.handle, !!visible, false);
    return;
  }
  state.explicitVisible = !!visible;
  apply(entity, state);
}
