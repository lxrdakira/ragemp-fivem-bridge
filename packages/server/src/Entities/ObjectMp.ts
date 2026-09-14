import { Entity, Vector3 } from "@ragemp-fivem-bridge/shared";
import { scheduleStateBagFlush } from "../utils/stateBagDefer";
import { whenNetworked } from "../utils/whenNetworked";
import { STATIC_OBJECT_FLAG } from "./objectFlags";
import { ObjectInternals, initObjectInternals } from "../internal/objectInternals";
import { objectNetIdMap, removeFromObjectPool } from "../internal/pools/objectPoolService";
import { handlePoolStore, EntityInternals } from "@ragemp-fivem-bridge/shared/internal";
import { entityBindNetId } from "../utils/entityRegistry";
import { EntityOrphanMode } from "../Enums";

export class ObjectMp extends Entity {
  constructor(token: symbol, id: number, handle: number | null) {
    super(token, id, "object", handle);
    initObjectInternals(this);
    const rec = EntityInternals.get(this);
    rec.stateBag = () => globalThis.Entity(this.handle).state;
    rec.stateBagReady = () => ObjectInternals.get(this).netIdReady === true;
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

  override get model(): number {
    return EntityInternals.get(this).model || GetEntityModel(this.handle);
  }

  override set model(value: number | string) {
    const modelHash = typeof value === "string" ? GetHashKey(value) : value;

    if (!DoesEntityExist(this.handle)) {
      EntityInternals.get(this).model = modelHash;
      return;
    }

    const ent = EntityInternals.get(this);
    const rec = ObjectInternals.get(this);
    const coords = GetEntityCoords(this.handle);
    const rot = GetEntityRotation(this.handle);
    const dimension = GetEntityRoutingBucket(this.handle);
    const alpha = ent.alpha;

    const pool = globalThis.mp.objects;
    handlePoolStore(pool).handleToEntity.delete(this.handle);
    if (rec.cachedNetId !== undefined) {
      objectNetIdMap(pool).delete(rec.cachedNetId);
      rec.cachedNetId = undefined;
    }
    DeleteEntity(this.handle);

    const handle = CreateObjectNoOffset(modelHash, coords[0], coords[1], coords[2], true, true, false);
    ent.handle = handle;
    ent.model = modelHash;
    rec.netIdReady = false;
    handlePoolStore(pool).handleToEntity.set(handle, this as any);

    FreezeEntityPosition(handle, true);
    SetEntityOrphanMode(handle, EntityOrphanMode.KeepEntity);
    SetEntityRotation(handle, rot[0], rot[1], rot[2], 2, false);

    if (dimension !== 0) {
      SetEntityRoutingBucket(handle, dimension);
    }

    whenNetworked(handle, (netId: number) => {
      objectNetIdMap(pool).set(netId, this);
      rec.cachedNetId = netId;
      rec.netIdReady = true;
      entityBindNetId("object", this.id, netId);

      try {
        globalThis.Entity(handle).state.set(STATIC_OBJECT_FLAG, true, true);
      } catch (e) {}

      if (alpha !== 255) {
        emitNet("ragemp:objectAlpha", -1, netId, alpha);
      }

      if (EntityInternals.get(this).variables.size) scheduleStateBagFlush(this as any);
    });
  }

  override get alpha(): number {
    return EntityInternals.get(this).alpha;
  }

  override set alpha(value: number) {
    EntityInternals.get(this).alpha = value;
    whenNetworked(this.handle, (netId: number) => {
      if (EntityInternals.get(this).alpha === value) {
        emitNet("ragemp:objectAlpha", -1, netId, value);
      }
    });
  }

  override get dimension(): number {
    return GetEntityRoutingBucket(this.handle);
  }

  override set dimension(value: number) {
    SetEntityRoutingBucket(this.handle, value);
  }

  override destroy(): void {
    DeleteEntity(this.handle);
    removeFromObjectPool(globalThis.mp.objects, this.id);
  }
}
