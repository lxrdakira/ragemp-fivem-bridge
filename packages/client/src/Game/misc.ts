import { Vector3 } from "@ragemp-fivem-bridge/shared";
import { createUnkProxy, toVec3 } from "./_helpers.js";

export class GameMiscNs {
  unk = createUnkProxy();

  getAllocatedStackSize(): number { return GetAllocatedStackSize(); }
  getNumberOfFreeStacksOfThisSize(stackSize: number): number { return GetNumberOfFreeStacksOfThisSize(stackSize); }

  setRandomSeed(seed: number): void { SetRandomSeed(seed); }
  setRandomEventFlag(toggle: boolean): void { SetRandomEventFlag(toggle); }
  getRandomEventFlag(): boolean { return GetRandomEventFlag(); }
  hasResumedFromSuspend(): boolean { return HasResumedFromSuspend(); }

  getPrevWeatherTypeHashName(): number { return GetPrevWeatherTypeHashName(); }
  getNextWeatherTypeHashName(): number { return GetNextWeatherTypeHashName(); }
  isPrevWeatherType(weatherType: string): boolean { return IsPrevWeatherType(weatherType); }
  isNextWeatherType(weatherType: string): boolean { return IsNextWeatherType(weatherType); }
  setWeatherTypePersist(weatherType: string): void { SetWeatherTypePersist(weatherType); }
  setWeatherTypeNow(weatherType: string): void {
    ClearOverrideWeather();
    ClearWeatherTypePersist();
    SetWeatherTypeNow(weatherType);
  }
  setWeatherTypeNowPersist(weatherType: string): void { SetWeatherTypeNowPersist(weatherType); }
  setWeatherTypeOvertimePersist(weatherType: string, time: number): void { SetWeatherTypeOvertimePersist(weatherType, time); }
  setRandomWeatherType(): void { SetRandomWeatherType(); }
  clearWeatherTypePersist(): void { ClearWeatherTypePersist(); }
  setOverrideWeather(weatherType: string): void { SetOverrideWeather(weatherType); }
  clearOverrideWeather(): void { ClearOverrideWeather(); }
  getWeatherTypeTransition(): { weatherType1: number; weatherType2: number; percent: number } {
    const [w1, w2, p] = GetWeatherTypeTransition();
    return { weatherType1: w1, weatherType2: w2, percent: p };
  }

  waterOverrideSetShorewaveamplitude(amplitude: number): void { WaterOverrideSetShorewaveamplitude(amplitude); }
  waterOverrideSetShorewaveminamplitude(minAmplitude: number): void { WaterOverrideSetShorewaveminamplitude(minAmplitude); }
  waterOverrideSetShorewavemaxamplitude(maxAmplitude: number): void { WaterOverrideSetShorewavemaxamplitude(maxAmplitude); }
  waterOverrideSetOceannoiseminamplitude(minAmplitude: number): void { WaterOverrideSetOceannoiseminamplitude(minAmplitude); }
  waterOverrideSetOceanwaveamplitude(amplitude: number): void { WaterOverrideSetOceanwaveamplitude(amplitude); }
  waterOverrideSetOceanwaveminamplitude(minAmplitude: number): void { WaterOverrideSetOceanwaveminamplitude(minAmplitude); }
  waterOverrideSetOceanwavemaxamplitude(maxAmplitude: number): void { WaterOverrideSetOceanwavemaxamplitude(maxAmplitude); }
  waterOverrideSetRipplebumpiness(bumpiness: number): void { WaterOverrideSetRipplebumpiness(bumpiness); }
  waterOverrideSetRippleminbumpiness(minBumpiness: number): void { WaterOverrideSetRippleminbumpiness(minBumpiness); }
  waterOverrideSetRipplemaxbumpiness(maxBumpiness: number): void { WaterOverrideSetRipplemaxbumpiness(maxBumpiness); }
  waterOverrideSetRippledisturb(disturb: number): void { WaterOverrideSetRippledisturb(disturb); }
  waterOverrideSetStrength(strength: number): void { WaterOverrideSetStrength(strength); }
  waterOverrideFadeIn(p0: number): void { WaterOverrideFadeIn(p0); }
  waterOverrideFadeOut(p0: number): void { WaterOverrideFadeOut(p0); }

  setWind(speed: number): void { SetWind(speed); }
  setWindSpeed(speed: number): void { SetWindSpeed(speed); }
  getWindSpeed(): number { return GetWindSpeed(); }
  setWindDirection(direction: number): void { SetWindDirection(direction); }
  getWindDirection(): Vector3 { return toVec3(GetWindDirection()); }
  setRainLevel(intensity: number): void { SetRainLevel(intensity); }
  getRainLevel(): number { return GetRainLevel(); }
  setSnowLevel(level: number): void { SetSnowLevel(level); }
  getSnowLevel(): number { return GetSnowLevel(); }
  forceLightningFlash(): void { ForceLightningFlash(); }

  preloadCloudHat(name: string): void { PreloadCloudHat(name); }
  loadCloudHat(name: string, transitionTime: number): void { LoadCloudHat(name, transitionTime); }
  unloadCloudHat(name: string, p1: number): void { UnloadCloudHat(name, p1); }

  getGameTimer(): number { return GetGameTimer(); }
  getFrameTime(): number { return GetFrameTime(); }
  getFrameCount(): number { return GetFrameCount(); }

  getRandomFloatInRange(startRange: number, endRange: number): number { return GetRandomFloatInRange(startRange, endRange); }
  getRandomIntInRange(startRange: number, endRange: number): number { return GetRandomIntInRange(startRange, endRange); }
  asin(p0: number): number { return Asin(p0); }
  acos(p0: number): number { return Acos(p0); }
  tan(p0: number): number { return Tan(p0); }
  atan(p0: number): number { return Atan(p0); }
  atan2(p0: number, p1: number): number { return Atan2(p0, p1); }
  getDistanceBetweenCoords(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, useZ: boolean): number {
    return GetDistanceBetweenCoords(x1, y1, z1, x2, y2, z2, useZ ?? true);
  }
  getAngleBetween2dVectors(x1: number, y1: number, x2: number, y2: number): number { return GetAngleBetween_2dVectors(x1, y1, x2, y2); }
  getHeadingFromVector2D(dx: number, dy: number): number { return GetHeadingFromVector_2d(dx, dy); }

  getGroundZFor3DCoord(x: number, y: number, z: number, ignoreWater: boolean): number {
    const [, z2] = GetGroundZFor_3dCoord(x, y, z, ignoreWater ?? false);
    return z2;
  }

  getHashKey(string: string): number { return GetHashKey(string); }
  areStringsEqual(string1: string, string2: string): boolean { return string1 === string2; }
  compareStrings(str1: string, str2: string, matchCase: boolean, maxLength: number): number { return CompareStrings(str1, str2, matchCase, maxLength); }
  isStringNull(string: string): boolean { return IsStringNull(string); }
  isStringNullOrEmpty(string: string): boolean { return IsStringNullOrEmpty(string); }
  absi(value: number): number { return Absi(value); }
  absf(value: number): number { return Absf(value); }

  isPointObscuredByAMissionEntity(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number): boolean { return IsPointObscuredByAMissionEntity(p0, p1, p2, p3, p4, p5, p6); }

  clearArea(x: number, y: number, z: number, radius: number, p4: boolean, p5: boolean, p6: boolean, p7: boolean): void {
    ClearAreaOfEverything(x, y, z, radius, p4 ?? false, p5 ?? false, p6 ?? false, p7 ?? false);
  }
  clearAreaLeaveVehicleHealth(x: number, y: number, z: number, radius: number, p4: boolean, p5: boolean, p6: boolean, p7: boolean): void {
    ClearAreaLeaveVehicleHealth(x, y, z, radius, p4 ?? false, p5 ?? false, p6 ?? false, p7 ?? false);
  }
  clearAreaOfVehicles(x: number, y: number, z: number, radius: number, p4: boolean, p5: boolean, p6: boolean, p7: boolean, p8: boolean): void {
    ClearAreaOfVehicles(x, y, z, radius, p4 ?? false, p5 ?? false, p6 ?? false, p7 ?? false, p8 ?? false);
  }
  clearAreaOfPeds(x: number, y: number, z: number, radius: number, flags: number): void {
    ClearAreaOfPeds(x, y, z, radius, !!flags)
  }
  clearAreaOfObjects(x: number, y: number, z: number, radius: number, flags: number): void {
    ClearAreaOfObjects(x, y, z, radius, flags);
  }
  clearAreaOfCops(x: number, y: number, z: number, radius: number, flags: number): void {
    ClearAreaOfCops(x, y, z, radius, !!flags);
  }
  clearAreaOfProjectiles(x: number, y: number, z: number, radius: number, flags: number): void {
    ClearAreaOfProjectiles(x, y, z, radius, !!flags);
  }

  setSaveMenuActive(ignoreVehicle: boolean): void { SetSaveMenuActive(ignoreVehicle); }
  setCreditsActive(toggle: boolean): void { SetCreditsActive(toggle); }
  haveCreditsReachedEnd(): boolean { return HaveCreditsReachedEnd(); }
  terminateAllScriptsWithThisName(scriptName: string): void { TerminateAllScriptsWithThisName(scriptName); }
  networkSetScriptIsSafeForNetworkGame(): void { NetworkSetScriptIsSafeForNetworkGame(); }

  addHospitalRestart(x: number, y: number, z: number, p3: number, p4: number): number { return AddHospitalRestart(x, y, z, p3, p4); }
  disableHospitalRestart(hospitalIndex: number, toggle: boolean): void { DisableHospitalRestart(hospitalIndex, toggle); }
  addPoliceRestart(p0: number, p1: number, p2: number, p3: number, p4: number): number { return AddPoliceRestart(p0, p1, p2, p3, p4); }
  disablePoliceRestart(policeIndex: number, toggle: boolean): void { DisablePoliceRestart(policeIndex, toggle); }
  pauseDeathArrestRestart(toggle: boolean): void { PauseDeathArrestRestart(toggle); }
  ignoreNextRestart(toggle: boolean): void { IgnoreNextRestart(toggle); }
  setFadeOutAfterDeath(toggle: boolean): void { SetFadeOutAfterDeath(toggle); }
  setFadeOutAfterArrest(toggle: boolean): void { SetFadeOutAfterArrest(toggle); }
  setFadeInAfterDeathArrest(toggle: boolean): void { SetFadeInAfterDeathArrest(toggle); }
  setFadeInAfterLoad(toggle: boolean): void { SetFadeInAfterLoad(toggle); }
  disableAutomaticRespawn(disableRespawn: boolean): void { DisableAutomaticRespawn(disableRespawn); }
  forceGameStatePlaying(): void { ForceGameStatePlaying(); }

  setSaveHouse(p0: number, p1: boolean, p2: boolean): void { SetSaveHouse(p0, p1, p2); }
  overrideSaveHouse(p0: boolean, p1: number, p2: number, p3: number, p4: number, p5: boolean, p6: number, p7: number): boolean {
    const [result] = OverrideSaveHouse(p0, p1, p2, p3, p4, p5);
    return result;
  }
  doAutoSave(): void { DoAutoSave(); }
  getIsAutoSaveOff(): boolean { return GetIsAutoSaveOff(); }
  isAutoSaveInProgress(): boolean { return IsAutoSaveInProgress(); }

  beginReplayStats(p0: number, p1: number): void { BeginReplayStats(p0, p1); }
  addReplayStatValue(value: number): void { AddReplayStatValue(value); }
  endReplayStats(): void { EndReplayStats(); }
  getReplayStatMissionType(): number { return GetReplayStatMissionType(); }
  getReplayStatCount(): number { return GetReplayStatCount(); }
  getReplayStatAtIndex(index: number): number { return GetReplayStatAtIndex(index); }
  clearReplayStats(): void { ClearReplayStats(); }
  isMemoryCardInUse(): boolean { return IsMemoryCardInUse(); }

  getModelDimensions(modelHash: number): {  minimum: Vector3, maximum: Vector3, min: Vector3; max: Vector3 } {
    const [min, max] = GetModelDimensions(modelHash);
    const minimum = toVec3(min);
    const maximum = toVec3(max);
    return { minimum, maximum, min: minimum, max: maximum };
  }

  setFakeWantedLevel(fakeWantedLevel: number): void { SetFakeWantedLevel(fakeWantedLevel); }
  getFakeWantedLevel(): number { return GetFakeWantedLevel(); }
  usingMissionCreator(toggle: boolean): void { UsingMissionCreator(toggle); }
  allowMissionCreatorWarp(toggle: boolean): void { AllowMissionCreatorWarp(toggle); }
  setMinigameInProgress(toggle: boolean): void { SetMinigameInProgress(toggle); }
  isMinigameInProgress(): boolean { return IsMinigameInProgress(); }
  isThisAMinigameScript(): boolean { return IsThisAMinigameScript(); }
  isSniperInverted(): boolean { return IsSniperInverted(); }
  shouldUseMetricMeasurements(): boolean { return ShouldUseMetricMeasurements(); }
  getProfileSetting(profileSetting: number): number { return GetProfileSetting(profileSetting); }

  isSniperBulletInArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): boolean { return IsSniperBulletInArea(x1, y1, z1, x2, y2, z2); }
  isProjectileInArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, ownedByPlayer: boolean): boolean {
    return IsProjectileInArea(x1, y1, z1, x2, y2, z2, ownedByPlayer ?? false);
  }
  isProjectileTypeInArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, type: number, ownedByPlayer: boolean): boolean {
    return IsProjectileTypeInArea(x1, y1, z1, x2, y2, z2, type, ownedByPlayer ?? false);
  }
  isProjectileTypeWithinDistance(x: number, y: number, z: number, projectileHash: number, radius: number, ownedByPlayer: boolean): boolean {
    return IsProjectileTypeWithinDistance(x, y, z, projectileHash, radius, ownedByPlayer ?? false);
  }
  isBulletInAngledArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, width: number, ownedByPlayer: boolean): boolean {
    return IsBulletInAngledArea(x1, y1, z1, x2, y2, z2, width, ownedByPlayer ?? false);
  }
  isBulletInArea(x: number, y: number, z: number, radius: number, ownedByPlayer: boolean): boolean {
    return IsBulletInArea(x, y, z, radius, ownedByPlayer ?? false);
  }
  isBulletInBox(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, ownedByPlayer: boolean): boolean {
    return IsBulletInBox(x1, y1, z1, x2, y2, z2, ownedByPlayer ?? false);
  }
  hasBulletImpactedInArea(x: number, y: number, z: number, p3: number, p4: boolean, p5: boolean): boolean { return HasBulletImpactedInArea(x, y, z, p3, p4 ?? false, p5 ?? false); }
  hasBulletImpactedInBox(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: boolean, p7: boolean): boolean { return HasBulletImpactedInBox(p0, p1, p2, p3, p4, p5, p6 ?? false, p7 ?? false); }

  isOrbisVersion(): boolean { return IsOrbisVersion(); }
  isDurangoVersion(): boolean { return IsDurangoVersion(); }
  isXbox360Version(): boolean { return IsXbox360Version(); }
  isPs3Version(): boolean { return IsPs3Version(); }
  isPcVersion(): boolean { return IsPcVersion(); }
  isAussieVersion(): boolean { return IsAussieVersion(); }

  getBitsInRange(variable: number, rangeStart: number, rangeEnd: number): number { return GetBitsInRange(variable, rangeStart, rangeEnd); }

  deleteStuntJump(p0: number): void { DeleteStuntJump(p0); }
  enableStuntJumpSet(p0: number): void { EnableStuntJumpSet(p0); }
  disableStuntJumpSet(p0: number): void { DisableStuntJumpSet(p0); }
  setStuntJumpsCanTrigger(toggle: boolean): void { SetStuntJumpsCanTrigger(toggle); }
  isStuntJumpInProgress(): boolean { return IsStuntJumpInProgress(); }
  isStuntJumpMessageShowing(): boolean { return IsStuntJumpMessageShowing(); }
  getNumSuccessfulStuntJumps(): number { return GetNumSuccessfulStuntJumps(); }
  getTotalSuccessfulStuntJumps(): number { return GetTotalSuccessfulStuntJumps(); }
  cancelStuntJump(): void { CancelStuntJump(); }

  setTimeScale(timeScale: number): void { SetTimeScale(timeScale); }
  setMissionFlag(toggle: boolean): void { SetMissionFlag(toggle); }
  getMissionFlag(): boolean { return GetMissionFlag(); }
  setGamePaused(toggle: boolean): void { SetGamePaused(toggle); }
  setThisScriptCanBePaused(toggle: boolean): void { SetThisScriptCanBePaused(toggle); }
  setThisScriptCanRemoveBlipsCreatedByAnyScript(toggle: boolean): void { SetThisScriptCanRemoveBlipsCreatedByAnyScript(toggle); }
  setInstancePriorityMode(p0: number): void { SetInstancePriorityMode(p0); }
  setInstancePriorityHint(flag: number): void { SetInstancePriorityHint(flag); }
  isFrontendFading(): boolean { return IsFrontendFading(); }
  populateNow(): void { PopulateNow(); }
  getIndexOfCurrentLevel(): number { return GetIndexOfCurrentLevel(); }

  setGravityLevel(level: number): void { SetGravityLevel(level); }

  enableDispatchService(dispatchService: number, toggle: boolean): void { EnableDispatchService(dispatchService, toggle); }
  blockDispatchServiceResourceCreation(dispatchService: number, toggle: boolean): void { BlockDispatchServiceResourceCreation(dispatchService, toggle); }
  deleteIncident(incidentId: number): void { DeleteIncident(incidentId); }
  isIncidentValid(incidentId: number): boolean { return IsIncidentValid(incidentId); }
  setIncidentRequestedUnits(incidentId: number, dispatchService: number, numUnits: number): void { SetIncidentRequestedUnits(incidentId, dispatchService, numUnits); }
  resetDispatchSpawnLocation(): void { ResetDispatchSpawnLocation(); }
  setDispatchSpawnLocation(x: number, y: number, z: number): void { SetDispatchSpawnLocation(x, y, z); }
  resetDispatchIdealSpawnDistance(): void { ResetDispatchIdealSpawnDistance(); }
  setDispatchIdealSpawnDistance(p0: number): void { SetDispatchIdealSpawnDistance(p0); }
  resetDispatchTimeBetweenSpawnAttempts(p0: number): void { ResetDispatchTimeBetweenSpawnAttempts(p0); }
  setDispatchTimeBetweenSpawnAttempts(p0: number, p1: number): void { SetDispatchTimeBetweenSpawnAttempts(p0, p1); }
  setDispatchTimeBetweenSpawnAttemptsMultiplier(p0: number, p1: number): void { SetDispatchTimeBetweenSpawnAttemptsMultiplier(p0, p1); }
  removeDispatchSpawnBlockingArea(p0: number): void { RemoveDispatchSpawnBlockingArea(p0); }
  resetDispatchSpawnBlockingAreas(): void { ResetDispatchSpawnBlockingAreas(); }

  doesPopMultiplierAreaExist(id: number): boolean { return DoesPopMultiplierAreaExist(id); }
  removePopMultiplierArea(id: number, p1: boolean): void { RemovePopMultiplierArea(id, p1 ?? false); }
  doesPopMultiplierSphereExist(id: number): boolean { return DoesPopMultiplierSphereExist(id); }
  removePopMultiplierSphere(id: number, p1: boolean): void { RemovePopMultiplierSphere(id, p1 ?? false); }

  enableTennisMode(ped: number, toggle: boolean, p2: boolean): void { EnableTennisMode(ped, toggle, p2 ?? false); }
  isTennisMode(ped: number): boolean { return IsTennisMode(ped); }
  playTennisSwingAnim(ped: number, animDict: string, animName: string, p3: number, p4: number, p5: boolean): void { PlayTennisSwingAnim(ped, animDict, animName, p3, p4, p5 ?? false); }
  getTennisSwingAnimComplete(ped: number): boolean { return GetTennisSwingAnimComplete(ped); }
  playTennisDiveAnim(ped: number, p1: number, p2: number, p3: number, p4: number, p5: boolean): void { PlayTennisDiveAnim(ped, p1, p2, p3, p4, p5 ?? false); }

  setRiotModeEnabled(toggle: boolean): void { SetRiotModeEnabled(toggle); }
  updateOnscreenKeyboard(): number { return UpdateOnscreenKeyboard(); }
  getOnscreenKeyboardResult(): string { return GetOnscreenKeyboardResult(); }
  cancelOnscreenKeyboard(): void { CancelOnscreenKeyboard(); }
  nextOnscreenKeyboardResultWillDisplayUsingTheseFonts(p0: number): void { NextOnscreenKeyboardResultWillDisplayUsingTheseFonts(p0); }

  setExplosiveAmmoThisFrame(player: number): void { SetExplosiveAmmoThisFrame(player); }
  setFireAmmoThisFrame(player: number): void { SetFireAmmoThisFrame(player); }
  setExplosiveMeleeThisFrame(player: number): void { SetExplosiveMeleeThisFrame(player); }
  setSuperJumpThisFrame(player: number): void { SetSuperJumpThisFrame(player); }

  areProfileSettingsValid(): boolean { return AreProfileSettingsValid(); }
  scriptRaceInit(p0: number, p1: number, p2: number, p3: number): void { ScriptRaceInit(p0, p1, p2, p3); }
  scriptRaceShutdown(): void { ScriptRaceShutdown(); }
  restartGame(): void { RestartGame(); }
  hasAsyncInstallFinished(): boolean { return HasAsyncInstallFinished(); }
  cleanupAsyncInstall(): void { CleanupAsyncInstall(); }

  setPlayerIsInAnimalForm(toggle: boolean): void { SetPlayerIsInAnimalForm(toggle); }
  getIsPlayerInAnimalForm(): boolean { return GetIsPlayerInAnimalForm(); }

  shootSingleBulletBetweenCoords(fromX: number, fromY: number, fromZ: number, toX: number, toY: number, toZ: number, damage: number, pureAccuracy: boolean, weaponHash: number, ownerPed: number, isAudible: boolean, isInvisible: boolean, speed: number): void {
    ShootSingleBulletBetweenCoords(fromX, fromY, fromZ, toX, toY, toZ, damage, pureAccuracy ?? true, weaponHash, ownerPed, isAudible ?? true, isInvisible ?? false, speed ?? 1.0);
  }
  shootSingleBulletBetweenCoordsIgnoreEntity(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, damage: number, p7: boolean, weaponHash: number, ownerPed: number, isAudible: boolean, isInvisible: boolean, speed: number, entity: number): void {
    ShootSingleBulletBetweenCoordsIgnoreEntity(x1, y1, z1, x2, y2, z2, damage, p7, weaponHash, ownerPed, isAudible, isInvisible, speed, entity);
  }
  shootSingleBulletBetweenCoordsIgnoreEntityNew(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, damage: number, p7: boolean, weaponHash: number, ownerPed: number, isAudible: boolean, isInvisible: boolean, speed: number, entity: number, p14: boolean, p15: boolean, p16: boolean, p17: boolean): void {
    ShootSingleBulletBetweenCoordsIgnoreEntityNew(x1, y1, z1, x2, y2, z2, damage, p7, weaponHash, ownerPed, isAudible, isInvisible, speed, entity, p14, p15, p16, p17);
  }

  getGlobalCharBuffer(): string { return GetGlobalCharBuffer(); }
  getBaseElementMetadata(p2: number, p3: boolean): { p0: number; p1: number; result: boolean } {
    const [result, p0, p1] = GetBaseElementMetadata(p2, p3);
    return { result, p0, p1 };
  }

  clearWeatherTypeOvertimePersist(transitionTime: number): void { ClearWeatherTypeOvertimePersist(transitionTime); }
  setWeatherTypeTransition(weatherType1: number, weatherType2: number, percentWeather2: number): void {
    ClearOverrideWeather();
    ClearWeatherTypePersist();
    SetWeatherTypeTransition(weatherType1, weatherType2, percentWeather2);
  }

  clearCloudHat(): void { ClearCloudHat(); }
  setCloudHatOpacity(opacity: number): void { SetCloudsAlpha(opacity); }
  getCloudHatOpacity(): number { return GetCloudsAlpha(); }

  getBenchmarkTime(): number { return GetBenchmarkTime(); }

  getRandomIntInRange2(startRange: number, endRange: number): number { return GetRandomIntInRange(startRange, endRange); }
  getAngleBetween2DVectors(x1: number, y1: number, x2: number, y2: number): number { return GetAngleBetween_2dVectors(x1, y1, x2, y2); }
  getHeadingFromVector2d(dx: number, dy: number): number { return GetHeadingFromVector_2d(dx, dy); }
  setBit(offset: number): number { return SetBit(offset); }
  clearBit(offset: number): number { return ClearBit(offset); }
  isBitSet(address: number, offset: number): boolean { return IsBitSet(address, offset); }
  setBitsInRange(rangeStart: number, rangeEnd: number, p3: number): number { return SetBitsInRange(rangeStart, rangeEnd, p3); }
  stringToInt(string: string): number {
    const [, result] = StringToInt(string);
    return result;
  }

  getGroundZFor3dCoord(x: number, y: number, z: number, ignoreWater: boolean, p5?: boolean): number {
    const [, z2] = GetGroundZFor_3dCoord(x, y, z, ignoreWater ?? false);
    return z2;
  }
  getGroundZAndNormalFor3DCoord(x: number, y: number, z: number): { groundZ: number; normal: Vector3; result: boolean } {
    const [result, groundZ, position] = GetGroundZAndNormalFor_3dCoord(x, y, z);
    return { result, groundZ, normal: toVec3(position) };
  }
  getGroundZFor3dCoord2(x: number, y: number, z: number, waterAsGround: boolean): number {
    const [, z2] = GetGroundZExcludingObjectsFor_3dCoord(x, y, z, waterAsGround);
    return z2;
  }
  getGroundZFor3DCoord2(x: number, y: number, z: number, waterAsGround: boolean): number {
    const [, z2] = GetGroundZExcludingObjectsFor_3dCoord(x, y, z, waterAsGround);
    return z2;
  }

  slerpNearQuaternion(t: number, x: number, y: number, z: number, w: number, x1: number, y1: number, z1: number, w1: number): { outX: number; outY: number; outZ: number; outW: number } {
    const r = SlerpNearQuaternion(t, x, y, z, w, x1, y1, z1, w1);
    return { outX: r?.[0], outY: r?.[1], outZ: r?.[2], outW: r?.[3] };
  }

  isAreaOccupied(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: boolean, p7: boolean, p8: boolean, p9: boolean, p10: boolean, p11: number, p12: boolean): boolean {
    return IsAreaOccupied(p0, p1, p2, p3, p4, p5, p6 ?? false, p7 ?? false, p8 ?? false, p9 ?? false, p10 ?? false, p11, p12 ?? false);
  }
  isPositionOccupied(x: number, y: number, z: number, range: number, p4: boolean, checkVehicles: boolean, checkPeds: boolean, p7: boolean, p8: boolean, ignoreEntity: number, p10: boolean): boolean {
    return IsPositionOccupied(x, y, z, range, p4 ?? false, checkVehicles ?? true, checkPeds ?? true, p7 ?? false, p8 ?? false, ignoreEntity ?? 0, p10 ?? false);
  }
  clearAngledAreaOfVehicles(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, width: number, p7: boolean, p8: boolean, p9: boolean, p10: boolean, p11: boolean): void {
    ClearAngledAreaOfVehicles(x1, y1, z1, x2, y2, z2, width, p7 ?? false, p8 ?? false, p9 ?? false, p10 ?? false, p11 ?? false);
  }

  setRestartCustomPosition(x: number, y: number, z: number, heading: number): void { SetRestartCustomPosition(x, y, z, heading); }
  clearRestartCustomPosition(): void { ClearRestartCustomPosition(); }
  registerSaveHouse(p0: number, p1: number, p2: number, p3: number, p5: number, p6: number): { p4: number; result: number } {
    const r = RegisterSaveHouse(p0, p1, p2, p3, p5, p6);
    return { p4: r?.[1], result: r?.[0] };
  }

  hasButtonCombinationJustBeenEntered(hash: number, amount: number): boolean { return HasButtonCombinationJustBeenEntered(hash, amount); }
  hasCheatStringJustBeenEntered(hash: number): boolean { return HasCheatStringJustBeenEntered(hash); }

  addStuntJump(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, x3: number, y3: number, z3: number, x4: number, y4: number, z4: number, camX: number, camY: number, camZ: number, p15: number, p16: number, p17: number): number {
    return AddStuntJump(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4, camX, camY, camZ, p15, p16, p17);
  }
  addStuntJumpAngled(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, radius1: number, x3: number, y3: number, z3: number, x4: number, y4: number, z4: number, radius2: number, camX: number, camY: number, camZ: number, p17: number, p18: number, p19: number): number {
    return AddStuntJumpAngled(x1, y1, z1, x2, y2, z2, radius1, x3, y3, z3, x4, y4, z4, radius2, camX, camY, camZ, p17, p18, p19);
  }

  getGravityLevel(): number { return GetGravityLevel(); }

  startSaveData(p1: number, p2: boolean): number { return StartSaveData(p1, p2); }
  stopSaveData(): void { StopSaveData(); }
  getSizeOfSaveData(p0: boolean): number { return GetSizeOfSaveData(p0); }
  registerIntToSave(name: string): number { return RegisterIntToSave(name); }
  registerInt64ToSave(name: string): number { return RegisterInt64ToSave(name); }
  registerEnumToSave(name: string): number { return RegisterEnumToSave(name); }
  registerFloatToSave(name: string): number { return RegisterFloatToSave(name); }
  registerBoolToSave(name: string): number { return RegisterBoolToSave(name); }
  registerTextLabelToSave(name: string): number { return RegisterTextLabelToSave(name); }
  registerTextLabelToSave2(name: string): number { return RegisterTextLabelToSave_2(name); }
  startSaveStructWithSize(size: number, structName: string): number { return StartSaveStructWithSize(size, structName); }
  stopSaveStruct(): void { StopSaveStruct(); }
  startSaveArrayWithSize(size: number, arrayName: string): number { return StartSaveArrayWithSize(size, arrayName); }
  stopSaveArray(): void { StopSaveArray(); }
  copyMemory(size: number): { dst: number; src: number } {
    const src = 0;
    const dst = CopyMemory(0, size);
    return { dst, src };
  }

  getNumDispatchedUnitsForPlayer(dispatchService: number): number { return GetNumDispatchedUnitsForPlayer(dispatchService); }
  createIncident(dispatchService: number, x: number, y: number, z: number, numUnits: number, radius: number, p7: number, p8: number): number {
    const [, result] = CreateIncident(dispatchService, x, y, z, numUnits, radius, p7);
    return result;
  }
  createIncidentWithEntity(dispatchService: number, ped: number, numUnits: number, radius: number, p5: number, p6: number): number {
    const [, result] = CreateIncidentWithEntity(dispatchService, ped, numUnits, radius, p5);
    return result;
  }
  setIncidentUnk(incidentId: number, p1: number): void { SetIncidentUnk(incidentId, p1); }
  findSpawnPointInDirection(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, distance: number): Vector3 {
    const [_, position] = FindSpawnPointInDirection(x1, y1, z1, x2, y2, z2, distance);
    return toVec3(position);
  }
  addDispatchSpawnBlockingAngledArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, width: number): number {
    return AddDispatchSpawnBlockingAngledArea(x1, y1, z1, x2, y2, z2, width);
  }
  addDispatchSpawnBlockingArea(x1: number, y1: number, x2: number, y2: number): number { return AddDispatchSpawnBlockingArea(x1, y1, x2, y2); }
  addTacticalAnalysisPoint(x: number, y: number, z: number): void { AddTacticalAnalysisPoint(x, y, z); }
  clearTacticalAnalysisPoints(): void { ClearTacticalAnalysisPoints(); }

  addPopMultiplierArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, p6: number, p7: number, p8: boolean): number {
    return AddPopMultiplierArea(x1, y1, z1, x2, y2, z2, p6, p7, p8 ?? false);
  }
  isPopMultiplierAreaUnk(id: number): boolean { return IsPopMultiplierAreaUnk(id); }
  addPopMultiplierSphere(x: number, y: number, z: number, radius: number, pedMultiplier: number, vehicleMultiplier: number, p6: boolean, p7: boolean): number {
    return AddPopMultiplierSphere(x, y, z, radius, pedMultiplier, vehicleMultiplier, p6 ?? false, p7 ?? false);
  }

  displayOnscreenKeyboardWithLongerInitialString(p0: number, windowTitle: string, defaultText: string, defaultConcat1: string, defaultConcat2: string, defaultConcat3: string, defaultConcat4: string, defaultConcat5: string, defaultConcat6: string, defaultConcat7: string, maxInputLength: number): number {
    return (DisplayOnscreenKeyboardWithLongerInitialString as any)(p0, windowTitle, defaultText, defaultConcat1, defaultConcat2, defaultConcat3, defaultConcat4, defaultConcat5, defaultConcat6, defaultConcat7, maxInputLength);
  }
  displayOnscreenKeyboard(p0: number, windowTitle: string, p2: string, defaultText: string, defaultConcat1: string, defaultConcat2: string, defaultConcat3: string, maxInputLength: number): void {
    DisplayOnscreenKeyboard(p0, windowTitle, p2, defaultText, defaultConcat1, defaultConcat2, defaultConcat3, maxInputLength);
  }

  removeStealthKill(hash: number, p1: boolean): void { RemoveStealthKill(hash, p1); }
  setBeastModeActive(player: number): void { SetBeastModeActive(player); }
  setForcePlayerToJump(player: number): void { SetForcePlayerToJump(player); }

  isProjectileTypeInAngledArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, width: number, p7: number, weaponHash: string | number, ownedByPlayer: boolean): boolean {
    return IsProjectileTypeInAngledArea(x1, y1, z1, x2, y2, z2, width, p7, weaponHash,  ownedByPlayer ?? false);
  }
  getCoordsOfProjectileTypeInArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, projectileHash: number, ownedByPlayer: boolean): import('@ragemp-fivem-bridge/shared').Vector3 {
    return toVec3((GetCoordsOfProjectileTypeInArea as any)(x1, y1, z1, x2, y2, z2, projectileHash, ownedByPlayer ?? false));
  }
  getCoordsOfProjectileTypeWithinDistance(ped: number, weaponHash: number, radius: number, ownedByPlayer: boolean): { entity: number } {
    const r: any = (GetCoordsOfProjectileTypeWithinDistance as any)(ped, weaponHash, radius, ownedByPlayer ?? false);
    return { entity: r?.[0] };
  }
  getProjectileNearPed(ped: number, weaponhash: number, p2: number, p3: number, p4: number, p5: boolean): boolean {
    return (GetProjectileNearPed as any)(ped, weaponhash, p2, p3, p4, p5 ?? false);
  }

  scriptRaceGetPlayerSplitTime(player: number): { p1: number; p2: number; result: boolean } {
    const r = ScriptRaceGetPlayerSplitTime(player);
    return { p1: r?.[1], p2: r?.[2], result: r?.[0] };
  }
  startBenchmarkRecording(): void { StartBenchmarkRecording(); }
  stopBenchmarkRecording(): void { StopBenchmarkRecording(); }
  resetBenchmarkRecording(): void { ResetBenchmarkRecording(); }
  saveBenchmarkRecording(): void { SaveBenchmarkRecording(); }
  uiIsSingleplayerPauseMenuActive(): boolean { return UiIsSingleplayerPauseMenuActive(); }
  landingMenuIsActive(): boolean { return LandingMenuIsActive(); }
  isCommandLineBenchmarkValueSet(): boolean { return IsCommandLineBenchmarkValueSet(); }
  getBenchmarkIterationsFromCommandLine(): number { return GetBenchmarkIterationsFromCommandLine(); }
  getBenchmarkPassFromCommandLine(): number { return GetBenchmarkPassFromCommandLine(); }

  forceSocialClubUpdate(): void { ForceSocialClubUpdate(); }
  isInPowerSavingMode(): boolean { return IsInPowerSavingMode(); }
  getPowerSavingModeDuration(): number { return GetPowerSavingModeDuration(); }
  setPlayerRockstarEditorDisabled(toggle: boolean): void { SetPlayerRockstarEditorDisabled(toggle); }

  startPerformanceTimer(): { getElapsedMs: () => number; getElapsedSec: () => number; getElapsedUs: () => number; reset: () => void } {
    let start = GetGameTimer();
    return {
      getElapsedMs: () => GetGameTimer() - start,
      getElapsedSec: () => (GetGameTimer() - start) / 1000,
      getElapsedUs: () => (GetGameTimer() - start) * 1000,
      reset: () => { start = GetGameTimer(); },
    };
  }

  getFreeStackSlotsCount(stackSize: number): number { return GetNumberOfFreeStacksOfThisSize(stackSize); }
  setWeatherTypeOverTime(weatherType: string, time: number): void { SetWeatherTypeOvertimePersist(weatherType, time); }
  setRainFxIntensity(intensity: number): void { SetRainLevel(intensity); }
  setCloudHatTransition(name: string, transitionTime: number): void { LoadCloudHat(name, transitionTime); }
  clearAreaOfEverything(x: number, y: number, z: number, radius: number, p4: boolean, p5: boolean, p6: boolean, p7: boolean): void {
    ClearAreaOfEverything(x, y, z, radius, p4 ?? false, p5 ?? false, p6 ?? false, p7 ?? false);
  }
  enableMpDlcMaps(toggle: boolean): void { EnableMpDlcMaps(Number(toggle)); }
  setUnkMapFlag(flag: number): void { SetUnkMapFlag(flag); }
  startSaveStruct(size: number, structName: string): number { return StartSaveStructWithSize(size, structName); }
  startSaveArray(size: number, arrayName: string): number { return StartSaveArrayWithSize(size, arrayName); }

  ["_0x4DCDF92BF64236CD"](...args: any[]): any { return Citizen.invokeNative("0x4DCDF92BF64236CD", ...args); }
  ["_0x31125FD509D9043F"](...args: any[]): any { return Citizen.invokeNative("0x31125FD509D9043F", ...args); }
  ["_0xEBD3205A207939ED"](...args: any[]): any { return Citizen.invokeNative("0xEBD3205A207939ED", ...args); }
  ["_0x97E7E2C04245115B"](...args: any[]): any { return Citizen.invokeNative("0x97E7E2C04245115B", ...args); }
  ["_0x916CA67D26FD1E37"](...args: any[]): any { return Citizen.invokeNative("0x916CA67D26FD1E37", ...args); }
  ["_0xEB078CA2B5E82ADD"](...args: any[]): any { return Citizen.invokeNative("0xEB078CA2B5E82ADD", ...args); }
  ["_0x703CC7F60CBB2B57"](...args: any[]): any { return Citizen.invokeNative("0x703CC7F60CBB2B57", ...args); }
  ["_0x8951EB9C6906D3C8"](): any { return Citizen.invokeNative("0x8951EB9C6906D3C8"); }
  ["_0xBA4B8D83BDC75551"](...args: any[]): any { return Citizen.invokeNative("0xBA4B8D83BDC75551", ...args); }
  ["_0x65D2EBB47E1CEC21"](...args: any[]): any { return Citizen.invokeNative("0x65D2EBB47E1CEC21", ...args); }
  ["_0x6F2135B6129620C1"](...args: any[]): any { return Citizen.invokeNative("0x6F2135B6129620C1", ...args); }
  ["_0x8D74E26F54B4E5C3"](...args: any[]): any { return Citizen.invokeNative("0x8D74E26F54B4E5C3", ...args); }
  ["_0x0CF97F497FE7D048"](...args: any[]): any { return Citizen.invokeNative("0x0CF97F497FE7D048", ...args); }
  ["_0x1178E104409FE58C"](...args: any[]): any { return Citizen.invokeNative("0x1178E104409FE58C", ...args); }
  ["_0x02DEAAC8F8EA7FE7"](...args: any[]): any { return Citizen.invokeNative("0x02DEAAC8F8EA7FE7", ...args); }
  ["_0x7F8F6405F4777AF6"](...args: any[]): any { return Citizen.invokeNative("0x7F8F6405F4777AF6", ...args); }
  ["_0x21C235BC64831E5A"](...args: any[]): any { return toVec3(Citizen.invokeNative("0x21C235BC64831E5A", ...args)); }
  ["_0xF56DFB7B61BE7276"](...args: any[]): any { return Citizen.invokeNative("0xF56DFB7B61BE7276", ...args); }
  ["_0xA0AD167E4B39D9A2"](...args: any[]): any { return Citizen.invokeNative("0xA0AD167E4B39D9A2", ...args); }
  ["_0x39455BF4F4F55186"](...args: any[]): any { return Citizen.invokeNative("0x39455BF4F4F55186", ...args); }
  ["_0x7EC6F9A478A6A512"]() { return Citizen.invokeNative("0x7EC6F9A478A6A512"); }
  ["_0x397BAA01068BAA96"]() { return Citizen.invokeNative("0x397BAA01068BAA96"); }
  ["_0xB51B9AB9EF81868C"](...args: any[]): any { return Citizen.invokeNative("0xB51B9AB9EF81868C", ...args); }
  ["_0xA4A0065E39C9F25C"]() {
    const r: any = Citizen.invokeNative("0xA4A0065E39C9F25C");
    return { p0: toVec3(r?.[0]) ?? r?.[0], p1: r?.[1], fadeInAfterLoad: r?.[2], p3: r?.[3], result: r?.[4] };
  }
  ["_0x2107A3773771186D"]() { return Citizen.invokeNative("0x2107A3773771186D"); }
  ["_0x06462A961E94B67C"]() { return Citizen.invokeNative("0x06462A961E94B67C"); }
  ["_0xD642319C54AADEB6"]() { return Citizen.invokeNative("0xD642319C54AADEB6"); }
  ["_0x5B1F2E327B6B6FE1"]() { return Citizen.invokeNative("0x5B1F2E327B6B6FE1"); }
  ["_0x72DE52178C291CB5"]() { return Citizen.invokeNative("0x72DE52178C291CB5"); }
  ["_0x44A0BDC559B35F6E"]() { return Citizen.invokeNative("0x44A0BDC559B35F6E"); }
  ["_0xEB2104E905C6F2E9"]() { return Citizen.invokeNative("0xEB2104E905C6F2E9"); }
  ["_0x2B5E102E4A42F2BF"]() { return Citizen.invokeNative("0x2B5E102E4A42F2BF"); }
  ["_0xFB80AB299D2EE1BD"](...args: any[]): any { return Citizen.invokeNative("0xFB80AB299D2EE1BD", ...args); }
  ["_0xFA3FFB0EEBC288A3"](...args: any[]): any { return Citizen.invokeNative("0xFA3FFB0EEBC288A3", ...args); }
  ["_0x48F069265A0E4BEC"](...args: any[]): any { return Citizen.invokeNative("0x48F069265A0E4BEC", ...args); }
  ["_0x8269816F6CFD40F8"](...args: any[]): any { return Citizen.invokeNative("0x8269816F6CFD40F8", ...args); }
  ["_0xFAA457EF263E8763"](...args: any[]): any { return Citizen.invokeNative("0xFAA457EF263E8763", ...args); }
  ["_0x19BFED045C647C49"](...args: any[]): any { return Citizen.invokeNative("0x19BFED045C647C49", ...args); }
  ["_0xE95B0C7D5BA3B96B"](...args: any[]): any { return Citizen.invokeNative("0xE95B0C7D5BA3B96B", ...args); }
  ["_0x54F157E0336A3822"](...args: any[]): any { return Citizen.invokeNative("0x54F157E0336A3822", ...args); }
  ["_0xD9F692D349249528"]() { return Citizen.invokeNative("0xD9F692D349249528"); }
  ["_0xE532EC1A63231B4F"](...args: any[]): any { return Citizen.invokeNative("0xE532EC1A63231B4F", ...args); }
  ["_0x1EAE0A6E978894A2"](...args: any[]): any { return Citizen.invokeNative("0x1EAE0A6E978894A2", ...args); }
  ["_0x6FDDF453C0C756EC"]() { return Citizen.invokeNative("0x6FDDF453C0C756EC"); }
  ["_0xFB00CA71DA386228"]() { return Citizen.invokeNative("0xFB00CA71DA386228"); }
  ["_0xE3D969D2785FFB5E"]() { return Citizen.invokeNative("0xE3D969D2785FFB5E"); }
  ["_0x1BB299305C3E8C13"](...args: any[]): any { return Citizen.invokeNative("0x1BB299305C3E8C13", ...args); }
  ["_0x23227DF0B2115469"]() { return Citizen.invokeNative("0x23227DF0B2115469"); }
  ["_0xD10282B6E3751BA0"]() { return Citizen.invokeNative("0xD10282B6E3751BA0"); }
  ["_0x693478ACBD7F18E7"]() { return Citizen.invokeNative("0x693478ACBD7F18E7"); }
}
