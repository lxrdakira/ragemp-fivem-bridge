import { defineInternals, IdAllocator } from "@ragemp-fivem-bridge/shared/internal";

export interface StreamingInternalsRec {
  handleToEntity: Map<number, any>;
  byRemote: Map<number, any>;
  byLocal: Map<number, any>;
  netIdToRemote: Map<number, number>;
  missingHandleSince: Map<number, number>;
  ids: IdAllocator;
  activeSet: Set<number>;
  netType: string | null;
  makeEntity: null | ((id: number, handle: number | null) => any);
  filter: null | ((handle: number) => boolean);
  onStreamIn: null | ((entity: any, handle: number, netId: number) => void);
  onStreamOut: null | ((entity: any) => void);
}

export const StreamingInternals = defineInternals<StreamingInternalsRec>();

export function initStreamingInternals(pool: object, netType: string | null): StreamingInternalsRec {
  return StreamingInternals.init(pool, {
    handleToEntity: new Map(),
    byRemote: new Map(),
    byLocal: new Map(),
    netIdToRemote: new Map(),
    missingHandleSince: new Map(),
    ids: new IdAllocator(),
    activeSet: new Set(),
    netType,
    makeEntity: null,
    filter: null,
    onStreamIn: null,
    onStreamOut: null,
  });
}

export interface StreamingEntityRec {
  isServer: boolean;
  isLocalFallback: boolean;
  netId: number;
  serverModel: number;
  serverPos: { x: number; y: number; z: number };
  serverDimension: number;
  serverPlate: string;
}

const EntityState = defineInternals<StreamingEntityRec>();

export function streamEntityState(entity: object): StreamingEntityRec {
  const existing = EntityState.peek(entity);
  if (existing) return existing;
  return EntityState.init(entity, {
    isServer: false,
    isLocalFallback: false,
    netId: 0,
    serverModel: 0,
    serverPos: { x: 0, y: 0, z: 0 },
    serverDimension: 0,
    serverPlate: "",
  });
}
