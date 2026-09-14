import { EntityMpBase } from "./EntityMpBase";
import { Vector3, Vector3Like } from "@ragemp-fivem-bridge/shared";
import { toVec3 } from "../utils/vec";
import { VehicleInternals, initVehicleInternals } from "../internal/vehicleInternals";
import { PlayerInternals } from "../internal/playerInternals";
import { removeFromStreamingPool } from "../internal/pools/streamingService";
import { playerByServerId } from "../internal/pools/playerPoolService";

const MAX_GEAR_INDEX = 10;

type HandlingFieldKind = "vector" | "int" | "float";

function handlingFieldKind(fieldName: string): HandlingFieldKind {
  if (fieldName.startsWith("vec")) return "vector";
  if (fieldName.startsWith("n")) return "int";
  return "float";
}

export class VehicleMp extends EntityMpBase {
  constructor(token: symbol, id: number, handle: number | null) {
    super(token, id, "vehicle", handle);
    initVehicleInternals(this);
  }

  get speed(): number { return GetEntitySpeed(this.handle); }

  get engineHealth(): number { return GetVehicleEngineHealth(this.handle); }
  set engineHealth(value: number) { SetVehicleEngineHealth(this.handle, value); }

  get bodyHealth(): number { return GetVehicleBodyHealth(this.handle); }
  set bodyHealth(value: number) { SetVehicleBodyHealth(this.handle, value); }

  get engine(): boolean { return GetIsVehicleEngineRunning(this.handle); }
  set engine(value: boolean) { SetVehicleEngineOn(this.handle, !!value, false, false); }

  get locked(): boolean { return GetVehicleDoorLockStatus(this.handle) === 2; }
  set locked(value: boolean) { SetVehicleDoorsLocked(this.handle, value ? 2 : 1); }

  get numberPlate(): string { return GetVehicleNumberPlateText(this.handle); }
  set numberPlate(value: string) { SetVehicleNumberPlateText(this.handle, value); }

  get gear(): number { return GetVehicleCurrentGear(this.handle); }
  get rpm(): number { return GetVehicleCurrentRpm(this.handle); }
  get steeringAngle(): number { return GetVehicleSteeringAngle(this.handle); }
  get throttle(): number { return GetVehicleThrottleOffset(this.handle); }
  get wheelCount(): number { return GetVehicleNumberOfWheels(this.handle); }
  override get dead(): boolean { return IsEntityDead(this.handle); }

  get livery(): number { return GetVehicleLivery(this.handle); }
  set livery(value: number) { SetVehicleLivery(this.handle, value); }

  get windowTint(): number { return GetVehicleWindowTint(this.handle); }
  set windowTint(value: number) { SetVehicleWindowTint(this.handle, value); }

  get wheelType(): number { return GetVehicleWheelType(this.handle); }
  set wheelType(value: number) { SetVehicleWheelType(this.handle, value); }

  get colorPrimary(): number { return GetVehicleColours(this.handle)[0]; }
  set colorPrimary(value: number) { const c = GetVehicleColours(this.handle); SetVehicleColours(this.handle, value, c[1]); }
  get colorSecondary(): number { return GetVehicleColours(this.handle)[1]; }
  set colorSecondary(value: number) { const c = GetVehicleColours(this.handle); SetVehicleColours(this.handle, c[0], value); }

  get pearlescentColor(): number { return GetVehicleExtraColours(this.handle)[0]; }
  set pearlescentColor(value: number) { const c = GetVehicleExtraColours(this.handle); SetVehicleExtraColours(this.handle, value, c[1]); }
  get wheelColor(): number { return GetVehicleExtraColours(this.handle)[1]; }
  set wheelColor(value: number) { const c = GetVehicleExtraColours(this.handle); SetVehicleExtraColours(this.handle, c[0], value); }

  get lightsOn(): boolean { return !!GetVehicleLightsState(this.handle)[1]; }
  get highbeamsOn(): boolean { return !!GetVehicleLightsState(this.handle)[2]; }
  getLightsState(_lightsOn?: number, _highbeamsOn?: number): { lightsOn: boolean; highbeamsOn: boolean } { const s = GetVehicleLightsState(this.handle); return { lightsOn: !!s[1], highbeamsOn: !!s[2] }; }

  get neonEnabled(): boolean { return IsVehicleNeonLightEnabled(this.handle, 0); }
  set neonEnabled(value: boolean) { for (let i = 0; i < 4; i++) SetVehicleNeonLightEnabled(this.handle, i, !!value); }

  set gravity(value: boolean) { SetVehicleGravity(this.handle, !!value); }
  get isPositionFrozen(): boolean { return IsEntityPositionFrozen(this.handle); }

  get nosActive(): boolean { return false; }
  set nosActive(_v: boolean) {}
  get nosAmount(): number { return 0; }
  set nosAmount(_v: number) {}
  get paintType(): number { return VehicleInternals.get(this).paintType; }
  set paintType(value: number) { VehicleInternals.get(this).paintType = value; }

  get controller(): any {
    const playerIndex = NetworkGetEntityOwner(this.handle);
    if (playerIndex < 0) return null;
    const serverId = GetPlayerServerId(playerIndex);
    if (!serverId || serverId === -1) return null;
    return playerByServerId(serverId) ?? null;
  }

  getColours(): number[] { return GetVehicleColours(this.handle); }
  getColor(): [number, number] { const c = GetVehicleColours(this.handle); return [c[0], c[1]]; }
  setColor(primary: number, secondary: number): void { SetVehicleColours(this.handle, primary, secondary); }
  setColours(colorPrimary: number, colorSecondary: number): void { SetVehicleColours(this.handle, colorPrimary, colorSecondary); }
  getColourCombination(): number { return GetVehicleColourCombination(this.handle); }
  setColourCombination(numCombos: number): void { SetVehicleColourCombination(this.handle, numCombos); }
  getCustomPrimaryColour(): number[] { return GetVehicleCustomPrimaryColour(this.handle); }
  getCustomSecondaryColour(): number[] { return GetVehicleCustomSecondaryColour(this.handle); }
  setCustomPrimaryColour(r: number, g: number, b: number): void { SetVehicleCustomPrimaryColour(this.handle, r, g, b); }
  setCustomSecondaryColour(r: number, g: number, b: number): void { SetVehicleCustomSecondaryColour(this.handle, r, g, b); }
  clearCustomPrimaryColour(): void { ClearVehicleCustomPrimaryColour(this.handle); }
  clearCustomSecondaryColour(): void { ClearVehicleCustomSecondaryColour(this.handle); }
  getColorRGB(): { primary: [number, number, number]; secondary: [number, number, number] } { const c1 = GetVehicleCustomPrimaryColour(this.handle); const c2 = GetVehicleCustomSecondaryColour(this.handle); return { primary: [c1[0], c1[1], c1[2]], secondary: [c2[0], c2[1], c2[2]] }; }
  setColorRGB(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): void { SetVehicleCustomPrimaryColour(this.handle, r1, g1, b1); SetVehicleCustomSecondaryColour(this.handle, r2, g2, b2); }
  getIsPrimaryColourCustom(): boolean { return GetIsVehiclePrimaryColourCustom(this.handle); }
  getIsSecondaryColourCustom(): boolean { return GetIsVehicleSecondaryColourCustom(this.handle); }
  setExtraColours(pearlescentColor: number, wheelColor: number): void { SetVehicleExtraColours(this.handle, pearlescentColor, wheelColor); }
  getNumberOfColours(): number { return GetNumberOfVehicleColours(this.handle); }
  setTyreSmokeColor(r: number, g: number, b: number): void { SetVehicleTyreSmokeColor(this.handle, r, g, b); }
  getNeonColor(): number[] { const c = GetVehicleNeonLightsColour(this.handle); return [c[0], c[1], c[2]]; }
  setNeonColor(r: number, g: number, b: number): void { SetVehicleNeonLightsColour(this.handle, r, g, b); }
  setNeonLightsColour(r: number, g: number, b: number): void { SetVehicleNeonLightsColour(this.handle, r, g, b); }
  isNeonLightEnabled(index: number): boolean { return IsVehicleNeonLightEnabled(this.handle, index ?? 0); }
  setNeonLightEnabled(index: number, toggle: boolean): void { SetVehicleNeonLightEnabled(this.handle, index, !!toggle); }

  getMod(modType: number): number { return GetVehicleMod(this.handle, modType); }
  setMod(modType: number, modIndex: number): void { SetVehicleModKit(this.handle, 0); SetVehicleMod(this.handle, modType, modIndex, false); }
  removeMod(modType: number): void { RemoveVehicleMod(this.handle, modType); }
  toggleMod(modType: number, toggle: boolean): void { ToggleVehicleMod(this.handle, modType, !!toggle); }
  isToggleModOn(modType: number): boolean { return IsToggleModOn(this.handle, modType); }
  getModKit(): number { return GetVehicleModKit(this.handle); }
  setModKit(modKit: number): void { SetVehicleModKit(this.handle, modKit); }
  getModKitType(): number { return GetVehicleModKitType(this.handle); }
  getNumModKits(): number { return GetNumModKits(this.handle); }
  getNumMods(modType: number): number { return GetNumVehicleMods(this.handle, modType); }
  getModModifierValue(modType: number, modIndex: number): any { return GetVehicleModModifierValue(this.handle, modType, modIndex); }
  getModSlotName(modType: number): string { return GetModSlotName(this.handle, modType); }
  getModTextLabel(modType: number, modValue: number): string { return GetModTextLabel(this.handle, modType, modValue); }
  getModVariation(modType: number): boolean { return GetVehicleModVariation(this.handle, modType); }
  getModColor1TextLabel(): string { return GetVehicleModColor_1Name(this.handle, false); }
  getModColor2TextLabel(): string { return GetVehicleModColor_2Name(this.handle); }
  setModColor1(paintType: number, color: number, p2: number): void { SetVehicleModColor_1(this.handle, paintType, color, p2 ?? 0); }
  setModColor2(paintType: number, color: number): void { SetVehicleModColor_2(this.handle, paintType, color); }
  releasePreloadMods(): void { ReleasePreloadMods(this.handle); }
  requestHighDetailModel(): void { RequestVehicleHighDetailModel(this.handle); }
  removeHighDetailModel(): void { RemoveVehicleHighDetailModel(this.handle); }
  isHighDetail(): boolean { return IsVehicleHighDetail(this.handle); }

  getLivery(): number { return GetVehicleLivery(this.handle); }
  setLivery(livery: number): void { SetVehicleLivery(this.handle, livery); }
  getLiveryCount(): number { return GetVehicleLiveryCount(this.handle); }
  getLiveryName(liveryIndex: number): string { return GetLiveryName(this.handle, liveryIndex); }

  getBodyHealth(): number { return GetVehicleBodyHealth(this.handle); }
  getBodyHealth2(): number { return GetVehicleBodyHealth(this.handle); }
  setBodyHealth(value: number): void { SetVehicleBodyHealth(this.handle, value); }
  getEngineHealth(): number { return GetVehicleEngineHealth(this.handle); }
  setEngineHealth(health: number): void { SetVehicleEngineHealth(this.handle, health); }
  getHeliEngineHealth(): number { return GetVehicleEngineHealth(this.handle); }
  getPetrolTankHealth(): number { return GetVehiclePetrolTankHealth(this.handle); }
  setPetrolTankHealth(fix: number): void { SetVehiclePetrolTankHealth(this.handle, fix); }
  getCauseOfDestruction(): number { return GetVehicleCauseOfDestruction(this.handle); }
  getMaxTraction(): number { return GetVehicleMaxTraction(this.handle); }
  getAcceleration(): number { return GetVehicleAcceleration(this.handle); }
  getDeformationAtPos(offsetX: number, offsetY: number, offsetZ: number): Vector3 { return toVec3(GetVehicleDeformationAtPos(this.handle, offsetX, offsetY, offsetZ)); }
  setDamage(xOffset: number, yOffset: number, zOffset: number, damage: number, radius: number, focusOnModel: boolean): void { SetVehicleDamage(this.handle, xOffset, yOffset, zOffset, damage, radius, !!focusOnModel); }
  setDeformationFixed(): void { SetVehicleDeformationFixed(this.handle); }
  setEngineCanDegrade(toggle: boolean): void { SetVehicleEngineCanDegrade(this.handle, !!toggle); }
  setCanBeVisiblyDamaged(state: boolean): void { SetVehicleCanBeVisiblyDamaged(this.handle, !!state); }
  setExplodesOnHighExplosionDamage(toggle: boolean): void { SetVehicleExplodesOnHighExplosionDamage(this.handle, !!toggle); }
  setDisablePetrolTankDamage(toggle: boolean): void { SetDisableVehiclePetrolTankDamage(this.handle, !!toggle); }
  setDisablePetrolTankFires(toggle: boolean): void { SetDisableVehiclePetrolTankFires(this.handle, !!toggle); }
  explode(isAudible: boolean, isInvisble: boolean): void { ExplodeVehicle(this.handle, isAudible ?? true, !!isInvisble); }
  explodeInCutscene(explosion: boolean): void { ExplodeVehicleInCutscene(this.handle, !!explosion); }
  repair(): void { SetVehicleFixed(this.handle); SetVehicleEngineHealth(this.handle, 1000); SetVehicleBodyHealth(this.handle, 1000); }
  setFixed(): void { SetVehicleFixed(this.handle); }

  getDoorAngleRatio(door: number): number { return GetVehicleDoorAngleRatio(this.handle, door); }
  getDoorLockStatus(): number { return GetVehicleDoorLockStatus(this.handle); }
  getDoorsLockedForPlayer(player: any): boolean { return GetVehicleDoorsLockedForPlayer(this.handle, (player && PlayerInternals.peek(player)?.playerIndex) ?? player); }
  getNumberOfDoors(): number { return GetNumberOfVehicleDoors(this.handle); }
  getPedUsingDoor(doorIndex: number): number { return GetPedUsingVehicleDoor(this.handle, doorIndex); }
  isDoorDamaged(doorId: number): boolean { return IsVehicleDoorDamaged(this.handle, doorId); }
  setDoorBroken(doorIndex: number, createDoorObject: boolean): void { SetVehicleDoorBroken(this.handle, doorIndex, !!createDoorObject); }
  setDoorBreakable(doorIndex: number, isBreakable: boolean): void { SetVehicleDoorCanBreak(this.handle, doorIndex, !!isBreakable); }
  setDoorControl(doorIndex: number, speed: number, angle: number): void { SetVehicleDoorControl(this.handle, doorIndex, speed, angle); }
  setDoorLatched(doorIndex: number, toggle: boolean, autoLatch: boolean, applyForce: boolean): void { SetVehicleDoorLatched(this.handle, doorIndex, !!toggle, !!autoLatch, !!applyForce); }
  setDoorOpen(doorIndex: number, loose: boolean, openInstantly: boolean): void { SetVehicleDoorOpen(this.handle, doorIndex, !!loose, openInstantly ?? false); }
  setDoorShut(doorIndex: number, closeInstantly: boolean): void { SetVehicleDoorShut(this.handle, doorIndex, closeInstantly ?? false); }
  setDoorsShut(closeInstantly: boolean): void { SetVehicleDoorsShut(this.handle, closeInstantly ?? false); }
  setDoorsLocked(doorLockStatus: number): void { SetVehicleDoorsLocked(this.handle, doorLockStatus); }
  setDoorsLockedForAllPlayers(toggle: boolean): void { SetVehicleDoorsLockedForAllPlayers(this.handle, !!toggle); }
  setDoorsLockedForPlayer(player: any, toggle: boolean): void { SetVehicleDoorsLockedForPlayer(this.handle, (player && PlayerInternals.peek(player)?.playerIndex) ?? player, !!toggle); }
  setDoorsLockedForTeam(team: number, toggle: boolean): void { SetVehicleDoorsLockedForTeam(this.handle, team, !!toggle); }
  areAllWindowsIntact(): boolean { return AreAllVehicleWindowsIntact(this.handle); }
  isWindowIntact(windowIndex: number): boolean { return IsVehicleWindowIntact(this.handle, windowIndex); }
  fixWindow(index: number): void { FixVehicleWindow(this.handle, index); }
  removeWindow(windowIndex: number): void { RemoveVehicleWindow(this.handle, windowIndex); }
  rollDownWindow(windowIndex: number): void { RollDownWindow(this.handle, windowIndex); }
  rollDownWindows(): void { RollDownWindows(this.handle); }
  rollUpWindow(windowIndex: number): void { RollUpWindow(this.handle, windowIndex); }
  smashWindow(index: number): void { SmashVehicleWindow(this.handle, index); }

  getMaxNumberOfPassengers(): number { return GetVehicleMaxNumberOfPassengers(this.handle); }
  getNumberOfPassengers(): number { return GetVehicleNumberOfPassengers(this.handle); }
  getPedInSeat(seatIndex: number): number { return GetPedInVehicleSeat(this.handle, seatIndex); }
  getLastPedInSeat(seatIndex: number): number { return GetLastPedInVehicleSeat(this.handle, seatIndex); }
  isSeatFree(seatIndex: number): boolean { return IsVehicleSeatFree(this.handle, seatIndex); }
  isAnySeatEmpty(): boolean { return IsAnyVehicleSeatEmpty(this.handle); }
  canShuffleSeat(seatIndex: number): boolean { return CanShuffleSeat(this.handle, seatIndex); }
  setExclusiveDriver(ped: any): void { SetVehicleExclusiveDriver(this.handle, ped?.handle ?? ped); }

  getIsEngineRunning(): boolean { return GetIsVehicleEngineRunning(this.handle); }
  setEngineOn(value: boolean, instantly: boolean, otherwise: boolean): void { SetVehicleEngineOn(this.handle, !!value, instantly ?? true, otherwise ?? false); }
  setHandbrake(toggle: boolean): void { SetVehicleHandbrake(this.handle, !!toggle); }
  setForwardSpeed(speed: number): void { SetVehicleForwardSpeed(this.handle, speed); }
  setUndriveable(toggle: boolean): void { SetVehicleUndriveable(this.handle, !!toggle); }
  isDriveable(checkfire: boolean): boolean { return IsVehicleDriveable(this.handle, checkfire ?? false); }
  setOnGroundProperly(): boolean { return SetVehicleOnGroundProperly(this.handle); }
  setOutOfControl(killDriver: boolean, explodeOnImpact: boolean): void { SetVehicleOutOfControl(this.handle, !!killDriver, !!explodeOnImpact); }
  setReduceGrip(toggle: boolean): void { SetVehicleReduceGrip(this.handle, toggle); }
  setFrictionOverride(friction: number): void { SetVehicleFrictionOverride(this.handle, friction); }
  setSteerBias(value: number): void { SetVehicleSteerBias(this.handle, value); }
  steerUnlockBias(value: number): void { SetVehicleSteerBias(this.handle, value); }
  setBurnout(toggle: boolean): void { SetVehicleBurnout(this.handle, !!toggle); }
  isInBurnout(): boolean { return IsVehicleInBurnout(this.handle); }
  setEnginePowerMultiplier(value: number): void { SetVehicleEnginePowerMultiplier(this.handle, value); }
  setEngineTorqueMultiplier(value: number): void { SetVehicleCheatPowerIncrease(this.handle, value); }
  setHasStrongAxles(toggle: boolean): void { SetVehicleHasStrongAxles(this.handle, !!toggle); }

  getHandling(fieldName: string): number | Vector3 {
    switch (handlingFieldKind(fieldName)) {
      case "vector": return toVec3(GetVehicleHandlingVector(this.handle, "CHandlingData", fieldName));
      case "int": return GetVehicleHandlingInt(this.handle, "CHandlingData", fieldName);
      default: return GetVehicleHandlingFloat(this.handle, "CHandlingData", fieldName);
    }
  }
  setHandling(fieldName: string, value: number | string | Vector3Like | number[]): void {
    if (typeof value === "number" || typeof value === "string") {
      const numeric = typeof value === "number" ? value : parseFloat(value);
      if (handlingFieldKind(fieldName) === "int") {
        SetVehicleHandlingInt(this.handle, "CHandlingData", fieldName, numeric);
      } else {
        SetVehicleHandlingFloat(this.handle, "CHandlingData", fieldName, numeric);
      }
      return;
    }
    const vec = Array.isArray(value) ? value : [value.x, value.y, value.z];
    (SetVehicleHandlingVector as (vehicle: number, class_: string, fieldName: string, value: number[]) => void)(this.handle, "CHandlingData", fieldName, vec);
  }
  getDefaultHandling(fieldName: string): number | string { return GetVehicleHandlingFloat(this.handle, "CHandlingData", fieldName); }
  resetHandling(): void { SetVehicleUseAlternateHandling(this.handle, false); }

  setWheelSize(size: number): boolean { return SetVehicleWheelSize(this.handle, size); }
  setWheelWidth(width: number): boolean { return SetVehicleWheelWidth(this.handle, width); }
  setWheelType(wheelType: number): void { SetVehicleWheelType(this.handle, wheelType); }
  getWheelType(): number { return GetVehicleWheelType(this.handle); }
  setWheelCamber(disabled: boolean): void { SetCamberedWheelsDisabled(this.handle, !!disabled); }
  setWheelTrackWidth(wheelIndex: number, value: number): void { SetVehicleWheelTireColliderWidth(this.handle, wheelIndex, value); }
  setWheelRadius(wheelIndex: number, value: number): void { SetVehicleWheelTireColliderSize(this.handle, wheelIndex, value); }
  resetWheels(toggle: boolean): void { ResetVehicleWheels(this.handle, !!toggle); }
  setWheelsCanBreak(enabled: boolean): void { SetVehicleWheelsCanBreak(this.handle, !!enabled); }
  setWheelsCanBreakOffWhenBlowUp(toggle: boolean): void { SetVehicleWheelsCanBreakOffWhenBlowUp(this.handle, !!toggle); }
  isOnAllWheels(): boolean { return IsVehicleOnAllWheels(this.handle); }
  setTyreFixed(tyreIndex: number): void { SetVehicleTyreFixed(this.handle, tyreIndex); }
  setTyreBurst(tyreIndex: number, instantBurst: boolean, damage: number): void { SetVehicleTyreBurst(this.handle, tyreIndex, !!instantBurst, damage ?? 1000.0); }
  isTyreBurst(wheelId: number, completely: boolean): boolean { return IsVehicleTyreBurst(this.handle, wheelId, !!completely); }
  getTyresCanBurst(): boolean { return GetVehicleTyresCanBurst(this.handle); }
  setTyresCanBurst(toggle: boolean): void { SetVehicleTyresCanBurst(this.handle, !!toggle); }

  getGearRatios() {
    if (!this.handle) return [];

    const gears = this.forwardGearCount();
    const ratios = [];
    for (let i = 0; i <= gears; i++) {
      ratios.push(GetVehicleGearRatio(this.handle, i));
    }
    return ratios;
  }

  setGearRatios(ratios: number[]) {
    if (!Array.isArray(ratios) || !this.handle || !DoesEntityExist(this.handle)) return;

    const rec = VehicleInternals.get(this);
    if (!rec.defaultGearRatios) {
      const defaults: number[] = [];
      let initialised = false;
      for (let i = 0; i <= MAX_GEAR_INDEX; i++) {
        const r = GetVehicleGearRatio(this.handle, i);
        defaults.push(r);
        if (r !== 0) initialised = true;
      }
      if (!initialised) return;
      rec.defaultGearRatios = defaults;
    }

    if (ratios.length === 0) {
      const defaults = rec.defaultGearRatios;
      for (let i = 0; i < defaults.length; i++) {
        SetVehicleGearRatio(this.handle, i, defaults[i]);
      }
      return;
    }

    const count = Math.min(ratios.length, MAX_GEAR_INDEX + 1);
    for (let i = 0; i < count; i++) {
      const r = ratios[i];
      if (typeof r !== "number" || !Number.isFinite(r)) continue;
      SetVehicleGearRatio(this.handle, i, r);
    }
  }

  private forwardGearCount(): number {
    const n = GetVehicleHandlingInt(this.handle, "CHandlingData", "nInitialDriveGears");
    if (!Number.isInteger(n) || n <= 0) return 0;
    return Math.min(n, MAX_GEAR_INDEX);
  }



  setLights(state: number | boolean): void { SetVehicleLights(this.handle, state === true ? 3 : state === false ? 4 : state as number); }
  setFullbeam(toggle: boolean): void { SetVehicleFullbeam(this.handle, !!toggle); }
  setBrakeLights(toggle: boolean): void { SetVehicleBrakeLights(this.handle, !!toggle); }
  setInteriorLight(toggle: boolean): void { SetVehicleInteriorlight(this.handle, !!toggle); }
  setLightMultiplier(multiplier: number): void { SetVehicleLightMultiplier(this.handle, multiplier); }
  getIsLeftHeadlightDamaged(): boolean { return GetIsLeftVehicleHeadlightDamaged(this.handle); }
  getIsRightHeadlightDamaged(): boolean { return GetIsRightVehicleHeadlightDamaged(this.handle); }
  setIndicatorLights(turnSignal: number, toggle: boolean): void { SetVehicleIndicatorLights(this.handle, turnSignal, !!toggle); }
  setSearchlight(toggle: boolean, canBeUsedByAI: boolean): void { SetVehicleSearchlight(this.handle, !!toggle, !!canBeUsedByAI); }
  isSearchlightOn(): boolean { return IsVehicleSearchlightOn(this.handle); }
  setTaxiLights(state: boolean): void { SetTaxiLights(this.handle, !!state); }
  isTaxiLightOn(): boolean { return IsTaxiLightOn(this.handle); }

  setAlarm(state: boolean): void { SetVehicleAlarm(this.handle, !!state); }
  startAlarm(): void { StartVehicleAlarm(this.handle); }
  isAlarmActivated(): boolean { return IsVehicleAlarmActivated(this.handle); }
  setSiren(toggle: boolean): void { SetVehicleSiren(this.handle, !!toggle); }
  isSirenOn(): boolean { return IsVehicleSirenOn(this.handle); }
  isSirenSoundOn(): boolean { return IsVehicleSirenAudioOn(this.handle); }
  setSirenWithNoDriver(enable: boolean): void { SetSirenWithNoDriver(this.handle, !!enable); }
  blipSiren(): void { BlipSiren(this.handle); }
  setHornPermanentlyOnTime(time: number): void { Citizen.invokeNative("0x9D3AF56E94C9AE98", this.handle, time); }
  startHorn(duration: number, model: number, forever: boolean): void { StartVehicleHorn(this.handle, duration, model ?? GetHashKey("HELDDOWN"), !!forever); }
  overrideVehHorn(override: boolean, hornHash: number): void { OverrideVehHorn(this.handle, !!override, hornHash); }
  triggerSiren(): void { SetVehicleSiren(this.handle, true); }
  setSirenKeepOn(_toggle: boolean): void {}
  setSirenSound(enable: boolean): void { SetVehicleHasMutedSirens(this.handle, !enable); }

  setVehicleRadioLoud(toggle: boolean): void { SetVehicleRadioLoud(this.handle, !!toggle); }
  setVehicleRadioEnabled(enable: boolean): void { SetVehicleRadioEnabled(this.handle, !!enable); }
  playStreamFromVehicle(): void { PlayStreamFromVehicle(this.handle); }

  doesHaveRoof(): boolean { return DoesVehicleHaveRoof(this.handle); }
  isAConvertible(checkRoofExtras: boolean): boolean { return IsVehicleAConvertible(this.handle, !!checkRoofExtras); }
  getConvertibleRoofState(): number { return GetConvertibleRoofState(this.handle); }
  setConvertibleRoof(animated: boolean): void { SetConvertibleRoof(this.handle, !!animated); }
  lowerConvertibleRoof(instantlyLower: boolean): void { LowerConvertibleRoof(this.handle, !!instantlyLower); }
  raiseConvertibleRoof(instantlyRaise: boolean): void { RaiseConvertibleRoof(this.handle, !!instantlyRaise); }

  getExtra(extraId: number): boolean { return IsVehicleExtraTurnedOn(this.handle, extraId); }
  // RAGE client API uses `disabled` (false enables), just like the native.
  // Only the server API/snapshot uses an enabled state that needs inversion.
  setExtra(extraId: number, disabled: boolean | number): void { SetVehicleExtra(this.handle, extraId, !!disabled); }
  doesExtraExist(extraId: number): boolean { return DoesExtraExist(this.handle, extraId); }
  isExtraTurnedOn(extraId: number): boolean { return IsVehicleExtraTurnedOn(this.handle, extraId); }

  getNumberPlateText(): string { return GetVehicleNumberPlateText(this.handle); }
  setNumberPlateText(plateText: string): void { SetVehicleNumberPlateText(this.handle, plateText); }
  getNumberPlateTextIndex(): number { return GetVehicleNumberPlateTextIndex(this.handle); }
  setNumberPlateTextIndex(plateIndex: number): void { SetVehicleNumberPlateTextIndex(this.handle, plateIndex); }
  getPlateType(): number { return GetVehiclePlateType(this.handle); }

  getDirtLevel(): number { return GetVehicleDirtLevel(this.handle); }
  setDirtLevel(dirtLevel: number): void { SetVehicleDirtLevel(this.handle, dirtLevel); }
  getClass(): number { return GetVehicleClass(this.handle); }
  getLayoutHash(): number { return GetVehicleLayoutHash(this.handle); }
  isModel(model: number): boolean { return IsVehicleModel(this.handle, model); }
  isBig(): boolean { return IsBigVehicle(this.handle); }
  override isVisible(): boolean { return IsEntityVisible(this.handle); }

  isStopped(): boolean { return IsVehicleStopped(this.handle); }
  isStoppedAtTrafficLights(): boolean { return IsVehicleStoppedAtTrafficLights(this.handle); }
  isDamaged(): boolean { return IsVehicleAudiblyDamaged(this.handle); }
  isStolen(): boolean { return IsVehicleStolen(this.handle); }
  isStuckOnRoof(): boolean { return IsVehicleStuckOnRoof(this.handle); }
  isStuckTimerUp(type: number, requiredTime: number): boolean { return IsVehicleStuckTimerUp(this.handle, type, requiredTime); }
  resetStuckTimer(reset: boolean): void { ResetVehicleStuckTimer(this.handle, reset ? 0 : 0); }
  doesHaveStuckVehicleCheck(): boolean { return DoesVehicleHaveStuckVehicleCheck(this.handle); }
  addUpsidedownCheck(): void { AddVehicleUpsidedownCheck(this.handle); }
  removeUpsidedownCheck(): void { RemoveVehicleUpsidedownCheck(this.handle); }
  trackVisibility(): void { TrackVehicleVisibility(this.handle); }

  setCanBeTargetted(state: boolean): void { SetVehicleCanBeTargetted(this.handle, !!state); }
  setCanBeUsedByFleeingPeds(toggle: boolean): void { SetVehicleCanBeUsedByFleeingPeds(this.handle, !!toggle); }
  setCanBreak(toggle: boolean): void { SetVehicleCanBreak(this.handle, !!toggle); }
  setCanRespray(state: boolean): void { SetCanResprayVehicle(this.handle, !!state); }
  setAllowNoPassengersLockon(toggle: boolean): void { SetVehicleAllowNoPassengersLockon(this.handle, !!toggle); }
  setCeilingHeight(height: number): void { SetVehicleCeilingHeight(this.handle, height); }
  setGravity(toggle: boolean): void { SetVehicleGravity(this.handle, !!toggle); }
  setHasBeenOwnedByPlayer(owned: boolean): void { SetVehicleHasBeenOwnedByPlayer(this.handle, !!owned); }
  setIsConsideredByPlayer(toggle: boolean): void { SetVehicleIsConsideredByPlayer(this.handle, !!toggle); }
  setIsStolen(isStolen: boolean): void { SetVehicleIsStolen(this.handle, !!isStolen); }
  setIsWanted(state: boolean): void { SetVehicleIsWanted(this.handle, !!state); }
  setLodMultiplier(multiplier: number): void { SetVehicleLodMultiplier(this.handle, multiplier); }
  setNameDebug(name: string): void { SetVehicleNameDebug(this.handle, name); }
  setNeedsToBeHotwired(toggle: boolean): void { SetVehicleNeedsToBeHotwired(this.handle, !!toggle); }
  setPlaybackToUseAi(flag: number): void { SetPlaybackToUseAi(this.handle, flag); }
  setPlayersLast(): void { SetPlayersLastVehicle(this.handle); }
  setProvidesCover(toggle: boolean): void { SetVehicleProvidesCover(this.handle, !!toggle); }
  setStrong(toggle: boolean): void { SetVehicleStrong(this.handle, !!toggle); }
  setTimedExplosion(ped: any, toggle: boolean): void { SetVehicleTimedExplosion(this.handle, ped?.handle ?? ped, !!toggle); }
  setRudderBroken(dissapear: boolean): void { SetVehicleRudderBroken(this.handle, !!dissapear); }

  getLandingGearState(): number { return GetLandingGearState(this.handle); }
  setLandingGear(state: number): void { ControlLandingGear(this.handle, state); }
  disablePlaneAileron(leftSide: boolean, disable: boolean): void { DisablePlaneAileron(this.handle, !!leftSide, !!disable); }
  openBombBayDoors(): void { OpenBombBayDoors(this.handle); }
  closeBombBayDoors(): void { CloseBombBayDoors(this.handle); }
  getHeliMainRotorHealth(): number { return GetHeliMainRotorHealth(this.handle); }
  getHeliTailRotorHealth(): number { return GetHeliTailRotorHealth(this.handle); }
  isHeliPartBroken(mainRotor: boolean, rearRotor: boolean, tailBoom: boolean): boolean { return IsHeliPartBroken(this.handle, !!mainRotor, !!rearRotor, !!tailBoom); }
  setHeliBladesFullSpeed(): void { SetHeliBladesFullSpeed(this.handle); }
  setHeliBladeSpeed(speed: number): void { SetHeliBladesSpeed(this.handle, speed); }
  setBoatAnchor(toggle: boolean): void { SetBoatAnchor(this.handle, !!toggle); }
  getTrainCarriage(cariage: number): number { return GetTrainCarriage(this.handle, cariage); }
  setMissionTrainCoords(x: number, y: number, z: number): void { SetMissionTrainCoords(this.handle, x, y, z); }
  setTrainCruiseSpeed(speed: number): void { SetTrainCruiseSpeed(this.handle, speed); }
  setTrainSpeed(speed: number): void { SetTrainSpeed(this.handle, speed); }
  setRenderTrainAsDerailed(toggle: boolean): void { SetRenderTrainAsDerailed(this.handle, !!toggle); }
  getHasKers(): boolean { return GetVehicleHasKers(this.handle); }
  setKersAllowed(enable: boolean): void { SetVehicleKersAllowed(this.handle, !!enable); }
  doesAllowRappel(): boolean { return DoesVehicleAllowRappel(this.handle); }
  setJetEngineOn(_value: boolean): void {}
  setHalt(distance: number, killEngine: number, unknown: boolean): void { SetVehicleHalt(this.handle, distance ?? 1.0, killEngine ? 1 : 0, unknown ?? false); }

  attachToTowTruck(vehicle: any, rear: boolean, hookOffsetX: number, hookOffsetY: number, hookOffsetZ: number): void { AttachVehicleToTowTruck(this.handle, vehicle?.handle ?? vehicle, !!rear, hookOffsetX, hookOffsetY, hookOffsetZ); }
  detachFromTowTruck(vehicle: any): void { DetachVehicleFromTowTruck(this.handle, vehicle?.handle ?? vehicle); }
  detachFromAnyTowTruck(): boolean { return DetachVehicleFromAnyTowTruck(this.handle); }
  isAttachedToTowTruck(vehicle: any): boolean { return IsVehicleAttachedToTowTruck(this.handle, vehicle?.handle ?? vehicle); }
  getEntityAttachedToTowTruck(): number { return GetEntityAttachedToTowTruck(this.handle); }
  getAttachedToTowTruck(): number { return GetEntityAttachedToTowTruck(this.handle); }
  attachToTrailer(trailer: any, radius: number): void { AttachVehicleToTrailer(this.handle, trailer?.handle ?? trailer, radius ?? 1.0); }
  detachFromTrailer(): void { DetachVehicleFromTrailer(this.handle); }
  isAttachedToTrailer(): boolean { return IsVehicleAttachedToTrailer(this.handle); }
  getTrailer(): number { const [, trailer] = GetVehicleTrailerVehicle(this.handle); return trailer; }
  getVehicleTrailer(): number { const [, trailer] = GetVehicleTrailerVehicle(this.handle); return trailer; }
  detachFromCargobob(cargobob: any): void { DetachEntityFromCargobob(cargobob?.handle ?? cargobob, this.handle); }
  detachFromAnyCargobob(): boolean { return DetachVehicleFromAnyCargobob(this.handle); }
  isAttachedToCargobob(vehicleAttached: any): boolean { return IsVehicleAttachedToCargobob(this.handle, vehicleAttached?.handle ?? vehicleAttached); }
  setAutomaticallyAttaches(autoAttach: boolean, scanDriver: number): void { SetVehicleAutomaticallyAttaches(this.handle, !!autoAttach, scanDriver ?? 0); }

  override destroy(): void {
    SetEntityAsMissionEntity(this.handle, false, true);
    DeleteEntity(this.handle);
    if (globalThis.mp.vehicles) removeFromStreamingPool(globalThis.mp.vehicles, this.id);
  }
}
