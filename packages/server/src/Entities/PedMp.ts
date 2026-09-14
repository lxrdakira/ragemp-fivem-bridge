import { Entity, Vector3 } from "@ragemp-fivem-bridge/shared";
import { gtaPedHealthToRage, rageHealthToGtaPed } from "@ragemp-fivem-bridge/shared";
import { scheduleStateBagFlush } from "../utils/stateBagDefer";
import { playerBySource } from "../utils/playerRegistry";
import { safeGetNetworkId } from "../utils/netId";
import { PedInternals, initPedInternals } from "../internal/pedInternals";
import { removeFromPedPool } from "../internal/pools/pedPoolService";
import { EntityInternals } from "@ragemp-fivem-bridge/shared/internal";

export class PedMp extends Entity {
  constructor(token: symbol, id: number, handle: number | null) {
    super(token, id, "ped", handle);
    initPedInternals(this);
    const rec = EntityInternals.get(this);
    rec.stateBag = () => globalThis.Entity(this.handle).state;
    rec.stateBagReady = () => PedInternals.get(this).netIdReady === true;
    rec.onVariableDeferred = () => scheduleStateBagFlush(this as any);
  }

  override get position(): Vector3 {
    const coords = GetEntityCoords(this.handle);
    return new Vector3(coords[0], coords[1], coords[2]);
  }

  override set position(value: Vector3) {
    SetEntityCoordsNoOffset(this.handle, value.x, value.y, value.z, true, true, true);
  }

  get rotation(): Vector3 {
    const rot = GetEntityRotation(this.handle);
    return new Vector3(rot[0], rot[1], rot[2]);
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

  override get dimension(): number {
    return GetEntityRoutingBucket(this.handle);
  }

  override set dimension(value: number) {
    SetEntityRoutingBucket(this.handle, value);
  }

  override get model(): number {
    return GetEntityModel(this.handle);
  }

  get controller(): any {
    const rec = PedInternals.get(this);
    if (rec.hasControllerOverride) return rec.controllerOverride;
    const source = NetworkGetEntityOwner(this.handle);
    if (!source) return null;
    return playerBySource(source) ?? null;
  }

  set controller(value: any) {
    const rec = PedInternals.get(this);
    rec.controllerOverride = value;
    rec.hasControllerOverride = true;
  }

  get health(): number {
    return gtaPedHealthToRage(GetEntityHealth(this.handle));
  }

  set health(value: number) {
    SetEntityHealth(this.handle, rageHealthToGtaPed(value));
  }

  getHealth(): number {
    return gtaPedHealthToRage(GetEntityHealth(this.handle));
  }

  setHealth(value: number): void {
    SetEntityHealth(this.handle, rageHealthToGtaPed(value));
  }

  get armour(): number {
    return GetPedArmour(this.handle);
  }

  set armour(value: number) {
    SetPedArmour(this.handle, value);
  }

  get frozen(): boolean {
    return PedInternals.get(this).frozen;
  }

  set frozen(value: boolean) {
    PedInternals.get(this).frozen = value;
    FreezeEntityPosition(this.handle, value);
  }

  get invincible(): boolean {
    return PedInternals.get(this).invincible;
  }

  set invincible(value: boolean) {
    const rec = PedInternals.get(this);
    rec.invincible = value;
    emitNet("ragemp:pedInvincible", -1, rec.cachedNetId || safeGetNetworkId(this.handle), value);
  }

  override destroy(): void {
    DeleteEntity(this.handle);
    removeFromPedPool(globalThis.mp.peds, this.id);
  }
}
