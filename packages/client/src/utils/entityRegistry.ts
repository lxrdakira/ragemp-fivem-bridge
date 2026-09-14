const _subscribers = Object.create(null);

export function subscribeEntityRegistry(type: string, handlers: {
  create: (remoteId: number, data: any) => void,
  netid: (remoteId: number, netId: number) => void,
  destroy: (remoteId: number) => void,
  shared?: (remoteId: number, key: string, value: any) => void
}) {
  _subscribers[type] = handlers;
}

function _create(type: string, remoteId: number, model: any, x: number, y: number, z: number, dimension: number, plate?: string, netId?: number) {
  const sub = _subscribers[type];
  if (sub && sub.create) sub.create(remoteId, { model, x, y, z, dimension, plate: plate ?? "" });
  // Bind from the same reliable payload as creation. The legacy standalone
  // netid event is still handled below for compatibility and late remaps.
  if (netId) _bind(type, remoteId, netId);
}

function _bind(type: string, remoteId: number, netId: number) {
  const sub = _subscribers[type];
  if (sub && sub.netid) sub.netid(remoteId, netId);
}

function _destroy(type: string, remoteId: number) {
  const sub = _subscribers[type];
  if (sub && sub.destroy) sub.destroy(remoteId);
}

function _shared(type: string, remoteId: number, key: string, value: any) {
  const sub = _subscribers[type];
  if (sub && sub.shared) sub.shared(remoteId, key, value);
}

if (typeof onNet === "function") {
  onNet("ragemp:entity:create", (type: string, remoteId: number, model: string, x: number, y: number, z: number, dimension: number, plate?: string, netId?: number) => {
    _create(type, remoteId, model, x, y, z, dimension, plate, netId);
  });

  onNet("ragemp:entity:netid", (type: string, remoteId: number, netId: number) => {
    _bind(type, remoteId, netId);
  });

  onNet("ragemp:entity:destroy", (type: string, remoteId: number) => {
    _destroy(type, remoteId);
  });

  onNet("ragemp:entity:sharedData", (type: string, remoteId: number, key: string, value: any) => {
    _shared(type, remoteId, key, value);
  });

  onNet("ragemp:entity:sharedBatch", (type: string, remoteId: number, items: unknown) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (!Array.isArray(item) || typeof item[0] !== "string") continue;
      _shared(type, remoteId, item[0], item[1]);
    }
  });

  onNet("ragemp:entity:snapshot", (list: unknown) => {
    if (!Array.isArray(list)) return;
    for (const entry of list) {
      if (!Array.isArray(entry)) continue;
      const [type, remoteId, model, x, y, z, dimension, netId, plate] = entry;
      _create(type, remoteId, model, x, y, z, dimension, plate);
      if (netId) _bind(type, remoteId, netId);
    }
  });
}
