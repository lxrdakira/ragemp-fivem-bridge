/**
 * BestMP can crash inside SET_PLAYER_MODEL when the current freemode model is
 * assigned again while addon clothing collections are mounted. Keep every
 * bridge entry point idempotent and call the native only for an actual change.
 */
export function setPlayerModelIfDifferent(player: number, model: number): boolean {
  const modelHash = model >>> 0;
  const ped = GetPlayerPed(player);

  if (ped && (GetEntityModel(ped) >>> 0) === modelHash) return false;

  SetPlayerModel(player, modelHash);
  return true;
}
