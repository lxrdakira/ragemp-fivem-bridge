import { defineInternals } from "@ragemp-fivem-bridge/shared/internal";

export interface ClientEventManagerRec {
  renderTick: number | null;
  lifecycleTick: number | null;
  builtinTick: (() => void) | number | null;
  lastHornState: boolean | null;
  lastSirenState: boolean | null;
  lastTrailerNetId: number | null;
  lastAudioVehHandle: number | null;
  lastPedModel: number | null;
  lastVehicleSeat: number | null;
  procs: Map<string, (...args: any[]) => any> | null;
  pendingProcs: Map<number, { procName: string; resolve: (value: any) => void; reject: (reason?: any) => void; timer: ReturnType<typeof setTimeout> }> | null;
  procCounter: number | null;
  rules: Map<string, (...args: any[]) => any> | null;
  dataHandlers: Map<string, Array<(...args: any[]) => void>> | null;
  dataSnapshots: WeakMap<object, Map<string, any>> | null;
  wasAlive: boolean;
  wasInVehicle: boolean;
  lastVehicleHandle: number;
  lastWeaponHash: number;
  builtinTickStarted: boolean;
  isTryingToEnterVehicle: boolean;
  tryingToEnterVehicleHandle: number;
  isTryingToExitVehicle: boolean;
  trackedHealth: number;
  trackedArmour: number;
  lastDamageAttackerServerId: number;
  lastDamageWeapon: number;
  lastPlayerStateSyncAt: number;
  wasShooting: boolean;
  lastWeaponAmmo: number;
  playerReadyFired: boolean;
  playerReadyWaiting: boolean;
  wasLeftClicking: boolean;
  wasRightClicking: boolean;
  streamedPlayers: Set<unknown>;
  connectedPlayers: Set<unknown>;
  talkingPlayers: Set<unknown>;
  activeSet: Set<unknown>;
  variadicRemoteEvents: Set<string>;
  remoteEventContracts: Map<string, { required: number; total: number; defaults: any[] }>;
  entityOwners: Map<number, number>;
  vehicleHealth: Map<number, { body: number; engine: number; dead: boolean; netId: number }>;
  vehicleHealthSeen: Set<number>;
  insideCheckpoints: Set<unknown>;
  waypointActive: boolean;
  waypointX: number;
  waypointY: number;
  waypointZ: number;
  waypointReached: boolean;
}

export const ClientEventManagerInternals = defineInternals<ClientEventManagerRec>();

export function initClientEventManagerInternals(mgr: object): ClientEventManagerRec {
  return ClientEventManagerInternals.init(mgr, {
    renderTick: null,
    lifecycleTick: null,
    builtinTick: null,
    lastHornState: null,
    lastSirenState: null,
    lastTrailerNetId: null,
    lastAudioVehHandle: null,
    lastPedModel: null,
    lastVehicleSeat: null,
    procs: null,
    pendingProcs: null,
    procCounter: null,
    rules: null,
    dataHandlers: null,
    dataSnapshots: null,
    wasAlive: true,
    wasInVehicle: false,
    lastVehicleHandle: 0,
    lastWeaponHash: 0,
    builtinTickStarted: false,
    isTryingToEnterVehicle: false,
    tryingToEnterVehicleHandle: 0,
    isTryingToExitVehicle: false,
    trackedHealth: -1,
    trackedArmour: -1,
    lastDamageAttackerServerId: -1,
    lastDamageWeapon: 0,
    lastPlayerStateSyncAt: 0,
    wasShooting: false,
    lastWeaponAmmo: -1,
    playerReadyFired: false,
    playerReadyWaiting: false,
    wasLeftClicking: false,
    wasRightClicking: false,
    streamedPlayers: new Set(),
    connectedPlayers: new Set(),
    talkingPlayers: new Set(),
    activeSet: new Set(),
    variadicRemoteEvents: new Set(),
    remoteEventContracts: new Map(),
    entityOwners: new Map(),
    vehicleHealth: new Map(),
    vehicleHealthSeen: new Set(),
    insideCheckpoints: new Set(),
    waypointActive: false,
    waypointX: 0,
    waypointY: 0,
    waypointZ: 0,
    waypointReached: false,
  });
}
