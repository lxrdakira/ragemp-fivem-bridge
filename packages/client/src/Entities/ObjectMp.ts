import { EntityMpBase } from "./EntityMpBase";
import { ObjectInternals, initObjectInternals } from "../internal/objectInternals";
import { removeFromObjectPool } from "../internal/pools/objectPoolService";
import { setNativeEntityVisible } from "../utils/nativeEntityDimension";

export class ObjectMp extends EntityMpBase {
  constructor(token: symbol, id: number, handle: number | null) {
    super(token, id, "object", handle);
    initObjectInternals(this);
  }

  get hidden(): boolean {
    return !IsEntityVisible(this.handle);
  }
  set hidden(value: boolean) {
    setNativeEntityVisible(this, !value);
  }

  get isWeak(): boolean {
    return ObjectInternals.get(this).isWeak;
  }

  get notifyStreaming(): boolean {
    return ObjectInternals.get(this).notifyStreaming;
  }
  set notifyStreaming(value: boolean) {
    ObjectInternals.get(this).notifyStreaming = value;
  }

  get streamingRange(): number {
    return ObjectInternals.get(this).streamingRange;
  }
  set streamingRange(value: number) {
    ObjectInternals.get(this).streamingRange = value;
  }

  hasBeenBroken(): boolean {
    return HasObjectBeenBroken(this.handle);
  }

  placeOnGroundProperly(): boolean {
    return PlaceObjectOnGroundProperly(this.handle);
  }

  setTargettable(targettable: boolean): void {
    (SetObjectTargettable as (...args: any[]) => void)(this.handle, !!targettable, 0);
  }

  setActivatePhysicsAsSoonAsItIsUnfrozen(toggle: boolean): void {
    SetActivateObjectPhysicsAsSoonAsItIsUnfrozen(this.handle, !!toggle);
  }

  slide(toX: number, toY: number, toZ: number, speedX: number, speedY: number, speedZ: number, collision: boolean): boolean {
    return SlideObject(this.handle, toX, toY, toZ, speedX, speedY, speedZ, !!collision);
  }

  getAllByHash(_hash: number): void { return; }
  setPhysicsParams(): void {}

  markForDeletion(): void {
    SetEntityAsMissionEntity(this.handle, false, true);
  }

  override destroy(): void {
    if (this.handle && DoesEntityExist(this.handle)) {
      SetEntityAsMissionEntity(this.handle, false, true);
      DeleteEntity(this.handle);
    }
    if (globalThis.mp.objects) removeFromObjectPool(globalThis.mp.objects, this.id);
  }
}
