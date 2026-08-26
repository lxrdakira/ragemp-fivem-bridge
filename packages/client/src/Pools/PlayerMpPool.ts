import { Pool } from "@ragemp-fivem-bridge/shared";
import type { Vector3 } from "@ragemp-fivem-bridge/shared";
import { PlayerMp } from "../Entities/PlayerMp";
import { setupPlayerPool } from "../internal/pools/playerPoolService";

export class PlayerMpPool extends Pool<PlayerMp> {
  local!: PlayerMp;

  constructor() {
    super();
    setupPlayerPool(this);
  }

  get weapon(): number {
    return this.local?.weapon ?? 0;
  }

  get health(): number {
    return this.local?.health ?? 100;
  }

  get position(): Vector3 | null {
    return this.local?.position ?? null;
  }

  get heading(): number {
    return this.local?.heading ?? 0;
  }

  override get streamed(): PlayerMp[] {
    return this.toArray().filter((p: PlayerMp) => p !== this.local);
  }

  override forEachInStreamRange(fn: (player: PlayerMp) => void): void {
    this.streamed.forEach(fn);
  }

  atHandle(handle: number): PlayerMp | null {
    for (const player of this.toArray()) {
      if (player.handle === handle || player.getIndex() === handle) return player;
    }
    return null;
  }
}
