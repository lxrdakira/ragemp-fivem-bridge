import { createUnkProxy, toVec3 } from "./_helpers.js";
import { Vector3 } from "@ragemp-fivem-bridge/shared";
import { gtaPedHealthToRage, rageHealthToGtaPed } from "@ragemp-fivem-bridge/shared";

export class GameEntityNs {
  unk = createUnkProxy();

  isAnEntity(handle: number): boolean { return IsAnEntity(handle); }
  isAn(handle: number): boolean { return IsAnEntity(handle); }
  doesExist(entity: number): boolean { return DoesEntityExist(entity); }
  doesBelongToThisScript(entity: number, p1: boolean): boolean { return DoesEntityBelongToThisScript(entity, p1); }
  doesHaveDrawable(entity: number): boolean { return DoesEntityHaveDrawable(entity); }
  doesHavePhysics(entity: number): boolean { return DoesEntityHavePhysics(entity); }
  getType(entity: number): number { return GetEntityType(entity); }
  getModel(entity: number): number { return GetEntityModel(entity); }
  getPopulationType(entity: number): number { return GetEntityPopulationType(entity); }
  isAPed(entity: number): boolean { return IsEntityAPed(entity); }
  isAMissionEntity(entity: number): boolean { return IsEntityAMissionEntity(entity); }
  isAVehicle(entity: number): boolean { return IsEntityAVehicle(entity); }
  isAnObject(entity: number): boolean { return IsEntityAnObject(entity); }
  getObjectIndexFromIndex(entity: number): number { return GetObjectIndexFromEntityIndex(entity); }
  getPedIndexFromIndex(entity: number): number { return GetPedIndexFromEntityIndex(entity); }
  getVehicleIndexFromIndex(entity: number): number { return GetVehicleIndexFromEntityIndex(entity); }

  getCoords(entity: number, alive: boolean): Vector3 { return toVec3(GetEntityCoords(entity, alive ?? true)); }
  setCoords(entity: number, xPos: number, yPos: number, zPos: number, xAxis: boolean, yAxis: boolean, zAxis: boolean, clearArea: boolean): void { SetEntityCoords(entity, xPos, yPos, zPos, xAxis ?? false, yAxis ?? false, zAxis ?? false, clearArea ?? true); }
  setCoordsNoOffset(entity: number, xPos: number, yPos: number, zPos: number, xAxis: boolean, yAxis: boolean, zAxis: boolean): void { SetEntityCoordsNoOffset(entity, xPos, yPos, zPos, xAxis ?? true, yAxis ?? true, zAxis ?? true); }
  setEntityCoordsNoOffset(entity: number, xPos: number, yPos: number, zPos: number, keepTasks: boolean, keepIK: boolean, doWarp: boolean): void { SetEntityCoordsNoOffset(entity, xPos, yPos, zPos, keepTasks ?? true, keepIK ?? true, doWarp ?? true); }
  getHeading(entity: number): number { return GetEntityHeading(entity); }
  setHeading(entity: number, heading: number): void { SetEntityHeading(entity, heading); }
  getRotation(entity: number, rotationOrder: number): Vector3 { return toVec3(GetEntityRotation(entity, rotationOrder ?? 2)); }
  setRotation(entity: number, pitch: number, roll: number, yaw: number, rotationOrder: number, p5: boolean): void { SetEntityRotation(entity, pitch, roll, yaw, rotationOrder ?? 2, p5 ?? true); }
  getRotationVelocity(entity: number): Vector3 { return toVec3(GetEntityRotationVelocity(entity)); }
  getPitch(entity: number): number { return GetEntityPitch(entity); }
  getRoll(entity: number): number { return GetEntityRoll(entity); }
  getUprightValue(entity: number): number { return GetEntityUprightValue(entity); }
  getQuaternion(entity: number): { x: number; y: number; z: number; w: number } { const r = GetEntityQuaternion(entity); return { x: r[0], y: r[1], z: r[2], w: r[3] }; }
  setQuaternion(entity: number, x: number, y: number, z: number, w: number): void { SetEntityQuaternion(entity, x, y, z, w); }
  getMatrix(entity: number): { forwardVector: Vector3; rightVector: Vector3; upVector: Vector3; position: Vector3 } { const r = GetEntityMatrix(entity); return { forwardVector: toVec3(r[0]), rightVector: toVec3(r[1]), upVector: toVec3(r[2]), position: toVec3(r[3]) }; }
  getForwardVector(entity: number): Vector3 { return toVec3(GetEntityForwardVector(entity)); }
  getForwardX(entity: number): number { return GetEntityForwardX(entity); }
  getForwardY(entity: number): number { return GetEntityForwardY(entity); }
  getOffsetFromInWorldCoords(entity: number, offsetX: number, offsetY: number, offsetZ: number): Vector3 { return toVec3(GetOffsetFromEntityInWorldCoords(entity, offsetX, offsetY, offsetZ)); }
  getOffsetFromGivenWorldCoords(entity: number, posX: number, posY: number, posZ: number): Vector3 { return toVec3(GetOffsetFromEntityGivenWorldCoords(entity, posX, posY, posZ)); }
  getHeight(entity: number, X: number, Y: number, Z: number, atTop: boolean, inWorldCoords: boolean): number { return GetEntityHeight(entity, X, Y, Z, !!atTop, !!inWorldCoords); }
  getHeightAboveGround(entity: number): number { return GetEntityHeightAboveGround(entity); }
  getSubmergedLevel(entity: number): number { return GetEntitySubmergedLevel(entity); }

  getVelocity(entity: number): Vector3 { return toVec3(GetEntityVelocity(entity)); }
  setVelocity(entity: number, x: number, y: number, z: number): void { SetEntityVelocity(entity, x, y, z); }
  setAngularVelocity(entity: number, x: number, y: number, z: number): void { SetEntityAngularVelocity(entity, x, y, z); }
  getSpeed(entity: number): number { return GetEntitySpeed(entity); }
  getSpeedVector(entity: number, relative: boolean): Vector3 { return toVec3(GetEntitySpeedVector(entity, !!relative)); }
  setMaxSpeed(entity: number, speed: number): void { SetEntityMaxSpeed(entity, speed); }
  setEntityMaxSpeed(entity: number, speed: number): void { SetEntityMaxSpeed(entity, speed); }

  getHealth(entity: number): number { const h = GetEntityHealth(entity); return IsEntityAPed(entity) ? gtaPedHealthToRage(h) : h; }
  setHealth(entity: number, health: number): void { SetEntityHealth(entity, IsEntityAPed(entity) ? rageHealthToGtaPed(health) : health); }
  getMaxHealth(entity: number): number { const h = GetEntityMaxHealth(entity); return IsEntityAPed(entity) ? gtaPedHealthToRage(h) : h; }
  setMaxHealth(entity: number, value: number): void { SetEntityMaxHealth(entity, IsEntityAPed(entity) ? rageHealthToGtaPed(value) : value); }

  setCanBeDamaged(entity: number, toggle: boolean): void { SetEntityCanBeDamaged(entity, !!toggle); }
  getCanBeDamaged(entity: number): boolean { return GetEntityCanBeDamaged(entity); }
  setCanBeDamagedByRelationshipGroup(entity: number, bCanBeDamaged: boolean, relGroup: number): void { SetEntityCanBeDamagedByRelationshipGroup(entity, !!bCanBeDamaged, relGroup); }
  setCanBeTargetedWithoutLos(entity: number, toggle: boolean): void { SetEntityCanBeTargetedWithoutLos(entity, !!toggle); }
  setOnlyDamagedByPlayer(entity: number, toggle: boolean): void { SetEntityOnlyDamagedByPlayer(entity, !!toggle); }
  setOnlyDamagedByRelationshipGroup(entity: number, p1: boolean, p2: number): void { SetEntityOnlyDamagedByRelationshipGroup(entity, !!p1, p2); }
  setProofs(entity: number, bulletProof: boolean, fireProof: boolean, explosionProof: boolean, collisionProof: boolean, meleeProof: boolean, p6: boolean, p7: boolean, drownProof: boolean): void { SetEntityProofs(entity, !!bulletProof, !!fireProof, !!explosionProof, !!collisionProof, !!meleeProof, p6 ?? false, p7 ?? false, drownProof ?? false); }
  getProofs(entity: number): { bulletProof: boolean; fireProof: boolean; explosionProof: boolean; collisionProof: boolean; meleeProof: boolean; steamProof: boolean; p7: boolean; drownProof: boolean; result: boolean } { const r = GetEntityProofs(entity); return { bulletProof: !!r[1], fireProof: !!r[2], explosionProof: !!r[3], collisionProof: !!r[4], meleeProof: !!r[5], steamProof: !!r[6], p7: !!r[7], drownProof: !!r[8], result: !!r[0] }; }
  setInvincible(entity: number, toggle: boolean): void { SetEntityInvincible(entity, !!toggle); }
  setIsTargetPriority(entity: number, p1: boolean, p2: number): void { SetEntityIsTargetPriority(entity, !!p1, p2); }
  hasBeenDamagedByAnyObject(entity: number): boolean { return HasEntityBeenDamagedByAnyObject(entity); }
  hasBeenDamagedByAnyPed(entity: number): boolean { return HasEntityBeenDamagedByAnyPed(entity); }
  hasBeenDamagedByAnyVehicle(entity: number): boolean { return HasEntityBeenDamagedByAnyVehicle(entity); }
  hasBeenDamagedByEntity(entity1: number, entity2: number, p2: boolean): boolean { return HasEntityBeenDamagedByEntity(entity1, entity2, p2 ?? true); }
  clearLastDamageEntity(entity: number): void { ClearEntityLastDamageEntity(entity); }
  getLastMaterialHitBy(entity: number): number { return GetLastMaterialHitByEntity(entity); }
  getCollisionNormalOfLastHitFor(entity: number): Vector3 { return toVec3(GetCollisionNormalOfLastHitForEntity(entity)); }

  hasClearLosToEntity(entity1: number, entity2: number, traceType: number): boolean { return HasEntityClearLosToEntity(entity1, entity2, traceType ?? 17); }
  hasClearLosToEntityInFront(entity1: number, entity2: number): boolean { return HasEntityClearLosToEntityInFront(entity1, entity2); }
  hasCollidedWithAnything(entity: number): boolean { return HasEntityCollidedWithAnything(entity); }
  hasCollisionLoadedAround(entity: number): boolean { return HasCollisionLoadedAroundEntity(entity); }
  setCollision(entity: number, toggle: boolean, keepPhysics: boolean): void { SetEntityCollision(entity, !!toggle, keepPhysics ?? true); }
  getCollisionDisabled(entity: number): boolean { return GetEntityCollisionDisabled(entity); }
  setCompletelyDisableCollision(entity: number, toggle: boolean, keepPhysics: boolean): void { SetEntityCompletelyDisableCollision(entity, !!toggle, !!keepPhysics); }
  setNoCollisionEntity(entity1: number, entity2: number, thisFrameOnly: boolean): void { SetEntityNoCollisionEntity(entity1, entity2, !!thisFrameOnly); }
  setRecordsCollisions(entity: number, toggle: boolean): void { SetEntityRecordsCollisions(entity, !!toggle); }
  isWaitingForWorldCollision(entity: number): boolean { return IsEntityWaitingForWorldCollision(entity); }

  playAnim(entity: number, animName: string, animDict: string, p3: number, loop: boolean, stayInAnim: boolean, p6: boolean, delta: number, bitset: number): boolean { return PlayEntityAnim(entity, animName, animDict, p3, !!loop, !!stayInAnim, !!p6, delta ?? 0, bitset ?? 0); }
  stopAnim(entity: number, animation: string, animGroup: string, p3: number): number { return StopEntityAnim(entity, animation, animGroup, p3); }
  isPlayingAnim(entity: number, animDict: string, animName: string, taskFlag: number): boolean { return IsEntityPlayingAnim(entity, animDict, animName, taskFlag ?? 3); }
  hasAnimFinished(entity: number, animDict: string, animName: string, p3: number): boolean { return HasEntityAnimFinished(entity, animDict, animName, p3 ?? 3); }
  hasAnimEventFired(entity: number, actionHash: number): boolean { return HasAnimEventFired(entity, actionHash); }
  findAnimEventPhase(animDictionary: string, animName: string, p2: string): { p3: number; p4: number; result: boolean } { return (FindAnimEventPhase as any)(animDictionary, animName, p2); }
  getAnimCurrentTime(entity: number, animDict: string, animName: string): number { return GetEntityAnimCurrentTime(entity, animDict, animName); }
  getAnimTotalTime(entity: number, animDict: string, animName: string): number { return GetEntityAnimTotalTime(entity, animDict, animName); }
  getAnimDuration(animDict: string, animName: string): number { return GetAnimDuration(animDict, animName); }
  getEntityAnimDuration(animDict: string, animName: string): number { return GetAnimDuration(animDict, animName); }
  setAnimCurrentTime(entity: number, animDictionary: string, animName: string, time: number): void { SetEntityAnimCurrentTime(entity, animDictionary, animName, time); }
  setAnimSpeed(entity: number, animDictionary: string, animName: string, speedMultiplier: number): void { SetEntityAnimSpeed(entity, animDictionary, animName, speedMultiplier); }
  setEntityAnimCurrentTime(entity: number, animDictionary: string, animName: string, time: number): void { SetEntityAnimCurrentTime(entity, animDictionary, animName, time); }
  setEntityAnimSpeed(entity: number, animDictionary: string, animName: string, speedMultiplier: number): void { SetEntityAnimSpeed(entity, animDictionary, animName, speedMultiplier); }

  attachToEntity(entity1: number, entity2: number, boneIndex: number, xPos: number, yPos: number, zPos: number, xRot: number, yRot: number, zRot: number, p9: boolean, useSoftPinning: boolean, collision: boolean, isPed: boolean, vertexIndex: number, fixedRot: boolean): void {
    AttachEntityToEntity(entity1, entity2, boneIndex, xPos, yPos, zPos, xRot, yRot, zRot, !!p9, !!useSoftPinning, !!collision, !!isPed, vertexIndex ?? 2, !!fixedRot);
  }
  attachBoneToEntityBone(entity1: number, entity2: number, boneIndex1: number, boneIndex2: number, p4: boolean, p5: boolean): void { AttachEntityBoneToEntityBone(entity1, entity2, boneIndex1, boneIndex2, !!p4, !!p5); }
  processAttachments(entity: number): void { ProcessEntityAttachments(entity); }
  isAttached(entity: number): boolean { return IsEntityAttached(entity); }
  isAttachedToAnyObject(entity: number): boolean { return IsEntityAttachedToAnyObject(entity); }
  isAttachedToAnyPed(entity: number): boolean { return IsEntityAttachedToAnyPed(entity); }
  isAttachedToAnyVehicle(entity: number): boolean { return IsEntityAttachedToAnyVehicle(entity); }
  isAttachedToEntity(from: number, to: number): boolean { return IsEntityAttachedToEntity(from, to); }
  detach(entity: number, dynamic: boolean, collision: boolean): void { DetachEntity(entity, dynamic ?? true, collision ?? true); }
  getAttachedTo(entity: number): number { return GetEntityAttachedTo(entity); }

  getBoneIndexByName(entity: number, boneName: string): number { return GetEntityBoneIndexByName(entity, boneName); }
  getBoneRotation(entity: number, boneIndex: number): Vector3 { return toVec3(GetEntityBoneRotation(entity, boneIndex)); }
  getBoneCount(entity: number): number { return GetEntityBoneCount(entity); }
  getWorldPositionOfBone(entity: number, boneIndex: number): Vector3 { return toVec3(GetWorldPositionOfEntityBone(entity, boneIndex)); }
  getBonePosition2(entity: number, boneIndex: number): Vector3 { return toVec3(GetWorldPositionOfEntityBone(entity, boneIndex)); }

  isDead(entity: number): boolean { return IsEntityDead(entity); }
  isEntityDead(entity: number): boolean { return IsEntityDead(entity); }
  isInAir(entity: number): boolean { return IsEntityInAir(entity); }
  isInWater(entity: number): boolean { return IsEntityInWater(entity); }
  isEntityInWater(entity: number): boolean { return IsEntityInWater(entity); }
  isAtEntity(entity1: number, entity2: number, xSize: number, ySize: number, zSize: number, p5: boolean, p6: boolean, p7: number): boolean { return IsEntityAtEntity(entity1, entity2, xSize, ySize, zSize, !!p5, !!p6, p7); }
  isInArea(entity: number, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, p7: boolean, p8: boolean, p9: number): boolean { return IsEntityInArea(entity, x1, y1, z1, x2, y2, z2, !!p7, !!p8, p9); }
  isInZone(entity: number, zone: string): boolean { return IsEntityInZone(entity, zone); }
  isOnScreen(entity: number): boolean { return IsEntityOnScreen(entity); }
  isStatic(entity: number): boolean { return IsEntityStatic(entity); }
  isTouchingEntity(entity: number, targetEntity: number): boolean { return IsEntityTouchingEntity(entity, targetEntity); }
  isTouchingModel(entity: number, modelHash: number): boolean { return IsEntityTouchingModel(entity, modelHash); }
  isUpright(entity: number, angle: number): boolean { return IsEntityUpright(entity, angle ?? 30.0); }
  isUpsidedown(entity: number): boolean { return IsEntityUpsidedown(entity); }
  isVisible(entity: number): boolean { return IsEntityVisible(entity); }
  isVisibleToScript(entity: number): boolean { return IsEntityVisibleToScript(entity); }
  isOccluded(entity: number): boolean { return IsEntityOccluded(entity); }
  wouldBeOccluded(entityModelHash: number, x: number, y: number, z: number, p4: boolean): boolean { return WouldEntityBeOccluded(entityModelHash, x, y, z, !!p4); }
  wouldEntityBeOccluded(entityModelHash: number, x: number, y: number, z: number, p4: boolean): boolean { return WouldEntityBeOccluded(entityModelHash, x, y, z, !!p4); }

  getScript(entity: number): { script: number; result: string } | string { const r = GetEntityScript(entity); return Array.isArray(r) ? r[0] : r; }
  getNearestPlayerTo(entity: number): number { return GetNearestPlayerToEntity(entity); }
  getNearestPlayerToOnTeam(entity: number, team: number): number { return GetNearestPlayerToEntityOnTeam(entity, team); }
  forceAiAndAnimationUpdate(entity: number): void { ForceEntityAiAndAnimationUpdate(entity); }
  setAsMissionEntity(entity: number, p1: boolean, p2: boolean): void { SetEntityAsMissionEntity(entity, p1 ?? true, p2 ?? true); }
  setAsNoLongerNeeded(entity: number): number { return (SetEntityAsNoLongerNeeded as any)(entity); }
  setPedAsNoLongerNeeded(ped: number): number { return (SetPedAsNoLongerNeeded as any)(ped); }
  setVehicleAsNoLongerNeeded(vehicle: number): number { return (SetVehicleAsNoLongerNeeded as any)(vehicle); }
  setObjectAsNoLongerNeeded(object: number): number { return (SetObjectAsNoLongerNeeded as any)(object); }
  delete(entity: number): number { return (DeleteEntity as any)(entity); }

  setDynamic(entity: number, toggle: boolean): void { SetEntityDynamic(entity, !!toggle); }
  setLights(entity: number, toggle: boolean): void { SetEntityLights(entity, !!toggle); }
  setLoadCollisionFlag(entity: number, toggle: boolean): void { SetEntityLoadCollisionFlag(entity, !!toggle); }
  setAlpha(entity: number, alphaLevel: number, skin: boolean): void { SetEntityAlpha(entity, alphaLevel, skin ?? false); }
  getAlpha(entity: number): number { return GetEntityAlpha(entity); }
  resetAlpha(entity: number): void { ResetEntityAlpha(entity); }
  setAlwaysPrerender(entity: number, toggle: boolean): void { SetEntityAlwaysPrerender(entity, !!toggle); }
  setRenderScorched(entity: number, toggle: boolean): void { SetEntityRenderScorched(entity, !!toggle); }
  setTrafficlightOverride(entity: number, state: number): void { SetEntityTrafficlightOverride(entity, state); }
  setMotionBlur(entity: number, toggle: boolean): void { SetEntityMotionBlur(entity, !!toggle); }
  setCanAutoVaultOn(entity: number, toggle: boolean): void { SetCanAutoVaultOnEntity(entity, !!toggle); }
  setCanClimbOn(entity: number, toggle: boolean): void { SetCanClimbOnEntity(entity, !!toggle); }
  setLodDist(entity: number, value: number): void { SetEntityLodDist(entity, value); }
  getLodDist(entity: number): number { return GetEntityLodDist(entity); }
  setHasGravity(entity: number, toggle: boolean): void { SetEntityHasGravity(entity, !!toggle); }
  freezePosition(entity: number, toggle: boolean): void { FreezeEntityPosition(entity, !!toggle); }
  applyForceToCenterOfMass(entity: number, forceType: number, x: number, y: number, z: number, p5: boolean, isDirectionRel: boolean, isForceRel: boolean, p8: boolean): void {
    ApplyForceToEntity(entity, forceType, x, y, z, 0, 0, 0, 0, !!isDirectionRel, !!isForceRel, p8 ?? false, false, false);
  }
  setVisible(entity: number, toggle: boolean, unk: boolean): void { SetEntityVisible(entity, !!toggle, unk ?? false); }

  createModelSwap(x: number, y: number, z: number, radius: number, originalModel: number, newModel: number, p6: boolean): void { CreateModelSwap(x, y, z, radius, originalModel, newModel, !!p6); }
  removeModelSwap(x: number, y: number, z: number, radius: number, originalModel: number, newModel: number, p6: boolean): void { RemoveModelSwap(x, y, z, radius, originalModel, newModel, !!p6); }
  createModelHide(x: number, y: number, z: number, radius: number, modelHash: number, p5: boolean): void { CreateModelHide(x, y, z, radius, modelHash, p5 ?? false); }
  createModelHideExcludingScriptObjects(x: number, y: number, z: number, radius: number, modelHash: number, p5: boolean): void { CreateModelHideExcludingScriptObjects(x, y, z, radius, modelHash, p5 ?? false); }
  removeModelHide(x: number, y: number, z: number, radius: number, modelHash: number, p5: boolean): void { if (typeof RemoveModelHide === "function") RemoveModelHide(x, y, z, radius, modelHash, p5 ?? false); }
  createForcedObject(x: number, y: number, z: number, p3: number, modelHash: number, p5: boolean): void { CreateForcedObject(x, y, z, p3, modelHash, !!p5); }
  removeForcedObject(x: number, y: number, z: number, p3: number, modelHash: number): void { RemoveForcedObject(x, y, z, p3, modelHash); }
  stopSynchronizedMapEntityAnim(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): boolean { return StopSynchronizedMapEntityAnim(x1, y1, z1, x2, y2, z2); }

  applyForceTo(entity: number, forceFlags: number, x: number, y: number, z: number, offX: number, offY: number, offZ: number, boneIndex: number, isDirectionRel: boolean, ignoreUpVec: boolean, isForceRel: boolean, p12: boolean, p13: boolean): void {
    ApplyForceToEntity(entity, forceFlags, x, y, z, offX ?? 0, offY ?? 0, offZ ?? 0, boneIndex ?? 0, !!isDirectionRel, !!ignoreUpVec, !!isForceRel, !!p12, !!p13);
  }
  attachBoneToEntityBonePhysically(entity1: number, entity2: number, boneIndex1: number, boneIndex2: number, p4: boolean, p5: boolean): void { AttachEntityBoneToEntityBonePhysically(entity1, entity2, boneIndex1, boneIndex2, !!p4, !!p5); }
  attachToEntityPhysically(entity1: number, entity2: number, boneIndex1: number, boneIndex2: number, xPos1: number, yPos1: number, zPos1: number, xPos2: number, yPos2: number, zPos2: number, xRot: number, yRot: number, zRot: number, breakForce: number, fixedRot: boolean, p15: boolean, collision: boolean, p17: boolean, p18: number): void {
    AttachEntityToEntityPhysically(entity1, entity2, boneIndex1, boneIndex2, xPos1, yPos1, zPos1, xPos2, yPos2, zPos2, xRot, yRot, zRot, breakForce, !!fixedRot, !!p15, !!collision, !!p17, p18 ?? 2);
  }
  enableUnk(entity: number): void { EnableEntityUnk(entity); }
  getBoneRotationLocal(entity: number, boneIndex: number): Vector3 { return toVec3(GetEntityBoneRotationLocal(entity, boneIndex)); }
  getPhysicsHeading(entity: number): number { return GetEntityPhysicsHeading(entity); }
  getPickup(entity: number, modelHash: number): number { return GetEntityPickup(entity, modelHash); }
  hasClearLosToEntity2(entity1: number, entity2: number, traceType: number): number { return Number(HasEntityClearLosToEntity(entity1, entity2, traceType)); }
  isAtCoord(entity: number, xPos: number, yPos: number, zPos: number, xSize: number, ySize: number, zSize: number, p7: boolean, p8: boolean, p9: number): boolean { return IsEntityAtCoord(entity, xPos, yPos, zPos, xSize, ySize, zSize, !!p7, !!p8, p9); }
  isInAngledArea(entity: number, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, width: number, debug: boolean, includeZ: boolean, p10: number): boolean { return IsEntityInAngledArea(entity, x1, y1, z1, x2, y2, z2, width, !!debug, !!includeZ, p10); }
  playSynchronizedAnim(entity: number, syncedScene: number, animation: string, propName: string, p4: number, p5: number, p6: number, p7: number): boolean { return PlaySynchronizedEntityAnim(entity, syncedScene, animation, propName, p4, p5, p6, p7); }
  playSynchronizedMapAnim(x: number, y: number, z: number, radius: number, objectModelHash: string | number, sceneId: number, pAnimName: string, pAnimDictName: string, fBlendDelta: number, fBlendOutDelta: number, flags: number, fMoverBlendInDelta: number): { p6: number; p7: number; result: boolean } {
    const r: any = PlaySynchronizedMapEntityAnim(x, y, z, radius, objectModelHash, sceneId, pAnimName, pAnimDictName, fBlendDelta, fBlendOutDelta, flags, fMoverBlendInDelta);
    return { p6: r[1], p7: r[2], result: !!r[0] };
  }
  setCleanupByEngine(entity: number, toggle: boolean): void { SetEntityCleanupByEngine(entity, !!toggle); }
  setCoordsWithoutPlantsReset(entity: number, xPos: number, yPos: number, zPos: number, alive: boolean, deadFlag: boolean, ragdollFlag: boolean, clearArea: boolean): void {
    SetEntityCoordsWithoutPlantsReset(entity, xPos, yPos, zPos, !!alive, !!deadFlag, !!ragdollFlag, !!clearArea);
  }
  setDecalsDisabled(entity: number, p1: boolean): void { SetEntityDecalsDisabled(entity, !!p1); }
  stopSynchronizedAnim(entity: number, p1: number, p2: boolean): boolean { return StopSynchronizedEntityAnim(entity, p1, !!p2); }
  stopSynchronizedMapAnim(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number): boolean { return StopSynchronizedMapEntityAnim(p0, p1, p2, p3, p4, p5); }

  ["_0x694E00132F2823ED"](...args: any[]): any { return Citizen.invokeNative("0x694E00132F2823ED", ...args); }
  ["_0x352E2B5CF420BF3B"](...args: any[]): any { return Citizen.invokeNative("0x352E2B5CF420BF3B", ...args); }
  ["_0xC34BC448DA29F5E9"](...args: any[]): any { return Citizen.invokeNative("0xC34BC448DA29F5E9", ...args); }
  ["_0xE66377CDDADA4810"](...args: any[]): any { return Citizen.invokeNative("0xE66377CDDADA4810", ...args); }
  ["_0x490861B88F4FD846"](...args: any[]): any { return Citizen.invokeNative("0x490861B88F4FD846", ...args); }
  ["_0xCEA7C8E1B48FF68C"](...args: any[]): any { return Citizen.invokeNative("0xCEA7C8E1B48FF68C", ...args); }
  ["_0x5C3B791D580E0BC2"](...args: any[]): any { return Citizen.invokeNative("0x5C3B791D580E0BC2", ...args); }
  ["_0x78E8E3A640178255"](...args: any[]): any { return Citizen.invokeNative("0x78E8E3A640178255", ...args); }
  ["_0xDC6F8601FAF2E893"](...args: any[]): any { return Citizen.invokeNative("0xDC6F8601FAF2E893", ...args); }
  ["_0x1A092BB0C3808B96"](...args: any[]): any { return Citizen.invokeNative("0x1A092BB0C3808B96", ...args); }
  ["_0xB17BC6453F6CF5AC"](...args: any[]): any { return Citizen.invokeNative("0xB17BC6453F6CF5AC", ...args); }
  ["_0x68B562E124CC0AEF"](...args: any[]): any { return Citizen.invokeNative("0x68B562E124CC0AEF", ...args); }
  ["_0x36F32DE87082343E"](...args: any[]): any { return Citizen.invokeNative("0x36F32DE87082343E", ...args); }
  ["_0xD7B80E7C3BEFC396"](...args: any[]): any { return Citizen.invokeNative("0xD7B80E7C3BEFC396", ...args); }
}
