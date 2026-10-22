import { STATE_KEY_PREFIX } from "@ragemp-fivem-bridge/shared";
import { sendEntitySnapshot } from "../utils/entityRegistry";
import { playerBySource } from "../utils/playerRegistry";
import { EntityInternals, EventEmitterInternals } from "@ragemp-fivem-bridge/shared/internal";
import { ServerEventManagerInternals } from "./eventManagerInternals";
import { PlayerInternals } from "./playerInternals";
import { removeFromVehiclePool } from "./pools/vehiclePoolService";
import { VehicleInternals } from "./vehicleInternals";
import { shouldCancelSafeZoneWeaponDamage } from "../utils/safeZoneDamageGate";
import { removeFromPedPool } from "./pools/pedPoolService";
import { removeFromObjectPool } from "./pools/objectPoolService";
import type { EventManager } from "../Events/EventManager";

const BUILTIN_EVENTS = new Set<string>([
  "playerJoin",
  "playerQuit",
  "playerReady",
  "playerChat",
  // Local-only hook the bridge raises after an uncancelled `playerChat`. The
  // `ragemp-chat` example listens to it to render the default echo. Listed here
  // so registering a handler never auto-wires a network listener for it (which
  // would let clients spoof chat output).
  "ragemp:chat:output",
]);

export function setupEventManager(mgr: EventManager): void {
  setupBuiltinEvents(mgr);
}

function setupBuiltinEvents(mgr: EventManager): void {
  // `outgoingDamage` on the client runs after GTA has generated the hit and
  // cannot authoritatively reject damage to a remotely-owned player ped.
  on("weaponDamageEvent", (sender: number, damage: any) => {
    try {
      if (shouldCancelSafeZoneWeaponDamage(sender, damage, {
        playerBySource,
        entityFromNetId: (netId) => NetworkGetEntityFromNetworkId(netId),
        entityOwner: (entity) => NetworkGetEntityOwner(entity),
        playerPed: (playerSource) => GetPlayerPed(String(playerSource)),
      })) CancelEvent();
    } catch (error) {
      console.error("[ragemp:safeZoneDamageGate]", error);
    }
  });

  onNet("ragemp:playerReady", (forResource: string) => {
    const src = source;
    const player = playerBySource(src);
    if (!player) return;
    emitNet("ragemp:playerReady", src, forResource);
    sendEntitySnapshot(src);
    if (ServerEventManagerInternals.get(mgr).playerReadyHandled.has(src)) return;
    ServerEventManagerInternals.get(mgr).playerReadyHandled.add(src);
    mgr.call("playerReady", player);
    globalThis.mp?.spawnmanager?._maybeAutoSpawn?.(player);
  });

  on("playerDropped", () => {
    ServerEventManagerInternals.get(mgr).playerReadyHandled.delete(source);
  });

  onNet("ragemp:command", (commandText: string) => {
    const src = source;
    processCommand(mgr, src, commandText);
  });

  onNet("ragemp:proc", async (procName: string, requestId: string, ...args: any[]) => {
    const src = source;
    const player = playerBySource(src);
    if (!player) return;
    const handler = ServerEventManagerInternals.get(mgr).procs.get(procName);
    if (!handler) {
      emitNet("ragemp:procResult", src, requestId, `Proc not found: ${procName}`, null);
      return;
    }
    try {
      const result = await handler(player, ...args);
      emitNet("ragemp:procResult", src, requestId, null, result);
    } catch (err) {
      emitNet("ragemp:procResult", src, requestId, String(err), null);
    }
  });

  onNet("ragemp:chat:message", (rawText: string) => {
    const player = playerBySource(source);
    if (!player || typeof rawText !== "string") return;
    const text = rawText.slice(0, 256);

    // The bridge owns the RAGE:MP `playerChat` event lifecycle only — it fires
    // the event and honours a handler returning `false` to cancel the default.
    // It does NOT render or broadcast anything itself: the default "name: text"
    // echo is chat policy and lives entirely in the `ragemp-chat` example
    // resource, which listens for `ragemp:chat:output`. With no such resource
    // loaded, a plain message produces no output.
    let cancelled = false;
    const handlers = EventEmitterInternals.get(mgr).handlers.get("playerChat");
    if (handlers) {
      for (const handler of handlers) {
        if ((handler as any)(player, text) === false) cancelled = true;
      }
    }
    if (cancelled) return;

    mgr.call("ragemp:chat:output", player, text);
  });

  onNet("ragemp:playerDeath", (reason: number, killerId: number | null) => {
    const player = playerBySource(source);
    const killer = killerId ? playerBySource(killerId) : null;
    if (player) mgr.call("playerDeath", player, reason, killer);
  });

  onNet("ragemp:playerSpawn", () => {
    const player = playerBySource(source);
    if (player) mgr.call("playerSpawn", player);
  });

  if (typeof AddStateBagChangeHandler === "function") {
    AddStateBagChangeHandler(null, null, (bagName: string, key: string, value: any) => {
      const mp = globalThis.mp;
      if (!mp || typeof bagName !== "string" || typeof key !== "string") return;
      if (key.indexOf(STATE_KEY_PREFIX) !== 0) return;
      const realKey = key.slice(STATE_KEY_PREFIX.length);
      let entity: any = null;
      if (bagName.indexOf("player:") === 0) {
        entity = playerBySource(parseInt(bagName.slice(7), 10)) ?? null;
      } else if (bagName.indexOf("entity:") === 0) {
        const handle =
          typeof GetEntityFromStateBagName === "function"
            ? GetEntityFromStateBagName(bagName)
            : 0;
        if (handle && handle !== 0) {
          entity =
            mp.vehicles?.atHandle?.(handle) ??
            mp.objects?.atHandle?.(handle) ??
            mp.peds?.atHandle?.(handle) ??
            null;
        }
      }
      if (entity) {
        emitDataChange(mgr, entity, realKey, value);
      }
    });
  }

  onNet("ragemp:playerEnterVehicle", (vehicleNetId: number, seatIndex: number) => {
    const player = playerBySource(source);
    const vehicle = globalThis.mp.vehicles.atNetId(vehicleNetId);
    if (player) {
      PlayerInternals.get(player as any).vehicle = vehicle ?? null;
      mgr.call(
        "playerEnterVehicle",
        player,
        vehicle,
        (seatIndex ?? -1) + 1,
      );
    }
  });

  onNet("ragemp:playerExitVehicle", (vehicleNetId: number) => {
    const player = playerBySource(source);
    const vehicle = globalThis.mp.vehicles.atNetId(vehicleNetId);
    if (player) {
      PlayerInternals.get(player as any).vehicle = null;
      mgr.call("playerExitVehicle", player, vehicle);
    }
  });

  onNet("ragemp:playerStartEnterVehicle", (vehicleNetId: number, seatIndex: number) => {
    const player = playerBySource(source);
    const vehicle = globalThis.mp.vehicles.atNetId(vehicleNetId);
    if (player)
      mgr.call("playerStartEnterVehicle", player, vehicle, seatIndex);
  });

  onNet("ragemp:playerStartExitVehicle", (vehicleNetId: number) => {
    const player = playerBySource(source);
    const vehicle = globalThis.mp.vehicles.atNetId(vehicleNetId);
    if (player) mgr.call("playerStartExitVehicle", player, vehicle);
  });

  onNet("ragemp:playerWeaponChange", (oldWeapon: number, newWeapon: number) => {
    const player = playerBySource(source);
    if (player)
      mgr.call("playerWeaponChange", player, oldWeapon, newWeapon);
  });

  onNet("ragemp:playerDamage", (healthLoss: number, armorLoss: number) => {
    const player = playerBySource(source);
    if (player) mgr.call("playerDamage", player, healthLoss, armorLoss);
  });

  onNet("ragemp:vehicleDeath", (vehicleNetId: number) => {
    const vehicle = globalThis.mp.vehicles.atNetId(vehicleNetId);
    if (vehicle) mgr.call("vehicleDeath", vehicle);
  });

  onNet(
    "ragemp:vehicleHealthReport",
    (vehicleNetId: number, bodyHealth: number, engineHealth: number) => {
      const vehicle = globalThis.mp.vehicles.atNetId(vehicleNetId);
      if (!vehicle) return;
      const rec = VehicleInternals.get(vehicle);
      const bodyHealthLoss = rec.bodyHealth - bodyHealth;
      const engineHealthLoss = rec.engineHealth - engineHealth;
      rec.bodyHealth = bodyHealth;
      rec.engineHealth = engineHealth;
      if (bodyHealthLoss > 0 || engineHealthLoss > 0) {
        mgr.call(
          "vehicleDamage",
          vehicle,
          Math.max(0, bodyHealthLoss),
          Math.max(0, engineHealthLoss),
        );
      }
    },
  );

  on("onResourceStop", (resource: string) => {
    if (resource === GetCurrentResourceName()) {
      mgr.call("serverShutdown");
    }
  });

  on("onResourceStart", (resource: string) => {
    if (resource === GetCurrentResourceName()) {
      mgr.call("packagesLoaded");
    }
  });

  on("playerEnteredScope", (data: { player: number; for: number }) => {
    const observer = playerBySource(data.player);
    const entered = playerBySource(data["for"]);
    if (observer && entered) mgr.call("playerStreamIn", entered, observer);
  });

  on("playerLeftScope", (data: { player: number; for: number }) => {
    const observer = playerBySource(data.player);
    const left = playerBySource(data["for"]);
    if (observer && left) mgr.call("playerStreamOut", left, observer);
  });

  on("entityRemoved", (handle: number) => {
    const mp = globalThis.mp;
    if (!mp) return;
    const vehicle = mp.vehicles?.atHandle?.(handle);
    if (vehicle) {
      removeFromVehiclePool(mp.vehicles, vehicle.id);
      return;
    }
    const ped = mp.peds?.atHandle?.(handle);
    if (ped) {
      removeFromPedPool(mp.peds, ped.id);
      return;
    }
    const object = mp.objects?.atHandle?.(handle);
    if (object) {
      removeFromObjectPool(mp.objects, object.id);
      return;
    }
  });

  onNet("ragemp:vehicleHorn", (vehicleNetId: number, state: boolean) => {
    const vehicle = globalThis.mp?.vehicles?.atNetId?.(vehicleNetId);
    if (vehicle) mgr.call("vehicleHornToggle", vehicle, !!state);
  });

  onNet("ragemp:vehicleSiren", (vehicleNetId: number, state: boolean) => {
    const vehicle = globalThis.mp?.vehicles?.atNetId?.(vehicleNetId);
    if (vehicle) mgr.call("vehicleSirenToggle", vehicle, !!state);
  });

  onNet("ragemp:trailerAttached", (vehicleNetId: number, trailerNetId: number) => {
    const vehicle = globalThis.mp?.vehicles?.atNetId?.(vehicleNetId);
    const trailer = globalThis.mp?.vehicles?.atNetId?.(trailerNetId);
    if (vehicle) mgr.call("trailerAttached", vehicle, trailer ?? null);
  });

  onNet("ragemp:playerReachWaypoint", (x: number, y: number, z: number) => {
    const player = playerBySource(source);
    if (player) mgr.call("playerReachWaypoint", player, x, y, z);
  });

  onNet("ragemp:entityModelChange", (entityNetId: number, oldModel: number, newModel: number) => {
    const mp = globalThis.mp;
    let entity: any = null;
    if (entityNetId != null && mp) {
      entity =
        mp.vehicles?.atNetId?.(entityNetId) ??
        mp.peds?.atNetId?.(entityNetId) ??
        mp.objects?.atNetId?.(entityNetId) ??
        playerBySource(source) ??
        null;
    }
    mgr.call("entityModelChange", entity, oldModel, newModel);
  });
}

export function handleEventAdded(mgr: EventManager, eventName: string): void {
  if (eventName === "incomingConnection") {
    if (EventEmitterInternals.get(mgr).handlers.get("__fivem_incomingConnection")) return;
    EventEmitterInternals.get(mgr).handlers.set("__fivem_incomingConnection", new Set([true]) as any);
    on("playerConnecting", (_name: string, setKickReason: (reason: string) => void, _deferrals: any) => {
      const playerSrc = source;
      const ip = GetPlayerEndpoint(String(playerSrc)) ?? "";
      let serial = "";
      let rgscId = "";
      try {
        const count = GetNumPlayerIdentifiers(String(playerSrc));
        for (let i = 0; i < count; i++) {
          const ident = GetPlayerIdentifier(String(playerSrc), i) || "";
          if (!serial && ident.indexOf("license:") === 0) serial = ident.slice(8);
          else if (!rgscId && ident.indexOf("steam:") === 0) rgscId = ident.slice(6);
        }
      } catch (e) {}
      const cancel = (reason?: string): void => {
        setKickReason(reason ?? "Connection rejected");
        CancelEvent();
      };
      mgr.call("incomingConnection", ip, serial, rgscId, cancel);
    });
    return;
  }

  if (BUILTIN_EVENTS.has(eventName)) return;

  if (!EventEmitterInternals.get(mgr).handlers.get(`__net_${eventName}`)) {
    EventEmitterInternals.get(mgr).handlers.set(`__net_${eventName}`, new Set([true]) as any);
    onNet(eventName, (...args: any[]) => {
      const src = source;
      const player = playerBySource(src);
      if (player) {
        mgr.call(eventName, player, ...args);
      }
    });
  }
}

export function emitDataChange(mgr: EventManager, entity: any, key: string, value: any): void {
  if (!ServerEventManagerInternals.get(mgr).dataSnapshots) ServerEventManagerInternals.get(mgr).dataSnapshots = new WeakMap();
  let snapshot = ServerEventManagerInternals.get(mgr).dataSnapshots!.get(entity);
  if (!snapshot) {
    snapshot = new Map();
    ServerEventManagerInternals.get(mgr).dataSnapshots!.set(entity, snapshot);
  }
  const oldValue = snapshot.get(key);
  snapshot.set(key, value);
  EntityInternals.get(entity).variables.set(key, value);

  const handlers = ServerEventManagerInternals.get(mgr).dataHandlers?.get(key);
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

export function processCommand(mgr: EventManager, src: number, commandText: string): void {
  const player = playerBySource(src);
  if (!player) return;
  const raw = String(commandText ?? "").trim();
  if (!raw) return;
  const cleaned = raw.charAt(0) === "/" ? raw.slice(1).trim() : raw;
  if (!cleaned) return;
  const parts = cleaned.split(/\s+/);
  const name = parts.shift();
  if (!name) return;

  mgr.call("playerCommand", player, cleaned);

  const handler = ServerEventManagerInternals.get(mgr).commands.get(name);
  if (handler) {
    try {
      handler(player, parts.join(" "), ...parts);
    } catch (e) {
      console.error(`[bridge] command "${name}" handler error:`, e);
    }
  }
}
