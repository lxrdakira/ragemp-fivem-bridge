import { Entity, Pool } from "@ragemp-fivem-bridge/shared";
import {
  setupStreamingPool,
  atLocal,
  atRemote,
  atHandle,
  resolveHandle,
  atNetId,
  existsRemote,
  LOCAL_STREAM_ID_BASE,
} from "../internal/pools/streamingService";

export { LOCAL_STREAM_ID_BASE };

export class StreamingPool<T extends Entity> extends Pool<T> {
  constructor(netType: string | null = null) {
    super();
    setupStreamingPool(this, netType);
  }

  override at(id: number): any {
    return atLocal(this, id);
  }

  override atRemoteId(remoteId: number): any {
    return atRemote(this, remoteId);
  }

  atRemoteIdAsync(remoteId: number, options: any = {}): Promise<any> {
    const timeout = typeof options === "number" ? options : options.timeout ?? 5000;
    const interval = (typeof options === "object" && options.interval) || 50;
    return new Promise((resolve) => {
      const immediate = this.atRemoteId(remoteId);
      if (immediate) {
        resolve(immediate);
        return;
      }
      const now = () => (typeof GetGameTimer === "function" ? GetGameTimer() : 0);
      const start = now();
      const tick = setInterval(() => {
        const found = this.atRemoteId(remoteId);
        if (found) {
          clearInterval(tick);
          resolve(found);
          return;
        }
        if (now() - start >= timeout) {
          clearInterval(tick);
          resolve(null);
        }
      }, interval);
    });
  }

  atHandle(handle: number): any {
    // RAGE:MP returns a streamed entity wrapper for a valid native handle.
    // FiveM can expose a handle one tick before the periodic pool scan has
    // populated handleToEntity (raycasts and PlayerMp.vehicle commonly hit
    // this window), so resolve it on demand instead of returning null.
    return atHandle(this, handle) ?? resolveHandle(this, handle);
  }

  atNetId(netId: number): any {
    return atNetId(this, netId);
  }

  override exists(entity: any): boolean {
    return existsRemote(this, entity);
  }
}
