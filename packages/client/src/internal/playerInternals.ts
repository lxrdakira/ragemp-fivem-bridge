import { defineInternals } from "@ragemp-fivem-bridge/shared/internal";
import type { PlayerMp } from "../Entities/PlayerMp";

export interface PlayerInternalsRec {
  playerIndex: number;
  serverId: number;
  dimension: number | undefined;
  typingInTextChat: boolean;
  voiceVolume: number;
  voice3d: boolean;
  voiceFX: any;
}

export const PlayerInternals = defineInternals<PlayerInternalsRec>();

export function getPlayerServerId(player: PlayerMp): number {
  const rec = PlayerInternals.get(player);
  if (rec.serverId > 0) return rec.serverId;
  return rec.playerIndex >= 0 ? GetPlayerServerId(rec.playerIndex) : -1;
}

export function setPlayerNetworkIdentity(player: PlayerMp, playerIndex: number, serverId?: number): void {
  const rec = PlayerInternals.get(player);
  rec.playerIndex = playerIndex;
  if (serverId != null && serverId > 0) rec.serverId = serverId;
  else if (playerIndex >= 0) {
    const resolved = GetPlayerServerId(playerIndex);
    if (resolved > 0) rec.serverId = resolved;
  }
}

export function initPlayerInternals(player: PlayerMp, playerIndex: number, serverId?: number): PlayerInternalsRec {
  return PlayerInternals.init(player, {
    playerIndex,
    serverId: serverId && serverId > 0 ? serverId : (playerIndex >= 0 ? GetPlayerServerId(playerIndex) : -1),
    dimension: undefined,
    typingInTextChat: false,
    voiceVolume: 1,
    voice3d: true,
    voiceFX: undefined,
  });
}
