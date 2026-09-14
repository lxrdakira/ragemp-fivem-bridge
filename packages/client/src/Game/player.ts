import { Vector3 } from "@ragemp-fivem-bridge/shared";
import { createUnkProxy, toVec3 } from "./_helpers.js";
import { setPlayerModelIfDifferent } from "../utils/playerModel";

export class GamePlayerNs {
  unk = createUnkProxy();

  getPed(player: number): number { return GetPlayerPed(player); }
  getPedScriptIndex(player: number): number { return GetPlayerPed(player); }
  setModel(player: number, model: number): void { setPlayerModelIfDifferent(player, model); }
  getIndex(player: number): number { return player; }
  getName(player: number): string { return GetPlayerName(player); }

  getEntityIsFreeAimingAt(player: number): number {
    const [hit, entity] = GetEntityPlayerIsFreeAimingAt(player);
    return hit ? entity : 0;
  }

  getTeam(player: number): number { return GetPlayerTeam(player); }
  setTeam(player: number, team: number): void { SetPlayerTeam(player, team); }
  getNumberOfPlayersInTeam(team: number): number {
    let count = 0;
    for (let i = 0; i < 32; i++) if (NetworkIsPlayerActive(i) && GetPlayerTeam(i) === team) count++;
    return count;
  }

  getWantedLevel(player: number): number { return GetPlayerWantedLevel(player); }
  setWantedLevel(player: number, wantedLevel: number, disableNoMission: boolean): void {
    SetPlayerWantedLevel(player, wantedLevel, disableNoMission ?? false);
    SetPlayerWantedLevelNow(player, false);
  }
  clearWantedLevel(player: number): void { ClearPlayerWantedLevel(player); }
  isWantedLevelGreater(player: number, wantedLevel: number): boolean { return GetPlayerWantedLevel(player) > wantedLevel; }

  setWeaponDamageModifier(player: number, modifier: number): void { SetPlayerWeaponDamageModifier(player, modifier); }
  setMeleeWeaponDamageModifier(player: number, modifier: number): void { SetPlayerMeleeWeaponDamageModifier(player, modifier); }
  disableFiring(player: number, toggle: boolean): void { DisablePlayerFiring(player, toggle); }

  specialAbilityActivate(player: number): void { SpecialAbilityActivate(player); }
  specialAbilityDeactivate(player: number): void { SpecialAbilityDeactivate(player); }
  isSpecialAbilityActive(player: number): boolean { return IsSpecialAbilityActive(player); }

  setParachuteTintIndex(player: number, tintIndex: number): void { SetPlayerParachuteTintIndex(player, tintIndex); }
  setParachuteSmokeTrailColor(player: number, r: number, g: number, b: number): void { SetPlayerParachuteSmokeTrailColor(player, r, g, b); }

  startTeleport(player: number, x: number, y: number, z: number, heading: number, tpVehicle: boolean, setToGround: boolean, fadeOut: boolean): void {
    StartPlayerTeleport(player, x, y, z, heading, tpVehicle ?? false, setToGround ?? false, fadeOut ?? true);
  }
  isTeleportActive(): boolean { return IsPlayerTeleportActive(); }
  stopTeleport(): void { StopPlayerTeleport(); }


  setHealthRechargeMultiplier(rechargeRate: number): void { SetPlayerHealthRechargeMultiplier(PlayerId(), rechargeRate); }
  setMaxArmour(player: number, value: number): void { SetPlayerMaxArmour(player, value); }
  setFallDistance(player: number, fallDistance: number): void { SetPlayerFallDistance(player, fallDistance); }
  restoreStamina(player: number, p1: number): void { RestorePlayerStamina(player ?? PlayerId(), p1 ?? 1.0); }
  resetStamina(player: number): void { ResetPlayerStamina(player ?? PlayerId()); }

  changePed(player: number, ped: number, p2: boolean, resetDamage: boolean): void { ChangePlayerPed(player, ped, p2 ?? false, resetDamage ?? true); }
  getRgbColour(player: number): { r: number; g: number; b: number } { const r = (GetPlayerRgbColour as any)(player) as [number, number, number, number]; return { r: r[1], g: r[2], b: r[3] }; } // NOTE: native typings say 3-tuple but 4 values used

  getWantedLevelRadius(player: number): number { return GetWantedLevelRadius(player); }
  getWantedCentrePosition(player: number): Vector3 { return toVec3(GetPlayerWantedCentrePosition(player)); }
  getWantedLevelThreshold(wantedLevel: number): number { return GetWantedLevelThreshold(wantedLevel); }
  setWantedLevelNoDrop(player: number, wantedLevel: number, p2: boolean): void { SetPlayerWantedLevelNoDrop(player, wantedLevel, p2 ?? false); }
  setWantedLevelNow(player: number, p1: boolean): void { SetPlayerWantedLevelNow(player, p1 ?? false); }
  areFlashingStarsAboutToDrop(player: number): boolean { return ArePlayerFlashingStarsAboutToDrop(player); }
  areStarsGreyedOut(player: number): boolean { return ArePlayerStarsGreyedOut(player); }
  setDispatchCopsFor(player: number, toggle: boolean): void { SetDispatchCopsForPlayer(player, toggle); }
  isPressingHorn(player: number): boolean { return IsPlayerPressingHorn(player); }
  setControl(player: number, bHasControl: boolean, flags: number): void { SetPlayerControl(player, bHasControl, flags); }
  setMaxWantedLevel(maxWantedLevel: number): void { SetMaxWantedLevel(maxWantedLevel); }
  setPoliceRadarBlips(toggle: boolean): void { SetPoliceRadarBlips(toggle); }
  setPoliceIgnore(player: number, toggle: boolean): void { SetPoliceIgnorePlayer(player, toggle); }
  isPlaying(player: number): boolean { return IsPlayerPlaying(player); }
  setEveryoneIgnore(player: number, toggle: boolean): void { SetEveryoneIgnorePlayer(player, toggle); }
  setAllRandomPedsFlee(player: number, toggle: boolean): void { SetAllRandomPedsFlee(player, toggle); }
  setAllRandomPedsFleeThisFrame(player: number): void { SetAllRandomPedsFleeThisFrame(player); }
  setIgnoreLowPriorityShockingEvents(player: number, toggle: boolean): void { SetIgnoreLowPriorityShockingEvents(player, toggle); }
  setWantedLevelMultiplier(multiplier: number): void { SetWantedLevelMultiplier(multiplier); }
  setWantedLevelDifficulty(player: number, difficulty: number): void { SetWantedLevelDifficulty(player, difficulty); }
  resetWantedLevelDifficulty(player: number): void { ResetWantedLevelDifficulty(player); }
  startFiringAmnesty(duration: number): void { StartFiringAmnesty(duration); }
  reportCrime(player: number, crimeType: number, wantedLvlThresh: number): void { ReportCrime(player, crimeType, wantedLvlThresh); }
  reportPoliceSpotted(player: number): void { ReportPoliceSpottedPlayer(player); }
  canStartMission(player: number): boolean { return CanPlayerStartMission(player); }
  isReadyForCutscene(player: number): boolean { return IsPlayerReadyForCutscene(player); }
  isTargettingEntity(player: number, entity: number): boolean { return IsPlayerTargettingEntity(player, entity); }
  getTargetEntity(player: number): number { const r = GetPlayerTargetEntity(player); return Array.isArray(r) ? (r[0] ? r[1] : 0) : r; }
  isFreeAiming(player: number): boolean { return IsPlayerFreeAiming(player); }
  isFreeAimingAtEntity(player: number, entity: number): boolean { return IsPlayerFreeAimingAtEntity(player, entity); }
  setLockonRangeOverride(player: number, range: number): void { SetPlayerLockonRangeOverride(player, range); }
  setCanDoDriveBy(player: number, toggle: boolean): void { SetPlayerCanDoDriveBy(player, toggle); }
  setCanBeHassledByGangs(player: number, toggle: boolean): void { SetPlayerCanBeHassledByGangs(player, toggle); }
  setCanUseCover(player: number, toggle: boolean): void { SetPlayerCanUseCover(player, toggle); }
  getMaxWantedLevel(): number { return GetMaxWantedLevel(); }
  isTargettingAnything(player: number): boolean { return IsPlayerTargettingAnything(player); }
  setSprint(player: number, toggle: boolean): void { SetPlayerSprint(player, toggle); }
  getSprintStaminaRemaining(player: number): number { return GetPlayerSprintStaminaRemaining(player); }
  getSprintTimeRemaining(player: number): number { return GetPlayerSprintTimeRemaining(player); }
  getUnderwaterTimeRemaining(player: number): number { return GetPlayerUnderwaterTimeRemaining(player); }
  getGroup(player: number): number { return GetPlayerGroup(player); }
  getMaxArmour(player: number): number { return GetPlayerMaxArmour(player); }
  isControlOn(player: number): boolean { return IsPlayerControlOn(player); }
  isScriptControlOn(player: number): boolean { return IsPlayerScriptControlOn(player); }
  isClimbing(ped: number): boolean { return IsPedClimbing(ped); }
  isBeingArrested(ped: number): boolean { return IsPedBeingArrested(ped); }
  resetArrestState(player: number): void { ResetPlayerArrestState(player); }
  getPlayersLastVehicle(): number { return GetPlayersLastVehicle(); }
  intToParticipantindex(value: number): number { return IntToParticipantindex(value); }
  isFreeForAmbientTask(player: number): boolean { return IsPlayerFreeForAmbientTask(player); }
  networkIdToInt(): number { return NetworkPlayerIdToInt(); }
  hasForceCleanupOccurred(cleanupFlags: number): boolean { return HasForceCleanupOccurred(cleanupFlags); }
  forceCleanup(cleanupFlags: number): void { ForceCleanup(cleanupFlags); }
  forceCleanupForAllThreadsWithThisName(name: string, cleanupFlags: number): void { ForceCleanupForAllThreadsWithThisName(name, cleanupFlags); }
  forceCleanupForThreadWithThisId(id: number, cleanupFlags: number): void { ForceCleanupForThreadWithThisId(id, cleanupFlags); }
  getCauseOfMostRecentForceCleanup(): number { return GetCauseOfMostRecentForceCleanup(); }
  setMayOnlyEnterThisVehicle(player: number, vehicle: number): void { SetPlayerMayOnlyEnterThisVehicle(player, vehicle); }
  setMayNotEnterAnyVehicle(player: number): void { SetPlayerMayNotEnterAnyVehicle(player); }
  giveAchievementTo(achievement: number): boolean { return GiveAchievementToPlayer(achievement); }
  setAchievementProgress(achievement: number, progress: number): boolean { return SetAchievementProgress(achievement, progress); }
  getAchievementProgress(achievement: number): number { return GetAchievementProgress(achievement); }
  hasAchievementBeenPassed(achievement: number): boolean { return HasAchievementBeenPassed(achievement); }
  isOnline(): boolean { return IsPlayerOnline(); }
  isLoggingInNp(): boolean { return IsPlayerLoggingInNp(); }
  displaySystemSigninUi(unk: boolean): void { DisplaySystemSigninUi(unk); }
  isSystemUiBeingDisplayed(): boolean { return IsSystemUiBeingDisplayed(); }
  setInvincible(entity: number, toggle: boolean): void { SetEntityInvincible(entity, toggle); }
  getInvincible(player: number): boolean { return GetPlayerInvincible(player); }
  removeHelmet(ped: number, p2: boolean): void { RemovePedHelmet(ped, p2); }
  giveRagdollControl(player: number, toggle: boolean): void { GivePlayerRagdollControl(player, toggle); }
  setLockon(player: number, toggle: boolean): void { SetPlayerLockon(player, toggle); }
  setTargetingMode(targetMode: number): void { SetPlayerTargetingMode(targetMode); }
  setTargetLevel(targetLevel: number): void { SetPlayerTargetLevel(targetLevel); }
  clearHasDamagedAtLeastOnePed(player: number): void { ClearPlayerHasDamagedAtLeastOnePed(player); }
  hasDamagedAtLeastOnePed(player: number): boolean { return HasPlayerDamagedAtLeastOnePed(player); }
  clearHasDamagedAtLeastOneNonAnimalPed(player: number): void { ClearPlayerHasDamagedAtLeastOneNonAnimalPed(player); }
  hasDamagedAtLeastOneNonAnimalPed(player: number): boolean { return HasPlayerDamagedAtLeastOneNonAnimalPed(player); }
  setAirDragMultiplierForPlayersVehicle(player: number, multiplier: number): void { SetAirDragMultiplierForPlayersVehicle(player, multiplier); }
  setSwimMultiplierFor(player: number, multiplier: number): void { SetSwimMultiplierForPlayer(player, multiplier); }
  setRunSprintMultiplierFor(player: number, multiplier: number): void { SetRunSprintMultiplierForPlayer(player, multiplier); }
  getTimeSinceLastArrest(): number { return GetTimeSinceLastArrest(); }
  getTimeSinceLastDeath(): number { return GetTimeSinceLastDeath(); }
  assistedMovementCloseRoute(): void { AssistedMovementCloseRoute(); }
  assistedMovementFlushRoute(): void { AssistedMovementFlushRoute(); }
  setForcedAim(player: number, toggle: boolean): void { SetPlayerForcedAim(player, toggle); }
  setForcedZoom(player: number, toggle: boolean): void { SetPlayerForcedZoom(player, toggle); }
  setForceSkipAimIntro(player: number, toggle: boolean): void { SetPlayerForceSkipAimIntro(player, toggle); }
  setDisableAmbientMeleeMove(player: number, toggle: boolean): void { SetDisableAmbientMeleeMove(player, toggle); }
  specialAbilityDeactivateFast(player: number): void { SpecialAbilityDeactivateFast(player); }
  specialAbilityReset(player: number): void { SpecialAbilityReset(player); }
  specialAbilityChargeOnMissionFailed(player: number): void { SpecialAbilityChargeOnMissionFailed(player); }
  specialAbilityChargeSmall(player: number, p1: boolean, p2: boolean): void { SpecialAbilityChargeSmall(player, p1, p2); }
  specialAbilityChargeMedium(player: number, p1: boolean, p2: boolean): void { SpecialAbilityChargeMedium(player, p1, p2); }
  specialAbilityChargeLarge(player: number, p1: boolean, p2: boolean): void { SpecialAbilityChargeLarge(player, p1, p2); }
  specialAbilityChargeContinuous(player: number, p1: number): void { SpecialAbilityChargeContinuous(player, p1); }
  specialAbilityChargeAbsolute(player: number, p1: number, p2: boolean): void { SpecialAbilityChargeAbsolute(player, p1, p2); }
  specialAbilityChargeNormalized(player: number, normalizedValue: number, p2: boolean): void { SpecialAbilityChargeNormalized(player, normalizedValue, p2); }
  specialAbilityFillMeter(player: number, p1: boolean): void { SpecialAbilityFillMeter(player, p1); }
  specialAbilityDepleteMeter(player: number, p1: boolean): void { SpecialAbilityDepleteMeter(player, p1); }
  specialAbilityLock(playerModel: number): void { SpecialAbilityLock(playerModel); }
  specialAbilityUnlock(playerModel: number): void { SpecialAbilityUnlock(playerModel); }
  isSpecialAbilityUnlocked(playerModel: number): boolean { return IsSpecialAbilityUnlocked(playerModel); }
  isSpecialAbilityMeterFull(player: number): boolean { return IsSpecialAbilityMeterFull(player); }
  enableSpecialAbility(player: number, toggle: boolean): void { EnableSpecialAbility(player, toggle); }
  isSpecialAbilityEnabled(player: number): boolean { return IsSpecialAbilityEnabled(player); }
  setSpecialAbilityMultiplier(multiplier: number): void { SetSpecialAbilityMultiplier(multiplier); }
  updateTeleport(player: number): boolean { return UpdatePlayerTeleport(player); }
  getCurrentStealthNoise(player: number): number { return GetPlayerCurrentStealthNoise(player); }
  setWeaponDefenseModifier(player: number, modifier: number): void { SetPlayerWeaponDefenseModifier(player, modifier); }
  setMeleeWeaponDefenseModifier(player: number, modifier: number): void { SetPlayerMeleeWeaponDefenseModifier(player, modifier); }
  setVehicleDamageModifier(player: number, modifier: number): void { SetPlayerVehicleDamageModifier(player, modifier); }
  setVehicleDefenseModifier(player: number, modifier: number): void { SetPlayerVehicleDefenseModifier(player, modifier); }
  setReserveParachuteTintIndex(ped: number, index: number): void { SetPedReserveParachuteTintIndex(ped, index); }
  getReserveParachuteTintIndex(player: number): number { const r = GetPlayerReserveParachuteTintIndex(player); return Array.isArray(r) ? r[1] : r; }
  setParachutePackTintIndex(player: number, tintIndex: number): void { SetPlayerParachutePackTintIndex(player, tintIndex); }
  getParachutePackTintIndex(player: number): number { const r = GetPlayerParachutePackTintIndex(player); return Array.isArray(r) ? r[1] : r; }
  setHasReserveParachute(player: number): void { SetPlayerHasReserveParachute(player); }
  getHasReserveParachute(player: number): boolean { return GetPlayerHasReserveParachute(player); }
  setCanLeaveParachuteSmokeTrail(player: number, enabled: boolean): void { SetPlayerCanLeaveParachuteSmokeTrail(player, enabled); }
  getParachuteSmokeTrailColor(player: number): { r: number; g: number; b: number } { const r = (GetPlayerParachuteSmokeTrailColor as any)(player) as [number, number, number, number]; return { r: r[1], g: r[2], b: r[3] }; } // NOTE: native typings say 3-tuple but 4 values used
  setNoiseMultiplier(player: number, multiplier: number): void { SetPlayerNoiseMultiplier(player, multiplier); }
  setSneakingNoiseMultiplier(player: number, multiplier: number): void { SetPlayerSneakingNoiseMultiplier(player, multiplier); }
  canPedHear(player: number, ped: number): boolean { return CanPedHearPlayer(player, ped); }
  simulateInputGait(player: number, amount: number, gaitType: number, speed: number, p4: boolean, p5: boolean): void { SimulatePlayerInputGait(player, amount, gaitType, speed, p4, p5); }
  resetInputGait(player: number): void { ResetPlayerInputGait(player); }
  setAutoGiveParachuteWhenEnterPlane(player: number, toggle: boolean): void { SetAutoGiveParachuteWhenEnterPlane(player, toggle); }
  setAutoGiveScubaGearWhenExitVehicle(player: number, toggle: boolean): void { SetAutoGiveScubaGearWhenExitVehicle(player, toggle); }
  setStealthPerceptionModifier(player: number, value: number): void { SetPlayerStealthPerceptionModifier(player, value); }
  setSimulateAiming(player: number, toggle: boolean): void { SetPlayerSimulateAiming(player, toggle); }
  setClothPinFrames(p0: number, p1: number): void { SetPedClothPinFrames(p0, p1); }
  setClothPackageIndex(p0: number, index: number): void { SetPedClothPackageIndex(p0, index); }
  setClothLockCounter(value: number): void { SetPlayerClothLockCounter(value); }
  hasBeenSpottedInStolenVehicle(player: number): boolean { return HasPlayerBeenSpottedInStolenVehicle(player); }
  isBattleAware(player: number): boolean { return IsPlayerBattleAware(player); }
  extendWorldBoundaryFor(x: number, y: number, z: number): void { ExtendWorldBoundaryForPlayer(x, y, z); }
  resetWorldBoundaryFor(): void { ResetWorldBoundaryForPlayer(); }
  isRidingTrain(player: number): boolean { return IsPlayerRidingTrain(player); }
  hasLeftTheWorld(player: number): boolean { return HasPlayerLeftTheWorld(player); }
  setLeavePedBehind(player: number, toggle: boolean): void { SetPlayerLeavePedBehind(player, toggle); }
  setParachuteVariationOverride(player: number, p1: number, p2: number, p3: number, p4: boolean): void { SetPlayerParachuteVariationOverride(player, p1, p2, p3, p4); }
  clearParachuteVariationOverride(player: number): void { ClearPlayerParachuteVariationOverride(player); }
  setParachuteModelOverride(player: number, model: number): void { SetPlayerParachuteModelOverride(player, model); }
  clearParachuteModelOverride(player: number): void { ClearPlayerParachuteModelOverride(player); }
  setParachutePackModelOverride(player: number, model: number): void { SetPlayerParachutePackModelOverride(player, model); }
  clearParachutePackModelOverride(player: number): void { ClearPlayerParachutePackModelOverride(player); }
  disableVehicleRewards(player: number): void { DisablePlayerVehicleRewards(player); }
  setBluetoothState(player: number, state: boolean): void { SetPlayerBluetoothState(player, state); }
  isBluetoothEnable(player: number): boolean { return IsPlayerBluetoothEnable(player); }
  getFakeWantedLevel(): number { return GetFakeWantedLevel(); }
  setReserveParachuteModelOverride(player: number, model: number): void { SetPlayerReserveParachuteModelOverride(player, model); }
  getParachuteModelOverride(player: number): number { return GetPlayerParachuteModelOverride(player); }
  getReserveParachuteModelOverride(player: number): number { return GetPlayerReserveParachuteModelOverride(player); }
  clearReserveParachuteModelOverride(player: number): void { ClearPlayerReserveParachuteModelOverride(player); }
  playerAttachVirtualBound(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number): void { PlayerAttachVirtualBound(p0, p1, p2, p3, p4, p5, p6, p7); }

  reserveEntityExplodesOnHighExplosionCombo(p1: number): void { ReserveEntityExplodesOnHighExplosionCombo(p1); } // unverified
  getNumberOfS(): number { return GetNumberOfPlayers(); }
  setWantedCentrePosition(player: number, p2: boolean, p3: boolean): Vector3 { return toVec3(SetPlayerWantedCentrePosition(player, p2, p3)); }
  switchCrimeType(player: number, p1: number): void { SwitchCrimeType(player, p1); } // unverified
  isDead(player: number): boolean { return IsPlayerDead(player); }
  intToIndex(value: number): number { return IntToPlayerindex(value); }
  getTimeSinceHitVehicle(player: number): number { return GetTimeSincePlayerHitVehicle(player); }
  getTimeSinceHitPed(player: number): number { return GetTimeSincePlayerHitPed(player); }
  getTimeSinceDroveOnPavement(player: number): number { return GetTimeSincePlayerDroveOnPavement(player); }
  getTimeSinceDroveAgainstTraffic(player: number): number { return GetTimeSincePlayerDroveAgainstTraffic(player); }
  id(): number { return PlayerId(); }
  pedId(): number { return PlayerPedId(); }
  isCamControlDisabled(): boolean { return IsPlayerCamControlDisabled(); } // unverified
  setUnderwaterTimeRemaining(player: number, time: number): void { SetPlayerUnderwaterTimeRemaining(player, time); } // unverified
  setInvincibleKeepRagdollEnabled(player: number, toggle: boolean): void { SetPlayerInvincibleKeepRagdollEnabled(player, toggle); } // unverified
  setSpecialAbility(player: number, p1: number): void { SetSpecialAbility(player, p1); } // unverified
  specialAbilityDeplete(player: number): void { SpecialAbilityDeplete(player); } // unverified
  getHealthRechargeLimit(player: number): number { return GetPlayerHealthRechargeLimit(player); } // unverified
  setHealthRechargeLimit(player: number, limit: number): void { SetPlayerHealthRechargeLimit(player, limit); } // unverified
  setWeaponDefenseModifier2(player: number, modifier: number): void { SetPlayerWeaponDefenseModifier_2(player, modifier); } // unverified
  getParachuteTintIndex(player: number): number { const r = GetPlayerParachuteTintIndex(player); return Array.isArray(r) ? r[1] : r; }
  setResetFlagPreferRearSeats(player: number, flags: number): void { SetPlayerResetFlagPreferRearSeats(player, flags); } // unverified
  attachVirtualBound(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number): void { PlayerAttachVirtualBound(p0, p1, p2, p3, p4, p5, p6, p7); }
  detachVirtualBound(): void { PlayerDetachVirtualBound(); }
  setHomingRocketDisabled(player: number, disableHoming: number): void { SetPlayerHomingRocketDisabled(player, disableHoming as any); } // unverified
  intToindex(args: number): number { return IntToPlayerindex(args); }
  setAirDragMultiplierForsVehicle(player: number, multiplier: number): void { SetAirDragMultiplierForPlayersVehicle(player, multiplier); }
  setHudAnimStopLevel(player: number, toggle: boolean): void { SetHudAnimStopLevel(player, toggle); } // unverified
  setAreasGeneratorOrientation(player: number): void { SetAreasGeneratorOrientation(player); } // unverified
  getWantedLevelParoleDuration(): number { return GetWantedLevelParoleDuration(); } // unverified
  setWantedLevelHiddenEvasionTime(player: number, wantedLevel: number, lossTime: number): void { SetWantedLevelHiddenEvasionTime(player, wantedLevel, lossTime); } // unverified
  hasTeleportFinished(player: number): boolean { return HasPlayerTeleportFinished(player); } // unverified
  getEntityIsFreeAimingAtRaw(player: number): number | undefined { const [hit, entity] = GetEntityPlayerIsFreeAimingAt(player); return hit ? entity : undefined; }
}
