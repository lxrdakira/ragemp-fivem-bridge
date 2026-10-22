export type ServerPedState = [dynamic: boolean, invincible: boolean, frozen: boolean, controlLocked: boolean];

export function applyServerPedState(handle: number, state: ServerPedState, wasStationary = false): boolean {
  const stationary = state[2] && !state[0];
  SetEntityDynamic(handle, state[0]);
  SetEntityInvincible(handle, state[1] || stationary);
  SetBlockingOfNonTemporaryEvents(handle, state[3] || stationary);
  SetPedCanRagdoll(handle, !stationary);
  SetPedCanRagdollFromPlayerImpact(handle, !stationary);
  if (stationary || wasStationary) {
    SetEntityCanBeDamaged(handle, !stationary);
    SetEntityProofs(handle, stationary, stationary, stationary, stationary, stationary, stationary, stationary, stationary);
    SetPedCanPlayInjuredAnims(handle, !stationary);
    SetPedCanPlayGestureAnims(handle, !stationary);
    SetPedCanEvasiveDive(handle, !stationary);
  }
  // Stop an existing ambient reaction without cancelling scripted idle scenes.
  if (stationary && (IsPedInCombat(handle, 0) || IsPedFleeing(handle) || IsPedRagdoll(handle) || IsPedGettingUp(handle))) {
    ClearPedTasksImmediately(handle);
  }
  FreezeEntityPosition(handle, state[2]);
  return state[1] || stationary;
}
