import { defineInternals } from "@ragemp-fivem-bridge/shared/internal";
import type { PlayerMp } from "../Entities/PlayerMp";

export interface PlayerInternalsRec {
  playerIndex: number;
  dimension: number | undefined;
  typingInTextChat: boolean;
  voiceFX: any;
}

export const PlayerInternals = defineInternals<PlayerInternalsRec>();

export function getPlayerServerId(player: PlayerMp): number {
  return GetPlayerServerId(PlayerInternals.get(player).playerIndex);
}

export function initPlayerInternals(player: PlayerMp, playerIndex: number): PlayerInternalsRec {
  return PlayerInternals.init(player, {
    playerIndex,
    dimension: undefined,
    typingInTextChat: false,
    voiceFX: undefined,
  });
}
