import { STATE_KEY_PREFIX } from "@ragemp-fivem-bridge/shared";
import { EntityInternals } from "@ragemp-fivem-bridge/shared/internal";

type SharedDataChangeSink = (entity: any, key: string, value: any) => void;
let sharedDataChangeSink: SharedDataChangeSink | null = null;

export function setSharedDataChangeSink(sink: SharedDataChangeSink): void {
  sharedDataChangeSink = sink;
}

function isPrototypeMember(entity: any, key: string): boolean {
  for (let current = Object.getPrototypeOf(entity); current && current !== Object.prototype; current = Object.getPrototypeOf(current)) {
    if (Object.prototype.hasOwnProperty.call(current, key)) return true;
  }
  return false;
}

export function applySharedDataValue(entity: any, key: string, value: any): void {
  if (!entity || typeof key !== "string" || !key) return;
  const variables = EntityInternals.get(entity).variables;
  if (value === null || value === undefined) variables.delete(key);
  else variables.set(key, value);

  // RAGE:MP exposes shared data both through getVariable() and as dynamic
  // entity properties. Do not shadow native class accessors such as position,
  // model or dimension, but keep custom gameplay keys API-compatible.
  if (!isPrototypeMember(entity, key)) {
    try {
      if (value === null || value === undefined) delete entity[key];
      else entity[key] = value;
    } catch (_) {}
  }
}

export function notifySharedDataValue(entity: any, key: string, value: any): void {
  if (sharedDataChangeSink) sharedDataChangeSink(entity, key, value);
  else applySharedDataValue(entity, key, value);
}

export function hydrateSharedData(entity: any, stateBag: any, notify = true): void {
  if (!entity || !stateBag) return;
  try {
    for (const stateKey of Object.keys(stateBag)) {
      if (stateKey.indexOf(STATE_KEY_PREFIX) !== 0) continue;
      const key = stateKey.slice(STATE_KEY_PREFIX.length);
      if (notify && sharedDataChangeSink) sharedDataChangeSink(entity, key, stateBag[stateKey]);
      else applySharedDataValue(entity, key, stateBag[stateKey]);
    }
  } catch (_) {}
}
