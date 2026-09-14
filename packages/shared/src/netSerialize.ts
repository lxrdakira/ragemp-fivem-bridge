import { Entity } from "./Entity.js";
import { INVALID_REMOTE_ID } from "./internal/entityInternals.js";

export const NET_REF_KEY = "__mpRef";

export type NetResolve = (type: string, id: number, netId?: number) => Entity | null | undefined;

const ENTITY_TYPES = new Set([
  "player", "vehicle", "object", "ped", "colshape", "checkpoint",
  "blip", "marker", "textlabel", "label", "pickup", "dummy",
]);

function isEntityLike(value: object): value is Entity {
  try {
    const candidate = value as unknown as { type?: unknown; id?: unknown; remoteId?: unknown; handle?: unknown };
    return typeof candidate.type === "string" &&
      ENTITY_TYPES.has(candidate.type.toLowerCase()) &&
      (typeof candidate.remoteId === "number" || typeof candidate.id === "number") &&
      typeof candidate.handle === "number";
  } catch (_) {
    return false;
  }
}

function entityToRef(entity: Entity): Record<string, unknown> {
  const candidate = entity as unknown as {
    type: string;
    id: number;
    remoteId?: number;
    netId?: number;
    getVariable?: (key: string) => unknown;
  };
  let id = typeof candidate.remoteId === "number" ? candidate.remoteId : candidate.id;

  // Last line of defence for an entity observed by the world scanner before
  // the registry event. The authoritative id is replicated in the state bag;
  // use it directly even if a legacy caller still holds the old wrapper.
  if ((id <= 0 || id === INVALID_REMOTE_ID) &&
      (candidate.type === "vehicle" || candidate.type === "object" || candidate.type === "ped")) {
    try {
      const stateId = Number(candidate.getVariable?.("__bridgeRemoteId"));
      if (Number.isInteger(stateId) && stateId > 0 && stateId < INVALID_REMOTE_ID) id = stateId;
    } catch (_) {}
  }
  const ref: Record<string, unknown> = { [NET_REF_KEY]: candidate.type, id };
  try {
    const netId = (entity as unknown as { netId?: number }).netId;
    if (netId !== undefined && netId !== null) ref.netId = netId;
  } catch (e) {}
  return ref;
}

export function sanitizeForNet(value: unknown, seen?: WeakSet<object>): unknown {
  if (value === null || typeof value !== "object") return value;
  // `instanceof` is insufficient when a legacy bundle embeds another copy of
  // the shared package. Duck-typing keeps those bridge entities intact instead
  // of flattening them to the enumerable `{ id }` field.
  if (value instanceof Entity || isEntityLike(value)) return entityToRef(value as Entity);

  if (!seen) seen = new WeakSet();
  if (seen.has(value)) return null;
  seen.add(value);

  let result: unknown;
  if (Array.isArray(value)) {
    result = new Array(value.length);
    for (let i = 0; i < value.length; i++) (result as unknown[])[i] = sanitizeForNet(value[i], seen);
  } else if (value instanceof Map) {
    result = {} as Record<string, unknown>;
    for (const [key, entry] of value) (result as Record<string, unknown>)[String(key)] = sanitizeForNet(entry, seen);
  } else if (value instanceof Set) {
    result = [];
    for (const entry of value) (result as unknown[]).push(sanitizeForNet(entry, seen));
  } else {
    result = {} as Record<string, unknown>;
    for (const key of Object.keys(value as object)) (result as Record<string, unknown>)[key] = sanitizeForNet((value as Record<string, unknown>)[key], seen);
  }

  seen.delete(value);
  return result;
}

export function sanitizeArgsForNet(args: unknown[]): unknown[] {
  if (!Array.isArray(args)) return args;
  let out: unknown[] | null = null;
  for (let i = 0; i < args.length; i++) {
    const value = args[i];
    if (value !== null && typeof value === "object") {
      if (!out) out = args.slice();
      out[i] = sanitizeForNet(value);
    }
  }
  return out ?? args;
}

export function isNetRef(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>)[NET_REF_KEY] === "string" &&
    "id" in (value as object)
  );
}

export function rehydrateFromNet(value: unknown, resolve: NetResolve, seen?: WeakSet<object>): unknown {
  if (value === null || typeof value !== "object") return value;

  if (isNetRef(value)) {
    const ref = value as Record<string, unknown>;
    const entity = resolve(ref[NET_REF_KEY] as string, ref.id as number, ref.netId as number | undefined);
    return entity ?? null;
  }

  if (!seen) seen = new WeakSet();
  if (seen.has(value)) return value;
  seen.add(value);

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = rehydrateFromNet(value[i], resolve, seen);
  } else {
    for (const key of Object.keys(value as object)) (value as Record<string, unknown>)[key] = rehydrateFromNet((value as Record<string, unknown>)[key], resolve, seen);
  }
  return value;
}

export function rehydrateArgsFromNet(args: unknown[], resolve: NetResolve): unknown[] {
  if (!Array.isArray(args)) return args;
  for (let i = 0; i < args.length; i++) {
    if (args[i] !== null && typeof args[i] === "object") {
      args[i] = rehydrateFromNet(args[i], resolve);
    }
  }
  return args;
}
