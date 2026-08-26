interface PluginContext {
  log: (...args: unknown[]) => void;
  [key: string]: unknown;
}

interface SpawnInfo {
  x: number;
  y: number;
  z: number;
  heading: number;
  model: string;
}

export const name = "spawnmanager";

export default function setup({ mp, plugin }: { mp: any; plugin: PluginContext }): void {
  const DEFAULT_SPAWN: SpawnInfo = {
    x: 0,
    y: 0,
    z: 72,
    heading: 0,
    model: "mp_m_freemode_01",
  };

  let isSpawning = false;
  let hasSpawned = false;
  let spawnInfo: SpawnInfo = { ...DEFAULT_SPAWN };
  let autoRespawnAfterDeath = true;
  let respawnSuppressTick: number | null = null;

  function startRespawnSuppress(): void {
    if (respawnSuppressTick !== null) return;
    if (typeof SetFadeOutAfterDeath === "function") SetFadeOutAfterDeath(false);
    respawnSuppressTick = setTick(() => {
      const ped = PlayerPedId();
      if (IsEntityDead(ped)) {
        IgnoreNextRestart(true);
        PauseDeathArrestRestart(true);
      }
    });
  }

  function stopRespawnSuppress(): void {
    if (respawnSuppressTick === null) return;
    clearTick(respawnSuppressTick);
    respawnSuppressTick = null;
    if (typeof SetFadeOutAfterDeath === "function") SetFadeOutAfterDeath(true);
    if (typeof PauseDeathArrestRestart === "function") PauseDeathArrestRestart(false);
  }

  async function loadModel(model: string | number): Promise<number | null> {
    const hash = typeof model === "string" ? GetHashKey(model) : model;
    if (!IsModelInCdimage(hash) || !IsModelValid(hash)) return null;
    RequestModel(hash);
    const start = Date.now();
    while (!HasModelLoaded(hash)) {
      if (Date.now() - start > 5000) return null;
      await mp.game.waitAsync(50);
    }
    return hash;
  }

  async function waitForGameReady(): Promise<void> {
    while (!NetworkIsSessionStarted()) {
      await mp.game.waitAsync(100);
    }
  }

  async function doSpawn(info?: Partial<SpawnInfo> | null): Promise<void> {
    if (isSpawning) return;
    isSpawning = true;
    const data = { ...spawnInfo, ...(info && typeof info === "object" ? info : {}) };

    try {
      await waitForGameReady();

      const modelHash = await loadModel(data.model);
      if (modelHash !== null) {
        SetPlayerModel(PlayerId(), modelHash);
        SetModelAsNoLongerNeeded(modelHash);
      }

      const ped = PlayerPedId();
      SetPedDefaultComponentVariation(ped);

      DoScreenFadeOut(500);
      const fadeStart = Date.now();
      while (!IsScreenFadedOut() && Date.now() - fadeStart < 1500) {
        await mp.game.waitAsync(10);
      }

      RequestCollisionAtCoord(data.x, data.y, data.z);
      await mp.game.waitAsync(500);

      NetworkResurrectLocalPlayer(
        data.x,
        data.y,
        data.z,
        data.heading,
        0,
        false,
      );
      const newPed = PlayerPedId();
      FreezeEntityPosition(newPed, true);
      ClearPedTasksImmediately(newPed);
      RemoveAllPedWeapons(newPed, false);
      ClearPlayerWantedLevel(PlayerId());
      SetEntityHealth(newPed, 200);

      ShutdownLoadingScreen();
      if (typeof ShutdownLoadingScreenNui === "function")
        ShutdownLoadingScreenNui();

      const collisionStart = Date.now();
      while (
        !HasCollisionLoadedAroundEntity(newPed) &&
        Date.now() - collisionStart < 10000
      ) {
        await mp.game.waitAsync(100);
      }

      FreezeEntityPosition(newPed, false);
      DoScreenFadeIn(500);
      SetPlayerControl(PlayerId(), true, 0);

      if (globalThis.mp?.events) globalThis.mp.events._wasAlive = true;
      const wasFirstSpawn = !hasSpawned;
      mp.events.call("playerSpawn", wasFirstSpawn);
      hasSpawned = true;
      emitNet("ragemp:playerSpawn");
    } catch (err) {
      plugin.log("spawn failed:", err);
    } finally {
      isSpawning = false;
    }
  }

  on("onClientResourceStart", (resName: string) => {
    if (resName !== GetCurrentResourceName()) return;
    if (typeof ShutdownLoadingScreenNui === "function")
      ShutdownLoadingScreenNui();
  });

  onNet("ragemp:spawnmanager:spawn", (info: Partial<SpawnInfo>) => {
    doSpawn(info);
  });

  onNet("ragemp:setAutoRespawn", (state: boolean) => {
    autoRespawnAfterDeath = state !== false;
    if (autoRespawnAfterDeath) stopRespawnSuppress();
    else startRespawnSuppress();
  });

  mp.spawnmanager = {
    setSpawnPoint(info: Partial<SpawnInfo>): void {
      spawnInfo = { ...spawnInfo, ...(info ?? {}) };
    },
    get spawnPoint(): SpawnInfo {
      return { ...spawnInfo };
    },
    spawn(info?: Partial<SpawnInfo>): Promise<void> {
      return doSpawn(info);
    },
    forceRespawn(): Promise<void> {
      return doSpawn();
    },
    get isSpawning(): boolean {
      return isSpawning;
    },
    get hasSpawned(): boolean {
      return hasSpawned;
    },
  };
}
