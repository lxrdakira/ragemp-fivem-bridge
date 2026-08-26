import "./nativeShims";
import { setPoolLifecycleSink } from "@ragemp-fivem-bridge/shared";
import { Mp } from "./Mp";
import * as spawnmanager from "./Plugins/builtin/spawnmanager";
import * as vehicleSync from "./Plugins/builtin/vehicle-sync";
import { setLocalDimension } from "./utils/dimension";
import { safeGetEntityFromNetId } from "./utils/netId";
import { getChatBrowser } from "./internal/browserInternals";

if (GetResourceMetadata(GetCurrentResourceName(), "ragemp_bridge", 0) !== "library") {
  globalThis.mp = new Mp();

  setPoolLifecycleSink((type, entity) => globalThis.mp?.events?.call(type, entity));

  globalThis.mp.plugins.registerBuiltin(spawnmanager);
  globalThis.mp.plugins.registerBuiltin(vehicleSync);
  globalThis.mp.plugins.loadAll();

  emitNet("ragemp:playerReady", GetCurrentResourceName());

  const _clothesState = new Map<number, [number, number, number]>();
  const _propsState = new Map<number, [number, number]>();

  type HeadBlend = {
    shapeFirst: number; shapeSecond: number; shapeThird: number;
    skinFirst: number; skinSecond: number; skinThird: number;
    shapeMix: number; skinMix: number; thirdMix: number;
  };
  type HairColor = { color: number; highlight: number };
  type Decoration = { collection: string | number; overlay: string | number };
  type OverlayParams = { value?: number; opacity?: number; color?: number; secondColor?: number; colorType?: number };

  const _appearance: {
    headBlend: HeadBlend | null;
    eyeColor: number | null;
    hairColor: HairColor | null;
    faceFeatures: Map<number, number>;
    headOverlays: Map<number, OverlayParams>;
    decorations: Decoration[];
  } = {
    headBlend: null,
    eyeColor: null,
    hairColor: null,
    faceFeatures: new Map(),
    headOverlays: new Map(),
    decorations: [],
  };
  let _clothesTick: number | null = null;
  let _clothesDeadline = 0;
  let _modelTimer: ReturnType<typeof setInterval> | null = null;
  let _animTimer: ReturnType<typeof setInterval> | null = null;
  let _putVehTimer: ReturnType<typeof setInterval> | null = null;

  function applyHeadBlend(ped: number): void {
    const b = _appearance.headBlend;
    if (!b) return;
    SetPedHeadBlendData(
      ped,
      b.shapeFirst | 0, b.shapeSecond | 0, b.shapeThird | 0,
      b.skinFirst | 0, b.skinSecond | 0, b.skinThird | 0,
      b.shapeMix || 0, b.skinMix || 0, b.thirdMix || 0,
      false
    );
  }

  function applyFaceFeatures(ped: number): void {
    for (const [index, scale] of _appearance.faceFeatures) SetPedFaceFeature(ped, index | 0, scale);
  }

  function applyHeadOverlay(ped: number, overlay: number, p: OverlayParams | any[]): void {
    let params: OverlayParams;
    if (Array.isArray(p)) {
      const op = (p[1] as number) ?? 1.0;
      params = { value: p[0] as number, opacity: op > 1 ? op / 100 : op, color: p[2] as number, secondColor: p[3] as number };
    } else {
      params = p as OverlayParams;
    }
    SetPedHeadOverlay(ped, overlay | 0, (params.value ?? 0) | 0, params.opacity ?? 1.0);
    if (params.color !== undefined && params.color !== null) {
      SetPedHeadOverlayColor(ped, overlay | 0, params.colorType ?? 1, params.color | 0, ((params.secondColor ?? params.color) | 0));
    }
  }

  function applyDecorations(ped: number): void {
    ClearPedDecorations(ped);
    for (const d of _appearance.decorations) {
      const c = typeof d.collection === "string" ? GetHashKey(d.collection) : d.collection;
      const o = typeof d.overlay === "string" ? GetHashKey(d.overlay) : d.overlay;
      AddPedDecorationFromHashes(ped, c, o);
    }
  }

  function applyAppearance(ped: number): void {
    const a = _appearance;
    if (a.headBlend) applyHeadBlend(ped);
    if (a.eyeColor != null) SetPedEyeColor(ped, a.eyeColor | 0);
    if (a.hairColor) SetPedHairColor(ped, a.hairColor.color | 0, (a.hairColor.highlight ?? a.hairColor.color) | 0);
    applyFaceFeatures(ped);
    for (const [overlay, p] of a.headOverlays) applyHeadOverlay(ped, overlay, p);
    if (a.decorations.length) applyDecorations(ped);
  }

  function applyOneClothes(ped: number, component: number, c: [number, number, number]): boolean {
    let d = c[0] | 0;
    if (d < 0) d = 0;
    let t = c[1] | 0;
    if (t < 0) t = 0;
    const maxD = GetNumberOfPedDrawableVariations(ped, component);
    if (!maxD || d >= maxD) return false;
    const maxT = GetNumberOfPedTextureVariations(ped, component, d);
    if (maxT > 0 && t >= maxT) t = 0;
    SetPedComponentVariation(ped, component, d, t, c[2] | 0);
    return true;
  }

  function applyAllClothes(): boolean {
    const ped = PlayerPedId();
    if (!ped || ped === 0) return false;
    let allDone = true;
    for (const [component, c] of _clothesState) {
      if (!applyOneClothes(ped, component, c)) allDone = false;
    }
    return allDone;
  }

  function applyAllProps(): boolean {
    const ped = PlayerPedId();
    if (!ped || ped === 0) return false;
    for (const [prop, v] of _propsState) {
      if (v[0] < 0) {
        ClearPedProp(ped, prop);
      } else {
        SetPedPropIndex(ped, prop, v[0], v[1], true);
      }
    }
    return true;
  }

  function ensureClothesApplied(): void {
    _clothesDeadline = GetGameTimer() + 10000;
    if (_clothesTick !== null) return;
    _clothesTick = setTick(() => {
      if (!_clothesState.size || applyAllClothes() || GetGameTimer() > _clothesDeadline) {
        clearTick(_clothesTick!);
        _clothesTick = null;
      }
    });
  }

  function reapplyAppearance(): void {
    const ped = PlayerPedId();
    if (!ped || ped === 0) return;
    applyAppearance(ped);
    applyAllProps();
    ensureClothesApplied();
  }

  globalThis.mp.events.add("playerSpawn", () => {
    reapplyAppearance();
  });

  onNet("ragemp:setDimension", (dimension: number) => {
    setLocalDimension(dimension);
  });

  onNet("ragemp:giveWeapon", (weaponHash: number, ammo: number) => {
    GiveWeaponToPed(PlayerPedId(), weaponHash, ammo, false, true);
  });

  onNet("ragemp:removeWeapon", (weaponHash: number) => {
    RemoveWeaponFromPed(PlayerPedId(), weaponHash);
  });

  onNet("ragemp:removeAllWeapons", () => {
    RemoveAllPedWeapons(PlayerPedId(), false);
  });

  onNet("ragemp:setClothes", (component: number, drawable: number, texture: number, palette: number) => {
    _clothesState.set(component, [drawable, texture, palette]);
    ensureClothesApplied();
  });

  onNet("ragemp:setModel", (model: number) => {
    if (!model) return;
    if (_modelTimer) clearInterval(_modelTimer);
    RequestModel(model);
    let tries = 0;
    const timer = setInterval(() => {
      if (HasModelLoaded(model)) {
        clearInterval(timer);
        if (_modelTimer === timer) _modelTimer = null;
        SetPlayerModel(PlayerId(), model);
        SetModelAsNoLongerNeeded(model);
        SetPedDefaultComponentVariation(PlayerPedId());
        reapplyAppearance();
        setTimeout(reapplyAppearance, 250);
      } else if (++tries > 100) {
        clearInterval(timer);
        if (_modelTimer === timer) _modelTimer = null;
      }
    }, 50);
    _modelTimer = timer;
  });

  onNet("ragemp:setProp", (prop: number, drawable: number, texture: number) => {
    _propsState.set(prop, [drawable, texture]);
    const ped = PlayerPedId();
    if (ped && ped !== 0) {
      if (drawable < 0) ClearPedProp(ped, prop);
      else SetPedPropIndex(ped, prop, drawable, texture, true);
    }
  });

  onNet("ragemp:setEyeColor", (index: number) => {
    _appearance.eyeColor = index;
    const ped = PlayerPedId();
    if (ped && ped !== 0) SetPedEyeColor(ped, index | 0);
  });

  onNet("ragemp:setHairColor", (color: number, highlight: number) => {
    _appearance.hairColor = { color, highlight: highlight ?? color };
    const ped = PlayerPedId();
    if (ped && ped !== 0) SetPedHairColor(ped, color | 0, (highlight ?? color) | 0);
  });

  onNet("ragemp:setFaceFeature", (index: number, scale: number) => {
    _appearance.faceFeatures.set(index, scale);
    const ped = PlayerPedId();
    if (ped && ped !== 0) SetPedFaceFeature(ped, index | 0, scale);
  });

  onNet("ragemp:setHeadBlend", (sf: number, ss: number, st: number, kf: number, ks: number, kt: number, shapeMix: number, skinMix: number, thirdMix: number) => {
    _appearance.headBlend = {
      shapeFirst: sf, shapeSecond: ss, shapeThird: st ?? 0,
      skinFirst: kf, skinSecond: ks, skinThird: kt ?? 0,
      shapeMix: shapeMix ?? 0, skinMix: skinMix ?? 0, thirdMix: thirdMix ?? 0,
    };
    const ped = PlayerPedId();
    if (ped && ped !== 0) {
      applyHeadBlend(ped);
      applyFaceFeatures(ped);
    }
  });

  onNet("ragemp:updateHeadBlend", (shapeMix: number, skinMix: number, thirdMix: number) => {
    if (!_appearance.headBlend) {
      _appearance.headBlend = {
        shapeFirst: 0, shapeSecond: 0, shapeThird: 0,
        skinFirst: 0, skinSecond: 0, skinThird: 0,
        shapeMix: 0, skinMix: 0, thirdMix: 0,
      };
    }
    _appearance.headBlend.shapeMix = shapeMix ?? 0;
    _appearance.headBlend.skinMix = skinMix ?? 0;
    _appearance.headBlend.thirdMix = thirdMix ?? 0;
    const ped = PlayerPedId();
    if (ped && ped !== 0) {
      if (typeof UpdatePedHeadBlendData === "function") {
        UpdatePedHeadBlendData(ped, shapeMix ?? 0, skinMix ?? 0, thirdMix ?? 0);
      } else {
        applyHeadBlend(ped);
      }
    }
  });

  onNet("ragemp:setHeadOverlay", (overlay: number, params: any) => {
    const p = params || {};
    _appearance.headOverlays.set(overlay, p);
    const ped = PlayerPedId();
    if (ped && ped !== 0) applyHeadOverlay(ped, overlay, p);
  });

  onNet("ragemp:setDecoration", (collection: string | number, overlay: string | number) => {
    _appearance.decorations.push({ collection, overlay });
    const ped = PlayerPedId();
    if (ped && ped !== 0) {
      const c = typeof collection === "string" ? GetHashKey(collection) : collection;
      const o = typeof overlay === "string" ? GetHashKey(overlay) : overlay;
      AddPedDecorationFromHashes(ped, c, o);
    }
  });

  onNet("ragemp:clearDecorations", () => {
    _appearance.decorations = [];
    const ped = PlayerPedId();
    if (ped && ped !== 0) ClearPedDecorations(ped);
  });

  onNet("ragemp:setCustomization", (params: any) => {
    if (!params || typeof params !== "object") return;
    _appearance.headBlend = {
      shapeFirst: params.shapeFirst ?? 0, shapeSecond: params.shapeSecond ?? 0, shapeThird: params.shapeThird ?? 0,
      skinFirst: params.skinFirst ?? 0, skinSecond: params.skinSecond ?? 0, skinThird: params.skinThird ?? 0,
      shapeMix: params.shapeMix ?? 0, skinMix: params.skinMix ?? 0, thirdMix: params.thirdMix ?? 0,
    };
    if (params.eyeColor !== undefined) _appearance.eyeColor = params.eyeColor;
    if (params.hairColor !== undefined) {
      _appearance.hairColor = { color: params.hairColor, highlight: params.highlightColor ?? params.hairColor };
    }
    if (Array.isArray(params.faceFeatures)) {
      for (let i = 0; i < params.faceFeatures.length && i < 20; i++) {
        _appearance.faceFeatures.set(i, params.faceFeatures[i] ?? 0);
      }
    }
    const ped = PlayerPedId();
    if (ped && ped !== 0) applyAppearance(ped);
  });

  onNet("ragemp:setWeapon", (weapon: number) => {
    const ped = PlayerPedId();
    if (!weapon) {
      RemoveAllPedWeapons(ped, true);
      return;
    }
    GiveWeaponToPed(ped, weapon, 0, false, true);
    SetCurrentPedWeapon(ped, weapon, true);
  });

  onNet("ragemp:setWeaponAmmo", (weapon: number, ammo: number) => {
    SetPedAmmo(PlayerPedId(), weapon, ammo);
  });

  onNet("ragemp:playAnimation", (dict: string, name: string, speed: number, flag: number) => {
    if (typeof dict !== "string" || typeof name !== "string") return;
    if (_animTimer) clearInterval(_animTimer);
    RequestAnimDict(dict);
    let tries = 0;
    const timer = setInterval(() => {
      if (HasAnimDictLoaded(dict)) {
        clearInterval(timer);
        if (_animTimer === timer) _animTimer = null;
        TaskPlayAnim(PlayerPedId(), dict, name, speed ?? 8.0, -8.0, -1, flag ?? 0, 0, false, false, false);
      } else if (++tries > 100) {
        clearInterval(timer);
        if (_animTimer === timer) _animTimer = null;
      }
    }, 50);
    _animTimer = timer;
  });

  onNet("ragemp:stopAnimation", () => {
    ClearPedTasks(PlayerPedId());
  });

  onNet("ragemp:playScenario", (name: string) => {
    if (typeof name === "string") TaskStartScenarioInPlace(PlayerPedId(), name, 0, true);
  });

  onNet("ragemp:eval", (code: string) => {
    try {
      (0, eval)(code);
    } catch (e) {
      console.error("[ragemp:eval]", e);
    }
  });

  onNet("ragemp:invoke", (hash: string, ...args: any[]) => {
    if (typeof Citizen !== "undefined" && Citizen.invokeNative) {
      Citizen.invokeNative(hash, ...args);
    }
  });

  onNet("ragemp:notify", (message: string) => {
    SetNotificationTextEntry("STRING");
    AddTextComponentString(message);
    DrawNotification(false, false);
  });

  onNet("ragemp:chatMessage", (message: string) => {
    emit("chat:addMessage", { args: [message] });
    const browserPool = globalThis.mp?.browsers;
    if (browserPool) getChatBrowser(browserPool)?.call("chat:push", message);
  });

  onNet("ragemp:requestVehicleControl", (targetServerId: number, netId: number) => {
    if (targetServerId !== -1 && targetServerId !== GetPlayerServerId(PlayerId())) return;
    if (!NetworkDoesNetworkIdExist(netId)) return;
    NetworkRequestControlOfNetworkId(netId);
  });

  onNet("ragemp:setTime", (hour: number, minute: number, second: number) => {
    NetworkOverrideClockTime(hour | 0, minute | 0, (second | 0) || 0);
  });

  onNet("ragemp:setWeather", (weather: string) => {
    if (typeof weather !== "string") return;
    SetWeatherTypeNowPersist(weather);
    SetWeatherTypePersist(weather);
  });

  onNet("ragemp:setWeatherTransition", (weather: string, easeTime: number) => {
    if (typeof weather !== "string") return;
    const ms = typeof easeTime === "number" ? easeTime : 0;
    if (ms > 0 && typeof SetWeatherTypeOvertimePersist === "function") {
      SetWeatherTypeOvertimePersist(weather, ms / 1000);
    } else {
      SetWeatherTypeNowPersist(weather);
      SetWeatherTypePersist(weather);
    }
  });

  onNet("ragemp:requestIpl", (name: string) => {
    if (typeof RequestIpl === "function") RequestIpl(name);
  });

  onNet("ragemp:removeIpl", (name: string) => {
    if (typeof RemoveIpl === "function") RemoveIpl(name);
  });

  onNet("ragemp:putIntoVehicle", (netId: number, seat: number) => {
    if (_putVehTimer) clearInterval(_putVehTimer);
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      const handle = safeGetEntityFromNetId(netId);
      if (handle) {
        clearInterval(timer);
        if (_putVehTimer === timer) _putVehTimer = null;
        if (!NetworkHasControlOfNetworkId || !NetworkHasControlOfNetworkId(netId)) {
          NetworkRequestControlOfNetworkId(netId);
        }
        const gtaSeat = (typeof seat === "number" ? seat : 0) - 1;
        SetPedIntoVehicle(PlayerPedId(), handle, gtaSeat);
      } else if (tries > 100) {
        clearInterval(timer);
        if (_putVehTimer === timer) _putVehTimer = null;
      }
    }, 50);
    _putVehTimer = timer;
  });

  onNet("ragemp:removeFromVehicle", () => {
    const ped = PlayerPedId();
    if (!IsPedInAnyVehicle(ped, false)) return;
    TaskLeaveVehicle(ped, GetVehiclePedIsIn(ped, false), 16);
  });

  onNet("ragemp:deleteWorldProp", (model: number, x: number, y: number, z: number, radius: number) => {
    if (!model || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
    CreateModelHide(x, y, z, Math.max(0, radius || 0), model, true);
  });

  on("onResourceStop", (name: string) => {
    if (name !== GetCurrentResourceName()) return;
    if (_modelTimer) clearInterval(_modelTimer);
    if (_animTimer) clearInterval(_animTimer);
    if (_putVehTimer) clearInterval(_putVehTimer);
    if (_clothesTick) clearTick(_clothesTick);
    _modelTimer = _animTimer = _putVehTimer = null;
    _clothesTick = null;
  });
}
