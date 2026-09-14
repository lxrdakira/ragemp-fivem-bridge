import { createUnkProxy, toVec3, _pollUntilLoaded } from "./_helpers.js";
import { Vector3 } from "@ragemp-fivem-bridge/shared";
import { setCompatibleComponentVariation, setCompatiblePropIndex } from "../utils/clothingCompatibility";

export class GamePedNs {
  unk = createUnkProxy();

  create(modelHash: number, x: number, y: number, z: number, heading: number): number {
    return CreatePed(4, modelHash, x, y, z, heading, true, false);
  }
  delete(ped: number): void { DeletePed(ped); }
  clone(ped: number): number { return ClonePed(ped, false, true, true); }
  cloneToTarget(ped: number, targetPed: number): void { ClonePedToTarget(ped, targetPed); }
  createInsideVehicle(vehicle: number, seatIndex: number, modelHash: number): number {
    return CreatePedInsideVehicle(vehicle, 4, modelHash, seatIndex, true, false);
  }

  isInVehicle(ped: number, vehicle: number): boolean { return IsPedInVehicle(ped, vehicle ?? 0, false); }
  isInAnyVehicle(ped: number): boolean { return IsPedInAnyVehicle(ped, false); }
  isInModel(ped: number, modelHash: number): boolean {
    if (!IsPedInAnyVehicle(ped, false)) return false;
    const veh = GetVehiclePedIsIn(ped, false);
    return veh !== 0 && GetEntityModel(veh) === modelHash;
  }
  isInjured(ped: number): boolean { return IsPedInjured(ped); }
  isHurt(ped: number): boolean { return IsPedHurt(ped); }
  isFatallyInjured(ped: number): boolean { return IsPedFatallyInjured(ped); }
  isDeadOrDying(ped: number, p1: boolean): boolean { return IsPedDeadOrDying(ped, p1); }
  isAimingFromCover(ped: number): boolean { return IsPedAimingFromCover(ped); }
  isReloading(ped: number): boolean { return IsPedReloading(ped); }
  isAPlayer(ped: number): boolean { return IsPedAPlayer(ped); }
  isCopInArea3D(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): boolean { return IsCopPedInArea_3d(x1, y1, z1, x2, y2, z2); }
  isCopPedInArea3d(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): boolean { return IsCopPedInArea_3d(x1, y1, z1, x2, y2, z2); }
  isInMeleeCombat(ped: number): boolean { return IsPedInMeleeCombat(ped); }
  isStopped(ped: number): boolean { return IsPedStopped(ped); }
  isShootingInArea(ped: number, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, p7: boolean, p8: boolean): boolean { return IsPedShootingInArea(ped, x1, y1, z1, x2, y2, z2, p7, p8); }
  isAnyShootingInArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, p6: boolean, p7: boolean): boolean { return IsAnyPedShootingInArea(x1, y1, z1, x2, y2, z2, p6, p7); }
  isAnyPedShootingInArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, p6: boolean, p7: boolean): boolean { return IsAnyPedShootingInArea(x1, y1, z1, x2, y2, z2, p6, p7); }
  isShooting(ped: number): boolean { return IsPedShooting(ped); }
  isFacingPed(ped: number, otherPed: number, angle: number): boolean { return IsPedFacingPed(ped, otherPed, angle); }
  isModel(ped: number, modelHash: number): boolean { return IsPedModel(ped, modelHash); }
  isMale(ped: number): boolean { return IsPedMale(ped); }
  isHuman(ped: number): boolean { return IsPedHuman(ped); }
  isOnFoot(ped: number): boolean { return IsPedOnFoot(ped); }
  isOnMount(ped: number): boolean { return IsPedOnMount(ped); }
  isOnVehicle(ped: number): boolean { return IsPedOnVehicle(ped); }
  isOnSpecificVehicle(ped: number, vehicle: number): boolean { return IsPedOnSpecificVehicle(ped, vehicle); }
  isOnAnyBike(ped: number): boolean { return IsPedOnAnyBike(ped); }
  isPlantingBomb(ped: number): boolean { return IsPedPlantingBomb(ped); }
  isInAnyBoat(ped: number): boolean { return IsPedInAnyBoat(ped); }
  isInAnySub(ped: number): boolean { return IsPedInAnySub(ped); }
  isInAnyHeli(ped: number): boolean { return IsPedInAnyHeli(ped); }
  isInAnyPlane(ped: number): boolean { return IsPedInAnyPlane(ped); }
  isInFlyingVehicle(ped: number): boolean { return IsPedInFlyingVehicle(ped); }
  isInAnyTaxi(ped: number): boolean { return IsPedInAnyTaxi(ped); }
  isInAnyTrain(ped: number): boolean { return IsPedInAnyTrain(ped); }
  isInAnyPoliceVehicle(ped: number): boolean { return IsPedInAnyPoliceVehicle(ped); }
  isSittingInVehicle(ped: number, vehicle: number): boolean { return IsPedSittingInVehicle(ped, vehicle); }
  isSittingInAnyVehicle(ped: number): boolean { return IsPedSittingInAnyVehicle(ped); }
  isGettingIntoAVehicle(ped: number): boolean { return IsPedGettingIntoAVehicle(ped); }
  isTryingToEnterALockedVehicle(ped: number): boolean { return IsPedTryingToEnterALockedVehicle(ped); }
  isHangingOnToVehicle(ped: number): boolean { return IsPedHangingOnToVehicle(ped); }
  isJumpingOutOfVehicle(ped: number): boolean { return IsPedJumpingOutOfVehicle(ped); }
  isSwimming(ped: number): boolean { return IsPedSwimming(ped); }
  isSwimmingUnderWater(ped: number): boolean { return IsPedSwimmingUnderWater(ped); }
  isFalling(ped: number): boolean { return IsPedFalling(ped); }
  isJumping(ped: number): boolean { return IsPedJumping(ped); }
  isClimbing(ped: number): boolean { return IsPedClimbing(ped); }
  isVaulting(ped: number): boolean { return IsPedVaulting(ped); }
  isDiving(ped: number): boolean { return IsPedDiving(ped); }
  isInParachuteFreeFall(ped: number): boolean { return IsPedInParachuteFreeFall(ped); }
  isDucking(ped: number): boolean { return IsPedDucking(ped); }
  isProne(ped: number): boolean { return IsPedProne(ped); }
  isInCombat(ped: number, target: number): boolean { return IsPedInCombat(ped, target); }
  canInCombatSeeTarget(ped: number, target: number): boolean { return CanPedInCombatSeeTarget(ped, target); }
  isDoingDriveby(ped: number): boolean { return IsPedDoingDriveby(ped); }
  isJacking(ped: number): boolean { return IsPedJacking(ped); }
  isBeingJacked(ped: number): boolean { return IsPedBeingJacked(ped); }
  isBeingStunned(ped: number, p1: number): boolean { return IsPedBeingStunned(ped, p1); }
  isFleeing(ped: number): boolean { return IsPedFleeing(ped); }
  isInCover(ped: number, exceptUseWeapon: boolean): boolean { return IsPedInCover(ped, exceptUseWeapon); }
  isInCoverFacingLeft(ped: number): boolean { return IsPedInCoverFacingLeft(ped); }
  isInHighCover(ped: number): boolean { return IsPedInHighCover(ped); }
  isGoingIntoCover(ped: number): boolean { return IsPedGoingIntoCover(ped); }
  isEvasiveDiving(ped: number): number { const r = IsPedEvasiveDiving(ped); return Array.isArray(r) ? r[0] as any : r as any; }
  isHeadingTowardsPosition(ped: number, x: number, y: number, z: number, p4: number): boolean { return IsPedHeadingTowardsPosition(ped, x, y, z, p4); }
  isTracked(ped: number): boolean { return IsPedTracked(ped); }
  isUsingScenario(ped: number, scenario: string): boolean { return IsPedUsingScenario(ped, scenario); }
  isUsingAnyScenario(ped: number): boolean { return IsPedUsingAnyScenario(ped); }
  isPerformingMeleeAction(ped: number): boolean { return IsPedPerformingMeleeAction(ped); }
  isPerformingStealthKill(ped: number): boolean { return IsPedPerformingStealthKill(ped); }
  isBeingStealthKilled(ped: number): boolean { return IsPedBeingStealthKilled(ped); }
  isRunningMeleeTask(ped: number): boolean { return IsPedRunningMeleeTask(ped); }
  isRunningMobilePhoneTask(ped: number): boolean { return IsPedRunningMobilePhoneTask(ped); }
  isRunningRagdollTask(ped: number): boolean { return IsPedRunningRagdollTask(ped); }
  isHeadtrackingPed(ped1: number, ped2: number): boolean { return IsPedHeadtrackingPed(ped1, ped2); }
  isHeadtrackingEntity(ped: number, entity: number): boolean { return IsPedHeadtrackingEntity(ped, entity); }
  isUsingActionMode(ped: number): boolean { return IsPedUsingActionMode(ped); }
  isAnyNearPoint(x: number, y: number, z: number, radius: number): boolean { return IsAnyPedNearPoint(x, y, z, radius); }
  isAnyPedNearPoint(x: number, y: number, z: number, radius: number): boolean { return IsAnyPedNearPoint(x, y, z, radius); }
  isRespondingToEvent(ped: number, event: number): boolean { return IsPedRespondingToEvent(ped, event); }
  hasReceivedEvent(ped: number, eventId: number): boolean { return HasPedReceivedEvent(ped, eventId); }
  canSeeHatedPed(ped1: number, ped2: number): boolean { return CanPedSeeHatedPed(ped1, ped2); }

  setAccuracy(ped: number, accuracy: number): void { SetPedAccuracy(ped, accuracy); }
  getAccuracy(ped: number): number { return GetPedAccuracy(ped); }
  setFiringPattern(ped: number, pattern: number): void { SetPedFiringPattern(ped, pattern); }
  setShootRate(ped: number, rate: number): void { SetPedShootRate(ped, rate); }
  setShootsAtCoord(ped: number, x: number, y: number, z: number, toggle: boolean): void { SetPedShootsAtCoord(ped, x, y, z, toggle); }
  setCombatFloat(ped: number, combatType: number, p2: number): void { SetCombatFloat(ped, combatType, p2); }
  getCombatFloat(ped: number, p1: number): number { return GetCombatFloat(ped, p1); }
  setCombatMovement(ped: number, combatMovement: number): void { SetPedCombatMovement(ped, combatMovement); }
  getCombatMovement(ped: number): number { return GetPedCombatMovement(ped); }
  getCombatRange(ped: number): number { return GetPedCombatRange(ped); }
  explodeHead(ped: number, explosionTag: number): void { ExplodePedHead(ped, explosionTag); }
  applyDamageTo(ped: number, damageAmount: number): void { ApplyDamageToPed(ped, damageAmount, false); }
  addArmourTo(ped: number, amount: number): void { AddArmourToPed(ped, amount); }
  setArmour(ped: number, amount: number): void { SetPedArmour(ped, amount); }
  getArmour(ped: number): number { return GetPedArmour(ped); }
  setSuffersCriticalHits(ped: number, toggle: boolean): void { SetPedSuffersCriticalHits(ped, toggle); }
  getLastDamageBone(ped: number): number { const r = GetPedLastDamageBone(ped); return Array.isArray(r) ? r[1] : r; }
  clearLastDamageBone(ped: number): void { ClearPedLastDamageBone(ped); }
  setAiWeaponDamageModifier(value: number): void { SetAiWeaponDamageModifier(value); }
  resetAiWeaponDamageModifier(): void { ResetAiWeaponDamageModifier(); }
  setAiMeleeWeaponDamageModifier(modifier: number): void { SetAiMeleeWeaponDamageModifier(modifier); }
  resetAiMeleeWeaponDamageModifier(): void { ResetAiMeleeWeaponDamageModifier(); }
  getSourceOfDeath(ped: number): number { return GetPedSourceOfDeath(ped); }
  getCauseOfDeath(ped: number): number { return GetPedCauseOfDeath(ped); }
  getTimeOfDeath(ped: number): number { return GetPedTimeOfDeath(ped); }
  registerTarget(ped: number, target: number): void { RegisterTarget(ped, target); }
  registerHatedTargetsAround(ped: number, radius: number): void { RegisterHatedTargetsAroundPed(ped, radius); }

  setCanBeTargetted(ped: number, toggle: boolean): void { SetPedCanBeTargetted(ped, toggle); }
  setCanBeTargettedByTeam(ped: number, team: number, toggle: boolean): void { SetPedCanBeTargettedByTeam(ped, team, toggle); }
  setCanBeTargettedByPlayer(ped: number, player: number, toggle: boolean): void { SetPedCanBeTargettedByPlayer(ped, player, toggle); }
  setCanBeTargetedWithoutLos(ped: number, toggle: boolean): void { SetEntityCanBeTargetedWithoutLos(ped, toggle); }
  setCanBeTargetedWhenInjured(ped: number, toggle: boolean): void { SetPedCanBeTargetedWhenInjured(ped, toggle); }
  setCanBeDraggedOut(ped: number, toggle: boolean): void { SetPedCanBeDraggedOut(ped, toggle); }

  setComponentVariation(ped: number, componentId: number, drawableId: number, textureId: number, paletteId: number): void {
    setCompatibleComponentVariation(ped, componentId, drawableId, textureId, paletteId);
  }
  getDrawableVariation(ped: number, componentId: number): number { return GetPedDrawableVariation(ped, componentId); }
  getTextureVariation(ped: number, componentId: number): number { return GetPedTextureVariation(ped, componentId); }
  getPaletteVariation(ped: number, componentId: number): number { return GetPedPaletteVariation(ped, componentId); }
  isComponentVariationValid(ped: number, componentId: number, drawableId: number, textureId: number): boolean { return IsPedComponentVariationValid(ped, componentId, drawableId, textureId); }
  setRandomComponentVariation(ped: number, p1: number): void { SetPedRandomComponentVariation(ped, p1); }
  setRandomProps(ped: number): void { SetPedRandomProps(ped); }
  setDefaultComponentVariation(ped: number): void { SetPedDefaultComponentVariation(ped); }
  setBlendFromParents(ped: number, p1: number, p2: number, p3: number, p4: number): void { SetPedBlendFromParents(ped, p1, p2, p3, p4); }
  getNumberOfDrawableVariations(ped: number, componentId: number): number { return GetNumberOfPedDrawableVariations(ped, componentId); }
  getNumberOfTextureVariations(ped: number, componentId: number, drawableId: number): number { return GetNumberOfPedTextureVariations(ped, componentId, drawableId); }
  getNumberOfPropDrawableVariations(ped: number, propId: number): number { return GetNumberOfPedPropDrawableVariations(ped, propId); }
  getNumberOfPropTextureVariations(ped: number, propId: number, drawableId: number): number { return GetNumberOfPedPropTextureVariations(ped, propId, drawableId); }

  setHeadBlendData(ped: number, shape: number, skin: number, thirdId: number, shapeMix: number, skinMix: number, thirdMix: number, isParent: boolean): void {
    SetPedHeadBlendData(ped, shape, skin, thirdId ?? 0, shape, skin, thirdId ?? 0, shapeMix ?? 0, skinMix ?? 0, thirdMix ?? 0, isParent ?? false);
  }
  updateHeadBlendData(ped: number, shapeMix: number, skinMix: number, thirdMix: number): void { UpdatePedHeadBlendData(ped, shapeMix, skinMix, thirdMix); }
  hasHeadBlendFinished(ped: number): boolean { return HasPedHeadBlendFinished(ped); }
  finalizeHeadBlend(ped: number): void { FinalizeHeadBlend(ped); }
  setHeadBlendPaletteColor(ped: number, r: number, g: number, b: number, id: number): void { SetHeadBlendPaletteColor(ped, r, g, b, id); }
  disableHeadBlendPaletteColor(ped: number): void { DisableHeadBlendPaletteColor(ped); }
  getHeadBlendFirstIndex(type: number): number { return GetPedHeadBlendFirstIndex(type); }
  getHeadBlendNumHeads(headType: number): number { return GetPedHeadBlendNumHeads(headType); }
  setHairColor(ped: number, colorID: number, highlightColorID: number): void { SetPedHairColor(ped, colorID, highlightColorID); }
  setHeadOverlay(ped: number, overlayID: number, index: number, opacity: number): void { SetPedHeadOverlay(ped, overlayID, index, opacity); }
  getHeadOverlayNum(overlayID: number): number { return GetPedHeadOverlayNum(overlayID); }
  setHeadOverlayColor(ped: number, overlayID: number, colorType: number, colorId: number, secondColorId: number): void {
    SetPedHeadOverlayColor(ped, overlayID, colorType, colorId, secondColorId);
  }
  setEyeColor(ped: number, index: number): void { SetPedEyeColor(ped, index); }
  setFaceFeature(ped: number, index: number, scale: number): void { SetPedFaceFeature(ped, index, scale); }
  setSweat(ped: number, sweat: number): void { SetPedSweat(ped, sweat); }

  clearDecorations(ped: number): void { ClearPedDecorations(ped); }
  clearDecorationsLeaveScars(ped: number): void { ClearPedDecorationsLeaveScars(ped); }
  addDecorationFromHashes(ped: number, collection: number, overlay: number): void { AddPedDecorationFromHashes(ped, collection, overlay); }
  addDecorationFromHashesInCorona(ped: number, collection: number, overlay: number): void { AddPedDecorationFromHashesInCorona(ped, collection, overlay); }
  getDecorationZoneFromHashes(collection: number, overlay: number): number { return GetPedDecorationZoneFromHashes(collection, overlay); }
  getDecorationsState(ped: number): number { return GetPedDecorationsState(ped); }

  resetVisibleDamage(ped: number): void { ResetPedVisibleDamage(ped); }
  applyBloodDamageByZone(ped: number, p1: number, p2: number, p3: number, p4: number): void { ApplyPedBloodDamageByZone(ped, p1, p2, p3, p4); }
  applyBlood(ped: number, boneIndex: number, xRot: number, yRot: number, zRot: number, woundType: string): void { ApplyPedBlood(ped, boneIndex, xRot, yRot, zRot, woundType); }
  applyBloodByZone(ped: number, p1: number, p2: number, p3: number, p4: number): void { ApplyPedBloodByZone(ped, p1, p2, p3, p4); }
  applyBloodSpecific(ped: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number): void { (ApplyPedBloodSpecific as any)(ped, p1, p2, p3, p4, p5, p6, p7, p8); }
  applyDamagePack(ped: number, damagePack: string, damage: number, mult: number): void { ApplyPedDamagePack(ped, damagePack, damage, mult); }
  clearBloodDamage(ped: number): void { ClearPedBloodDamage(ped); }
  clearBloodDamageByZone(ped: number, p1: number): void { ClearPedBloodDamageByZone(ped, p1); }
  hideBloodDamageByZone(ped: number, p1: number, p2: boolean): void { HidePedBloodDamageByZone(ped, p1, p2); }
  clearDamageDecalByZone(ped: number, p1: number, p2: string): void { ClearPedDamageDecalByZone(ped, p1, p2); }
  clearWetness(ped: number): void { ClearPedWetness(ped); }
  setWetnessHeight(ped: number, height: number): void { SetPedWetnessHeight(ped, height); }
  setWetnessEnabledThisFrame(ped: number): void { SetPedWetnessEnabledThisFrame(ped); }
  clearEnvDirt(ped: number): void { ClearPedEnvDirt(ped); }

  clearParachutePackVariation(ped: number): void { ClearPedParachutePackVariation(ped); }
  setScubaGearVariation(ped: number): void { SetPedScubaGearVariation(ped); }
  clearScubaGearVariation(ped: number): void { ClearPedScubaGearVariation(ped); }

  setPreloadVariationData(ped: number, slot: number, drawableId: number, textureId: number): number { return SetPedPreloadVariationData(ped, slot, drawableId, textureId); }
  hasPreloadVariationDataFinished(ped: number): boolean { return HasPedPreloadVariationDataFinished(ped); }
  releasePreloadVariationData(ped: number): void { ReleasePedPreloadVariationData(ped); }
  setPreloadPropData(ped: number, componentId: number, drawableId: number, TextureId: number): boolean { return SetPedPreloadPropData(ped, componentId, drawableId, TextureId); }
  hasPreloadPropDataFinished(ped: number): boolean { return HasPedPreloadPropDataFinished(ped); }
  releasePreloadPropData(ped: number): void { ReleasePedPreloadPropData(ped); }

  getPropIndex(ped: number, componentId: number): number { return GetPedPropIndex(ped, componentId); }
  setPropIndex(ped: number, componentId: number, drawableId: number, TextureId: number, attach: boolean): void { setCompatiblePropIndex(ped, componentId, drawableId, TextureId, attach); }
  clearProp(ped: number, propId: number): void { ClearPedProp(ped, propId); }
  dropAmbientProp(ped: number): void { DropAmbientProp(ped); }
  getPropTextureIndex(ped: number, componentId: number): number { return GetPedPropTextureIndex(ped, componentId); }

  setAlternateWalkAnim(ped: number, animDict: string, animName: string): void { SetPedAlternateWalkAnim(ped, animDict, animName, 1.0, false); }
  clearAlternateWalkAnim(ped: number, p1: number): void { ClearPedAlternateWalkAnim(ped, p1); }
  setAlternateMovementAnim(ped: number, stance: number, animDictionary: string, animationName: string, p4: number, p5: boolean): void { SetPedAlternateMovementAnim(ped, stance, animDictionary, animationName, p4, p5); }
  clearAlternateMovementAnim(ped: number, stance: number, p2: number): void { ClearPedAlternateMovementAnim(ped, stance, p2); }
  setGestureGroup(ped: number, animGroupGesture: string): void { SetPedGestureGroup(ped, animGroupGesture); }
  setMovementClipset(ped: number, clipset: string): void { SetPedMovementClipset(ped, clipset, 1.0); }
  resetMovementClipset(ped: number): void { ResetPedMovementClipset(ped, false as any); }
  setStrafeClipset(ped: number, clipSet: string): void { SetPedStrafeClipset(ped, clipSet); }
  resetStrafeClipset(ped: number): void { ResetPedStrafeClipset(ped); }
  setWeaponMovementClipset(ped: number, clipset: string): void { SetPedWeaponMovementClipset(ped, clipset); }
  resetWeaponMovementClipset(ped: number): void { ResetPedWeaponMovementClipset(ped); }
  setDriveByClipsetOverride(ped: number, clipset: string): void { SetPedDriveByClipsetOverride(ped, clipset); }
  clearDriveByClipsetOverride(ped: number): void { ClearPedDriveByClipsetOverride(ped); }
  setInVehicleContext(ped: number, context: number): void { SetPedInVehicleContext(ped, context); }
  resetInVehicleContext(ped: number): void { ResetPedInVehicleContext(ped); }
  playFacialAnim(ped: number, animName: string, animDict: string): void { PlayFacialAnim(ped, animName, animDict); }
  setFacialIdleAnimOverride(ped: number, animName: string, animDict: string): void { SetFacialIdleAnimOverride(ped, animName, animDict); }
  clearFacialIdleAnimOverride(ped: number): void { ClearFacialIdleAnimOverride(ped); }
  setCanPlayGestureAnims(ped: number, toggle: boolean): void { SetPedCanPlayGestureAnims(ped, toggle); }
  setCanPlayVisemeAnims(ped: number, toggle: boolean, p2: boolean): void { SetPedCanPlayVisemeAnims(ped, toggle, p2); }
  setCanPlayAmbientAnims(ped: number, toggle: boolean): void { SetPedCanPlayAmbientAnims(ped, toggle); }
  setCanPlayAmbientBaseAnims(ped: number, toggle: boolean): void { SetPedCanPlayAmbientBaseAnims(ped, toggle); }

  setCanArmIk(ped: number, toggle: boolean): void { SetPedCanArmIk(ped, toggle); }
  setCanHeadIk(ped: number, toggle: boolean): void { SetPedCanHeadIk(ped, toggle); }
  setCanLegIk(ped: number, toggle: boolean): void { SetPedCanLegIk(ped, toggle); }
  setCanTorsoIk(ped: number, toggle: boolean): void { SetPedCanTorsoIk(ped, toggle); }
  setCanTorsoReactIk(ped: number, p1: boolean): void { SetPedCanTorsoReactIk(ped, p1); }
  setCanUseAutoConversationLookat(ped: number, toggle: boolean): void { SetPedCanUseAutoConversationLookat(ped, toggle); }
  setPrimaryLookat(ped: number, lookAt: number): void { SetPedPrimaryLookat(ped, lookAt); }
  setLegIkMode(ped: number, mode: number): void { SetPedLegIkMode(ped, mode); }

  setIntoVehicle(ped: number, vehicle: number, seatIndex: number): void { SetPedIntoVehicle(ped, vehicle, seatIndex); }
  getVehicleIsIn(ped: number, lastVehicle: boolean): number { return GetVehiclePedIsIn(ped, lastVehicle ?? false); }
  resetLastVehicle(ped: number): void { ResetPedLastVehicle(ped); }
  setAllowVehiclesOverride(ped: number, toggle: boolean): void { SetPedAllowVehiclesOverride(ped, toggle); }
  setVehicleForcedSeatUsage(ped: number, vehicle: number, seatIndex: number, flags: number): void { SetPedVehicleForcedSeatUsage(ped, vehicle, seatIndex, flags); }
  setCanBeKnockedOffVehicle(ped: number, state: number): void { SetPedCanBeKnockedOffVehicle(ped, state); }
  knockOffVehicle(ped: number): void { KnockPedOffVehicle(ped); }
  setStayInVehicleWhenJacked(ped: number, toggle: boolean): void { SetPedStayInVehicleWhenJacked(ped, toggle); }
  setCanBeShotInVehicle(ped: number, toggle: boolean): void { SetPedCanBeShotInVehicle(ped, toggle); }
  setGetOutUpsideDownVehicle(ped: number, toggle: boolean): void { SetPedGetOutUpsideDownVehicle(ped, toggle); }
  setDiesInVehicle(ped: number, toggle: boolean): void { SetPedDiesInVehicle(ped, toggle); }
  setDiesInSinkingVehicle(ped: number, toggle: boolean): void { SetPedDiesInSinkingVehicle(ped, toggle); }
  getPedsJacker(ped: number): number { return GetPedsJacker(ped); }
  getJackTarget(ped: number): number { return GetJackTarget(ped); }
  getMount(ped: number): number { return GetMount(ped); }

  canRagdoll(ped: number): boolean { return CanPedRagdoll(ped); }
  setToRagdoll(ped: number, time: number, p2: number): boolean { return SetPedToRagdoll(ped, time, p2 ?? time, 0, false, false, false); }
  isRagdoll(ped: number): boolean { return IsPedRagdoll(ped); }
  setCanRagdoll(ped: number, toggle: boolean): void { SetPedCanRagdoll(ped, toggle); }
  setRagdollOnCollision(ped: number, toggle: boolean): void { SetPedRagdollOnCollision(ped, toggle); }
  setRagdollForceFall(ped: number): void { SetPedRagdollForceFall(ped); }
  resetRagdollTimer(ped: number): void { ResetPedRagdollTimer(ped); }
  setRagdollBlockingFlags(ped: number, flags: number): void { SetRagdollBlockingFlags(ped, flags); }
  clearRagdollBlockingFlags(ped: number, flags: number): void { ClearRagdollBlockingFlags(ped, flags); }
  setCanRagdollFromPlayerImpact(ped: number, toggle: boolean): void { SetPedCanRagdollFromPlayerImpact(ped, toggle); }

  setFleeAttributes(ped: number, attributes: number, add: boolean): void { SetPedFleeAttributes(ped, attributes, add); }
  setCombatAttributes(ped: number, attributeIndex: number, enabled: boolean): void { SetPedCombatAttributes(ped, attributeIndex, enabled); }
  setCombatAbility(ped: number, ability: number): void { SetPedCombatAbility(ped, ability); }
  setCombatRange(ped: number, combatRange: number): void { SetPedCombatRange(ped, combatRange); }
  setTargetLossResponse(ped: number, responseType: number): void { SetPedTargetLossResponse(ped, responseType); }
  setCowerHash(ped: number, p1: string): void { SetPedCowerHash(ped, p1); }
  setSteersAroundPeds(ped: number, toggle: boolean): void { SetPedSteersAroundPeds(ped, toggle); }
  setSteersAroundObjects(ped: number, toggle: boolean): void { SetPedSteersAroundObjects(ped, toggle); }
  setSteersAroundVehicles(ped: number, toggle: boolean): void { SetPedSteersAroundVehicles(ped, toggle); }
  setIncreasedAvoidanceRadius(ped: number): void { SetPedIncreasedAvoidanceRadius(ped); }
  setBlocksPathingWhenDead(ped: number, toggle: boolean): void { SetPedBlocksPathingWhenDead(ped, toggle); }
  getMeleeTargetFor(ped: number): number { return GetMeleeTargetForPed(ped); }
  wasKilledByStealth(ped: number): boolean { return WasPedKilledByStealth(ped); }
  wasKilledByTakedown(ped: number): boolean { return WasPedKilledByTakedown(ped); }
  wasKnockedOut(ped: number): boolean { return WasPedKnockedOut(ped); }

  createGroup(unused: number): number { return CreateGroup(unused); }
  setAsGroupLeader(ped: number, groupHandle: number): void { SetPedAsGroupLeader(ped, groupHandle); }
  setAsGroupMember(ped: number, groupHandle: number): void { SetPedAsGroupMember(ped, groupHandle); }
  setCanTeleportToGroupLeader(pedHandle: number, groupHandle: number, toggle: boolean): void { SetPedCanTeleportToGroupLeader(pedHandle, groupHandle, toggle); }
  removeGroup(groupId: number): void { RemoveGroup(groupId); }
  removeFromGroup(ped: number): void { RemovePedFromGroup(ped); }
  isGroupMember(ped: number, groupHandle: number): boolean { return IsPedGroupMember(ped, groupHandle); }
  getGroupSize(groupID: number): { unknown: number; sizeInMembers: number } { const r = GetGroupSize(groupID); return { unknown: r[0], sizeInMembers: r[1] }; }
  doesGroupExist(groupId: number): boolean { return DoesGroupExist(groupId); }
  getGroupIndex(ped: number): number { return GetPedGroupIndex(ped); }
  isInGroup(ped: number): boolean { return IsPedInGroup(ped); }
  setGroupFormation(groupId: number, formationType: number): void { SetGroupFormation(groupId, formationType); }
  setGroupFormationSpacing(groupId: number, p1: number, p2: number, p3: number): void { SetGroupFormationSpacing(groupId, p1, p2, p3); }
  resetGroupFormationDefaultSpacing(groupHandle: number): void { ResetGroupFormationDefaultSpacing(groupHandle); }
  setGroupSeparationRange(groupHandle: number, separationRange: number): void { SetGroupSeparationRange(groupHandle, separationRange); }
  setGroupMemberPassengerIndex(ped: number, index: number): void { SetPedGroupMemberPassengerIndex(ped, index); }
  getAsGroupMember(groupID: number, memberNumber: number): number { return GetPedAsGroupMember(groupID, memberNumber); }
  getAsGroupLeader(groupID: number): number { return GetPedAsGroupLeader(groupID); }
  setNeverLeavesGroup(ped: number, toggle: boolean): void { SetPedNeverLeavesGroup(ped, toggle); }

  setRelationshipGroupDefaultHash(ped: number, hash: number): void { SetPedRelationshipGroupDefaultHash(ped, hash); }
  setRelationshipGroupHash(ped: number, hash: number): void { SetPedRelationshipGroupHash(ped, hash); }
  setRelationshipBetweenGroups(relationship: number, group1: number, group2: number): void { SetRelationshipBetweenGroups(relationship, group1, group2); }
  clearRelationshipBetweenGroups(relationship: number, group1: number, group2: number): void { ClearRelationshipBetweenGroups(relationship, group1, group2); }
  addRelationshipGroup(name: string): number { const r = AddRelationshipGroup(name); return Array.isArray(r) ? r[1] : r; }
  removeRelationshipGroup(groupHash: number): void { RemoveRelationshipGroup(groupHash); }
  doesRelationshipGroupExist(groupHash: number): boolean { return DoesRelationshipGroupExist(groupHash); }
  getRelationshipGroupDefaultHash(ped: number): number { return GetPedRelationshipGroupDefaultHash(ped); }
  getRelationshipGroupHash(ped: number): number { return GetPedRelationshipGroupHash(ped); }
  getRelationshipBetweenGroups(group1: number, group2: number): number { return GetRelationshipBetweenGroups(group1, group2); }
  setToInformRespectedFriends(ped: number, radius: number, maxFriends: number): void { SetPedToInformRespectedFriends(ped, radius, maxFriends); }

  registerHeadshot(ped: number): number { return RegisterPedheadshot(ped); }
  registerHeadshot3(ped: number): number { return RegisterPedheadshot_3(ped); }
  unregisterHeadshot(handle: number): void { UnregisterPedheadshot(handle); }
  isHeadshotValid(handle: number): boolean { return IsPedheadshotValid(handle); }
  isHeadshotReady(handle: number): boolean { return IsPedheadshotReady(handle); }
  getHeadshotTxdString(handle: number): string { return GetPedheadshotTxdString(handle); }

  setDesiredHeading(ped: number, heading: number): void { SetPedDesiredHeading(ped, heading); }
  setCoordsNoGang(ped: number, posX: number, posY: number, posZ: number): void { SetPedCoordsNoGang(ped, posX, posY, posZ); }
  setCoordsKeepVehicle(ped: number, posX: number, posY: number, posZ: number): void { SetPedCoordsKeepVehicle(ped, posX, posY, posZ); }
  setGravity(ped: number, toggle: boolean): void { SetPedGravity(ped, toggle); }
  setMoveAnimsBlendOut(ped: number): void { SetPedMoveAnimsBlendOut(ped); }
  setDiesInWater(ped: number, toggle: boolean): void { SetPedDiesInWater(ped, toggle); }
  setDiesInstantlyInWater(ped: number, toggle: boolean): void { SetPedDiesInstantlyInWater(ped, toggle); }
  setDiesWhenInjured(ped: number, toggle: boolean): void { SetPedDiesWhenInjured(ped, toggle); }
  setMaxTimeInWater(ped: number, value: number): void { SetPedMaxTimeInWater(ped, value); }
  setMaxTimeUnderwater(ped: number, value: number): void { SetPedMaxTimeUnderwater(ped, value); }
  setMoney(ped: number, amount: number): void { SetPedMoney(ped, amount); }
  getMoney(ped: number): number { return GetPedMoney(ped); }
  setAsCop(ped: number, toggle: boolean): void { SetPedAsCop(ped, toggle); }
  setAsEnemy(ped: number, toggle: boolean): void { SetPedAsEnemy(ped, toggle); }
  setKeepTask(ped: number, toggle: boolean): void { SetPedKeepTask(ped, toggle); }
  setAllowedToDuck(ped: number, toggle: boolean): void { SetPedAllowedToDuck(ped, toggle); }
  setDucking(ped: number, toggle: boolean): void { SetPedDucking(ped, toggle); }
  setBlockingOfNonTemporaryEvents(ped: number, toggle: boolean): void { SetBlockingOfNonTemporaryEvents(ped, toggle); }
  setBoundsOrientation(ped: number, p1: number, p2: number, p3: number, p4: number, p5: number): void { SetPedBoundsOrientation(ped, p1, p2, p3, p4, p5); }
  setIdRange(ped: number, value: number): void { SetPedIdRange(ped, value); }
  setHighlyPerceptive(ped: number, toggle: boolean): void { SetPedHighlyPerceptive(ped, toggle); }
  setSeeingRange(ped: number, value: number): void { SetPedSeeingRange(ped, value); }
  setHearingRange(ped: number, value: number): void { SetPedHearingRange(ped, value); }
  setVisualFieldMinAngle(ped: number, value: number): void { SetPedVisualFieldMinAngle(ped, value); }
  setVisualFieldMaxAngle(ped: number, value: number): void { SetPedVisualFieldMaxAngle(ped, value); }
  setVisualFieldMinElevationAngle(ped: number, angle: number): void { SetPedVisualFieldMinElevationAngle(ped, angle); }
  setVisualFieldMaxElevationAngle(ped: number, angle: number): void { SetPedVisualFieldMaxElevationAngle(ped, angle); }
  setVisualFieldPeripheralRange(ped: number, range: number): void { SetPedVisualFieldPeripheralRange(ped, range); }
  setVisualFieldCenterAngle(ped: number, angle: number): void { SetPedVisualFieldCenterAngle(ped, angle); }
  getVisualFieldCenterAngle(ped: number): number { return GetPedVisualFieldCenterAngle(ped); }
  setStealthMovement(ped: number, p1: boolean, action: string): void { SetPedStealthMovement(ped, p1, action); }
  getStealthMovement(ped: number): boolean { return GetPedStealthMovement(ped); }
  setAlertness(ped: number, value: number): void { SetPedAlertness(ped, value); }
  getAlertness(ped: number): number { return GetPedAlertness(ped); }
  setMinGroundTimeForStungun(ped: number, ms: number): void { SetPedMinGroundTimeForStungun(ped, ms); }
  setCanSmashGlass(ped: number, p1: boolean, p2: boolean): void { SetPedCanSmashGlass(ped, p1, p2); }
  setEnableHandcuffs(ped: number, toggle: boolean): void { SetEnableHandcuffs(ped, toggle); }
  setEnableBoundAnkles(ped: number, toggle: boolean): void { SetEnableBoundAnkles(ped, toggle); }
  setEnableScuba(ped: number, toggle: boolean): void { SetEnableScuba(ped, toggle); }
  setCanAttackFriendly(ped: number, toggle: boolean, p2: boolean): void { SetCanAttackFriendly(ped, toggle, p2); }
  setMaxMoveBlendRatio(ped: number, value: number): void { SetPedMaxMoveBlendRatio(ped, value); }
  setMinMoveBlendRatio(ped: number, value: number): void { SetPedMinMoveBlendRatio(ped, value); }
  setMoveRateOverride(ped: number, value: number): void { SetPedMoveRateOverride(ped, value); }
  setCapsule(ped: number, value: number): void { SetPedCapsule(ped, value); }
  setCanSwitchWeapon(ped: number, toggle: boolean): void { SetPedCanSwitchWeapon(ped, toggle); }
  stopWeaponFiringWhenDropped(ped: number): void { StopPedWeaponFiringWhenDropped(ped); }
  setScriptedAnimSeatOffset(ped: number, p1: number): void { SetScriptedAnimSeatOffset(ped, p1); }
  setEnableWeaponBlocking(ped: number, toggle: boolean): void { SetPedEnableWeaponBlocking(ped, toggle); }
  setGeneratesDeadBodyEvents(ped: number, toggle: boolean): void { SetPedGeneratesDeadBodyEvents(ped, toggle); }
  setCanEvasiveDive(ped: number, toggle: boolean): void { SetPedCanEvasiveDive(ped, toggle); }
  setModelIsSuppressed(modelHash: number, toggle: boolean): void { SetPedModelIsSuppressed(modelHash, toggle); }
  setNameDebug(ped: number, name: string): void { SetPedNameDebug(ped, name); }
  setMotionBlur(ped: number, toggle: boolean): void { SetEntityMotionBlur(ped, toggle); }
  setConfigFlag(ped: number, flagId: number, value: boolean): void { SetPedConfigFlag(ped, flagId, value); }
  setResetFlag(ped: number, flagId: number, doReset: boolean): void { SetPedResetFlag(ped, flagId, doReset); }
  getConfigFlag(ped: number, flagId: number, p2: boolean): boolean { return GetPedConfigFlag(ped, flagId, p2); }
  getResetFlag(ped: number, flagId: number): boolean { return GetPedResetFlag(ped, flagId); }

  giveHelmet(ped: number, cannotRemove: boolean, helmetFlag: number, textureIndex: number): void { GivePedHelmet(ped, cannotRemove, helmetFlag, textureIndex); }
  removeHelmet(ped: number, instantly: boolean): void { RemovePedHelmet(ped, instantly); }
  isTakingOffHelmet(ped: number): boolean { return IsPedTakingOffHelmet(ped); }
  setHelmet(ped: number, canWearHelmet: boolean): void { SetPedHelmet(ped, canWearHelmet); }
  setHelmetFlag(ped: number, helmetFlag: number): void { SetPedHelmetFlag(ped, helmetFlag); }
  setHelmetPropIndex(ped: number, propIndex: number): void { SetPedHelmetPropIndex(ped, propIndex); }
  setHelmetTextureIndex(ped: number, textureIndex: number): void { SetPedHelmetTextureIndex(ped, textureIndex); }
  isWearingHelmet(ped: number): boolean { return IsPedWearingHelmet(ped); }
  clearStoredHatProp(ped: number): void { ClearPedStoredHatProp(ped); }
  getHelmetStoredHatPropIndex(ped: number): number { return GetPedHelmetStoredHatPropIndex(ped); }
  getHelmetStoredHatTexIndex(ped: number): number { return GetPedHelmetStoredHatTexIndex(ped); }

  setToLoadCover(ped: number, toggle: boolean): void { SetPedToLoadCover(ped, toggle); }
  setCanCowerInCover(ped: number, toggle: boolean): void { SetPedCanCowerInCover(ped, toggle); }
  setCanPeekInCover(ped: number, toggle: boolean): void { SetPedCanPeekInCover(ped, toggle); }
  setPlaysHeadOnHornAnimWhenDiesInVehicle(ped: number, toggle: boolean): void { SetPedPlaysHeadOnHornAnimWhenDiesInVehicle(ped, toggle); }
  setPreferredCoverSet(ped: number, itemSet: number): void { SetPedPreferredCoverSet(ped, itemSet); }
  removePreferredCoverSet(ped: number): void { RemovePedPreferredCoverSet(ped); }

  setSphereDefensiveArea(ped: number, x: number, y: number, z: number, radius: number, p5: boolean, p6: boolean): void { SetPedSphereDefensiveArea(ped, x, y, z, radius, p5, p6); }
  setDefensiveAreaDirection(ped: number, p1: number, p2: number, p3: number, p4: boolean): void { SetPedDefensiveAreaDirection(ped, p1, p2, p3, p4); }
  removeDefensiveArea(ped: number, toggle: boolean): void { RemovePedDefensiveArea(ped, toggle); }
  getDefensiveAreaPosition(ped: number, p1: boolean): Vector3 { return toVec3(GetPedDefensiveAreaPosition(ped, p1)); }
  isDefensiveAreaActive(ped: number, p1: boolean): boolean { return IsPedDefensiveAreaActive(ped, p1); }

  reviveInjured(ped: number): void { ReviveInjuredPed(ped); }
  resurrect(ped: number): void { ResurrectPed(ped); }
  getExtractedDisplacement(ped: number, worldSpace: boolean): Vector3 { return toVec3(GetPedExtractedDisplacement(ped, worldSpace)); }
  getBoneCoords(ped: number, boneId: number, offsetX: number, offsetY: number, offsetZ: number): Vector3 { return toVec3(GetPedBoneCoords(ped, boneId, offsetX, offsetY, offsetZ)); }
  getBoneIndex(ped: number, boneId: number): number { return GetPedBoneIndex(ped, boneId); }
  getRagdollBoneIndex(ped: number, bone: number): number { return GetPedRagdollBoneIndex(ped, bone); }
  wasSkeletonUpdated(ped: number): boolean { return WasPedSkeletonUpdated(ped); }

  setEnveffScale(ped: number, value: number): void { SetPedEnveffScale(ped, value); }
  getEnveffScale(ped: number): number { return GetPedEnveffScale(ped); }
  setEnveffColorModulator(ped: number, p1: number, p2: number, p3: number): void { SetPedEnveffColorModulator(ped, p1, p2, p3); }
  setAoBlobRendering(ped: number, toggle: boolean): void { SetPedAoBlobRendering(ped, toggle); }

  createNmMessage(startImmediately: boolean, messageId: number): void { CreateNmMessage(startImmediately, messageId); }
  giveNmMessage(ped: number): void { GivePedNmMessage(ped); }

  haveAllStreamingRequestsCompleted(ped: number): boolean { return HaveAllStreamingRequestsCompleted(ped); }
  setUsingActionMode(ped: number, p1: boolean, p2: number, action: string): void { SetPedUsingActionMode(ped, p1, p2, action); }
  setMovementModeOverride(ped: number, name: string): void { SetMovementModeOverride(ped, name); }
  setHeatscaleOverride(ped: number, heatScale: number): void { SetPedHeatscaleOverride(ped, heatScale); }
  disableHeatscaleOverride(ped: number): void { DisablePedHeatscaleOverride(ped); }
  setLodMultiplier(ped: number, multiplier: number): void { SetPedLodMultiplier(ped, multiplier); }
  setForceFootstepUpdate(ped: number, toggle: boolean): void { SetForceFootstepUpdate(ped, toggle); }
  setForceStepType(ped: number, p1: boolean, type: number, p3: number): void { SetForceStepType(ped, p1, type, p3); }
  forceMotionState(ped: number, motionStateHash: number, p2: boolean, p3: number, p4: boolean): boolean { return ForcePedMotionState(ped, motionStateHash, p2, p3, p4); }
  requestVisibilityTracking(ped: number): void { RequestPedVisibilityTracking(ped); }
  requestVehicleVisibilityTracking(ped: number, p1: boolean): void { RequestPedVehicleVisibilityTracking(ped, p1); }

  forceToOpenParachute(ped: number): void { ForcePedToOpenParachute(ped); }
  getParachuteState(ped: number): number { return GetPedParachuteState(ped); }
  getParachuteLandingType(ped: number): number { return GetPedParachuteLandingType(ped); }
  setParachuteTintIndex(ped: number, tintIndex: number): void { SetPedParachuteTintIndex(ped, tintIndex); }
  getParachuteTintIndex(ped: number): number { const r = GetPedParachuteTintIndex(ped); return Array.isArray(r) ? r[0] : r; }
  setReserveParachuteTintIndex(ped: number, p1: number): void { SetPedReserveParachuteTintIndex(ped, p1); }
  createParachuteBagObject(ped: number, p1: boolean, p2: boolean): number { return CreateParachuteBagObject(ped, p1, p2); }

  createSynchronizedScene(x: number, y: number, z: number, roll: number, pitch: number, yaw: number, p6: number): number { return CreateSynchronizedScene(x, y, z, roll, pitch, yaw, p6); }
  createSynchronizedSceneAtMapObject(x: number, y: number, z: number, radius: number, objectHash: number): number { return CreateSynchronizedSceneAtMapObject(x, y, z, radius, objectHash); }
  isSynchronizedSceneRunning(sceneId: number): boolean { return IsSynchronizedSceneRunning(sceneId); }
  setSynchronizedSceneOrigin(sceneID: number, x: number, y: number, z: number, roll: number, pitch: number, yaw: number, p7: boolean): void { SetSynchronizedSceneOrigin(sceneID, x, y, z, roll, pitch, yaw, p7); }
  setSynchronizedScenePhase(sceneID: number, phase: number): void { SetSynchronizedScenePhase(sceneID, phase); }
  getSynchronizedScenePhase(sceneID: number): number { return GetSynchronizedScenePhase(sceneID); }
  setSynchronizedSceneRate(sceneID: number, rate: number): void { SetSynchronizedSceneRate(sceneID, rate); }
  getSynchronizedSceneRate(sceneID: number): number { return GetSynchronizedSceneRate(sceneID); }
  setSynchronizedSceneLooped(sceneID: number, toggle: boolean): void { SetSynchronizedSceneLooped(sceneID, toggle); }
  isSynchronizedSceneLooped(sceneID: number): boolean { return IsSynchronizedSceneLooped(sceneID); }
  setSynchronizedSceneHoldLastFrame(sceneID: number, toggle: boolean): void { SetSynchronizedSceneHoldLastFrame(sceneID, toggle); }
  isSynchronizedSceneHoldLastFrame(sceneID: number): boolean { return IsSynchronizedSceneHoldLastFrame(sceneID); }
  attachSynchronizedSceneToEntity(sceneID: number, entity: number, boneIndex: number): void { AttachSynchronizedSceneToEntity(sceneID, entity, boneIndex); }
  detachSynchronizedScene(sceneID: number): void { DetachSynchronizedScene(sceneID); }

  removeScenarioBlockingAreas(): void { RemoveScenarioBlockingAreas(); }
  removeScenarioBlockingArea(scenario: number, network: boolean): void { RemoveScenarioBlockingArea(scenario, network); }
  setScenarioPedsSpawnInSphereArea(x: number, y: number, z: number, range: number, p4: number): void { SetScenarioPedsSpawnInSphereArea(x, y, z, range, p4); }
  setShouldPlayNormalScenarioExit(ped: number): void { SetPedShouldPlayNormalScenarioExit(ped); }
  setShouldPlayImmediateScenarioExit(ped: number): void { SetPedShouldPlayImmediateScenarioExit(ped); }
  setScenarioPedsToBeReturnedByNextCommand(value: boolean): void { SetScenarioPedsToBeReturnedByNextCommand(value); }

  setDriverRacingModifier(driver: number, modifier: number): void { SetDriverRacingModifier(driver, modifier); }
  setDriverAbility(driver: number, ability: number): void { SetDriverAbility(driver, ability); }
  setDriverAggressiveness(driver: number, aggressiveness: number): void { SetDriverAggressiveness(driver, aggressiveness); }

  getClosest(x: number, y: number, z: number, radius: number, p4: boolean, p5: boolean, p7: boolean, p8: boolean, pedType: number): number { const r = GetClosestPed(x, y, z, radius, p4, p5, p7, p8, pedType); return Array.isArray(r) ? r[1] : r; }
  getRandomAtCoord(x: number, y: number, z: number, xRadius: number, yRadius: number, zRadius: number, pedType: number): number { return GetRandomPedAtCoord(x, y, z, xRadius, yRadius, zRadius, pedType); }
  canCreateRandom(unk: boolean): boolean { return CanCreateRandomPed(unk); }
  createRandom(posX: number, posY: number, posZ: number): number { return CreateRandomPed(posX, posY, posZ); }
  canCreateRandomDriver(): boolean { return CanCreateRandomDriver(); }
  canCreateRandomBikeRider(): boolean { return CanCreateRandomBikeRider(); }
  setCreateRandomCops(toggle: boolean): void { SetCreateRandomCops(toggle); }
  setCreateRandomCopsNotOnScenarios(toggle: boolean): void { SetCreateRandomCopsNotOnScenarios(toggle); }
  setCreateRandomCopsOnScenarios(toggle: boolean): void { SetCreateRandomCopsOnScenarios(toggle); }
  canCreateRandomCops(): boolean { return CanCreateRandomCops(); }
  setDensityMultiplierThisFrame(multiplier: number): void { SetPedDensityMultiplierThisFrame(multiplier); }
  setScenarioPedDensityMultiplierThisFrame(intMultiplier: number, extMultiplier: number): void { SetScenarioPedDensityMultiplierThisFrame(intMultiplier, extMultiplier); }
  setNonCreationArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): void { SetPedNonCreationArea(x1, y1, z1, x2, y2, z2); }
  clearNonCreationArea(): void { ClearPedNonCreationArea(); }
  setScriptedConversionCoordThisFrame(x: number, y: number, z: number): void { SetScriptedConversionCoordThisFrame(x, y, z); }
  setAmbientPedsDropMoney(dropMoney: boolean): void { SetAmbientPedsDropMoney(dropMoney); }
  setPopControlSphereThisFrame(x: number, y: number, z: number, min: number, max: number): void { SetPopControlSphereThisFrame(x, y, z, min, max); }

  requestActionModeAsset(asset: string): void { RequestActionModeAsset(asset); }
  hasActionModeAssetLoaded(asset: string): boolean { return HasActionModeAssetLoaded(asset); }
  removeActionModeAsset(asset: string): void { RemoveActionModeAsset(asset); }
  requestStealthModeAsset(asset: string): void { RequestStealthModeAsset(asset); }
  hasStealthModeAssetLoaded(asset: string): boolean { return HasStealthModeAssetLoaded(asset); }
  removeStealthModeAsset(asset: string): void { RemoveStealthModeAsset(asset); }

  spawnpointsStartSearch(x: number, y: number, z: number, radius: number, zmax: number, interiorFlags: number, scale: number, duration: number): void { SpawnpointsStartSearch(x, y, z, radius, zmax, interiorFlags, scale, duration); }
  spawnpointsCancelSearch(): void { SpawnpointsCancelSearch(); }
  spawnpointsIsSearchActive(): boolean { return SpawnpointsIsSearchActive(); }
  spawnpointsIsSearchComplete(): boolean { return SpawnpointsIsSearchComplete(); }
  spawnpointsIsSearchFailed(): boolean { return SpawnpointsIsSearchFailed(); }
  spawnpointsGetNumSearchResults(): number { return SpawnpointsGetNumSearchResults(); }
  spawnpointsGetSearchResult(randomInt: number): { x: number; y: number; z: number } { const r = SpawnpointsGetSearchResult(randomInt); return { x: r[0], y: r[1], z: r[2] }; }

  cloneEx(ped: number, heading: number, isNetwork: boolean, bScriptHostPed: boolean, p4: number): number { return ClonePedEx(ped, heading, isNetwork, bScriptHostPed, p4); }
  cloneToTargetEx(ped: number, targetPed: number, p2: number): void { ClonePedToTargetEx(ped, targetPed, p2); }
  removeElegantly(ped: number): number { return (RemovePedElegantly as any)(ped); }
  freezeCameraRotation(ped: number): void { FreezePedCameraRotation(ped); }
  isConversationDead(ped: number): boolean { return IsConversationPedDead(ped); }
  isOpeningADoor(ped: number): boolean { return IsPedOpeningADoor(ped); }
  createRandomAsDriver(vehicle: number, returnHandle: boolean): number { return CreateRandomPedAsDriver(vehicle, returnHandle); }
  instantlyFillPopulation(): void { InstantlyFillPedPopulation(); }
  setScenarioDensityMultiplierThisFrame(intMultiplier: number, extMultiplier: number): void { SetScenarioPedDensityMultiplierThisFrame(intMultiplier, extMultiplier); }
  getDeadPickupCoords(ped: number, p1: number, p2: number): Vector3 { return toVec3(GetDeadPedPickupCoords(ped, p1, p2)); }
  getMaxHealth(ped: number): number { return GetPedMaxHealth(ped); }
  setMaxHealth(ped: number, value: number): void { SetPedMaxHealth(ped, value); }
  getType(ped: number): number { return GetPedType(ped); }
  applyDamageDecal(ped: number, damageZone: number, xOffset: number, yOffset: number, heading: number, scale: number, alpha: number, variation: number, fadeIn: boolean, decalName: string): void { ApplyPedDamageDecal(ped, damageZone, xOffset, yOffset, heading, scale, alpha, variation, fadeIn, decalName); }
  getEventData(ped: number, eventType: number): number { return (GetEventData as any)(ped, eventType); } // NOTE: native returns [boolean,number] per typings
  getTimeOfLastWeaponDamage(ped: number, weaponHash: number): number { return GetTimeOfLastPedWeaponDamage(ped, weaponHash); }
  setPinnedDown(ped: number, pinned: boolean, i: number): number { return (SetPedPinnedDown as any)(ped, pinned, i); } // NOTE: native returns [boolean,number] per typings
  getSeatIsTryingToEnter(ped: number): number { return GetSeatPedIsTryingToEnter(ped); }
  getVehicleIsTryingToEnter(ped: number): number { return GetVehiclePedIsTryingToEnter(ped); }
  getVehicleIsUsing(ped: number): number { return GetVehiclePedIsUsing(ped); }
  getVehicleIsEntering(ped: number): number { return GetVehiclePedIsEntering(ped); }
  getPlayerIsFollowing(ped: number): number { return GetPlayerPedIsFollowing(ped); }
  canKnockOffVehicle(ped: number): boolean { return CanKnockPedOffVehicle(ped); }
  clearAllVehicleForcedSeatUsage(ped: number): void { ClearAllPedVehicleForcedSeatUsage(ped); }
  getRelationshipBetweenS(ped1: number, ped2: number): number { return GetRelationshipBetweenPeds(ped1, ped2); }
  setRelationshipGroupDontAffectWantedLevel(group: number, p1: boolean): void { SetRelationshipGroupDontAffectWantedLevel(group, p1); }

  clearAllProps(ped: number): void { ClearAllPedProps(ped); }
  knockOffProp(ped: number, p1: boolean, p2: boolean, p3: boolean, p4: boolean): void { KnockOffPedProp(ped, p1, p2, p3, p4); }

  getEyeColor(ped: number): number { return GetPedEyeColor(ped); }
  getHeadBlendData(ped: number): number { 
    const [, result] = GetPedHeadBlendData(ped);
    return result;
  }
  getHeadOverlayValue(ped: number, overlayID: number): number { return GetPedHeadOverlayValue(ped, overlayID); }
  getNumHairColors(): number { return GetNumHairColors(); }
  getNumMakeupColors(): number { return GetNumMakeupColors(); }
  getNumParentPedsOfType(type: number): number { return GetNumParentPedsOfType(type); }
  getHairRgbColor(hairColorIndex: number): { outR: number; outG: number; outB: number } { const r = GetPedHairRgbColor(hairColorIndex); return { outR: r[0], outG: r[1], outB: r[2] }; }
  getMakeupRgbColor(makeupColorIndex: number): { outR: number; outG: number; outB: number } { const r = GetPedMakeupRgbColor(makeupColorIndex); return { outR: r[0], outG: r[1], outB: r[2] }; }
  isHairColorValid(colorID: number): boolean { return IsPedHairColorValid(colorID); }
  isHairColorValid2(colorId: number): boolean { return IsPedHairColorValid_2(colorId); }
  isLipstickColorValid(colorID: number): boolean { return IsPedLipstickColorValid(colorID); }
  isLipstickColorValid2(colorId: number): boolean { return IsPedLipstickColorValid_2(colorId); }
  isBlushColorValid(colorID: number): boolean { return IsPedBlushColorValid(colorID); }
  isBlushColorValid2(colorId: number): boolean { return IsPedBlushColorValid_2(colorId); }
  isBodyBlemishValid(colorId: number): boolean { return IsPedBodyBlemishValid(colorId); }

  setEmissiveIntensity(ped: number, intensity: number): void { SetPedEmissiveIntensity(ped, intensity); }
  getEmissiveIntensity(ped: number): number { return GetPedEmissiveIntensity(ped); }
  isShaderEffectValid(ped: number): boolean { return IsPedShaderEffectValid(ped); }
  setEnableEnveffScale(ped: number, toggle: boolean): void { SetEnablePedEnveffScale(ped, toggle); }

  setAngledDefensiveArea(ped: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: boolean, p9: boolean): void { SetPedAngledDefensiveArea(ped, p1, p2, p3, p4, p5, p6, p7, p8, p9); }
  setDefensiveSphereAttachedToPed(ped: number, target: number, xOffset: number, yOffset: number, zOffset: number, radius: number, p6: boolean): void { SetPedDefensiveSphereAttachedToPed(ped, target, xOffset, yOffset, zOffset, radius, p6); }
  setDefensiveSphereAttachedToVehicle(ped: number, target: number, xOffset: number, yOffset: number, zOffset: number, radius: number, p6: boolean): void { SetPedDefensiveSphereAttachedToVehicle(ped, target, xOffset, yOffset, zOffset, radius, p6); }
  setDefensiveAreaAttachedToPed(ped: number, attachPed: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: boolean, p10: boolean): void { SetPedDefensiveAreaAttachedToPed(ped, attachPed, p2, p3, p4, p5, p6, p7, p8, p9, p10); }

  setCoverClipsetOverride(ped: number, p1: string): void { SetPedCoverClipsetOverride(ped, p1); }
  clearCoverClipsetOverride(ped: number): void { ClearPedCoverClipsetOverride(ped); }
  isScriptedScenarioUsingConditionalAnim(ped: number, animDict: string, anim: string): boolean { return IsScriptedScenarioPedUsingConditionalAnim(ped, animDict, anim); }
  getAnimInitialOffsetPosition(animDict: string, animName: string, x: number, y: number, z: number, xRot: number, yRot: number, zRot: number, p8: number, p9: number): Vector3 { return toVec3(GetAnimInitialOffsetPosition(animDict, animName, x, y, z, xRot, yRot, zRot, p8, p9)); }
  getAnimInitialOffsetRotation(animDict: string, animName: string, x: number, y: number, z: number, xRot: number, yRot: number, zRot: number, p8: number, p9: number): Vector3 { return toVec3(GetAnimInitialOffsetRotation(animDict, animName, x, y, z, xRot, yRot, zRot, p8, p9)); }
  setFacialClipsetOverride(ped: number, animDict: string): void { SetFacialClipsetOverride(ped, animDict); }
  clearFacialClipsetOverride(ped: number): void { ClearFacialClipsetOverride(ped); }
  setCanPlayInjuredAnims(ped: number, p1: boolean): void { SetPedCanPlayInjuredAnims(ped, p1); }
  setCanPlayInCarIdles(ped: number, enable: boolean): void { SetPedCanPlayInCarIdles(ped, enable); }

  setClothPackageIndex(p0: number, p1: number): void { SetPedClothPackageIndex(p0, p1); }
  setClothProne(p0: number, p1: number): void { SetPedClothProne(p0, p1); }

  blockDeadBodyShockingEvents(ped: number, toggle: boolean): void { BlockPedDeadBodyShockingEvents(ped, toggle); }
  isPerformingDependentComboLimit(ped: number): boolean { return IsPedPerformingDependentComboLimit(ped); }
  setToRagdollWithFall(ped: number, time: number, p2: number, ragdollType: number, x: number, y: number, z: number, p7: number, p8: number, p9: number, p10: number, p11: number, p12: number, p13: number): boolean { return SetPedToRagdollWithFall(ped, time, p2, ragdollType, x, y, z, p7, p8, p9, p10, p11, p12, p13); }
  isSwappingWeapon(Ped: number): boolean { return IsPedSwappingWeapon(Ped); }
  setDisableFallDamage(ped: number, enable: boolean): void { SetPedDisableFallDamage(ped, enable); }
  forceAiAndAnimationUpdate(ped: number, p1: boolean, p2: boolean): void { ForcePedAiAndAnimationUpdate(ped, p1, p2); }
  isTrackedVisible(ped: number): boolean { return IsTrackedPedVisible(ped); }
  isAnyHostileNearPoint(ped: number, x: number, y: number, z: number, radius: number): boolean { return IsAnyHostilePedNearPoint(ped, x, y, z, radius); }
  isTargetInPerceptionArea(ped: number, targetPed: number, focusAngle: number, focusDistance: number, peripheralAngle: number, peripheralDistance: number): boolean { return IsTargetPedInPerceptionArea(ped, targetPed, focusAngle, focusDistance, peripheralAngle, peripheralDistance); }
  setCanLosePropsOnDamage(ped: number, enable: boolean, flag: number): void { SetPedCanLosePropsOnDamage(ped, enable, flag); }
  getTaskCombatTarget(ped: number, losCheck: boolean): number { return GetPedTaskCombatTarget(ped, losCheck as any); }
  isMobilePhoneToEar(ped: number): boolean { return IsMobilePhoneToPedEar(ped); }
  setTimeExclusiveDisplayTexture(ped: number, tog: boolean): void { SetTimeExclusiveDisplayTexture(ped, tog); }

  setHelmetUnk(ped: number, p1: boolean, p2: number, p3: number): void { SetPedHelmetUnk(ped, p1, p2, p3); }
  isHelmetUnk(ped: number): boolean { return IsPedHelmetUnk(ped); }

  setEnableScubaGearLight(ped: number, toggle: boolean): void { SetEnableScubaGearLight(ped, toggle); }
  isScubaGearLightEnabled(ped: number): boolean { return IsScubaGearLightEnabled(ped); }

  createSynchronizedScene2(x: number, y: number, z: number, radius: number, object: number): number { return CreateSynchronizedScene_2(x, y, z, radius, object); }
  disposeSynchronizedScene(scene: number): void { DisposeSynchronizedScene(scene); }
  setSynchronizedSceneLoo(sceneID: number, toggle: boolean): void { SetSynchronizedSceneLooped(sceneID, toggle); }
  isSynchronizedSceneLoo(sceneID: number): boolean { return IsSynchronizedSceneLooped(sceneID); }
  setShouldPlayDirectedScenarioExit(ped: number, x: number, y: number, z: number): boolean { return SetPedShouldPlayDirectedScenarioExit(ped, x, y, z); }
  setShouldPlayFleeScenarioExit(ped: number, p1: number, p2: number, p3: number): number { return SetPedShouldPlayFleeScenarioExit(ped, p1, p2, p3); }
  setPanicExitScenario(p0: number, p1: number, p2: number, p3: number): number { return SetPedPanicExitScenario(p0, p1, p2, p3); }
  addScenarioBlockingArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, p6: boolean, p7: boolean, p8: boolean, p9: boolean): number { return AddScenarioBlockingArea(x1, y1, z1, x2, y2, z2, p6, p7, p8, p9); }
  doesScenarioBlockingAreaExist(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): boolean { return DoesScenarioBlockingAreaExist(x1, y1, z1, x2, y2, z2); }

  getCurrentMovementSpeed(ped: number): { speedX: number; speedY: number; result: boolean } { const r = GetPedCurrentMovementSpeed(ped); return { speedX: r[1], speedY: r[2], result: r[0] }; }
  getNearbyVehicles(ped: number): any { return GetPedNearbyVehicles(ped); }
  getNearbyPeds(ped: number, ignore: number): any { return GetPedNearbyPeds(ped, ignore); }

  registerHeadshotTransparent(ped: number): number { return RegisterPedheadshotTransparent(ped); }
  requestHeadshotImgUpload(id: number): boolean { return RequestPedheadshotImgUpload(id); }
  releaseHeadshotImgUpload(id: number): void { ReleasePedheadshotImgUpload(id); }
  isHeadshotImgUploadAvailable(): boolean { return IsPedheadshotImgUploadAvailable(); }
  hasHeadshotImgUploadFailed(): boolean { return HasPedheadshotImgUploadFailed(); }
  hasHeadshotImgUploadSucceeded(): boolean { return HasPedheadshotImgUploadSucceeded(); }

  spawnpointsStartSearchInAngledArea(x: number, y: number, z: number, x1: number, y1: number, z1: number, zmax: number, interiorFlags: number, scale: number, duration: number): void { SpawnpointsStartSearchInAngledArea(x, y, z, x1, y1, z1, zmax, interiorFlags, scale, duration); }
  spawnpointsGetSearchResultFlags(p0: number): number { return SpawnpointsGetSearchResultFlags(p0); }
  setIkTarget(ped: number, ikIndex: number, entityLookAt: number, boneLookAt: number, offsetX: number, offsetY: number, offsetZ: number, ikflag: number, blendInDuration: number, blendOutDuration: number): void { SetIkTarget(ped, ikIndex, entityLookAt, boneLookAt, offsetX, offsetY, offsetZ, ikflag, blendInDuration, blendOutDuration); }
  stopAnyModelBeingSuppressed(): void { StopAnyPedModelBeingSuppressed(); }

  async requestActionModeAssetAsync(name: string, timeout: number): Promise<boolean> { return _pollUntilLoaded(RequestActionModeAsset, HasActionModeAssetLoaded, name, timeout ?? 5000); }
  async requestStealthModeAssetAsync(name: string, timeout: number): Promise<boolean> { return _pollUntilLoaded(RequestStealthModeAsset, HasStealthModeAssetLoaded, name, timeout ?? 5000); }


  createPed(pedType: number, modelHash: number, x: number, y: number, z: number, heading: number, isNetwork: boolean, bScriptHostPed: boolean): number { return CreatePed(pedType, modelHash, x, y, z, heading, isNetwork, bScriptHostPed); }
  canCreateRandomPed(unk: boolean): boolean { return CanCreateRandomPed(unk); }
  createRandomPed(posX: number, posY: number, posZ: number): number { return CreateRandomPed(posX, posY, posZ); }
  setPedDensityMultiplierThisFrame(multiplier: number): void { SetPedDensityMultiplierThisFrame(multiplier); }
  setPedNonCreationArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): void { SetPedNonCreationArea(x1, y1, z1, x2, y2, z2); }
  setPedReserveParachuteTintIndex(ped: number, p1: number): void { SetPedReserveParachuteTintIndex(ped, p1); }
  isPedRespondingToEvent(ped: number, event: number): boolean { return IsPedRespondingToEvent(ped, event); }
  setExclusivePhoneRelationships(ped: number): number { return SetExclusivePhoneRelationships(ped); }
  getPedAsGroupMember(groupID: number, memberNumber: number): number { return GetPedAsGroupMember(groupID, memberNumber); }
  getPedAsGroupLeader(groupID: number): number { return GetPedAsGroupLeader(groupID); }
  setPedAlternateWalkAnim(ped: number, animDict: string, animName: string, p3: number, p4: boolean): void { SetPedAlternateWalkAnim(ped, animDict, animName, p3, p4); }
  clearPedAlternateWalkAnim(ped: number, p1: number): void { ClearPedAlternateWalkAnim(ped, p1); }
  getNumHeadOverlayValues(overlayID: number): number { return GetNumHeadOverlayValues(overlayID); }
  isAValidHairColor(colorID: number): boolean { return IsPedHairColorValid(colorID); }
  isAValidLipstickColor(colorID: number): boolean { return IsPedLipstickColorValid(colorID); }
  isAValidBlushColor(colorID: number): boolean { return IsPedBlushColorValid(colorID); }
  getFirstParentIdForPedType(type: number): number { return GetFirstParentIdForPedType(type); }
  getRandomPedAtCoord(x: number, y: number, z: number, xRadius: number, yRadius: number, zRadius: number, pedType: number): number { return GetRandomPedAtCoord(x, y, z, xRadius, yRadius, zRadius, pedType); }
  getClosestPed(x: number, y: number, z: number, radius: number, p4: boolean, p5: boolean, p7: boolean, p8: boolean, pedType: number): number { return (GetClosestPed as any)(x, y, z, radius, p4, p5, p7, p8, pedType); } // NOTE: native returns [boolean,number] per typings
  getTattooZone(collection: number, overlay: number): number { return GetTattooZone(collection, overlay); }
  hasPedReceivedEvent(ped: number, eventId: number): boolean { return HasPedReceivedEvent(ped, eventId); }
  isPedheadshotValid(id: number): boolean { return IsPedheadshotValid(id); }
  isPedheadshotReady(id: number): boolean { return IsPedheadshotReady(id); }
  getPedheadshotTxdString(id: number): string { return GetPedheadshotTxdString(id); }
  setPedToRagdoll(ped: number, time1: number, time2: number, ragdollType: number, p4: boolean, p5: boolean, p6: boolean): boolean { return SetPedToRagdoll(ped, time1, time2, ragdollType, p4, p5, p6); }
  setPedToRagdollWithFall(ped: number, time: number, p2: number, ragdollType: number, x: number, y: number, z: number, p7: number, p8: number, p9: number, p10: number, p11: number, p12: number, p13: number): boolean { return SetPedToRagdollWithFall(ped, time, p2, ragdollType, x, y, z, p7, p8, p9, p10, p11, p12, p13); }

  ["_0x03EA03AF85A85CB7"](...args: any[]) { return Citizen.invokeNative("0x03EA03AF85A85CB7", ...args); }
  ["_0x06087579E7AA85A9"](...args: any[]) { return Citizen.invokeNative("0x06087579E7AA85A9", ...args); }
  ["_0x061CB768363D6424"](...args: any[]) { return Citizen.invokeNative("0x061CB768363D6424", ...args); }
  ["_0x0B3E35AC043707D9"](...args: any[]) { return Citizen.invokeNative("0x0B3E35AC043707D9", ...args); }
  ["_0x0F62619393661D6E"](...args: any[]) { return Citizen.invokeNative("0x0F62619393661D6E", ...args); }
  ["_0x110F526AB784111F"](...args: any[]) { return Citizen.invokeNative("0x110F526AB784111F", ...args); }
  ["_0x1216E0BFA72CC703"](...args: any[]) { return Citizen.invokeNative("0x1216E0BFA72CC703", ...args); }
  ["_0x1A330D297AAC6BC1"](...args: any[]) { return Citizen.invokeNative("0x1A330D297AAC6BC1", ...args); }
  ["_0x1E77FA7A62EE6C4C"](...args: any[]) { return Citizen.invokeNative("0x1E77FA7A62EE6C4C", ...args); }
  ["_0x2016C603D6B8987C"](...args: any[]) { return Citizen.invokeNative("0x2016C603D6B8987C", ...args); }
  ["_0x25361A96E0F7E419"](...args: any[]) { return Citizen.invokeNative("0x25361A96E0F7E419", ...args); }
  ["_0x2735233A786B1BEF"](...args: any[]) { return Citizen.invokeNative("0x2735233A786B1BEF", ...args); }
  ["_0x288DF530C92DAD6F"](...args: any[]) { return Citizen.invokeNative("0x288DF530C92DAD6F", ...args); }
  ["_0x2B694AFCF64E6994"](...args: any[]) { return Citizen.invokeNative("0x2B694AFCF64E6994", ...args); }
  ["_0x2DFC81C9B9608549"](...args: any[]) { return Citizen.invokeNative("0x2DFC81C9B9608549", ...args); }
  ["_0x2F074C904D85129E"](...args: any[]) { return Citizen.invokeNative("0x2F074C904D85129E", ...args); }
  ["_0x2F3C3D9F50681DE4"](...args: any[]) { return Citizen.invokeNative("0x2F3C3D9F50681DE4", ...args); }
  ["_0x336B3D200AB007CB"](...args: any[]) { return Citizen.invokeNative("0x336B3D200AB007CB", ...args); }
  ["_0x3E9679C1DFCF422C"](...args: any[]) { return Citizen.invokeNative("0x3E9679C1DFCF422C", ...args); }
  ["_0x412F1364FA066CFB"](...args: any[]) { return Citizen.invokeNative("0x412F1364FA066CFB", ...args); }
  ["_0x425AECF167663F48"](...args: any[]) { return Citizen.invokeNative("0x425AECF167663F48", ...args); }
  ["_0x451D05012CCEC234"](...args: any[]) { return Citizen.invokeNative("0x451D05012CCEC234", ...args); }
  ["_0x46B05BCAE43856B0"](...args: any[]) { return Citizen.invokeNative("0x46B05BCAE43856B0", ...args); }
  ["_0x49E50BDB8BA4DAB2"](...args: any[]) { return Citizen.invokeNative("0x49E50BDB8BA4DAB2", ...args); }
  ["_0x511F1A683387C7E2"](...args: any[]) { return Citizen.invokeNative("0x511F1A683387C7E2", ...args); }
  ["_0x5407B7288D0478B7"](...args: any[]) { return Citizen.invokeNative("0x5407B7288D0478B7", ...args); }
  ["_0x5A7F62FDA59759BD"](...args: any[]) { return Citizen.invokeNative("0x5A7F62FDA59759BD", ...args); }
  ["_0x5B6010B3CBC29095"](...args: any[]) { return Citizen.invokeNative("0x5B6010B3CBC29095", ...args); }
  ["_0x6647C5F6F5792496"](...args: any[]) { return Citizen.invokeNative("0x6647C5F6F5792496", ...args); }
  ["_0x711794453CFD692B"](...args: any[]) { return Citizen.invokeNative("0x711794453CFD692B", ...args); }
  ["_0x733C87D4CE22BEA2"](...args: any[]) { return Citizen.invokeNative("0x733C87D4CE22BEA2", ...args); }
  ["_0x75BA1CB3B7D40CAF"](...args: any[]) { return Citizen.invokeNative("0x75BA1CB3B7D40CAF", ...args); }
  ["_0x80054D7FCC70EEC6"](...args: any[]) { return Citizen.invokeNative("0x80054D7FCC70EEC6", ...args); }
  ["_0x820E9892A77E97CD"](...args: any[]) { return Citizen.invokeNative("0x820E9892A77E97CD", ...args); }
  ["_0x83A169EABCDB10A2"](...args: any[]) { return Citizen.invokeNative("0x83A169EABCDB10A2", ...args); }
  ["_0x87DDEB611B329A9C"](...args: any[]) { return Citizen.invokeNative("0x87DDEB611B329A9C", ...args); }
  ["_0x9911F4A24485F653"](...args: any[]) { return Citizen.invokeNative("0x9911F4A24485F653", ...args); }
  ["_0x9A77DFD295E29B09"](...args: any[]) { return Citizen.invokeNative("0x9A77DFD295E29B09", ...args); }
  ["_0x9C6A6C19B6C0C496"](...args: any[]) { return Citizen.invokeNative("0x9C6A6C19B6C0C496", ...args); }
  ["_0x9E30E91FB03A2CAF"](...args: any[]) { return Citizen.invokeNative("0x9E30E91FB03A2CAF", ...args); }
  ["_0xA3F3564A5B3646C0"](...args: any[]) { return Citizen.invokeNative("0xA3F3564A5B3646C0", ...args); }
  ["_0xA52D5247A4227E14"](...args: any[]) { return Citizen.invokeNative("0xA52D5247A4227E14", ...args); }
  ["_0xA660FAF550EB37E5"](...args: any[]) { return Citizen.invokeNative("0xA660FAF550EB37E5", ...args); }
  ["_0xA9B61A329BFDCBEA"](...args: any[]) { return Citizen.invokeNative("0xA9B61A329BFDCBEA", ...args); }
  ["_0xAAA6A3698A69E048"](...args: any[]) { return Citizen.invokeNative("0xAAA6A3698A69E048", ...args); }
  ["_0xAD27D957598E49E9"](...args: any[]) { return Citizen.invokeNative("0xAD27D957598E49E9", ...args); }
  ["_0xAFC976FD0580C7B3"](...args: any[]) { return Citizen.invokeNative("0xAFC976FD0580C7B3", ...args); }
  ["_0xB282749D5E028163"](...args: any[]) { return Citizen.invokeNative("0xB282749D5E028163", ...args); }
  ["_0xB8B52E498014F5B0"](...args: any[]) { return Citizen.invokeNative("0xB8B52E498014F5B0", ...args); }
  ["_0xC2EE020F5FB4DB53"](...args: any[]) { return Citizen.invokeNative("0xC2EE020F5FB4DB53", ...args); }
  ["_0xC30BDAEE47256C13"](...args: any[]) { return Citizen.invokeNative("0xC30BDAEE47256C13", ...args); }
  ["_0xC56FBF2F228E1DAC"](...args: any[]) { return Citizen.invokeNative("0xC56FBF2F228E1DAC", ...args); }
  ["_0xCD018C591F94CB43"](...args: any[]) { return Citizen.invokeNative("0xCD018C591F94CB43", ...args); }
  ["_0xCEDA60A74219D064"](...args: any[]) { return Citizen.invokeNative("0xCEDA60A74219D064", ...args); }
  ["_0xD33DAA36272177C4"](...args: any[]) { return Citizen.invokeNative("0xD33DAA36272177C4", ...args); }
  ["_0xDFE68C4B787E1BFB"](...args: any[]) { return Citizen.invokeNative("0xDFE68C4B787E1BFB", ...args); }
  ["_0xE861D0B05C7662B8"](...args: any[]) { return Citizen.invokeNative("0xE861D0B05C7662B8", ...args); }
  ["_0xE906EC930F5FE7C8"](...args: any[]) { return Citizen.invokeNative("0xE906EC930F5FE7C8", ...args); }
  ["_0xEA9960D07DADCF10"](...args: any[]) { return Citizen.invokeNative("0xEA9960D07DADCF10", ...args); }
  ["_0xEC4B4B3B9908052A"](...args: any[]) { return Citizen.invokeNative("0xEC4B4B3B9908052A", ...args); }
  ["_0xEC6935EBE0847B90"](...args: any[]) { return Citizen.invokeNative("0xEC6935EBE0847B90", ...args); }
  ["_0xED3C76ADFA6D07C4"](...args: any[]) { return Citizen.invokeNative("0xED3C76ADFA6D07C4", ...args); }
  ["_0xF033419D1B81FAE8"](...args: any[]) { return Citizen.invokeNative("0xF033419D1B81FAE8", ...args); }
  ["_0xF2385935BFFD4D92"](...args: any[]) { return Citizen.invokeNative("0xF2385935BFFD4D92", ...args); }
  ["_0xF2BEBCDFAFDAA19E"](...args: any[]) { return Citizen.invokeNative("0xF2BEBCDFAFDAA19E", ...args); }
  ["_0xF9ACF4A08098EA25"](...args: any[]) { return Citizen.invokeNative("0xF9ACF4A08098EA25", ...args); }
  ["_0xFAB944D4D481ACCB"](...args: any[]) { return Citizen.invokeNative("0xFAB944D4D481ACCB", ...args); }
  ["_0xFD325494792302D7"](...args: any[]) { return Citizen.invokeNative("0xFD325494792302D7", ...args); }
  ["_0xFEC9A3B1820F3331"](...args: any[]) { return Citizen.invokeNative("0xFEC9A3B1820F3331", ...args); }
  ["_0xFF4803BC019852D9"](...args: any[]) { return Citizen.invokeNative("0xFF4803BC019852D9", ...args); }
}
