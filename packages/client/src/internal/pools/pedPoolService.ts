import { safeGetEntityFromNetId } from "../../utils/netId";
import { atHandle, setStreamHandlers } from "./streamingService";
import { PedInternals } from "../pedInternals";
import type { PedMp } from "../../Entities/PedMp";

export function setupPedPool(pool: object): void {
  const pending = new Map<number, [boolean, boolean, boolean, boolean]>();

  const apply = (handle: number, state: [boolean, boolean, boolean, boolean]): boolean => {
    SetEntityDynamic(handle, state[0]);
    SetEntityInvincible(handle, state[1]);
    FreezeEntityPosition(handle, state[2]);
    SetBlockingOfNonTemporaryEvents(handle, state[3]);
    const ped = atHandle(pool, handle) as PedMp | null;
    if (ped) {
      const rec = PedInternals.get(ped);
      rec.dynamic = state[0];
      rec.invincible = state[1];
    }
    return !!ped;
  };

  onNet("ragemp:ped:batch", (netId: number, dynamic: boolean, invincible: boolean, frozen: boolean, controlLocked: boolean) => {
    const state: [boolean, boolean, boolean, boolean] = [!!dynamic, !!invincible, !!frozen, !!controlLocked];
    const handle = safeGetEntityFromNetId(netId);
    if (!handle || !apply(handle, state)) pending.set(netId, state);
  });

  setStreamHandlers(pool, {
    onStreamIn: (_ped: PedMp, handle: number, netId: number) => {
      const state = pending.get(netId);
      if (!state) return;
      pending.delete(netId);
      apply(handle, state);
    },
  });

  onNet("ragemp:pedInvincible", (netId: number, value: boolean) => {
    const handle = safeGetEntityFromNetId(netId);
    if (handle) {
      SetEntityInvincible(handle, value);
      const ped = atHandle(pool, handle) as PedMp | null;
      if (ped) {
        PedInternals.get(ped).invincible = value;
      }
    }
  });
}
