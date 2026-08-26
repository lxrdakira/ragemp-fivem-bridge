interface DeferredNativeEntity {
  handle: number;
}

type NativeAction = (handle: number) => void;

const enabled = new WeakSet<object>();
const pending = new Map<object, NativeAction[]>();

export function enableDeferredNativeActions(entity: object): void {
  enabled.add(entity);
}

export function runNativeEntityAction(entity: DeferredNativeEntity, action: NativeAction): void {
  const handle = entity.handle;
  if (handle && DoesEntityExist(handle)) {
    action(handle);
    return;
  }
  if (!enabled.has(entity as object)) return;
  const actions = pending.get(entity as object) ?? [];
  actions.push(action);
  pending.set(entity as object, actions);
}

export function flushDeferredNativeActions(entity: DeferredNativeEntity): void {
  const actions = pending.get(entity as object);
  if (!actions || actions.length === 0) return;
  pending.delete(entity as object);
  const handle = entity.handle;
  if (!handle || !DoesEntityExist(handle)) return;
  for (const action of actions) {
    try { action(handle); } catch (e) { console.error(`[ragemp-bridge] deferred native action failed: ${e}`); }
  }
}

export function clearDeferredNativeActions(entity: object): void {
  pending.delete(entity);
  enabled.delete(entity);
}
