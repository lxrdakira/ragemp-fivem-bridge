// Neptune owns RP crime/death handling; GTA's single-player police response
// must not react to multiplayer kills or resume after a respawn/model change.
export function suppressNativeWanted(): void {
  const player = PlayerId();
  SetMaxWantedLevel(0);
  ClearPlayerWantedLevel(player);
  SetFakeWantedLevel(0);
  SetPoliceIgnorePlayer(player, true);
  SetDispatchCopsForPlayer(player, false);
  SetAudioFlag("PoliceScannerDisabled", true);
  SetAudioFlag("WantedMusicDisabled", true);
  for (let service = 1; service <= 15; service++) EnableDispatchService(service, false);
}

export function installNativeWantedSuppression(): void {
  suppressNativeWanted();
  setInterval(suppressNativeWanted, 1000);
  setTick(() => HideHudComponentThisFrame(1));
}
