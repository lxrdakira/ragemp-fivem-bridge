import { STATE_KEY_PREFIX } from "@ragemp-fivem-bridge/shared";
import { EntityInternals } from "@ragemp-fivem-bridge/shared/internal";

function isPrototypeMember(entity: any, key: string): boolean {
  for (let current = Object.getPrototypeOf(entity); current && current !== Object.prototype; current = Object.getPrototypeOf(current)) {
    if (Object.prototype.hasOwnProperty.call(current, key)) return true;
  }
  return false;
}

export function applySharedDataValue(entity: any, key: string, value: any): void {
  if (!entity || typeof key !== "string" || !key) return;
  EntityInternals.get(entity).variables.set(key, value);

  // RAGE:MP exposes shared data both through getVariable() and as dynamic
  // entity properties. Do not shadow native class accessors such as position,
  // model or dimension, but keep custom gameplay keys API-compatible.
  if (!isPrototypeMember(entity, key)) {
    try { entity[key] = value; } catch (_) {}
  }
}

export function hydrateSharedData(entity: any, stateBag: any): void {
  if (!entity || !stateBag) return;
  try {
    for (const stateKey of Object.keys(stateBag)) {
      if (stateKey.indexOf(STATE_KEY_PREFIX) !== 0) continue;
      applySharedDataValue(entity, stateKey.slice(STATE_KEY_PREFIX.length), stateBag[stateKey]);
    }
  } catch (_) {}
}
