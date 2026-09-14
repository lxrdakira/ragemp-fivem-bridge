import { Entity, Vector3 } from "@ragemp-fivem-bridge/shared";
import { EntityInternals } from "@ragemp-fivem-bridge/shared/internal";
import { scheduleStateBagFlush } from "../utils/stateBagDefer";
import { playerBySource } from "../utils/playerRegistry";
import { safeGetNetworkId } from "../utils/netId";
import { whenNetworked } from "../utils/whenNetworked";
import {
  VehicleInternals,
  initVehicleInternals,
  emitVehicle,
} from "../internal/vehicleInternals";
import { PlayerInternals, getPlayerSource } from "../internal/playerInternals";
import { removeFromVehiclePool } from "../internal/pools/vehiclePoolService";

type Quaternion = { x: number; y: number; z: number; w: number };

function applyOrphanMode(vehicle: VehicleMp): void {
  const handle = vehicle.handle;
  if (!handle) return;
  const internals = VehicleInternals.get(vehicle);
  if (safeGetNetworkId(handle)) {
    if (internals.orphanMode !== undefined)
      SetEntityOrphanMode(handle, internals.orphanMode);
    return;
  }
  if (internals.orphanModeScheduled) return;
  internals.orphanModeScheduled = true;
  whenNetworked(handle, () => {
    internals.orphanModeScheduled = false;
    if (internals.orphanMode !== undefined)
      SetEntityOrphanMode(handle, internals.orphanMode);
  });
}

export class VehicleMp extends Entity {
  constructor(token: symbol, id: number, handle: number | null) {
    super(token, id, "vehicle", handle);
    initVehicleInternals(this);
    const rec = EntityInternals.get(this);
    rec.stateBag = () => globalThis.Entity(this.handle).state;
    rec.stateBagReady = () => VehicleInternals.get(this).netIdReady === true;
    rec.onVariableDeferred = () => scheduleStateBagFlush(this as any);
  }

  get netId(): number {
    return (
      VehicleInternals.get(this).cachedNetId || safeGetNetworkId(this.handle)
    );
  }

  private deferIfPending(op: () => void): boolean {
    if (this.handle) return false;
    const rec = VehicleInternals.get(this);
    if (!rec.pendingOps) rec.pendingOps = [];
    rec.pendingOps.push(op);
    return true;
  }

  setDistanceCullingRadius(radius: number): void {
    if (typeof SetEntityDistanceCullingRadius === "function") {
      SetEntityDistanceCullingRadius(this.handle, radius);
    }
  }

  override get position(): Vector3 {
    if (!this.handle) {
      const p = EntityInternals.get(this).position;
      return p ? new Vector3(p.x, p.y, p.z) : new Vector3(0, 0, 0);
    }
    const coords = GetEntityCoords(this.handle);
    return new Vector3(coords[0], coords[1], coords[2]);
  }

  override set position(value: Vector3) {
    if (!this.handle) {
      EntityInternals.get(this).position = new Vector3(
        value.x,
        value.y,
        value.z,
      );
      return;
    }
    SetEntityCoordsNoOffset(
      this.handle,
      value.x,
      value.y,
      value.z,
      true,
      true,
      true,
    );
  }

  get rotation(): Vector3 {
    if (!this.handle) return new Vector3(0, 0, 0);
    const rot = GetEntityRotation(this.handle);
    return new Vector3(rot[0], rot[1], rot[2]);
  }

  set rotation(value: Vector3) {
    if (!this.handle) return;
    SetEntityRotation(this.handle, value.x, value.y, value.z, 2, false);
  }

  get heading(): number {
    if (!this.handle) return VehicleInternals.get(this).pendingHeading ?? 0;
    return GetEntityHeading(this.handle);
  }

  set heading(value: number) {
    if (!this.handle) {
      VehicleInternals.get(this).pendingHeading = value;
      return;
    }
    SetEntityHeading(this.handle, value);
  }

  override get model(): number {
    if (!this.handle) return EntityInternals.get(this).model;
    return GetEntityModel(this.handle);
  }

  override get dimension(): number {
    if (!this.handle) return EntityInternals.get(this).dimension;
    return GetEntityRoutingBucket(this.handle);
  }

  override set dimension(value: number) {
    if (!this.handle) {
      EntityInternals.get(this).dimension = value;
      return;
    }
    SetEntityRoutingBucket(this.handle, value);
  }

  get orphanMode(): number {
    return VehicleInternals.get(this).orphanMode ?? 0;
  }

  set orphanMode(value: number) {
    VehicleInternals.get(this).orphanMode = value;
    applyOrphanMode(this);
  }

  setOrphanMode(mode: number): void {
    this.orphanMode = mode;
  }

  get locked(): boolean {
    return VehicleInternals.get(this).locked;
  }

  set locked(value: boolean) {
    VehicleInternals.get(this).locked = value;
    emitVehicle(this, "ragemp:vehicleLocked", value);
  }

  get numberPlate(): string {
    return (
      VehicleInternals.get(this).numberPlate ??
      GetVehicleNumberPlateText(this.handle)
    );
  }

  set numberPlate(value: string) {
    VehicleInternals.get(this).numberPlate = value;
    emitVehicle(this, "ragemp:vehicleNumberPlate", value);
  }

  get bodyHealth(): number {
    return VehicleInternals.get(this).bodyHealth;
  }

  set bodyHealth(value: number) {
    VehicleInternals.get(this).bodyHealth = value;
    emitVehicle(this, "ragemp:vehicleBodyHealth", value);
  }

  get engineHealth(): number {
    return VehicleInternals.get(this).engineHealth;
  }

  set engineHealth(value: number) {
    VehicleInternals.get(this).engineHealth = value;
    emitVehicle(this, "ragemp:vehicleEngineHealth", value);
  }

  get engine(): boolean {
    return VehicleInternals.get(this).engine;
  }

  set engine(value: boolean) {
    VehicleInternals.get(this).engine = value;
    emitVehicle(this, "ragemp:vehicleEngine", value);
  }

  override get alpha(): number {
    return EntityInternals.get(this).alpha;
  }

  override set alpha(value: number) {
    EntityInternals.get(this).alpha = value;
    emitVehicle(this, "ragemp:vehicleAlpha", value);
  }

  get livery(): number {
    return VehicleInternals.get(this).livery;
  }

  set livery(value: number) {
    VehicleInternals.get(this).livery = value;
    emitVehicle(this, "ragemp:vehicleLivery", value);
  }

  get numberPlateType(): number {
    return VehicleInternals.get(this).numberPlateType;
  }

  set numberPlateType(value: number) {
    VehicleInternals.get(this).numberPlateType = value;
    emitVehicle(this, "ragemp:vehicleNumberPlateType", value);
  }

  get windowTint(): number {
    return VehicleInternals.get(this).windowTint;
  }

  set windowTint(value: number) {
    VehicleInternals.get(this).windowTint = value;
    emitVehicle(this, "ragemp:vehicleWindowTint", value);
  }

  get neonEnabled(): boolean {
    return VehicleInternals.get(this).neonEnabled;
  }

  set neonEnabled(value: boolean) {
    VehicleInternals.get(this).neonEnabled = value;
    emitVehicle(this, "ragemp:vehicleNeonEnabled", value);
  }

  get dead(): boolean {
    if (typeof IsEntityDead === "function") return !!IsEntityDead(this.handle);
    return GetEntityHealth(this.handle) <= 0;
  }

  set dead(value: boolean) {
    void value;
  }

  get customTires(): boolean {
    return VehicleInternals.get(this).customTires;
  }

  set customTires(value: boolean) {
    VehicleInternals.get(this).customTires = value;
    emitVehicle(this, "ragemp:vehicleCustomTires", value);
  }

  get wheelType(): number {
    return VehicleInternals.get(this).wheelType;
  }

  set wheelType(value: number) {
    VehicleInternals.get(this).wheelType = value;
    emitVehicle(this, "ragemp:vehicleWheelType", value);
  }

  get velocity(): Vector3 {
    if (!DoesEntityExist(this.handle)) return new Vector3(0, 0, 0);
    const v = GetEntityVelocity(this.handle);
    return new Vector3(v[0], v[1], v[2]);
  }

  get quaternion(): Quaternion {
    if (!this.handle) return { x: 0, y: 0, z: 0, w: 1 };
    const rot = GetEntityRotation(this.handle);
    const rad = Math.PI / 180;
    const rx = (rot[0] * rad) / 2,
      ry = (rot[1] * rad) / 2,
      rz = (rot[2] * rad) / 2;
    const cx = Math.cos(rx),
      sx = Math.sin(rx);
    const cy = Math.cos(ry),
      sy = Math.sin(ry);
    const cz = Math.cos(rz),
      sz = Math.sin(rz);
    return {
      x: sx * cy * cz - cx * sy * sz,
      y: cx * sy * cz + sx * cy * sz,
      z: cx * cy * sz - sx * sy * cz,
      w: cx * cy * cz + sx * sy * sz,
    };
  }

  get extras(): Record<number, boolean> {
    return { ...VehicleInternals.get(this).extras };
  }

  get mods(): Record<number, number> {
    return { ...VehicleInternals.get(this).mods };
  }

  get brake(): boolean {
    return VehicleInternals.get(this).brake;
  }

  get highbeams(): boolean {
    return VehicleInternals.get(this).highbeams;
  }

  get horn(): boolean {
    return VehicleInternals.get(this).horn;
  }

  get rocketBoost(): boolean {
    return VehicleInternals.get(this).rocketBoost;
  }

  get siren(): boolean {
    return VehicleInternals.get(this).siren;
  }

  get steerAngle(): number {
    return VehicleInternals.get(this).steerAngle;
  }

  get streamedPlayers(): any[] {
    const mp = globalThis.mp;
    if (!mp || !mp.players) return [];
    if (!this.handle) return [];
    let pos: Vector3;
    try {
      pos = this.position;
    } catch (e) {
      return mp.players.toArray();
    }
    if (!pos) return mp.players.toArray();
    const dim = this.dimension;
    const out: any[] = [];
    mp.players.forEach((player: any) => {
      if (player.dimension !== dim) return;
      let ppos: Vector3 | null;
      try {
        ppos = player.position;
      } catch (e) {
        return;
      }
      if (!ppos) return;
      const dx = ppos.x - pos.x;
      const dy = ppos.y - pos.y;
      const dz = ppos.z - pos.z;
      if (dx * dx + dy * dy + dz * dz <= 300 * 300) out.push(player);
    });
    return out;
  }

  get trailer(): VehicleMp | null {
    if (typeof GetVehicleTrailerVehicle !== "function") return null;
    const [hit, handle] = GetVehicleTrailerVehicle(this.handle);
    if (!hit || !handle) return null;
    return globalThis.mp.vehicles.atHandle(handle) ?? null;
  }

  get traileredBy(): VehicleMp | null {
    if (typeof GetEntityAttachedTo !== "function") return null;
    const parent = GetEntityAttachedTo(this.handle);
    if (!parent || parent === 0) return null;
    return globalThis.mp.vehicles.atHandle(parent) ?? null;
  }

  get controller(): any {
    if (!this.handle) return null;
    const ownerSource = NetworkGetEntityOwner(this.handle);
    if (!ownerSource || ownerSource === 0) return null;
    return playerBySource(ownerSource) ?? null;
  }

  set controller(value: any) {
    const targetSource: number | null =
      value == null
        ? null
        : typeof value === "number"
          ? value
          : getPlayerSource(value);
    const netId = this.netId;
    emitNet("ragemp:requestVehicleControl", targetSource ?? -1, netId);
  }

  get dashboardColor(): number {
    return VehicleInternals.get(this).dashboardColor;
  }

  set dashboardColor(value: number) {
    VehicleInternals.get(this).dashboardColor = value;
    emitVehicle(this, "ragemp:vehicleDashboardColor", value);
  }

  get movable(): boolean {
    return VehicleInternals.get(this).movable;
  }

  set movable(value: boolean) {
    VehicleInternals.get(this).movable = value;
    if (this.deferIfPending(() => FreezeEntityPosition(this.handle, !value)))
      return;
    FreezeEntityPosition(this.handle, !value);
  }

  get pearlescentColor(): number {
    return VehicleInternals.get(this).pearlescentColor;
  }

  set pearlescentColor(value: number) {
    VehicleInternals.get(this).pearlescentColor = value;
    emitVehicle(this, "ragemp:vehiclePearlescentColor", value);
  }

  get taxiLights(): boolean {
    return VehicleInternals.get(this).taxiLights;
  }

  set taxiLights(value: boolean) {
    VehicleInternals.get(this).taxiLights = value;
    emitVehicle(this, "ragemp:vehicleTaxiLights", value);
  }

  get trimColor(): number {
    return VehicleInternals.get(this).trimColor;
  }

  set trimColor(value: number) {
    VehicleInternals.get(this).trimColor = value;
    emitVehicle(this, "ragemp:vehicleTrimColor", value);
  }

  get wheelColor(): number {
    return VehicleInternals.get(this).wheelColor;
  }

  set wheelColor(value: number) {
    VehicleInternals.get(this).wheelColor = value;
    emitVehicle(this, "ragemp:vehicleWheelColor", value);
  }

  explode(): void {
    emitVehicle(this, "ragemp:vehicleExplode");
  }

  repair(): void {
    const rec = VehicleInternals.get(this);
    rec.bodyHealth = 1000;
    rec.engineHealth = 1000;
    emitVehicle(this, "ragemp:vehicleRepair");
  }

  spawn(position: Vector3, heading?: number): void {
    if (!this.handle) {
      this.position = position;
      this.heading = heading ?? 0;
      this.repair();
      return;
    }
    SetEntityCoordsNoOffset(
      this.handle,
      position.x,
      position.y,
      position.z,
      true,
      true,
      true,
    );
    SetEntityHeading(this.handle, heading ?? 0);
    this.repair();
  }

  getColor(): [number, number] {
    const paint = VehicleInternals.get(this).paint;
    return [paint.primary ?? 0, paint.secondary ?? 0];
  }

  setColor(primary: number, secondary: number): void {
    VehicleInternals.get(this).paint = { primary, secondary };
    emitVehicle(this, "ragemp:vehicleColor", primary, secondary);
  }

  getColorRGB(): {
    primary: [number, number, number];
    secondary: [number, number, number];
  } {
    const rgb = VehicleInternals.get(this).colorRGB ?? [
      [0, 0, 0],
      [0, 0, 0],
    ];
    return { primary: rgb[0], secondary: rgb[1] };
  }

  setColorRGB(
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number,
  ): void {
    const rec = VehicleInternals.get(this);
    rec.colorRGB = [
      [r1, g1, b1],
      [r2, g2, b2],
    ];
    SetVehicleCustomPrimaryColour(this.handle, r1, g1, b1);
    SetVehicleCustomSecondaryColour(this.handle, r2, g2, b2);
    emitVehicle(this, "ragemp:vehicleColorRGB", rec.colorRGB);
  }

  getExtra(extraId: number): boolean {
    return IsVehicleExtraTurnedOn(this.handle, extraId);
  }

  setExtra(extraId: number, state: boolean): void {
    VehicleInternals.get(this).extras[extraId] = !!state;
    emitVehicle(this, "ragemp:vehicleExtra", extraId, !state);
  }

  getMod(modType: number): number {
    return VehicleInternals.get(this).mods[modType] ?? -1;
  }

  setMod(modType: number, modIndex: number): void {
    VehicleInternals.get(this).mods[modType] = modIndex;
    emitVehicle(this, "ragemp:vehicleMod", modType, modIndex);
  }

  getNeonColor(): number[] {
    return VehicleInternals.get(this).neonColor;
  }

  setNeonColor(r: number, g: number, b: number): void {
    VehicleInternals.get(this).neonColor = [r, g, b];
    emitVehicle(this, "ragemp:vehicleNeonColor", r, g, b);
  }

  get driver(): any {
    const occupant = this.getOccupant(0);
    if (occupant) return occupant;
    const players = globalThis.mp?.players;
    if (players) {
      let found: any = null;
      players.forEach((p: any) => {
        if (found) return;
        if (PlayerInternals.get(p).vehicle === this && p.seat === 0) found = p;
      });
      if (found) return found;
    }
    return null;
  }

  getOccupant(seat: number): any {
    if (!this.handle) return null;
    const ped = GetPedInVehicleSeat(this.handle, seat - 1);
    if (!ped || ped === 0) return null;
    const owner = NetworkGetEntityOwner(ped);
    if (owner) {
      const player = playerBySource(owner);
      if (player && player.ped === ped) return player;
    }
    return globalThis.mp.peds?.atHandle?.(ped) ?? null;
  }

  getOccupants(): any[] {
    const occupants: any[] = [];
    for (let seat = 0; seat <= 16; seat++) {
      const occupant = this.getOccupant(seat);
      if (occupant) {
        occupants.push(occupant);
      }
    }
    return occupants;
  }

  setOccupant(seat: number, player: any): void {
    player.putIntoVehicle(this, seat);
  }

  getPaint(type: number): number | null {
    const paint = VehicleInternals.get(this).paint;
    if (type === 0) return paint.primary;
    if (type === 1) return paint.secondary;
    return null;
  }

  setPaint(primary: number, secondary: number): void {
    VehicleInternals.get(this).paint = { primary, secondary };
    emitVehicle(this, "ragemp:vehicleColor", primary, secondary);
  }

  isStreamed(player?: any): boolean {
    return DoesEntityExist(this.handle);
  }

  override destroy(): void {
    if (!this.handle) {
      VehicleInternals.get(this).pendingCancelled = true;
      removeFromVehiclePool(globalThis.mp.vehicles, this.id);
      return;
    }
    DeleteEntity(this.handle);
    removeFromVehiclePool(globalThis.mp.vehicles, this.id);
  }
}
