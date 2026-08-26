import { Entity, Vector3 } from "@ragemp-fivem-bridge/shared";
import { EntityInternals } from "@ragemp-fivem-bridge/shared/internal";
import { toVec3 } from "../utils/vec";
import { safeGetNetworkId } from "../utils/netId";

export class EntityMpBase extends Entity {
  constructor(token: symbol, id: number, type: string, handle: number | null) {
    super(token, id, type, handle);
    EntityInternals.get(this).stateBag = () => globalThis.Entity(this.handle).state;
  }

  override get position(): Vector3 {
    return toVec3(GetEntityCoords(this.handle, true));
  }
  override set position(value: Vector3) {
    SetEntityCoords(this.handle, value.x, value.y, value.z, false, false, false, false);
  }

  get rotation(): Vector3 {
    return toVec3(GetEntityRotation(this.handle, 2));
  }
  set rotation(value: Vector3) {
    SetEntityRotation(this.handle, value.x, value.y, value.z, 2, false);
  }

  get heading(): number {
    return GetEntityHeading(this.handle);
  }
  set heading(value: number) {
    SetEntityHeading(this.handle, value);
  }

  override get model(): number {
    return GetEntityModel(this.handle);
  }

  get netId(): number {
    return safeGetNetworkId(this.handle);
  }

  get velocity(): Vector3 {
    return toVec3(GetEntityVelocity(this.handle));
  }

  override get alpha(): number {
    return GetEntityAlpha(this.handle);
  }
  override set alpha(value: number) {
    SetEntityAlpha(this.handle, value, false);
  }

  get dead(): boolean {
    return IsEntityDead(this.handle);
  }

  getCoords(alive?: boolean): Vector3 {
    return toVec3(GetEntityCoords(this.handle, alive ?? true));
  }

  getRotation(rotationOrder?: number): Vector3 {
    return toVec3(GetEntityRotation(this.handle, rotationOrder ?? 2));
  }

  getForwardVector(): Vector3 {
    return toVec3(GetEntityForwardVector(this.handle));
  }

  getForwardX(): number {
    return GetEntityForwardX(this.handle);
  }

  getForwardY(): number {
    return GetEntityForwardY(this.handle);
  }

  getHeading(): number {
    return GetEntityHeading(this.handle);
  }

  getHealth(): number {
    return GetEntityHealth(this.handle);
  }

  getMaxHealth(): number {
    return GetEntityMaxHealth(this.handle);
  }

  getModel(): number {
    return GetEntityModel(this.handle);
  }

  getType(): number {
    return GetEntityType(this.handle);
  }

  getSpeed(): number {
    return GetEntitySpeed(this.handle);
  }

  getSpeedVector(relative?: boolean): Vector3 {
    return toVec3(GetEntitySpeedVector(this.handle, !!relative));
  }

  getVelocity(): Vector3 {
    return toVec3(GetEntityVelocity(this.handle));
  }

  getRotationVelocity(): Vector3 {
    return toVec3(GetEntityRotationVelocity(this.handle));
  }

  getSubmergedLevel(): number {
    return GetEntitySubmergedLevel(this.handle);
  }

  getHeightAboveGround(): number {
    return GetEntityHeightAboveGround(this.handle);
  }

  getLodDist(): number {
    return GetEntityLodDist(this.handle);
  }

  getAlpha(): number {
    return GetEntityAlpha(this.handle);
  }

  getPopulationType(): number {
    return GetEntityPopulationType(this.handle);
  }

  getOffsetFromInWorldCoords(offsetX: number, offsetY: number, offsetZ: number): Vector3 {
    return toVec3(GetOffsetFromEntityInWorldCoords(this.handle, offsetX, offsetY, offsetZ));
  }

  getOffsetFromGivenWorldCoords(posX: number, posY: number, posZ: number): Vector3 {
    return toVec3(GetOffsetFromEntityGivenWorldCoords(this.handle, posX, posY, posZ));
  }

  getWorldPositionOfBone(boneIndex: number): Vector3 {
    return toVec3(GetWorldPositionOfEntityBone(this.handle, boneIndex));
  }

  getBoneIndexByName(boneName: string): number {
    return GetEntityBoneIndexByName(this.handle, boneName);
  }

  getAttachedTo(): number | null {
    const handle = GetEntityAttachedTo(this.handle);
    if (!handle || handle === 0) return null;
    return handle;
  }

  setCoords(x: number, y: number, z: number, xAxis?: boolean, yAxis?: boolean, zAxis?: boolean, clearArea?: boolean): void {
    SetEntityCoords(this.handle, x, y, z, xAxis ?? false, yAxis ?? false, zAxis ?? false, clearArea ?? true);
  }

  setCoordsNoOffset(x: number, y: number, z: number, xAxis?: boolean, yAxis?: boolean, zAxis?: boolean): void {
    SetEntityCoordsNoOffset(this.handle, x, y, z, xAxis ?? true, yAxis ?? true, zAxis ?? true);
  }

  setRotation(pitch: number, roll: number, yaw: number, rotationOrder?: number, p5?: boolean): void {
    SetEntityRotation(this.handle, pitch, roll, yaw, rotationOrder ?? 2, p5 ?? true);
  }

  setHeading(heading: number): void {
    SetEntityHeading(this.handle, heading);
  }

  setHealth(health: number): void {
    SetEntityHealth(this.handle, health);
  }

  setMaxHealth(value: number): void {
    SetEntityMaxHealth(this.handle, value);
  }

  setAlpha(alphaLevel: number, skin?: boolean): void {
    SetEntityAlpha(this.handle, alphaLevel, !!skin);
  }

  resetAlpha(): void {
    ResetEntityAlpha(this.handle);
  }

  setVelocity(x: number, y: number, z: number): void {
    SetEntityVelocity(this.handle, x, y, z);
  }

  setVisible(toggle: boolean, p2: boolean): void {
    SetEntityVisible(this.handle, !!toggle, !!p2);
  }

  setCollision(toggle: boolean, keepPhysics?: boolean): void {
    SetEntityCollision(this.handle, !!toggle, keepPhysics ?? true);
  }

  setNoCollision(entity: any, toggle: boolean): void {
    SetEntityNoCollisionEntity(this.handle, entity?.handle ?? entity, !!toggle);
  }

  setLodDist(value: number): void {
    SetEntityLodDist(this.handle, value);
  }

  setInvincible(toggle: boolean): void {
    SetEntityInvincible(this.handle, !!toggle);
  }

  setProofs(bulletProof: boolean, fireProof: boolean, explosionProof: boolean, collisionProof: boolean, meleeProof: boolean, steamProof: boolean, p7: boolean, drownProof: boolean): void {
    SetEntityProofs(
      this.handle,
      !!bulletProof,
      !!fireProof,
      !!explosionProof,
      !!collisionProof,
      !!meleeProof,
      !!steamProof,
      !!p7,
      !!drownProof,
    );
  }

  setRenderScorched(toggle: boolean): void {
    SetEntityRenderScorched(this.handle, !!toggle);
  }

  setCanBeDamaged(toggle: boolean): void {
    SetEntityCanBeDamaged(this.handle, !!toggle);
  }

  setOnlyDamagedByPlayer(toggle: boolean): void {
    SetEntityOnlyDamagedByPlayer(this.handle, !!toggle);
  }

  freezePosition(toggle: boolean): void {
    FreezeEntityPosition(this.handle, !!toggle);
  }

  attachTo(entity: any, boneIndex: number, xPos: number, yPos: number, zPos: number, xRot: number, yRot: number, zRot: number, p9: boolean, useSoftPinning: boolean, collision: boolean, isPed: boolean, vertexIndex?: number, fixedRot?: boolean): void {
    AttachEntityToEntity(
      this.handle,
      entity?.handle ?? entity,
      boneIndex,
      xPos, yPos, zPos,
      xRot, yRot, zRot,
      !!p9,
      !!useSoftPinning,
      !!collision,
      !!isPed,
      vertexIndex ?? 2,
      !!fixedRot,
    );
  }

  detach(p1?: boolean, collision?: boolean): void {
    DetachEntity(this.handle, p1 ?? true, collision ?? true);
  }

  isAttached(): boolean {
    return IsEntityAttached(this.handle);
  }

  isAttachedTo(entity: any): boolean {
    return IsEntityAttachedToEntity(this.handle, entity?.handle ?? entity);
  }

  isAttachedToAnyObject(): boolean {
    return IsEntityAttachedToAnyObject(this.handle);
  }

  isAttachedToAnyPed(): boolean {
    return IsEntityAttachedToAnyPed(this.handle);
  }

  isAttachedToAnyVehicle(): boolean {
    return IsEntityAttachedToAnyVehicle(this.handle);
  }

  isInAir(): boolean {
    return IsEntityInAir(this.handle);
  }

  isInWater(): boolean {
    return IsEntityInWater(this.handle);
  }

  isInZone(zone: string): boolean {
    return IsEntityInZone(this.handle, zone);
  }

  isInArea(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, p7: boolean, p8: boolean, p9: any): boolean {
    return IsEntityInArea(this.handle, x1, y1, z1, x2, y2, z2, !!p7, !!p8, p9);
  }

  isInAngledArea(originX: number, originY: number, originZ: number, edgeX: number, edgeY: number, edgeZ: number, angle: number, p8: boolean, p9: boolean, p10: any): boolean {
    return IsEntityInAngledArea(this.handle, originX, originY, originZ, edgeX, edgeY, edgeZ, angle, !!p8, !!p9, p10);
  }

  isVisible(): boolean {
    return IsEntityVisible(this.handle);
  }

  isOnScreen(): boolean {
    return IsEntityOnScreen(this.handle);
  }

  isStatic(): boolean {
    return IsEntityStatic(this.handle);
  }

  isUpsidedown(): boolean {
    return IsEntityUpsidedown(this.handle);
  }

  isUpright(angle?: number): boolean {
    return IsEntityUpright(this.handle, angle ?? 30.0);
  }

  isDead(): boolean {
    return IsEntityDead(this.handle);
  }

  isTouchingEntity(entity: any): boolean {
    return IsEntityTouchingEntity(this.handle, entity?.handle ?? entity);
  }

  isTouchingModel(modelHash: number): boolean {
    return IsEntityTouchingModel(this.handle, modelHash);
  }

  isCollisionDisabled(): boolean {
    return GetEntityCollisionDisabled(this.handle);
  }

  hasClearLosTo(entity: any, traceType?: number): boolean {
    return HasEntityClearLosToEntity(this.handle, entity?.handle ?? entity, traceType ?? 17);
  }

  hasClearLosToInFront(entity: any): boolean {
    return HasEntityClearLosToEntityInFront(this.handle, entity?.handle ?? entity);
  }

  hasBeenDamagedBy(entity: any, p2?: boolean): boolean {
    return HasEntityBeenDamagedByEntity(this.handle, entity?.handle ?? entity, p2 ?? true);
  }

  hasCollidedWithAnything(): boolean {
    return HasEntityCollidedWithAnything(this.handle);
  }

  hasAnimFinished(animDict: string, animName: string, p3?: number): boolean {
    return HasEntityAnimFinished(this.handle, animDict, animName, p3 ?? 3);
  }

  isPlayingAnim(animDict: string, animName: string, taskFlag?: number): boolean {
    return IsEntityPlayingAnim(this.handle, animDict, animName, taskFlag ?? 3);
  }

  playAnim(animName: string, animDict: string, p8?: number, loop?: boolean, stayInAnim?: boolean, p11?: boolean, delta?: number, bitset?: any): boolean {
    return PlayEntityAnim(this.handle, animName, animDict, p8 ?? 8.0, !!loop, !!stayInAnim, !!p11, delta ?? 0, bitset ?? 0);
  }

  applyForceTo(forceType: number, x: number, y: number, z: number, offX?: number, offY?: number, offZ?: number, boneIndex?: number, isDirectionRel?: boolean, ignoreUpVec?: boolean, isForceRel?: boolean, p12?: boolean, p13?: boolean): void {
    ApplyForceToEntity(
      this.handle, forceType, x, y, z,
      offX ?? 0, offY ?? 0, offZ ?? 0,
      boneIndex ?? 0, !!isDirectionRel, ignoreUpVec ?? true, isForceRel ?? true, !!p12, !!p13,
    );
  }

  applyForceToCenterOfMass(forceType: number, x: number, y: number, z: number, p5?: boolean, isRel?: boolean, p7?: boolean, p8?: boolean): void {
    // NOTE: possible runtime bug — !!p5 passes boolean where native expects nComponent: number
    (ApplyForceToEntityCenterOfMass as any)(this.handle, forceType, x, y, z, !!p5, !!isRel, p7 ?? true, !!p8);
  }

  setAsMission(value?: boolean, byThisScript?: boolean): void {
    SetEntityAsMissionEntity(this.handle, value ?? true, byThisScript ?? true);
  }

  doesExist(): boolean {
    return !!this.handle && DoesEntityExist(this.handle);
  }

  override destroy(): void {
    if (this.handle && DoesEntityExist(this.handle)) {
      SetEntityAsMissionEntity(this.handle, false, true);
      DeleteEntity(this.handle);
    }
  }
}
