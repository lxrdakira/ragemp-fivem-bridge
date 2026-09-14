import { gtaPedHealthToRage, rageHealthToGtaPed } from "@ragemp-fivem-bridge/shared";
import { EntityMpBase } from "./EntityMpBase";
import { toVec3 } from "../utils/vec";
import { Vector3 } from "@ragemp-fivem-bridge/shared";
import { setCompatibleComponentVariation, setCompatiblePropIndex } from "../utils/clothingCompatibility";

export class PedMpBase extends EntityMpBase {
  private pendingAnimatedDriverEntry: { vehicle: number; startedAt: number } | null = null;

  constructor(token: symbol, id: number, type: string, handle: number | null = null) {
    super(token, id, type, handle);
  }

  get health(): number {
    return gtaPedHealthToRage(GetEntityHealth(this.handle));
  }
  set health(value: number) {
    SetEntityHealth(this.handle, rageHealthToGtaPed(value));
  }
  override getHealth(): number {
    return gtaPedHealthToRage(GetEntityHealth(this.handle));
  }
  override setHealth(value: number): void {
    SetEntityHealth(this.handle, rageHealthToGtaPed(value));
  }

  get armour(): number {
    return GetPedArmour(this.handle);
  }
  set armour(value: number) {
    SetPedArmour(this.handle, value);
  }

  get weapon(): number {
    return GetSelectedPedWeapon(this.handle);
  }

  weaponAmmo: number = 0;
  shapeFirst: number = 0;
  shapeSecond: number = 0;
  shapeThird: number = 0;
  skinFirst: number = 0;
  skinSecond: number = 0;
  skinThird: number = 0;
  shapeMix: number = 0;
  skinMix: number = 0;
  thirdMix: number = 0;
  voiceGameOutputSound: number = 0;

  haveAllStreamingRequestsCompleted(): boolean { return HaveAllStreamingRequestsCompleted(this.handle); }
  canInCombatSeeTarget(target: number): boolean { return CanPedInCombatSeeTarget(this.handle, target); }
  canKnockOffVehicle(): boolean { return CanKnockPedOffVehicle(this.handle); }
  canRagdoll(): boolean { return CanPedRagdoll(this.handle); }
  controlMountedWeapon(): boolean { return ControlMountedWeapon(this.handle); }
  forceMotionState(motionStateHash: number, p2: boolean, p3: boolean, p4: boolean): boolean { return (ForcePedMotionState as any)(this.handle, motionStateHash, !!p2, p3, !!p4); }
  getAccuracy(): number { return GetPedAccuracy(this.handle); }
  getAlertness(): number { return GetPedAlertness(this.handle); }
  getAmmoInClip(weapon: number): number { const [, ammo] = GetAmmoInClip(this.handle, weapon); return ammo; }
  getArmour(): number { return GetPedArmour(this.handle); }
  getBoneCoords(boneId: number, offsetX: number, offsetY: number, offsetZ: number): Vector3 { return toVec3(GetPedBoneCoords(this.handle, boneId, offsetX, offsetY, offsetZ) as any); }
  getBoneIndex(boneId: number): number { return GetPedBoneIndex(this.handle, boneId); }
  getCauseOfDeath(): number { return GetPedCauseOfDeath(this.handle); }
  getCombatFloat(p1: number): number { return GetCombatFloat(this.handle, p1); }
  getCombatMovement(): number { return GetPedCombatMovement(this.handle); }
  getCombatRange(): number { return GetPedCombatRange(this.handle); }
  getConfigFlag(flagId: number, p2: boolean): boolean { return GetPedConfigFlag(this.handle, flagId, p2 ?? true); }
  getDeadPickupCoords(p1: number, p2: number): Vector3 { return toVec3(GetDeadPedPickupCoords(this.handle, p1, p2) as any); }
  getDecorationsState(): number { return GetPedDecorationsState(this.handle); }
  getDefensiveAreaPosition(p1: boolean): Vector3 { return toVec3(GetPedDefensiveAreaPosition(this.handle, !!p1) as any); }
  getDesiredMoveBlendRatio(): number { return GetPedDesiredMoveBlendRatio(this.handle); }
  getDrawableVariation(componentId: number): number { return GetPedDrawableVariation(this.handle, componentId); }
  getEnveffScale(): number { return GetPedEnveffScale(this.handle); }
  getExtractedDisplacement(worldSpace: boolean): Vector3 { return toVec3(GetPedExtractedDisplacement(this.handle, !!worldSpace) as any); }
  getGroupIndex(): number { return GetPedGroupIndex(this.handle); }
  getHeadOverlayValue(overlayID: number): number { return GetPedHeadOverlayValue(this.handle, overlayID); }
  getEyeColor(): number { return GetPedEyeColor(this.handle); }
  getIsTaskActive(taskNumber: number): boolean { return GetIsTaskActive(this.handle, taskNumber); }
  getJackTarget(): number { return GetJackTarget(this.handle); }
  getLastDamageBone(): number { const [, bone] = GetPedLastDamageBone(this.handle); return bone; }
  getMeleeTargetFor(): number { return GetMeleeTargetForPed(this.handle); }
  getMoney(): number { return GetPedMoney(this.handle); }
  getMount(): number { return GetMount(this.handle); }
  getNavmeshRouteDistanceRemaining(): any { return GetNavmeshRouteDistanceRemaining(this.handle); }
  getNearbyPeds(numPeds: number, ignoreType: number): number[] | null { return (GetPedNearbyPeds as any)(this.handle, numPeds, ignoreType ?? -1); }
  getNearbyVehicles(numVehicles: number): number[] | null { return GetPedNearbyVehicles(this.handle, numVehicles); }
  getNumberOfDrawableVariations(componentId: number): number { return GetNumberOfPedDrawableVariations(this.handle, componentId); }
  getNumberOfPropDrawableVariations(propId: number): number { return GetNumberOfPedPropDrawableVariations(this.handle, propId); }
  getNumberOfPropTextureVariations(propId: number, drawableId: number): number { return GetNumberOfPedPropTextureVariations(this.handle, propId, drawableId); }
  getNumberOfTextureVariations(componentId: number, drawableId: number): number { return GetNumberOfPedTextureVariations(this.handle, componentId, drawableId); }
  getPaletteVariation(componentId: number): number { return GetPedPaletteVariation(this.handle, componentId); }
  getParachuteLandingType(): number { return GetPedParachuteLandingType(this.handle); }
  getParachuteState(): number { return GetPedParachuteState(this.handle); }
  getParachuteTintIndex(tintIndex: number): number { return GetPedParachuteTintIndex(this.handle); }
  getPhoneGestureAnimCurrentTime(): number { return GetPhoneGestureAnimCurrentTime(this.handle); }
  getPhoneGestureAnimTotalTime(): number { return GetPhoneGestureAnimTotalTime(this.handle); }
  getPlayerIsFollowing(): number { return GetPlayerPedIsFollowing(this.handle); }
  getPropIndex(componentId: number): number { return GetPedPropIndex(this.handle, componentId); }
  getPropTextureIndex(componentId: number): number { return GetPedPropTextureIndex(this.handle, componentId); }
  getRagdollBoneIndex(bone: number): number { return GetPedRagdollBoneIndex(this.handle, bone); }
  getRelationshipBetweens(ped2: number): void { GetRelationshipBetweenPeds(this.handle, ped2); }
  getRelationshipGroupDefaultHash(): number { return GetPedRelationshipGroupDefaultHash(this.handle); }
  getRelationshipGroupHash(): number { return GetPedRelationshipGroupHash(this.handle); }
  getResetFlag(flagId: number): boolean { return GetPedResetFlag(this.handle, flagId); }
  getScriptTaskStatus(taskHash: number): number { return GetScriptTaskStatus(this.handle, taskHash); }
  getSeatIsTryingToEnter(): number { return GetSeatPedIsTryingToEnter(this.handle); }
  getSequenceProgress(): number { return GetSequenceProgress(this.handle); }
  getStealthMovement(): boolean { return GetPedStealthMovement(this.handle); }
  getsJacker(): number { return GetPedsJacker(this.handle); }
  getSourceOfDeath(): number { return GetPedSourceOfDeath(this.handle); }
  getTextureVariation(componentId: number): number { return GetPedTextureVariation(this.handle, componentId); }
  getTimeOfDeath(): number { return GetPedTimeOfDeath(this.handle); }
  getVehicleIsIn(getLastVehicle: boolean): number { return GetVehiclePedIsIn(this.handle, !!getLastVehicle); }
  getVehicleIsTryingToEnter(): number { return GetVehiclePedIsTryingToEnter(this.handle); }
  getVehicleIsUsing(): number { return GetVehiclePedIsUsing(this.handle); }
  hasHeadBlendFinished(): boolean { return HasPedHeadBlendFinished(this.handle); }

  isActiveInScenario(): boolean { return IsPedActiveInScenario(this.handle); }
  isAimingFromCover(): boolean { return IsPedAimingFromCover(this.handle); }
  isBeingArrested(): boolean { return IsPedBeingArrested(this.handle); }
  isBeingJacked(): boolean { return IsPedBeingJacked(this.handle); }
  isBeingStealthKilled(): boolean { return IsPedBeingStealthKilled(this.handle); }
  isBeingStunned(p1: number): boolean { return IsPedBeingStunned(this.handle, p1 ?? 0); }
  isComponentVariationValid(componentId: number, drawableId: number, textureId: number): boolean { return IsPedComponentVariationValid(this.handle, componentId, drawableId, textureId); }
  isConversationDead(): boolean { return IsConversationPedDead(this.handle); }
  isCuffed(): boolean { return IsPedCuffed(this.handle); }
  override isDead(): boolean { return IsEntityDead(this.handle); }
  isDeadOrDying(p1: boolean): boolean { return IsPedDeadOrDying(this.handle, p1 ?? true); }
  isDiving(): boolean { return IsPedDiving(this.handle); }
  isDoingDriveby(): boolean { return IsPedDoingDriveby(this.handle); }
  isDrivebyTaskUnderneathDrivingTask(): boolean { return IsDrivebyTaskUnderneathDrivingTask(this.handle); }
  isDucking(): boolean { return IsPedDucking(this.handle); }
  isEvasiveDiving(evadingEntity: number): boolean { const [diving] = IsPedEvasiveDiving(this.handle); return diving; }
  isFacingPed(otherPed: number, angle: number): boolean { return IsPedFacingPed(this.handle, otherPed, angle); }
  isFalling(): boolean { return IsPedFalling(this.handle); }
  isFatallyInjured(): boolean { return IsPedFatallyInjured(this.handle); }
  isFleeing(): boolean { return IsPedFleeing(this.handle); }
  isGettingIntoAVehicle(): boolean { return IsPedGettingIntoAVehicle(this.handle); }
  isGettingUp(): boolean { return IsPedGettingUp(this.handle); }
  isGoingIntoCover(): boolean { return IsPedGoingIntoCover(this.handle); }
  isGroupMember(groupId: number): boolean { return IsPedGroupMember(this.handle, groupId); }
  isHangingOnToVehicle(): boolean { return IsPedHangingOnToVehicle(this.handle); }
  isHeadtracking(entity: number): boolean { return IsPedHeadtrackingEntity(this.handle, entity); }
  isHeadtrackingPed(ped2: number): boolean { return IsPedHeadtrackingPed(this.handle, ped2); }
  isHuman(): boolean { return IsPedHuman(this.handle); }
  isHurt(): boolean { return IsPedHurt(this.handle); }
  isInAnyBoat(): boolean { return IsPedInAnyBoat(this.handle); }
  isInAnyHeli(): boolean { return IsPedInAnyHeli(this.handle); }
  isInAnyPlane(): boolean { return IsPedInAnyPlane(this.handle); }
  isInAnyPoliceVehicle(): boolean { return IsPedInAnyPoliceVehicle(this.handle); }
  isInAnySub(): boolean { return IsPedInAnySub(this.handle); }
  isInAnyTaxi(): boolean { return IsPedInAnyTaxi(this.handle); }
  isInAnyTrain(): boolean { return IsPedInAnyTrain(this.handle); }
  isInAnyVehicle(atGetIn: boolean): boolean { return IsPedInAnyVehicle(this.handle, !!atGetIn); }
  isInCombat(target: number): boolean { return IsPedInCombat(this.handle, target); }
  isInCoverFacingLeft(): boolean { return IsPedInCoverFacingLeft(this.handle); }
  isInFlyingVehicle(): boolean { return IsPedInFlyingVehicle(this.handle); }
  isInGroup(): boolean { return IsPedInGroup(this.handle); }
  isInjured(): boolean { return IsPedInjured(this.handle); }
  isInMeleeCombat(): boolean { return IsPedInMeleeCombat(this.handle); }
  isInModel(modelHash: number): boolean { return IsPedInModel(this.handle, modelHash); }
  isInParachuteFreeFall(): boolean { return IsPedInParachuteFreeFall(this.handle); }
  isInVehicle(vehicle: number, atGetIn: boolean): boolean { return IsPedInVehicle(this.handle, vehicle, !!atGetIn); }
  isInWrithe(): boolean { return IsPedInWrithe(this.handle); }
  isJacking(): boolean { return IsPedJacking(this.handle); }
  isJumpingOutOfVehicle(): boolean { return IsPedJumpingOutOfVehicle(this.handle); }
  isMale(): boolean { return IsPedMale(this.handle); }
  isModel(modelHash: number): boolean { return IsPedModel(this.handle, modelHash); }
  isMountedWeaponTaskUnderneathDrivingTask(): boolean { return IsMountedWeaponTaskUnderneathDrivingTask(this.handle); }
  isMoveBlendRatioRunning(): boolean { return IsMoveBlendRatioRunning(this.handle); }
  isMoveBlendRatioSprinting(): boolean { return IsMoveBlendRatioSprinting(this.handle); }
  isMoveBlendRatioStill(): boolean { return IsMoveBlendRatioStill(this.handle); }
  isMoveBlendRatioWalking(): boolean { return IsMoveBlendRatioWalking(this.handle); }
  isOnAnyBike(): boolean { return IsPedOnAnyBike(this.handle); }
  isOnFoot(): boolean { return IsPedOnFoot(this.handle); }
  isOnMount(): boolean { return IsPedOnMount(this.handle); }
  isOnSpecificVehicle(vehicle: number): boolean { return IsPedOnSpecificVehicle(this.handle, vehicle); }
  isOnVehicle(): boolean { return IsPedOnVehicle(this.handle); }
  isPerformingStealthKill(): boolean { return IsPedPerformingStealthKill(this.handle); }
  isPlantingBomb(): boolean { return IsPedPlantingBomb(this.handle); }
  isPlayingPhoneGestureAnim(): boolean { return IsPlayingPhoneGestureAnim(this.handle); }
  isProne(): boolean { return IsPedProne(this.handle); }
  isRagdoll(): boolean { return IsPedRagdoll(this.handle); }
  isReloading(): boolean { return IsPedReloading(this.handle); }
  isRunning(): boolean { return IsPedRunning(this.handle); }
  isRunningArrestTask(): boolean { return IsPedRunningArrestTask(this.handle); }
  isRunningMobilePhoneTask(): boolean { return IsPedRunningMobilePhoneTask(this.handle); }
  isRunningRagdollTask(): boolean { return IsPedRunningRagdollTask(this.handle); }
  isScriptedScenarioUsingConditionalAnim(animDict: string, anim: string): boolean { return IsScriptedScenarioPedUsingConditionalAnim(this.handle, animDict, anim); }
  isShooting(): boolean { return IsPedShooting(this.handle); }
  isShootingInArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, highlightArea: boolean, threeDCheck: boolean): boolean { return IsPedShootingInArea(this.handle, x1, y1, z1, x2, y2, z2, !!highlightArea, !!threeDCheck); }
  isSittingInAnyVehicle(): boolean { return IsPedSittingInAnyVehicle(this.handle); }
  isSittingInVehicle(vehicle: number): boolean { return IsPedSittingInVehicle(this.handle, vehicle); }
  isSprinting(): boolean { return IsPedSprinting(this.handle); }
  isStill(): boolean { return IsPedStill(this.handle); }
  isStopped(): boolean { return IsPedStopped(this.handle); }
  isStrafing(): boolean { return IsPedStrafing(this.handle); }
  isSwimming(): boolean { return IsPedSwimming(this.handle); }
  isSwimmingUnderWater(): boolean { return IsPedSwimmingUnderWater(this.handle); }
  isTracked(): boolean { return IsPedTracked(this.handle); }
  isTrackedVisible(): boolean { return IsTrackedPedVisible(this.handle); }
  isTryingToEnterALockedVehicle(): boolean { return IsPedTryingToEnterALockedVehicle(this.handle); }
  isUsingActionMode(): boolean { return IsPedUsingActionMode(this.handle); }
  isUsingAnyScenario(): boolean { return IsPedUsingAnyScenario(this.handle); }
  isUsingScenario(scenario: string): boolean { return IsPedUsingScenario(this.handle, scenario); }
  isVaulting(): boolean { return IsPedVaulting(this.handle); }
  isWalking(): boolean { return IsPedWalking(this.handle); }
  isWearingHelmet(): boolean { return IsPedWearingHelmet(this.handle); }
  wasKilledByStealth(): boolean { return WasPedKilledByStealth(this.handle); }
  wasKilledByTakedown(): boolean { return WasPedKilledByTakedown(this.handle); }
  wasSkeletonUpdated(): boolean { return WasPedSkeletonUpdated(this.handle); }

  applyBlood(boneIndex: number, xRot: number, yRot: number, zRot: number, woundType: string): void { ApplyPedBlood(this.handle, boneIndex, xRot, yRot, zRot, woundType); }
  applyBloodByZone(p1: any, p2: number, p3: number, p4: any): void { ApplyPedBloodByZone(this.handle, p1, p2, p3, p4); }
  applyBloodDamageByZone(p1: any, p2: number, p3: number, p4: any): void { ApplyPedBloodDamageByZone(this.handle, p1, p2, p3, p4); }
  applyBloodSpecific(p1: any, p2: number, p3: number, p4: number, p5: number, p6: any, p7: number, p8: any): void { ApplyPedBloodSpecific(this.handle, p1, p2, p3, p4, p5, p6, p7, p8); }
  applyDamageDecal(p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: boolean, p9: string): void { ApplyPedDamageDecal(this.handle, p1, p2, p3, p4, p5, p6, p7, !!p8, p9); }
  applyDamagePack(damagePack: string, damage: number, mult: number): void { ApplyPedDamagePack(this.handle, damagePack, damage, mult); }
  applyDamageTo(damageAmount: number, damageArmourFlag: boolean, instigatorHandle?: number): void { (ApplyDamageToPed as any)(this.handle, damageAmount, !!damageArmourFlag, instigatorHandle ?? 0, 0); }
  clearBloodDamage(): void { ClearPedBloodDamage(this.handle); }
  clearBloodDamageByZone(p1: number): void { ClearPedBloodDamageByZone(this.handle, p1); }
  clearDamageDecalByZone(zone: number, decalName: string): void { ClearPedDamageDecalByZone(this.handle, zone, decalName); }
  clearDecorations(): void { ClearPedDecorations(this.handle); }
  clearFacialDecorations(): void { ClearPedFacialDecorations(this.handle); }
  resetVisibleDamage(): void { ResetPedVisibleDamage(this.handle); }
  setDecoration(collection: number, overlay: number): void { AddPedDecorationFromHashes(this.handle, collection, overlay); }
  setFacialDecoration(collection: number, overlay: number): void { SetPedFacialDecoration(this.handle, collection, overlay); }

  clearAllProps(): void { ClearAllPedProps(this.handle); }
  clearProp(propId: number): void { ClearPedProp(this.handle, propId); }
  isPropValid(componentId: number, drawableId: number, textureId: number): boolean { return IsPedPropValid(this.handle, componentId, drawableId, textureId); }
  knockOffProp(damaged: boolean, hats: boolean, glasses: boolean, helmets: boolean): void { KnockOffPedProp(this.handle, !!damaged, !!hats, !!glasses, !!helmets); }
  setComponentVariation(componentId: number, drawableId: number, textureId: number, paletteId: number): void { setCompatibleComponentVariation(this.handle, componentId, drawableId, textureId, paletteId ?? 0); }
  setDefaultComponentVariation(): void { SetPedDefaultComponentVariation(this.handle); }
  setEyeColor(index: number): void { SetPedEyeColor(this.handle, index); }
  setFaceFeature(index: number, scale: number): void { SetPedFaceFeature(this.handle, index, scale); }
  setHairColor(colorID: number, highlightColorID: number): void { SetPedHairTint(this.handle, colorID, highlightColorID ?? 0); }
  setHeadOverlay(overlayID: number, index: number, opacity: number, firstColor: number, secondColor: number): void { SetPedHeadOverlay(this.handle, overlayID, index, opacity ?? 1.0); if (firstColor !== undefined) SetPedHeadOverlayColor(this.handle, overlayID, 1, firstColor, secondColor ?? 0); }
  setHeadOverlayColor(overlayID: number, colorType: number, colorID: number, secondColorID: number): void { SetPedHeadOverlayColor(this.handle, overlayID, colorType, colorID, secondColorID ?? 0); }
  setPropIndex(componentId: number, drawableId: number, TextureId: number, attach: boolean): void { setCompatiblePropIndex(this.handle, componentId, drawableId, TextureId, attach ?? true); }
  setRandomComponentVariation(p1: boolean): void { SetPedRandomComponentVariation(this.handle, (p1 ?? 0) as number); }
  setRandomProps(): void { SetPedRandomProps(this.handle); }
  setHeadBlendData(shapeFirst: number, shapeSecond: number, shapeThird: number, skinFirst: number, skinSecond: number, skinThird: number, shapeMix: number, skinMix: number, thirdMix: number, isParent: boolean): void {
    SetPedHeadBlendData(this.handle, shapeFirst, shapeSecond, shapeThird ?? 0, skinFirst, skinSecond, skinThird ?? 0, shapeMix, skinMix, thirdMix ?? 0, !!isParent);
  }
  updateHeadBlendData(shapeMix: number, skinMix: number, thirdMix: number): void { UpdatePedHeadBlendData(this.handle, shapeMix, skinMix, thirdMix); }

  giveHelmet(cannotRemove: boolean, helmetFlag: number, textureIndex: number): void { GivePedHelmet(this.handle, !!cannotRemove, helmetFlag, textureIndex); }
  removeHelmet(forceRemove: boolean): void { RemovePedHelmet(this.handle, forceRemove ?? true); }
  setHelmet(canWearHelmet: boolean): void { SetPedHelmet(this.handle, !!canWearHelmet); }
  setHelmetFlag(helmetFlag: number): void { SetPedHelmetFlag(this.handle, helmetFlag); }
  setHelmetPropIndex(propIndex: number): void { (SetPedHelmetPropIndex as any)(this.handle, propIndex, true); }
  setHelmetTextureIndex(textureIndex: number): void { SetPedHelmetTextureIndex(this.handle, textureIndex); }

  giveWeapon(weapon: number, ammo: number, equipNow: boolean): void { GiveWeaponToPed(this.handle, weapon, ammo, false, equipNow ?? true); }
  removeWeapon(weapon: number): void { RemoveWeaponFromPed(this.handle, weapon); }
  removeAllWeapons(): void { RemoveAllPedWeapons(this.handle, true); }
  setAmmoInClip(weapon: number, ammo: number): void { SetAmmoInClip(this.handle, weapon, ammo); }
  setFiringPattern(patternHash: number): void { SetPedFiringPattern(this.handle, patternHash); }
  setShootRate(shootRate: number): void { SetPedShootRate(this.handle, shootRate); }
  setShootsAtCoord(x: number, y: number, z: number, toggle: boolean): void { SetPedShootsAtCoord(this.handle, x, y, z, toggle ?? true); }
  setCanSwitchWeapon(toggle: boolean): void { SetPedCanSwitchWeapon(this.handle, !!toggle); }
  setEnableWeaponBlocking(toggle: boolean): void { SetPedEnableWeaponBlocking(this.handle, !!toggle); }
  stopWeaponFiringWhenDropped(): void { StopPedWeaponFiringWhenDropped(this.handle); }

  clone(_heading: number, isNetwork: boolean, bScriptHostPed: boolean): number { return ClonePed(this.handle, isNetwork ?? false, bScriptHostPed ?? false, true); }
  cloneToTarget(ped2: number): void { ClonePedToTarget(this.handle, ped2); }
  resurrect(): void { ResurrectPed(this.handle); }
  reviveInjured(): void { ReviveInjuredPed(this.handle); }

  setToRagdoll(time1: number, time2: number, ragdollType: number, p4: boolean, p5: boolean, p6: boolean): boolean { return SetPedToRagdoll(this.handle, time1, time2, ragdollType, p4 ?? true, p5 ?? true, !!p6); }
  setRagdollForceFall(): void { SetPedRagdollForceFall(this.handle); }
  setRagdollOnCollision(toggle: boolean): void { SetPedRagdollOnCollision(this.handle, !!toggle); }
  setCanRagdoll(toggle: boolean): void { SetPedCanRagdoll(this.handle, !!toggle); }
  setCanRagdollFromPlayerImpact(toggle: boolean): void { SetPedCanRagdollFromPlayerImpact(this.handle, !!toggle); }
  resetRagdollTimer(): void { ResetPedRagdollTimer(this.handle); }
  setRagdollFlag(flag: number): void { SetRagdollBlockingFlags(this.handle, flag); }
  setResetRagdollFlag(flag: number): void { ClearRagdollBlockingFlags(this.handle, flag); }

  forceToOpenParachute(): void { ForcePedToOpenParachute(this.handle); }
  setParachuteTaskTarget(x: number, y: number, z: number): void { SetParachuteTaskTarget(this.handle, x, y, z); }
  setParachuteTaskThrust(thrust: number): void { SetParachuteTaskThrust(this.handle, thrust); }
  setParachuteTintIndex(tintIndex: number): void { SetPedParachuteTintIndex(this.handle, tintIndex); }

  removeFromGroup(): void { RemovePedFromGroup(this.handle); }
  setAsGroupLeader(groupId: number): void { SetPedAsGroupLeader(this.handle, groupId); }
  setAsGroupMember(groupId: number): void { SetPedAsGroupMember(this.handle, groupId); }
  setGroupMemberPassengerIndex(index: number): void { SetPedGroupMemberPassengerIndex(this.handle, index); }
  setNeverLeavesGroup(toggle: boolean): void { SetPedNeverLeavesGroup(this.handle, !!toggle); }
  setCanTeleportToGroupLeader(groupHandle: number, toggle: boolean): void { SetPedCanTeleportToGroupLeader(this.handle, groupHandle, !!toggle); }
  setRelationshipGroupDefaultHash(hash: number): void { SetPedRelationshipGroupDefaultHash(this.handle, hash); }
  setRelationshipGroupHash(hash: number): void { SetPedRelationshipGroupHash(this.handle, hash); }

  registerHatedTargetsAround(radius: number): void { RegisterHatedTargetsAroundPed(this.handle, radius); }
  registerTarget(target: number): void { RegisterTarget(this.handle, target); }
  removeDefensiveArea(toggle: boolean): void { RemovePedDefensiveArea(this.handle, !!toggle); }
  removePreferredCoverSet(): void { RemovePedPreferredCoverSet(this.handle); }
  resetInVehicleContext(): void { ResetPedInVehicleContext(this.handle); }
  resetLastVehicle(): void { ResetPedLastVehicle(this.handle); }
  resetMovementClipset(blendDuration: number): void { ResetPedMovementClipset(this.handle, blendDuration ?? 0.0); }
  resetStrafeClipset(): void { ResetPedStrafeClipset(this.handle); }
  resetWeaponMovementClipset(): void { ResetPedWeaponMovementClipset(this.handle); }
  setAccuracy(accuracy: number): void { SetPedAccuracy(this.handle, accuracy); }
  setAlertness(value: number): void { SetPedAlertness(this.handle, value); }
  setAllowedToDuck(toggle: boolean): void { SetPedAllowedToDuck(this.handle, !!toggle); }
  setAllowVehiclesOverride(toggle: boolean): void { SetPedAllowVehiclesOverride(this.handle, !!toggle); }
  setAlternateMovementAnim(stance: number, animDictionary: string, animationName: string, p4: number, p5: boolean): void { SetPedAlternateMovementAnim(this.handle, stance, animDictionary, animationName, p4, !!p5); }
  clearAlternateMovementAnim(type: number, blendDelta: number): void { ClearPedAlternateMovementAnim(this.handle, type, blendDelta); }
  setAngledDefensiveArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, fWidth: number, useCenterAsGoToPosition: boolean, applyToSecondaryDefensiveArea: boolean): void { SetPedAngledDefensiveArea(this.handle, x1, y1, z1, x2, y2, z2, fWidth, !!useCenterAsGoToPosition, !!applyToSecondaryDefensiveArea); }
  setArmour(amount: number): void { SetPedArmour(this.handle, amount); }
  setAsCop(toggle: boolean): void { SetPedAsCop(this.handle, !!toggle); }
  setAsEnemy(toggle: boolean): void { SetPedAsEnemy(this.handle, !!toggle); }
  setBlendFromParents(firstPed: number, secondPed: number, blend: number, texBlend: number): void { SetPedBlendFromParents(this.handle, firstPed, secondPed, blend, texBlend); }
  setBlockingOfNonTemporaryEvents(toggle: boolean): void { SetBlockingOfNonTemporaryEvents(this.handle, !!toggle); }
  setBoundsOrientation(pitch: number, heading: number, x: number, y: number, z: number): void { SetPedBoundsOrientation(this.handle, pitch, heading, x, y, z); }
  setCanArmIk(toggle: boolean): void { SetPedCanArmIk(this.handle, !!toggle); }
  setCanAttackFriendly(toggle: boolean, lockOnState: boolean): void { SetCanAttackFriendly(this.handle, !!toggle, !!lockOnState); }
  setCanBeDraggedOut(toggle: boolean): void { SetPedCanBeDraggedOut(this.handle, !!toggle); }
  setCanBeKnockedOffVehicle(state: number): void { SetPedCanBeKnockedOffVehicle(this.handle, state); }
  setCanBeShotInVehicle(toggle: boolean): void { SetPedCanBeShotInVehicle(this.handle, !!toggle); }
  setCanBeTargetedWhenInjured(toggle: boolean): void { SetPedCanBeTargetedWhenInjured(this.handle, !!toggle); }
  setCanLosePropsOnDamage(enable: boolean, flag: number): void { SetPedCanLosePropsOnDamage(this.handle, !!enable, flag ?? 0); }
  setCanBeTargetted(toggle: boolean): void { SetPedCanBeTargetted(this.handle, !!toggle); }
  setCanBeTargettedByPlayer(player: number, toggle: boolean): void { SetPedCanBeTargettedByPlayer(this.handle, player, !!toggle); }
  setCanBeTargettedByTeam(team: number, toggle: boolean): void { SetPedCanBeTargettedByTeam(this.handle, team, !!toggle); }
  setCanCowerInCover(toggle: boolean): void { SetPedCanCowerInCover(this.handle, !!toggle); }
  setCanEvasiveDive(toggle: boolean): void { SetPedCanEvasiveDive(this.handle, !!toggle); }
  setCanHeadIk(toggle: boolean): void { SetPedCanHeadIk(this.handle, !!toggle); }
  setCanLegIk(toggle: boolean): void { SetPedCanLegIk(this.handle, !!toggle); }
  setCanPeekInCover(toggle: boolean): void { SetPedCanPeekInCover(this.handle, !!toggle); }
  setCanPlayAmbientAnims(toggle: boolean): void { SetPedCanPlayAmbientAnims(this.handle, !!toggle); }
  setCanPlayAmbientBaseAnims(toggle: boolean): void { SetPedCanPlayAmbientBaseAnims(this.handle, !!toggle); }
  setCanPlayGestureAnims(toggle: boolean): void { SetPedCanPlayGestureAnims(this.handle, !!toggle); }
  setCanPlayVisemeAnims(p1: boolean, p2: boolean): void { SetPedCanPlayVisemeAnims(this.handle, !!p1, !!p2); }
  setCanSmashGlass(glassRagdoll: boolean, glassWeapon: boolean): void { SetPedCanSmashGlass(this.handle, !!glassRagdoll, !!glassWeapon); }
  setCanTorsoIk(toggle: boolean): void { SetPedCanTorsoIk(this.handle, !!toggle); }
  setCanUseAutoConversationLookat(toggle: boolean): void { SetPedCanUseAutoConversationLookat(this.handle, !!toggle); }
  setCapsule(value: number): void { SetPedCapsule(this.handle, value); }
  setCombatAbility(p1: number): void { SetPedCombatAbility(this.handle, p1); }
  setCombatAttributes(attributeIndex: number, enabled: boolean): void { SetPedCombatAttributes(this.handle, attributeIndex, !!enabled); }
  setCombatFloat(combatType: number, attribute: number): void { SetCombatFloat(this.handle, combatType, attribute); }
  setCombatMovement(combatMovement: number): void { SetPedCombatMovement(this.handle, combatMovement); }
  setCombatRange(p1: number): void { SetPedCombatRange(this.handle, p1); }
  setConfigFlag(flagId: number, value: boolean): void { SetPedConfigFlag(this.handle, flagId, !!value); }
  setCoordsKeepVehicle(posX: number, posY: number, posZ: number): void { SetPedCoordsKeepVehicle(this.handle, posX, posY, posZ); }
  setCoordsNoGang(posX: number, posY: number, posZ: number): void { SetPedCoordsNoGang(this.handle, posX, posY, posZ); }
  setCowerHash(p1: string): void { SetPedCowerHash(this.handle, p1); }
  setDefensiveAreaDirection(p1: number, p2: number, p3: number, p4: boolean): void { SetPedDefensiveAreaDirection(this.handle, p1, p2, p3, !!p4); }
  setDefensiveSphereAttachedToPed(p1: any, p2: number, p3: number, p4: number, p5: number, p6: boolean): void { SetPedDefensiveSphereAttachedToPed(this.handle, p1, p2, p3, p4, p5, !!p6); }
  setDesiredHeading(heading: number): void { SetPedDesiredHeading(this.handle, heading); }
  setDesiredMoveBlendRatio(p1: number): void { SetPedDesiredMoveBlendRatio(this.handle, p1); }
  setDiesInSinkingVehicle(toggle: boolean): void { SetPedDiesInSinkingVehicle(this.handle, !!toggle); }
  setDiesInstantlyInWater(toggle: boolean): void { SetPedDiesInstantlyInWater(this.handle, !!toggle); }
  setDiesInVehicle(toggle: boolean): void { SetPedDiesInVehicle(this.handle, !!toggle); }
  setDiesInWater(toggle: boolean): void { SetPedDiesInWater(this.handle, !!toggle); }
  setDiesWhenInjured(toggle: boolean): void { SetPedDiesWhenInjured(this.handle, !!toggle); }
  setDriveByClipsetOverride(clipset: string): void { SetPedDriveByClipsetOverride(this.handle, clipset); }
  clearDriveByClipsetOverride(): void { ClearPedDriveByClipsetOverride(this.handle); }
  clearDrivebyTaskUnderneathDrivingTask(): void { ClearDrivebyTaskUnderneathDrivingTask(this.handle); }
  setDriverAbility(ability: number): void { SetDriverAbility(this.handle, ability); }
  setDriverAggressiveness(aggressiveness: number): void { SetDriverAggressiveness(this.handle, aggressiveness); }
  setDriveTaskCruiseSpeed(cruiseSpeed: number): void { SetDriveTaskCruiseSpeed(this.handle, cruiseSpeed); }
  setDriveTaskDrivingStyle(drivingStyle: number): void { SetDriveTaskDrivingStyle(this.handle, drivingStyle); }
  setDucking(toggle: boolean): void { SetPedDucking(this.handle, !!toggle); }
  setEnableBoundAnkles(toggle: boolean): void { SetEnableBoundAnkles(this.handle, !!toggle); }
  setEnableEnveffScale(toggle: boolean): void { SetEnablePedEnveffScale(this.handle, !!toggle); }
  setEnableHandcuffs(toggle: boolean): void { SetEnableHandcuffs(this.handle, !!toggle); }
  setEnableScuba(toggle: boolean): void { SetEnableScuba(this.handle, !!toggle); }
  setEnveffScale(value: number): void { SetPedEnveffScale(this.handle, value); }
  setExclusivePhoneRelationships(): number { return SetExclusivePhoneRelationships(this.handle); }
  setFacialIdleAnimOverride(animName: string, animDict: string): void { SetFacialIdleAnimOverride(this.handle, animName, animDict); }
  clearFacialIdleAnimOverride(): void { ClearFacialIdleAnimOverride(this.handle); }
  setFleeAttributes(attributes: number, p2: boolean): void { SetPedFleeAttributes(this.handle, attributes, !!p2); }
  getFloodInvincibility(p1: boolean): void { SetPedFloodInvincibility(this.handle, !!p1); }
  setGeneratesDeadBodyEvents(toggle: boolean): void { SetPedGeneratesDeadBodyEvents(this.handle, !!toggle); }
  setGestureGroup(p1: any): void { SetPedGestureGroup(this.handle, p1); }
  setGetOutUpsideDownVehicle(toggle: boolean): void { SetPedGetOutUpsideDownVehicle(this.handle, !!toggle); }
  setGravity(toggle: boolean): void { SetPedGravity(this.handle, !!toggle); }
  setHearingRange(value: number): void { SetPedHearingRange(this.handle, value); }
  setHighFallTask(p1: any, p2: any, p3: any): void { SetHighFallTask(this.handle, p1, p2, p3); }
  setIdRange(value: number): void { SetPedIdRange(this.handle, value); }
  setIntoVehicle(vehicle: number, seatIndex: number): void { SetPedIntoVehicle(this.handle, vehicle, seatIndex); }
  setInVehicleContext(context: number): void { SetPedInVehicleContext(this.handle, context); }
  setKeepTask(toggle: boolean): void { SetPedKeepTask(this.handle, !!toggle); }
  setLegIkMode(mode: number): void { SetPedLegIkMode(this.handle, mode); }
  setLodMultiplier(multiplier: number): void { SetPedLodMultiplier(this.handle, multiplier); }
  setMaxMoveBlendRatio(value: number): void { SetPedMaxMoveBlendRatio(this.handle, value); }
  setMaxTimeInWater(value: number): void { SetPedMaxTimeInWater(this.handle, value); }
  setMaxTimeUnderwater(value: number): void { SetPedMaxTimeUnderwater(this.handle, value); }
  setMinGroundTimeForStungun(ms: number): void { SetPedMinGroundTimeForStungun(this.handle, ms); }
  setMinMoveBlendRatio(value: number): void { SetPedMinMoveBlendRatio(this.handle, value); }
  setModelIsSuppressed(toggle: boolean): void { SetPedModelIsSuppressed(this.model, !!toggle); }
  setMoney(amount: number): void { SetPedMoney(this.handle, amount); }
  setMotionBlur(toggle: boolean): void { SetEntityMotionBlur(this.handle, !!toggle); }
  setMountedWeaponTarget(targetEntity: number, p2: any, x: number, y: number, z: number): void { (SetMountedWeaponTarget as any)(this.handle, targetEntity, p2, x, y, z, 0, false); }
  setMoveAnimsBlendOut(): void { SetPedMoveAnimsBlendOut(this.handle); }
  setMovementClipset(clipSet: string, p2: number): void { SetPedMovementClipset(this.handle, clipSet, p2 ?? 1.0); }
  setMoveRateOverride(value: number): void { SetPedMoveRateOverride(this.handle, value); }
  setNameDebug(name: string): void { SetPedNameDebug(this.handle, name); }
  setPathAvoidFire(avoidFire: boolean): void { SetPedPathAvoidFire(this.handle, !!avoidFire); }
  setPathCanDropFromHeight(Toggle: boolean): void { SetPedPathCanDropFromHeight(this.handle, !!Toggle); }
  setPathCanUseClimbovers(Toggle: boolean): void { SetPedPathCanUseClimbovers(this.handle, !!Toggle); }
  setPathCanUseLadders(Toggle: boolean): void { SetPedPathCanUseLadders(this.handle, !!Toggle); }
  setPathPreferToAvoidWater(avoidWater: boolean): void { SetPedPathPreferToAvoidWater(this.handle, !!avoidWater); }
  setPathsWidthPlant(mayEnterWater: boolean): void { SetPedPathsWidthPlant(this.handle, !!mayEnterWater); }
  setPinnedDown(pinned: boolean, i: number): void { SetPedPinnedDown(this.handle, !!pinned, i); }
  setPlaysHeadOnHornAnimWhenDiesInVehicle(toggle: boolean): void { SetPedPlaysHeadOnHornAnimWhenDiesInVehicle(this.handle, !!toggle); }
  setPreferredCoverSet(itemSet: any): void { SetPedPreferredCoverSet(this.handle, itemSet); }
  setPrimaryLookat(lookAt: number): void { SetPedPrimaryLookat(this.handle, lookAt); }
  setResetFlag(flagId: number, doReset: boolean): void { SetPedResetFlag(this.handle, flagId, !!doReset); }
  resetConfigFlag(flagId: number): void { SetPedResetFlag(this.handle, flagId, true); }
  setResetFlagPreferRearSeats(flags: number): void { SetPedResetFlagPreferRearSeats(this.handle, flags); }
  setScriptedAnimSeatOffset(p1: number): void { SetScriptedAnimSeatOffset(this.handle, p1); }
  setSeeingRange(value: number): void { SetPedSeeingRange(this.handle, value); }
  setSphereDefensiveArea(x: number, y: number, z: number, radius: number, p5: boolean, p6: boolean): void { SetPedSphereDefensiveArea(this.handle, x, y, z, radius, !!p5, !!p6); }
  setStayInVehicleWhenJacked(toggle: boolean): void { SetPedStayInVehicleWhenJacked(this.handle, !!toggle); }
  setStealthMovement(p1: boolean, action: string): void { SetPedStealthMovement(this.handle, !!p1, action); }
  setSteersAroundObjects(toggle: boolean): void { SetPedSteersAroundObjects(this.handle, !!toggle); }
  setSteersAroundPeds(toggle: boolean): void { SetPedSteersAroundPeds(this.handle, !!toggle); }
  setSteersAroundVehicles(toggle: boolean): void { SetPedSteersAroundVehicles(this.handle, !!toggle); }
  setStrafeClipset(clipSet: string): void { SetPedStrafeClipset(this.handle, clipSet); }
  setSuffersCriticalHits(toggle: boolean): void { SetPedSuffersCriticalHits(this.handle, !!toggle); }
  setSweat(sweat: number): void { SetPedSweat(this.handle, sweat); }
  setTargetLossResponse(responseType: number): void { SetPedTargetLossResponse(this.handle, responseType); }
  setTaskVehicleChaseBehaviorFlag(flag: number, set: boolean): void { SetTaskVehicleChaseBehaviorFlag(this.handle, flag, !!set); }
  setTaskVehicleChaseIdealPursuitDistance(distance: number): void { SetTaskVehicleChaseIdealPursuitDistance(this.handle, distance); }
  setToInformRespectedFriends(radius: number, maxFriends: number): void { SetPedToInformRespectedFriends(this.handle, radius, maxFriends); }
  setToLoadCover(toggle: boolean): void { SetPedToLoadCover(this.handle, !!toggle); }
  setUsingActionMode(p1: boolean, p2: any, action: string): void { SetPedUsingActionMode(this.handle, !!p1, p2, action); }
  setVisualFieldCenterAngle(angle: number): void { SetPedVisualFieldCenterAngle(this.handle, angle); }
  setVisualFieldMaxAngle(value: number): void { SetPedVisualFieldMaxAngle(this.handle, value); }
  setVisualFieldMaxElevationAngle(angle: number): void { SetPedVisualFieldMaxElevationAngle(this.handle, angle); }
  setVisualFieldMinAngle(value: number): void { SetPedVisualFieldMinAngle(this.handle, value); }
  setVisualFieldMinElevationAngle(angle: number): void { SetPedVisualFieldMinElevationAngle(this.handle, angle); }
  setVisualFieldPeripheralRange(range: number): void { SetPedVisualFieldPeripheralRange(this.handle, range); }
  setWeaponMovementClipset(clipSet: string): void { SetPedWeaponMovementClipset(this.handle, clipSet); }
  setWetnessEnabledThisFrame(): void { SetPedWetnessEnabledThisFrame(this.handle); }
  setWetnessHeight(height: number): void { SetPedWetnessHeight(this.handle, height); }
  clearWetness(): void { ClearPedWetness(this.handle); }

  giveNmMessage(): void { GivePedNmMessage(this.handle); }
  knockOffVehicle(): void { KnockPedOffVehicle(this.handle); }
  playAnimOnRunningScenario(animDict: string, animName: string): void { PlayAnimOnRunningScenario(this.handle, animDict, animName); }
  playFacialAnim(animName: string, animDict: string): void { PlayFacialAnim(this.handle, animName, animDict); }
  uncuff(): void { UncuffPed(this.handle); }
  clearLastDamageBone(): void { ClearPedLastDamageBone(this.handle); }
  registerheadshot(): number { return RegisterPedheadshot(this.handle); }
  unregisterheadshot(): void { UnregisterPedheadshot(this.handle); }
  stopAnimPlayback(p1: any, p2: boolean): void { StopAnimPlayback(this.handle, p1, !!p2); }
  stopAnimTask(animDictionary: string, animationName: string, p3: number): void { StopAnimTask(this.handle, animDictionary, animationName, p3); }

  clearTasks(): void { ClearPedTasks(this.handle); }
  clearTasksImmediately(): void { ClearPedTasksImmediately(this.handle); }
  taskPlayAnim(animDictionary: string, animationName: string, speed: number, speedMultiplier: number, duration: number, flag: number, playbackRate: number, lockX: boolean, lockY: boolean, lockZ: boolean): void {
    TaskPlayAnim(this.handle, animDictionary, animationName, speed ?? 8.0, speedMultiplier ?? -1, duration ?? -1, flag ?? 0, playbackRate ?? 0, !!lockX, !!lockY, !!lockZ);
  }
  taskAchieveHeading(heading: number, timeout: number): void { TaskAchieveHeading(this.handle, heading, timeout ?? 0); }
  taskAimGunAt(entity: number, duration: number, p3: boolean): void { TaskAimGunAtEntity(this.handle, entity, duration, !!p3); }
  taskAimGunAtCoord(x: number, y: number, z: number, time: number, p5: boolean, p6: boolean): void { TaskAimGunAtCoord(this.handle, x, y, z, time, !!p5, !!p6); }
  taskAimGunScripted(scriptTask: number, p2: boolean, p3: boolean): void { TaskAimGunScripted(this.handle, scriptTask, !!p2, !!p3); }
  taskArrest(target: number): void { TaskArrestPed(this.handle, target); }
  taskBoatMission(boat: number, p2: any, p3: any, x: number, y: number, z: number, p7: any, maxSpeed: number, p9: any, p10: number, p11: any): void { TaskBoatMission(this.handle, boat, p2, p3, x, y, z, p7, maxSpeed, p9, p10, p11); }
  taskChatTo(target: number, p2: any, p3: number, p4: number, p5: number, p6: number, p7: number): void { TaskChatToPed(this.handle, target, p2, p3, p4, p5, p6, p7); }
  taskClearLookAt(): void { TaskClearLookAt(this.handle); }
  taskClimb(unused: boolean): void { TaskClimb(this.handle, unused ?? true); }
  taskClimbLadder(p1: number): void { TaskClimbLadder(this.handle, p1); }
  taskCombat(targetPed: number, p2: number, p3: number): void { TaskCombatPed(this.handle, targetPed, p2 ?? 0, p3 ?? 16); }
  taskCombatHatedTargetsAround(radius: number, p2: number): void { TaskCombatHatedTargetsAroundPed(this.handle, radius, p2 ?? 0); }
  taskCombatHatedTargetsInArea(x: number, y: number, z: number, radius: number, p5: any): void { TaskCombatHatedTargetsInArea(this.handle, x, y, z, radius, p5 ?? 0); }
  taskCower(duration: number): void { TaskCower(this.handle, duration); }
  taskEnterVehicle(vehicle: number, timeout: number, seat: number, speed: number, p5: number, p6: any): void {
    const resolvedSeat = seat ?? -1;
    if (vehicle > 0 && resolvedSeat === -1) {
      this.pendingAnimatedDriverEntry = { vehicle, startedAt: Date.now() };
    } else if (vehicle <= 0) {
      this.pendingAnimatedDriverEntry = null;
    }
    try {
      (globalThis as any).vehicleEntryTraceLog?.("bridge.taskEnterVehicle", (globalThis as any).mp?.vehicles?.atHandle?.(vehicle), {
        bridgeVehicle: vehicle,
        timeout,
        seat: resolvedSeat,
        speed,
        flag: p5,
      });
    } catch (_) {}
    TaskEnterVehicle(this.handle, vehicle, timeout ?? -1, resolvedSeat, speed ?? 1.0, p5 ?? 1, p6);
  }
  taskFollowPointRoute(speed: number, unknown: number): void { TaskFollowPointRoute(this.handle, speed, unknown); }
  taskForceMotionState(state: number, p2: boolean): void { TaskForceMotionState(this.handle, state, !!p2); }
  taskGetOffBoat(boat: number): void { TaskGetOffBoat(this.handle, boat); }
  taskGotoAiming(target: number, distanceToStopAt: number, StartAimingDist: number): void { TaskGotoEntityAiming(this.handle, target, distanceToStopAt, StartAimingDist); }
  taskGoStraightToCoord(x: number, y: number, z: number, speed: number, timeout: number, targetHeading: number, distanceToSlide: number): void { TaskGoStraightToCoord(this.handle, x, y, z, speed, timeout, targetHeading, distanceToSlide); }
  taskGoToCoordAnyMeans(x: number, y: number, z: number, speed: number, p5: any, p6: boolean, walkingStyle: number, p8: number): void { TaskGoToCoordAnyMeans(this.handle, x, y, z, speed, p5 ?? 0, !!p6, walkingStyle ?? 786603, p8 ?? 0.0); }
  taskGuardCurrentPosition(p1: number, p2: number, p3: number): void { TaskGuardCurrentPosition(this.handle, p1, p2, !!p3); }
  taskHandsUp(duration: number, facingPed: number, p3: number, p4: boolean): void { TaskHandsUp(this.handle, duration, facingPed ?? 0, p3 ?? -1, !!p4); }
  taskHeliChase(entityToFollow: number, x: number, y: number, z: number): void { TaskHeliChase(this.handle, entityToFollow, x, y, z); }
  taskJump(unused: boolean, flag1: boolean, flag2: boolean): void { (TaskJump as any)(this.handle, unused ?? true, !!flag1, !!flag2); }
  taskLeaveAnyVehicle(p1: number, p2: number): void { TaskLeaveAnyVehicle(this.handle, p1 ?? 0, p2 ?? 0); }
  taskLeaveVehicle(vehicle: number, flags: number): void { TaskLeaveVehicle(this.handle, vehicle, flags ?? 0); }
  taskLookAt(lookAt: number, duration: number, unknown1: number, unknown2: number): void { TaskLookAtEntity(this.handle, lookAt, duration, unknown1 ?? 0, unknown2 ?? 2); }
  taskMoveNetwork(taskName: string, multiplier: number, p3: boolean, animDict: string, flags: number): void { TaskMoveNetworkByName(this.handle, taskName, multiplier ?? 0.0, p3 ?? true, animDict ?? "", flags ?? 0); }
  taskOpenVehicleDoor(vehicle: number, timeOut: number, doorIndex: number, speed: number): void { TaskOpenVehicleDoor(this.handle, vehicle, timeOut, doorIndex, speed ?? 1.0); }
  taskParachute(p1: boolean): void { (TaskParachute as any)(this.handle, p1 ?? true, false); }
  taskParachuteToTarget(x: number, y: number, z: number): void { TaskParachuteToTarget(this.handle, x, y, z); }
  taskPatrol(p1: string, p2: any, p3: boolean, p4: boolean): void { TaskPatrol(this.handle, p1, p2, !!p3, !!p4); }
  taskPause(ms: number): void { TaskPause(this.handle, ms); }
  taskPerformSequence(taskSequence: number): void { TaskPerformSequence(this.handle, taskSequence); }
  taskPlaneChase(entityToFollow: number, x: number, y: number, z: number): void { TaskPlaneChase(this.handle, entityToFollow, x, y, z); }
  taskPlantBomb(x: number, y: number, z: number, heading: number): void { TaskPlantBomb(this.handle, x, y, z, heading); }
  taskPlayPhoneGestureAnimation(p1: any, p2: any, p3: any, p4: number, p5: number, p6: boolean, p7: boolean): void { TaskPlayPhoneGestureAnimation(this.handle, p1, p2, p3, p4, p5, !!p6, !!p7); }
  taskPutDirectlyIntoMelee(meleeTarget: number, p2: number, p3: number, p4: number, p5: boolean): void { (TaskPutPedDirectlyIntoMelee as any)(this.handle, meleeTarget, p2 ?? 0.0, p3 ?? -1.0, p4 ?? 0.0, p5 ?? 0); }
  taskRappelFromHeli(p1: number): void { TaskRappelFromHeli(this.handle, p1); }
  taskReactAndFlee(fleeTarget: number): void { TaskReactAndFleePed(this.handle, fleeTarget); }
  taskReloadWeapon(doReload: boolean): void { TaskReloadWeapon(this.handle, doReload ?? true); }
  taskScriptedAnimation(lowData: number, midData: number, highData: number, blendIn: number, blendOut: number): void { (TaskScriptedAnimation as any)(this.handle, lowData, midData, highData, blendIn, blendOut); }
  taskSeekCoverFrom(target: number, duration: number, p3: boolean): void { TaskSeekCoverFromPed(this.handle, target, duration, !!p3); }
  taskSeekCoverToCoords(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, p7: any, p8: boolean): void { TaskSeekCoverToCoords(this.handle, x1, y1, z1, x2, y2, z2, p7 ?? -1, !!p8); }
  taskSetBlockingOfNonTemporaryEvents(toggle: boolean): void { TaskSetBlockingOfNonTemporaryEvents(this.handle, !!toggle); }
  taskSetDecisionMaker(p1: number): void { TaskSetDecisionMaker(this.handle, p1); }
  taskShockingEventReact(eventHandle: number): void { TaskShockingEventReact(this.handle, eventHandle); }
  taskShootAtCoord(x: number, y: number, z: number, duration: number, firingPattern: number): void { TaskShootAtCoord(this.handle, x, y, z, duration, firingPattern); }
  taskShuffleToNextVehicleSeat(vehicle: number): void { (TaskShuffleToNextVehicleSeat as any)(this.handle, vehicle, false); }
  taskSkyDive(): void { (TaskSkyDive as any)(this.handle, false); }
  taskSlideToCoord(x: number, y: number, z: number, heading: number, speed: number): void { TaskPedSlideToCoord(this.handle, x, y, z, heading, speed); }
  taskSlideToCoordHdgRate(x: number, y: number, z: number, heading: number, speed: number, headingChangeRate: number): void { TaskPedSlideToCoordHdgRate(this.handle, x, y, z, heading, speed, headingChangeRate); }
  taskSmartFlee(fleeTarget: number, distance: number, fleeTime: any, preferPavements: boolean, updateToNearestHatedPed: boolean): void { TaskSmartFleePed(this.handle, fleeTarget, distance, fleeTime, !!preferPavements, !!updateToNearestHatedPed); }
  taskSmartFleeCoord(x: number, y: number, z: number, distance: number, time: number, preferPavements: boolean, quitIfOutOfRange: boolean): void { TaskSmartFleeCoord(this.handle, x, y, z, distance, time, !!preferPavements, !!quitIfOutOfRange); }
  taskStandGuard(x: number, y: number, z: number, heading: number, scenarioName: string): void { TaskStandGuard(this.handle, x, y, z, heading, scenarioName); }
  taskStandStill(time: number): void { TaskStandStill(this.handle, time); }
  taskStartScenarioInPlace(scenarioName: string, unkDelay: number, playEnterAnim: boolean): void { TaskStartScenarioInPlace(this.handle, scenarioName, unkDelay ?? 0, !!playEnterAnim); }
  taskStayInCover(): void { TaskStayInCover(this.handle); }
  taskStealthKill(target: number, killType: number, p3: number, p4: boolean): void { (TaskStealthKill as any)(this.handle, target, killType, p3 ?? 1.0, p4 ?? 0); }
  taskStopPhoneGestureAnimation(): void { (TaskStopPhoneGestureAnimation as any)(this.handle, 0.0); }
  taskSwapWeapon(p1: boolean): void { TaskSwapWeapon(this.handle, !!p1); }
  taskSweepAim(anim: string, p2: string, p3: string, p4: string, p5: number, vehicle: number, p7: number, p8: number): void { TaskSweepAimEntity(this.handle, anim, p2, p3, p4, p5, vehicle, p7, p8); }
  taskTurnToFace(entity: number, duration: number): void { TaskTurnPedToFaceEntity(this.handle, entity, duration); }
  taskTurnToFaceCoord(x: number, y: number, z: number, duration: number): void { TaskTurnPedToFaceCoord(this.handle, x, y, z, duration); }
  taskUseMobilePhone(p1: number): void { (TaskUseMobilePhone as any)(this.handle, !!p1, -1); }
  taskUseMobilePhoneTimed(duration: number): void { TaskUseMobilePhoneTimed(this.handle, duration); }
  taskUseNearestScenarioToCoordWarp(x: number, y: number, z: number, radius: number, p5: any): void { TaskUseNearestScenarioToCoordWarp(this.handle, x, y, z, radius, p5 ?? -1); }
  taskVehicleAimAt(target: number): void { TaskVehicleAimAtPed(this.handle, target); }
  taskVehicleChase(targetEnt: number): void { TaskVehicleChase(this.handle, targetEnt); }
  taskVehicleDriveToCoordLongrange(vehicle: number, x: number, y: number, z: number, speed: number, driveMode: number, stopRange: number): void { TaskVehicleDriveToCoordLongrange(this.handle, vehicle, x, y, z, speed, driveMode, stopRange); }
  taskVehicleDriveWander(vehicle: number, speed: number, drivingStyle: number): void { TaskVehicleDriveWander(this.handle, vehicle, speed, drivingStyle); }
  taskVehicleFollow(vehicle: number, targetEntity: number, drivingStyle: number, speed: number, minDistance: number): void { TaskVehicleFollow(this.handle, vehicle, targetEntity, speed, drivingStyle, minDistance); }
  taskVehicleGotoNavmesh(vehicle: number, x: number, y: number, z: number, speed: number, behaviorFlag: number, stoppingRange: number): void { TaskVehicleGotoNavmesh(this.handle, vehicle, x, y, z, speed, behaviorFlag, stoppingRange); }
  taskVehiclePark(vehicle: number, x: number, y: number, z: number, heading: number, mode: number, radius: number, keepEngineOn: boolean): void { TaskVehiclePark(this.handle, vehicle, x, y, z, heading, mode, radius, !!keepEngineOn); }
  taskVehicleTempAction(vehicle: number, action: number, time: number): void { TaskVehicleTempAction(this.handle, vehicle, action, time); }
  taskWanderInArea(x: number, y: number, z: number, radius: number, minimalLength: number, timeBetweenWalks: number): void { TaskWanderInArea(this.handle, x, y, z, radius, minimalLength, timeBetweenWalks); }
  taskWanderStandard(p1: number, p2: number): void { TaskWanderStandard(this.handle, p1 ?? 10.0, p2 ?? 10); }
  taskWarpIntoVehicle(vehicle: number, seat: number): void {
    const pending = this.pendingAnimatedDriverEntry;
    if (
      seat === -1 &&
      pending?.vehicle === vehicle &&
      Date.now() - pending.startedAt < 5000 &&
      !IsPedInVehicle(this.handle, vehicle, false) &&
      GetIsTaskActive(this.handle, 160)
    ) {
      // Older generated Neptune bundles used a 1.6 second emergency warp.
      // That fires while GTA is still walking to/opening the door and removes
      // the normal entry animation. Leave the active task intact instead.
      console.log(`[ragemp-bridge] suppressed premature driver warp vehicle=${vehicle}`);
      try {
        (globalThis as any).vehicleEntryTraceLog?.("bridge.warpSuppressed", (globalThis as any).mp?.vehicles?.atHandle?.(vehicle), {
          bridgeVehicle: vehicle,
          seat,
          pendingAgeMs: Date.now() - pending.startedAt,
        });
      } catch (_) {}
      return;
    }
    try {
      (globalThis as any).vehicleEntryTraceLog?.("bridge.warpExecuted", (globalThis as any).mp?.vehicles?.atHandle?.(vehicle), {
        bridgeVehicle: vehicle,
        seat,
        pendingAgeMs: pending ? Date.now() - pending.startedAt : null,
      });
    } catch (_) {}
    this.pendingAnimatedDriverEntry = null;
    TaskWarpPedIntoVehicle(this.handle, vehicle, seat);
  }
  taskWrithe(target: number, time: number, p3: number): void { (TaskWrithe as any)(this.handle, target, time, p3 ?? 0, false, 0); }
  updateTaskAimGunScriptedTarget(p1: number, p2: number, p3: number, p4: number, p5: boolean): void { UpdateTaskAimGunScriptedTarget(this.handle, p1, p2, p3, p4, !!p5); }
  updateTaskHandsUpDuration(duration: number): void { UpdateTaskHandsUpDuration(this.handle, duration); }
}
