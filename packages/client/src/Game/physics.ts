import { createUnkProxy, toVec3 } from "./_helpers.js";
import { Vector3 } from "@ragemp-fivem-bridge/shared";

export class GamePhysicsNs {
  unk = createUnkProxy();

  getRopeLength(ropeId: number): number { return GetRopeLength(ropeId); } // unverified
  addRope(x: number, y: number, z: number, rotX: number, rotY: number, rotZ: number, length: number, ropeType: number, maxLength: number, minLength: number, windingSpeed: number, p11?: boolean, rigid?: boolean, breakable?: boolean, p14?: number): number {
    return (AddRope as any)(x, y, z, rotX, rotY, rotZ, length, ropeType, maxLength, minLength, windingSpeed, p11 ?? false, rigid ?? false, breakable ?? true, p14 ?? 0);
  }
  deleteRope(rope: number): void { DeleteRope(rope); }
  deleteChildRope(ropeId: number): void { DeleteChildRope(ropeId); }
  doesRopeExist(rope: number): number { return (DoesRopeExist as any)(rope); } // NOTE: native returns [boolean,number] per typings — possible bug
  ropeDrawShadowEnabled(toggle: boolean): number { return RopeDrawShadowEnabled(!!toggle) as number; }
  loadRopeData(ropeId: number, rope_preset: string): void { LoadRopeData(ropeId, rope_preset as any); }
  attachEntitiesToRope(rope: number, ent1: number, ent2: number, ent1X: number, ent1Y: number, ent1Z: number, ent2X: number, ent2Y: number, ent2Z: number, length: number, p10?: boolean, p11?: boolean, p12?: number, p13?: number): void {
    (AttachEntitiesToRope as any)(rope, ent1, ent2, ent1X, ent1Y, ent1Z, ent2X, ent2Y, ent2Z, length, p10 ?? false, p11 ?? false, p12 ?? 0, p13 ?? 0);
  }
  attachRopeToEntity(ropeId: number, entity: number, x: number, y: number, z: number, p5: boolean): void { AttachRopeToEntity(ropeId, entity, x, y, z, !!p5); }
  detachRopeFromEntity(rope: number, entity: number): void { DetachRopeFromEntity(rope, entity); }
  pinRopeVertex(rope: number, vertex: number, x: number, y: number, z: number): void { PinRopeVertex(rope, vertex, x, y, z); }
  unpinRopeVertex(rope: number, vertex: number): void { UnpinRopeVertex(rope, vertex); }
  getRopeVertexCount(rope: number): number { return GetRopeVertexCount(rope); }
  ropeSetUpdatePinverts(ropeId: number): void { RopeSetUpdatePinverts(ropeId); }
  ropeSetUpdateOrder(ropeId: number, p1: number): void { RopeSetUpdateOrder(ropeId, p1); }
  getRopeLastVertexCoord(ropeId: number): Vector3 { return toVec3(GetRopeLastVertexCoord(ropeId)); }
  getRopeVertexCoord(ropeId: number, vertex: number): Vector3 { return toVec3(GetRopeVertexCoord(ropeId, vertex)); }
  startRopeWinding(ropeId: number): void { StartRopeWinding(ropeId); }
  stopRopeWinding(ropeId: number): void { StopRopeWinding(ropeId); }
  startRopeUnwindingFront(ropeId: number): void { StartRopeUnwindingFront(ropeId); }
  stopRopeUnwindingFront(ropeId: number): void { StopRopeUnwindingFront(ropeId); }
  ropeConvertToSimple(ropeId: number): void { RopeConvertToSimple(ropeId); }
  ropeLoadTextures(): void { RopeLoadTextures(); }
  ropeAreTexturesLoaded(): boolean { return RopeAreTexturesLoaded(); }
  ropeUnloadTextures(): void { RopeUnloadTextures(); }
  doesRopeBelongToThisScript(ropeId: number): boolean { return DoesRopeBelongToThisScript(ropeId); } // unverified
  ropeGetDistanceBetweenEnds(ropeId: number): number { return RopeGetDistanceBetweenEnds(ropeId); }
  ropeForceLength(ropeId: number, length: number): void { RopeForceLength(ropeId, length); }
  ropeResetLength(ropeId: number, length: number): void { RopeResetLength(ropeId, length); }
  applyImpulseToCloth(posX: number, posY: number, posZ: number, vecX: number, vecY: number, vecZ: number, impulse: number): void { ApplyImpulseToCloth(posX, posY, posZ, vecX, vecY, vecZ, impulse); }
  setDamping(entity: number, vertex: number, value: number): void { SetDamping(entity, vertex, value); }
  activate(entity: number): void { ActivatePhysics(entity); }
  activatePhysics(entity: number): void { ActivatePhysics(entity); }
  setCgoffset(entity: number, x: number, y: number, z: number): void { SetCgoffset(entity, x, y, z); }
  getCgoffset(entity: number): Vector3 { return toVec3(GetCgoffset(entity)); }
  setCgAtBoundcenter(entity: number): void { SetCgAtBoundcenter(entity); }
  breakEntityGlass(entity: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, p10: boolean): void { BreakEntityGlass(entity, p1, p2, p3, p4, p5, p6, p7, p8, p9, !!p10); }
  getHasObjectFragInst(object: number): boolean { return GetHasObjectFragInst(object); } // unverified
  setDisableBreaking(object: number, toggle: boolean): void { SetDisableBreaking(object, !!toggle); }
  setDisableFragDamage(object: number, toggle: boolean): void { SetDisableFragDamage(object, !!toggle); }
  setEntityProofUnk(entity: number, toggle: boolean): void { SetEntityProofUnk(entity, !!toggle); } // unverified
  setLaunchControlEnabled(toggle: boolean): void { SetLaunchControlEnabled(!!toggle); } // unverified
}
