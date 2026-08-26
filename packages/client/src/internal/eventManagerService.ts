import { gtaPedHealthToRage, rehydrateArgsFromNet, STATE_KEY_PREFIX, Vector3 } from "@ragemp-fivem-bridge/shared";
import { EntityInternals, EventEmitterInternals } from "@ragemp-fivem-bridge/shared/internal";
import { safeGetNetworkId, safeGetEntityFromNetId } from "../utils/netId";
import { onWorldScan } from "../utils/worldScan";
import { isVisibleHere } from "../utils/dimension";
import { resolveNetEntity } from "../utils/netEntity";
import { sanitizeArgsForNet } from "@ragemp-fivem-bridge/shared";
import { resolveHandle } from "../internal/pools/streamingService";
import { playerByServerId } from "../internal/pools/playerPoolService";
import { ClientEventManagerInternals } from "../internal/eventManagerInternals";
import type { EventManager } from "../Events/EventManager";
import { beginDamageEvent, endDamageEvent } from "./damageEventContext";
import { applySharedDataValue } from "../utils/sharedData";

export function setupEventManager(mgr: EventManager): void {
  setupBuiltinEvents(mgr);
}

export function handleEventAdded(mgr: EventManager, eventName: string): void {
  const rec = ClientEventManagerInternals.get(mgr);
  if (eventName === "render" && rec.renderTick === null) {
    rec.renderTick = setTick(() => {
      mgr.call("render");
    });
    return;
  }

  const handlers = EventEmitterInternals.get(mgr).handlers;
  if (!handlers.get(`__net_${eventName}`)) {
    const sentinel = (() => {}) as any;
    handlers.set(`__net_${eventName}`, new Set([sentinel]));
    onNet(eventName, (...args: any[]) => {
      mgr.call(eventName, ...rehydrateArgsFromNet(args, resolveNetEntity));
    });
  }
}

export function handleEventRemoved(mgr: EventManager, eventName: string): void {
  const rec = ClientEventManagerInternals.get(mgr);
  if (eventName === "render" && rec.renderTick !== null) {
    const renderHandlers = EventEmitterInternals.get(mgr).handlers.get("render");
    if (!renderHandlers || renderHandlers.size === 0) {
      clearTick(rec.renderTick);
      rec.renderTick = null;
    }
  }
}

export function setupBuiltinEvents(mgr: EventManager): void {
  setupConsoleAndChat(mgr);
  setupGameEvents(mgr);
  setupGlobalErrorHandlers(mgr);
  setupStateBags(mgr);
  setupMainTick(mgr);
  setupProcChannel(mgr);

  onNet("ragemp:csharp:variadicEvents", (names: string[]) => {
    const rec = ClientEventManagerInternals.get(mgr);
    rec.variadicRemoteEvents.clear();
    if (Array.isArray(names)) {
      for (const name of names) if (typeof name === "string") rec.variadicRemoteEvents.add(name);
    }
  });

  onNet("ragemp:csharp:eventContracts", (contracts: any[]) => {
    const rec = ClientEventManagerInternals.get(mgr);
    rec.remoteEventContracts.clear();
    if (!Array.isArray(contracts)) return;
    for (const contract of contracts) {
      if (!Array.isArray(contract) || typeof contract[0] !== "string") continue;
      const required = Number(contract[1]);
      const total = Number(contract[2]);
      const defaults = Array.isArray(contract[3]) ? contract[3] : [];
      if (Number.isInteger(required) && Number.isInteger(total) && required >= 0 && total >= required) {
        rec.remoteEventContracts.set(contract[0], { required, total, defaults });
      }
    }
  });

  onNet("ragemp:playerReady", (forResource: string | null) => {
    if (forResource && forResource !== GetCurrentResourceName()) return;
    const rec = ClientEventManagerInternals.get(mgr);
    if (rec.playerReadyFired || rec.playerReadyWaiting) return;
    const fire = () => {
      const localPlayer = globalThis.mp?.players?.local;
      if (!localPlayer) return false;
      rec.playerReadyFired = true;
      mgr.call("playerReady", localPlayer);
      return true;
    };
    if (fire()) return;
    rec.playerReadyWaiting = true;
    const tick = setTick(() => {
      if (fire()) {
        rec.playerReadyWaiting = false;
        clearTick(tick);
      }
    });
  });
}

export function setupConsoleAndChat(mgr: EventManager): void {
  on("__cfx_internal:commandFallback", (commandName: string, ...args: any[]) => {
    mgr.call("consoleCommand", commandName, ...args);
    const localPlayer = globalThis.mp?.players?.local;
    if (localPlayer) {
      mgr.call("playerCommand", localPlayer, commandName, ...args);
    }
    const command = [commandName, ...args].filter((part) => part != null && String(part).length > 0).join(" ");
    if (command) emitNet("ragemp:command", command);
  });

  on("chatMessage", (_source: any, _name: any, message: string) => {
    const localPlayer = globalThis.mp?.players?.local;
    if (!localPlayer) return;
    mgr.call("playerChat", localPlayer, message);
  });
}

export function setupGameEvents(mgr: EventManager): void {
  on("gameEventTriggered", (name: string, args: any[]) => {
    const localPlayer = globalThis.mp?.players?.local;
    if (!localPlayer) return;

    if (name === "CEventNetworkEntityDamage") {
      const victim = args[0];
      const attacker = args[1];
      const damageAmount = args[3];
      const weaponHash = args[4];
      const localPed = PlayerPedId();

      if (victim === localPed) {
        const rec = ClientEventManagerInternals.get(mgr);
        rec.lastDamageAttackerServerId = -1;
        rec.lastDamageWeapon = Number(weaponHash ?? 0);
        try {
          if (attacker && attacker !== localPed && IsEntityAPed(attacker)) {
            const attackerPlayer = NetworkGetPlayerIndexFromPed(attacker);
            if (attackerPlayer >= 0) rec.lastDamageAttackerServerId = GetPlayerServerId(attackerPlayer);
          }
        } catch (_) {}
        beginDamageEvent();
        const cancelled = dispatchCancelable(
          mgr,
          "incomingDamage",
          localPlayer,
          attacker,
          weaponHash,
          damageAmount,
          false,
          0,
        );
        const damageState = endDamageEvent();
        if (cancelled || damageState?.cancelled) {
          if (typeof CancelEvent === "function") CancelEvent();
        }
      }
      if (attacker === localPed) {
        beginDamageEvent();
        const cancelled = dispatchCancelable(
          mgr,
          "outgoingDamage",
          localPlayer,
          victim,
          weaponHash,
          damageAmount,
          false,
          0,
        );
        const damageState = endDamageEvent();
        if (cancelled || damageState?.cancelled) {
          if (typeof CancelEvent === "function") CancelEvent();
        }
      }
      return;
    }

    if (name === "CEventExplosion") {
      const posX = args[2] ?? 0;
      const posY = args[3] ?? 0;
      const posZ = args[4] ?? 0;
      const explosionType = args[1] ?? -1;
      const cancelled = dispatchCancelable(
        mgr,
        "explosion",
        localPlayer,
        { x: posX, y: posY, z: posZ },
        explosionType,
      );
      if (cancelled && typeof CancelEvent === "function") CancelEvent();
      return;
    }

    if (name === "CEventMeleeDamage") {
      const target = args[0];
      const attacker = args[1];
      const weaponHash = args[2] ?? 0;
      const damageAmount = args[3] ?? 0;
      const localPed = PlayerPedId();
      if (attacker === localPed) {
        mgr.call(
          "meleeActionDamage",
          localPlayer,
          target,
          weaponHash,
          damageAmount,
        );
      }
      return;
    }

    if (name === "CProjectileImpactEvent") {
      const weaponHash = args[0];
      const impactX = args[1] ?? 0;
      const impactY = args[2] ?? 0;
      const impactZ = args[3] ?? 0;
      const targetEntity = args[4] ?? 0;
      mgr.call(
        "playerWeaponShot",
        localPlayer,
        { x: impactX, y: impactY, z: impactZ },
        targetEntity,
      );
      mgr.call(
        "projectile",
        { x: impactX, y: impactY, z: impactZ },
        weaponHash,
      );
      return;
    }
  });
}

function dispatchCancelable(mgr: EventManager, eventName: string, ...args: any[]): boolean {
  const handlers = EventEmitterInternals.get(mgr).handlers.get(eventName);
  if (!handlers) return false;
  let cancelled = false;
  for (const handler of handlers) {
    try {
      if ((handler as any)(...args) === true) cancelled = true;
    } catch (error) {
      console.error(`[ragemp:${eventName}]`, error);
    }
  }
  return cancelled;
}

export function setupStateBags(mgr: EventManager): void {
  if (typeof AddStateBagChangeHandler !== "function") return;
  AddStateBagChangeHandler(null, null, (bagName: string, key: string, value: any) => {
    const mp = globalThis.mp;
    if (!mp || typeof bagName !== "string" || typeof key !== "string") return;
    if (key.indexOf(STATE_KEY_PREFIX) !== 0) return;
    const realKey = key.slice(STATE_KEY_PREFIX.length);
    let entity = null;
    if (bagName.indexOf("player:") === 0) {
      entity =
        playerByServerId(parseInt(bagName.slice(7), 10)) ?? null;
    } else if (bagName.indexOf("entity:") === 0) {
      const netId = parseInt(bagName.slice(7), 10);
      const handle = safeGetEntityFromNetId(netId);
      if (handle) {
        entity =
          mp.vehicles?.atHandle?.(handle) ??
          mp.peds?.atHandle?.(handle) ??
          mp.objects?.atHandle?.(handle) ??
          null;
      }
      if (!entity && netId) {
        entity =
          mp.vehicles?.atNetId?.(netId) ??
          mp.peds?.atNetId?.(netId) ??
          mp.objects?.atNetId?.(netId) ??
          null;
      }
    }
    if (entity) {
      emitDataChange(mgr, entity, realKey, value);
    }
  });
}

export function emitDataChange(mgr: EventManager, entity: any, key: string, value: any): void {
  const rec = ClientEventManagerInternals.get(mgr);
  if (!rec.dataSnapshots) rec.dataSnapshots = new WeakMap();
  let snapshot = rec.dataSnapshots.get(entity);
  if (!snapshot) {
    snapshot = new Map();
    rec.dataSnapshots.set(entity, snapshot);
  }
  const oldValue = snapshot.get(key);
  snapshot.set(key, value);
  applySharedDataValue(entity, key, value);

  const handlers = rec.dataHandlers?.get(key);
  if (handlers) {
    for (const handler of handlers) {
      try {
        handler(entity, value, oldValue);
      } catch (e) {
        console.error(`[bridge] addDataHandler("${key}") handler error:`, e);
      }
    }
  }
}

export function setupGlobalErrorHandlers(mgr: EventManager): void {
  on("unhandledPromiseRejection", (error: any) => {
    mgr.call("unhandledRejection", error);
  });

  if (typeof process !== "undefined" && process.on) {
    try {
      process.on("uncaughtException", (error) => {
        mgr.call("uncaughtException", error);
      });
    } catch (_) {}
  }
}

export function setupMainTick(mgr: EventManager): void {
  const rec = ClientEventManagerInternals.get(mgr);
  rec.builtinTick = onWorldScan((cache: { players: number[]; vehicles: number[]; peds: number[] }) => {
    const ped = PlayerPedId();
    if (ped === 0) return;

    if (!rec.builtinTickStarted) {
      initTick(mgr, ped, cache);
      return;
    }

    const localPlayer = globalThis.mp?.players?.local;
    if (!localPlayer) return;

    const playerCoords = GetEntityCoords(ped, true);

    const now = GetGameTimer();
    if (now - rec.lastPlayerStateSyncAt >= 500) {
      rec.lastPlayerStateSyncAt = now;
      const vehicleHandle = GetVehiclePedIsIn(ped, false);
      let vehicleSeat = -2;
      if (vehicleHandle) {
        const maxPassengers = GetVehicleMaxNumberOfPassengers(vehicleHandle);
        for (let seat = -1; seat < maxPassengers; seat++) {
          if (GetPedInVehicleSeat(vehicleHandle, seat) === ped) {
            vehicleSeat = seat;
            break;
          }
        }
      }
      emitNet(
        "ragemp:playerState",
        playerCoords[0],
        playerCoords[1],
        playerCoords[2],
        GetEntityHeading(ped),
        gtaPedHealthToRage(GetEntityHealth(ped)),
        GetPedArmour(ped),
        IsPedInCover(ped, false),
        safeGetNetworkId(vehicleHandle),
        vehicleSeat,
      );
    }

    tickCheckpoints(mgr, ped, localPlayer, playerCoords);
    tickWaypoint(mgr, ped, localPlayer, playerCoords);
    tickVehicleAudio(mgr);
    tickModelAndHealth(mgr, ped);
    tickActions(mgr, ped, localPlayer);
    tickStreaming(mgr, cache, localPlayer);
  });

  rec.lifecycleTick = setTick(() => {
    if (!rec.builtinTickStarted) return;
    const ped = PlayerPedId();
    if (ped === 0) return;
    const localPlayer = globalThis.mp?.players?.local;
    if (!localPlayer) return;

    tickLifecycle(mgr, ped, localPlayer);
    tickVehicleState(mgr, ped, localPlayer);
    tickWeapon(mgr, ped, localPlayer);
  });

  on("onResourceStop", (name: string) => {
    if (name !== GetCurrentResourceName()) return;
    if (rec.lifecycleTick != null) {
      clearTick(rec.lifecycleTick);
      rec.lifecycleTick = null;
    }
    if (rec.renderTick != null) {
      clearTick(rec.renderTick);
      rec.renderTick = null;
    }
    if (typeof rec.builtinTick === "function") {
      rec.builtinTick();
      rec.builtinTick = null;
    }
  });
}

export function initTick(mgr: EventManager, ped: number, cache: { players: number[]; vehicles: number[]; peds: number[] }): void {
  const rec = ClientEventManagerInternals.get(mgr);
  rec.builtinTickStarted = true;
  rec.wasAlive = !IsPedDeadOrDying(ped, true);
  rec.wasInVehicle = IsPedInAnyVehicle(ped, false);
  if (rec.wasInVehicle) {
    rec.lastVehicleHandle = GetVehiclePedIsIn(ped, false);
  }
  rec.lastWeaponHash = GetSelectedPedWeapon(ped);
  rec.trackedHealth = GetEntityHealth(ped);
  rec.trackedArmour = GetPedArmour(ped);
  rec.lastHornState = false;
  rec.lastSirenState = false;
  rec.lastTrailerNetId = 0;
  rec.lastAudioVehHandle = 0;
  rec.lastPedModel = GetEntityModel(ped);
  rec.waypointActive = IsWaypointActive();
  if (rec.waypointActive) {
    const waypointBlipId = GetFirstBlipInfoId(GetWaypointBlipEnumId());
    if (DoesBlipExist(waypointBlipId)) {
      const coords = GetBlipInfoIdCoord(waypointBlipId);
      rec.waypointX = coords[0];
      rec.waypointY = coords[1];
      rec.waypointZ = coords[2];
    }
  }
  const localPlayerId = PlayerId();
  for (const p of cache.players) {
    if (p === localPlayerId) continue;
    const serverId = GetPlayerServerId(p);
    if (serverId && serverId !== -1) rec.connectedPlayers.add(serverId);
  }
}

export function tickLifecycle(mgr: EventManager, ped: number, localPlayer: any): void {
  const rec = ClientEventManagerInternals.get(mgr);
  const isDead = IsPedDeadOrDying(ped, true);

  if (isDead && rec.wasAlive) {
    const causeOfDeath = GetPedCauseOfDeath(ped);
    const killerEntity = GetPedSourceOfDeath(ped);

    let killerId = null;
    if (killerEntity !== 0 && killerEntity !== ped) {
      try {
        if (IsEntityAPed(killerEntity)) {
          const killerPlayer = NetworkGetPlayerIndexFromPed(killerEntity);
          if (killerPlayer >= 0) {
            killerId = GetPlayerServerId(killerPlayer);
          }
        }
      } catch (_) {}
    }

    const killer = killerId
      ? (playerByServerId(killerId) ?? null)
      : null;
    mgr.call("playerDeath", localPlayer, causeOfDeath, killer);
    emitNet("ragemp:playerDeath", causeOfDeath, killerId);
  } else if (
    !isDead &&
    !rec.wasAlive &&
    !globalThis.mp?.spawnmanager?.isSpawning
  ) {
    mgr.call("playerSpawn", localPlayer);
    mgr.call("playerResurrect", localPlayer);
    emitNet("ragemp:playerSpawn");
  }
  rec.wasAlive = !isDead;
}

export function tickVehicleState(mgr: EventManager, ped: number, localPlayer: any): void {
  const rec = ClientEventManagerInternals.get(mgr);
  const inVehicle = IsPedInAnyVehicle(ped, false);
  const currentVehicleHandle = inVehicle ? GetVehiclePedIsIn(ped, false) : 0;

  if (inVehicle && !rec.wasInVehicle) {
    const vehicleHandle = currentVehicleHandle;
    rec.lastVehicleHandle = vehicleHandle;

    let seatIndex = -1;
    const maxPassengers = GetVehicleMaxNumberOfPassengers(vehicleHandle);
    for (let s = -1; s < maxPassengers; s++) {
      if (GetPedInVehicleSeat(vehicleHandle, s) === ped) {
        seatIndex = s;
        break;
      }
    }
    rec.lastVehicleSeat = seatIndex;

    const vehicleNetId = safeGetNetworkId(vehicleHandle);

    const enteredVehicle =
      resolveHandle(globalThis.mp.vehicles, vehicleHandle) ?? null;
    mgr.call("playerEnterVehicle", enteredVehicle, seatIndex);

    emitNet("ragemp:playerEnterVehicle", vehicleNetId, seatIndex);
  } else if (inVehicle && rec.wasInVehicle && currentVehicleHandle !== rec.lastVehicleHandle) {
    const previousHandle = rec.lastVehicleHandle;
    const previousNetId = safeGetNetworkId(previousHandle);
    const previousVehicle = resolveHandle(globalThis.mp.vehicles, previousHandle) ?? null;
    mgr.call("playerLeaveVehicle", previousVehicle, rec.lastVehicleSeat ?? -1);
    emitNet("ragemp:playerExitVehicle", previousNetId);

    rec.lastVehicleHandle = currentVehicleHandle;
    let seatIndex = -1;
    const maxPassengers = GetVehicleMaxNumberOfPassengers(currentVehicleHandle);
    for (let seat = -1; seat < maxPassengers; seat++) {
      if (GetPedInVehicleSeat(currentVehicleHandle, seat) === ped) {
        seatIndex = seat;
        break;
      }
    }
    rec.lastVehicleSeat = seatIndex;
    const currentNetId = safeGetNetworkId(currentVehicleHandle);
    const currentVehicle = resolveHandle(globalThis.mp.vehicles, currentVehicleHandle) ?? null;
    mgr.call("playerEnterVehicle", currentVehicle, seatIndex);
    emitNet("ragemp:playerEnterVehicle", currentNetId, seatIndex);
  } else if (!inVehicle && rec.wasInVehicle) {
    const lastVehicle = rec.lastVehicleHandle;
    const vehicleNetId = safeGetNetworkId(lastVehicle);

    const leftVehicle =
      resolveHandle(globalThis.mp.vehicles, lastVehicle) ?? null;
    mgr.call(
      "playerLeaveVehicle",
      leftVehicle,
      rec.lastVehicleSeat ?? -1,
    );

    emitNet("ragemp:playerExitVehicle", vehicleNetId);
    rec.lastVehicleHandle = 0;
  }
  rec.wasInVehicle = inVehicle;

  const tryingToEnterVehicle = GetVehiclePedIsTryingToEnter(ped);
  if (tryingToEnterVehicle !== 0 && !rec.isTryingToEnterVehicle) {
    rec.isTryingToEnterVehicle = true;
    rec.tryingToEnterVehicleHandle = tryingToEnterVehicle;

    let seatIndex = -1;
    const maxPassengers =
      GetVehicleMaxNumberOfPassengers(tryingToEnterVehicle);
    for (let s = -1; s < maxPassengers; s++) {
      if (GetPedInVehicleSeat(tryingToEnterVehicle, s) === 0) {
        seatIndex = s;
        break;
      }
    }

    const vehicleNetId = safeGetNetworkId(tryingToEnterVehicle);
    const startVehicle =
      resolveHandle(globalThis.mp.vehicles, tryingToEnterVehicle) ?? null;
    mgr.call("playerStartEnterVehicle", startVehicle, seatIndex);
    emitNet("ragemp:playerStartEnterVehicle", vehicleNetId, seatIndex);
  } else if (tryingToEnterVehicle === 0 && rec.isTryingToEnterVehicle) {
    rec.isTryingToEnterVehicle = false;
    rec.tryingToEnterVehicleHandle = 0;
  }

  const isTryingToExit = inVehicle && GetIsTaskActive(ped, 2);
  if (isTryingToExit && !rec.isTryingToExitVehicle) {
    rec.isTryingToExitVehicle = true;
    const vehicleHandle = GetVehiclePedIsIn(ped, false);
    const vehicleNetId = safeGetNetworkId(vehicleHandle);
    const exitVehicle =
      resolveHandle(globalThis.mp.vehicles, vehicleHandle) ?? null;
    mgr.call("playerStartExitVehicle", exitVehicle);
    emitNet("ragemp:playerStartExitVehicle", vehicleNetId);
  } else if (!isTryingToExit && rec.isTryingToExitVehicle) {
    rec.isTryingToExitVehicle = false;
  }
}

export function tickWeapon(mgr: EventManager, ped: number, localPlayer: any): void {
  const rec = ClientEventManagerInternals.get(mgr);
  const currentWeapon = GetSelectedPedWeapon(ped);
  if (currentWeapon !== rec.lastWeaponHash) {
    const oldWeapon = rec.lastWeaponHash;
    rec.lastWeaponHash = currentWeapon;

    mgr.call("playerWeaponChange", localPlayer, oldWeapon, currentWeapon);
    emitNet("ragemp:playerWeaponChange", oldWeapon, currentWeapon);
  }
}

export function tickCheckpoints(mgr: EventManager, ped: number, localPlayer: any, playerCoords: number[]): void {
  const rec0 = ClientEventManagerInternals.get(mgr);
  const checkpointPool = globalThis.mp?.checkpoints;
  if (!checkpointPool) return;

  const px = playerCoords[0];
  const py = playerCoords[1];
  const pz = playerCoords[2];

  for (const checkpoint of checkpointPool) {
    const rec = EntityInternals.get(checkpoint);
    const pos = rec.position;
    const radius = checkpoint._radius;
    if (!pos || radius == null) continue;

    const dx = px - pos.x;
    const dy = py - pos.y;
    const dz = pz - pos.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    const isInside =
      isVisibleHere(rec.dimension) && distSq <= radius * radius;

    if (isInside && !rec0.insideCheckpoints.has(checkpoint.id)) {
      rec0.insideCheckpoints.add(checkpoint.id);
      mgr.call("playerEnterCheckpoint", checkpoint);
      if (checkpoint._origin === "server")
        emitNet("ragemp:checkpoint:enter", checkpoint.remoteId);
    } else if (!isInside && rec0.insideCheckpoints.has(checkpoint.id)) {
      rec0.insideCheckpoints.delete(checkpoint.id);
      mgr.call("playerExitCheckpoint", checkpoint);
      if (checkpoint._origin === "server")
        emitNet("ragemp:checkpoint:exit", checkpoint.remoteId);
    }
  }

  for (const cpId of rec0.insideCheckpoints) {
    if (!checkpointPool.exists(cpId)) {
      rec0.insideCheckpoints.delete(cpId);
    }
  }
}

export function tickWaypoint(mgr: EventManager, ped: number, localPlayer: any, playerCoords: number[]): void {
  const rec = ClientEventManagerInternals.get(mgr);
  const waypointNowActive = IsWaypointActive();

  if (waypointNowActive) {
    const waypointBlipId = GetFirstBlipInfoId(GetWaypointBlipEnumId());
    if (DoesBlipExist(waypointBlipId)) {
      const coords = GetBlipInfoIdCoord(waypointBlipId);
      const wx = coords[0];
      const wy = coords[1];
      const wz = coords[2];

      if (
        !rec.waypointActive ||
        wx !== rec.waypointX ||
        wy !== rec.waypointY ||
        wz !== rec.waypointZ
      ) {
        rec.waypointX = wx;
        rec.waypointY = wy;
        rec.waypointZ = wz;
        rec.waypointReached = false;
        mgr.call("playerCreateWaypoint", new Vector3(wx, wy, wz));
      }

      if (!rec.waypointReached) {
        const dxW = playerCoords[0] - wx;
        const dyW = playerCoords[1] - wy;
        const dist2D = Math.sqrt(dxW * dxW + dyW * dyW);
        if (dist2D <= 5.0) {
          rec.waypointReached = true;
          mgr.call("playerReachWaypoint", localPlayer, wx, wy, wz);
          emitNet("ragemp:playerReachWaypoint", wx, wy, wz);
        }
      }
    }
  } else if (rec.waypointActive) {
    rec.waypointReached = false;
  }

  rec.waypointActive = waypointNowActive;
}

export function tickVehicleAudio(mgr: EventManager): void {
  const rec = ClientEventManagerInternals.get(mgr);
  const vehHandle = rec.wasInVehicle ? rec.lastVehicleHandle : 0;
  if (vehHandle !== 0) {
    const isHornActive = IsHornActive(vehHandle);
    if (isHornActive !== rec.lastHornState) {
      rec.lastHornState = isHornActive;
      emitNet("ragemp:vehicleHorn", safeGetNetworkId(vehHandle), isHornActive);
    }
    const isSirenActive = IsVehicleSirenOn(vehHandle);
    if (isSirenActive !== rec.lastSirenState) {
      rec.lastSirenState = isSirenActive;
      emitNet("ragemp:vehicleSiren", safeGetNetworkId(vehHandle), isSirenActive);
    }
    const [hasTrailer, trailerHandle] = GetVehicleTrailerVehicle(vehHandle);
    const trailerNetId = hasTrailer ? safeGetNetworkId(trailerHandle) : 0;
    if (trailerNetId !== (rec.lastTrailerNetId ?? 0)) {
      rec.lastTrailerNetId = trailerNetId;
      if (trailerNetId !== 0) {
        emitNet(
          "ragemp:trailerAttached",
          safeGetNetworkId(vehHandle),
          trailerNetId,
        );
      }
    }
    rec.lastAudioVehHandle = vehHandle;
  } else {
    const lastHandle = rec.lastAudioVehHandle ?? 0;
    if (lastHandle !== 0 && (rec.lastHornState || rec.lastSirenState)) {
      const netId = safeGetNetworkId(lastHandle);
      if (rec.lastHornState) emitNet("ragemp:vehicleHorn", netId, false);
      if (rec.lastSirenState) emitNet("ragemp:vehicleSiren", netId, false);
    }
    rec.lastHornState = false;
    rec.lastSirenState = false;
    rec.lastTrailerNetId = 0;
    rec.lastAudioVehHandle = 0;
  }
}

export function tickModelAndHealth(mgr: EventManager, ped: number): void {
  const rec = ClientEventManagerInternals.get(mgr);
  const currentModel = GetEntityModel(ped);
  if (currentModel !== (rec.lastPedModel ?? 0)) {
    if (rec.lastPedModel !== undefined) {
      emitNet(
        "ragemp:entityModelChange",
        0,
        rec.lastPedModel,
        currentModel,
      );
    }
    rec.lastPedModel = currentModel;
  }

  const currentHealth = GetEntityHealth(ped);
  const currentArmour = GetPedArmour(ped);
  if (rec.trackedHealth > 0) {
    const healthLoss = rec.trackedHealth - currentHealth;
    const armourLoss = rec.trackedArmour - currentArmour;
    if (healthLoss > 0 || armourLoss > 0) {
      emitNet("ragemp:playerDamage", healthLoss, armourLoss);
      emitNet(
        "ragemp:csharp:playerDamage",
        rec.lastDamageAttackerServerId,
        rec.lastDamageWeapon,
        Math.max(0, healthLoss),
      );
      rec.lastDamageAttackerServerId = -1;
      rec.lastDamageWeapon = 0;
    }
  }
  rec.trackedHealth = currentHealth;
  rec.trackedArmour = currentArmour;
}

export function tickActions(mgr: EventManager, ped: number, localPlayer: any): void {
  const rec = ClientEventManagerInternals.get(mgr);
  const isShooting = IsPedShooting(ped);
  if (isShooting && !rec.wasShooting) {
    const [hit, impactCoords] = GetPedLastWeaponImpactCoord(ped);
    const targetPos = hit
      ? { x: impactCoords[0], y: impactCoords[1], z: impactCoords[2] }
      : null;
    mgr.call("playerWeaponShot", localPlayer, targetPos, 0);
  }
  rec.wasShooting = isShooting;

  const isClicking = IsControlPressed(0, 24);
  if (isClicking && !rec.wasClicking) {
    const [cursorX, cursorY] = GetNuiCursorPosition();
    mgr.call("click", { x: cursorX ?? 0, y: cursorY ?? 0 }, "down");
  } else if (!isClicking && rec.wasClicking) {
    const [cursorX, cursorY] = GetNuiCursorPosition();
    mgr.call("click", { x: cursorX ?? 0, y: cursorY ?? 0 }, "up");
  }
  rec.wasClicking = isClicking;
}

export function tickStreaming(mgr: EventManager, cache: { players: number[]; vehicles: number[]; peds: number[] }, localPlayer: any): void {
  const rec = ClientEventManagerInternals.get(mgr);
  const activePlayers = cache.players;
  const activeSet = rec.activeSet;
  activeSet.clear();
  const localPlayerId = PlayerId();

  for (const p of activePlayers) {
    const serverId = GetPlayerServerId(p);
    if (!serverId || serverId === -1) continue;
    activeSet.add(serverId);
    const remoteMp = playerByServerId(serverId) ?? p;
    const isLocal = p === localPlayerId;

    if (!isLocal) {
      const pPed = GetPlayerPed(p);
      const isStreamed = pPed !== 0 && DoesEntityExist(pPed);
      if (isStreamed && !rec.streamedPlayers.has(serverId)) {
        rec.streamedPlayers.add(serverId);
        mgr.call("playerStreamIn", remoteMp);
      } else if (!isStreamed && rec.streamedPlayers.has(serverId)) {
        rec.streamedPlayers.delete(serverId);
        mgr.call("playerStreamOut", remoteMp);
      }

      if (!rec.connectedPlayers.has(serverId)) {
        rec.connectedPlayers.add(serverId);
        mgr.call("playerJoin", remoteMp);
      }
    }

    const isTalking = NetworkIsPlayerTalking(p);
    if (isTalking && !rec.talkingPlayers.has(serverId)) {
      rec.talkingPlayers.add(serverId);
      mgr.call("playerStartTalking", remoteMp);
    } else if (!isTalking && rec.talkingPlayers.has(serverId)) {
      rec.talkingPlayers.delete(serverId);
      mgr.call("playerStopTalking", remoteMp);
    }
  }

  for (const id of rec.streamedPlayers) {
    if (!activeSet.has(id)) rec.streamedPlayers.delete(id);
  }
  for (const id of rec.connectedPlayers) {
    if (!activeSet.has(id)) {
      rec.connectedPlayers.delete(id);
      const quitMp = playerByServerId(id as number) ?? id;
      mgr.call("playerQuit", quitMp, "quit", "");
    }
  }
  for (const id of rec.talkingPlayers) {
    if (!activeSet.has(id)) rec.talkingPlayers.delete(id);
  }

  const vehPool = cache.vehicles;
  const healthSeen = rec.vehicleHealthSeen;
  healthSeen.clear();
  for (const handle of vehPool) {
    if (!NetworkGetEntityIsNetworked(handle)) continue;
    const owner = NetworkGetEntityOwner(handle);
    const prev = rec.entityOwners.get(handle);
    if (prev !== undefined && prev !== owner) {
      const vehMp = globalThis.mp?.vehicles?.atHandle?.(handle);
      const controller = owner < 0 ? null : (playerByServerId(GetPlayerServerId(owner)) ?? null);
      mgr.call("entityControllerChange", vehMp ?? handle, controller);
    }
    rec.entityOwners.set(handle, owner);

    if (owner === localPlayerId) {
      healthSeen.add(handle);
      reportVehicleHealth(rec, handle);
    }
  }
  for (const [h] of rec.entityOwners) {
    if (!DoesEntityExist(h)) rec.entityOwners.delete(h);
  }
  for (const h of rec.vehicleHealth.keys()) {
    if (!healthSeen.has(h)) rec.vehicleHealth.delete(h);
  }
}

function reportVehicleHealth(rec: ReturnType<typeof ClientEventManagerInternals.get>, handle: number): void {
  const body = GetVehicleBodyHealth(handle);
  const engine = GetVehicleEngineHealth(handle);
  const dead = IsEntityDead(handle);
  const prev = rec.vehicleHealth.get(handle);

  if (!prev) {
    rec.vehicleHealth.set(handle, { body, engine, dead, netId: safeGetNetworkId(handle) });
    return;
  }

  if (body !== prev.body || engine !== prev.engine) {
    if (!prev.netId) prev.netId = safeGetNetworkId(handle);
    if (prev.netId) emitNet("ragemp:vehicleHealthReport", prev.netId, body, engine);
    prev.body = body;
    prev.engine = engine;
  }

  if (dead && !prev.dead) {
    if (!prev.netId) prev.netId = safeGetNetworkId(handle);
    if (prev.netId) emitNet("ragemp:vehicleDeath", prev.netId);
  }
  prev.dead = dead;
}

export function setupProcChannel(mgr: EventManager): void {
  const rec = ClientEventManagerInternals.get(mgr);
  if (!rec.pendingProcs) rec.pendingProcs = new Map();
  if (!rec.procs) rec.procs = new Map();

  onNet("ragemp:procResult", (reqId: number, error: string | null, result: any) => {
    const entry = rec.pendingProcs!.get(reqId);
    if (!entry) return;
    if (entry.timer) clearTimeout(entry.timer);
    rec.pendingProcs!.delete(reqId);
    if (error) entry.reject(new Error(error));
    else entry.resolve(result);
  });

  onNet("ragemp:callProc", async (procName: string, reqId: number, ...args: any[]) => {
    const handler = rec.procs!.get(procName);
    if (!handler) {
      emitNet(
        "ragemp:callProcResult",
        reqId,
        `Proc not found: ${procName}`,
        null,
      );
      return;
    }
    try {
      const result = await handler(...args);
      emitNet("ragemp:callProcResult", reqId, null, sanitizeArgsForNet([result])[0]);
    } catch (err) {
      emitNet("ragemp:callProcResult", reqId, String(err), null);
    }
  });
}
