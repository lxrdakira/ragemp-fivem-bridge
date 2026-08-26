import { Vector3 } from "@ragemp-fivem-bridge/shared";
import { PedMpBase } from "./PedMpBase";
import { PedInternals, initPedInternals } from "../internal/pedInternals";
import { removeFromStreamingPool } from "../internal/pools/streamingService";
import { playerByServerId } from "../internal/pools/playerPoolService";

export class PedMp extends PedMpBase {
  constructor(token: symbol, id: number, handle: number | null) {
    super(token, id, "ped", handle);
    initPedInternals(this);
  }

  get spawnPosition(): Vector3 | null {
    return PedInternals.get(this).spawnPosition;
  }
  set spawnPosition(value: Vector3 | null) {
    PedInternals.get(this).spawnPosition = value;
  }

  get isDynamic(): boolean {
    return PedInternals.get(this).dynamic;
  }
  set isDynamic(value: boolean) {
    PedInternals.get(this).dynamic = !!value;
  }
  get dynamic(): boolean {
    return PedInternals.get(this).dynamic;
  }
  set dynamic(value: boolean) {
    PedInternals.get(this).dynamic = !!value;
  }

  get invincible(): boolean {
    return PedInternals.get(this).invincible;
  }
  set invincible(value: boolean) {
    PedInternals.get(this).invincible = !!value;
    SetEntityInvincible(this.handle, !!value);
  }
  override setInvincible(toggle: boolean): void {
    PedInternals.get(this).invincible = !!toggle;
    SetEntityInvincible(this.handle, !!toggle);
  }

  get frozen(): boolean {
    return IsEntityPositionFrozen(this.handle);
  }
  set frozen(value: boolean) {
    FreezeEntityPosition(this.handle, !!value);
  }
  get isPositionFrozen(): boolean {
    return IsEntityPositionFrozen(this.handle);
  }

  get controller(): any {
    const playerIndex = NetworkGetEntityOwner(this.handle);
    if (playerIndex < 0) return null;
    const serverId = GetPlayerServerId(playerIndex);
    if (!serverId) return null;
    return playerByServerId(serverId) ?? null;
  }

  override destroy(): void {
    if (this.handle && DoesEntityExist(this.handle)) {
      SetEntityAsMissionEntity(this.handle, false, true);
      DeleteEntity(this.handle);
    }
    const pool = (globalThis as any).mp.peds;
    if (pool) removeFromStreamingPool(pool, this.id);
  }
}
