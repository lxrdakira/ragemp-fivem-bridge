export function safeGetNetworkId(handle: number): number {
  if (!handle || !DoesEntityExist(handle)) return 0;
  if (!NetworkGetEntityIsNetworked(handle)) return 0;
  return NetworkGetNetworkIdFromEntity(handle);
}

// Calling NetworkGetEntityFromNetworkId for an unknown id makes BestMP print
// a warning every time. Several compatibility getters run every frame and can
// touch thousands of stale OneSync ids, so never call the noisy resolver after
// the silent existence native has rejected an id. GetEntityFromStateBagName is
// checked first because it can resolve an ownership migration one frame sooner.
const NET_ID_MISS_RETRY_MS = 2_000;
const NET_ID_MISS_CACHE_LIMIT = 1_024;
const unresolvedNetIds = new Map<number, number>();

function rememberUnresolvedNetId(netId: number, now: number): void {
  unresolvedNetIds.delete(netId);
  unresolvedNetIds.set(netId, now + NET_ID_MISS_RETRY_MS);
  if (unresolvedNetIds.size <= NET_ID_MISS_CACHE_LIMIT) return;
  const oldest = unresolvedNetIds.keys().next().value;
  if (typeof oldest === "number") unresolvedNetIds.delete(oldest);
}

export function safeGetEntityFromNetId(netId: number): number {
  if (!netId || netId <= 0) return 0;
  // The state-bag lookup is silent for missing ids and can become available a
  // frame before the normal network resolver on BestMP.
  if (typeof GetEntityFromStateBagName === "function") {
    const handle = GetEntityFromStateBagName("entity:" + netId);
    if (handle && (typeof DoesEntityExist !== "function" || DoesEntityExist(handle))) {
      unresolvedNetIds.delete(netId);
      return handle;
    }
  }

  const now = Date.now();
  let advisoryExists: boolean | null = null;
  if (typeof NetworkDoesNetworkIdExist === "function") {
    advisoryExists = !!NetworkDoesNetworkIdExist(netId);
    const retryAt = unresolvedNetIds.get(netId) ?? 0;
    if (!advisoryExists && retryAt > now) return 0;
    if (!advisoryExists) {
      rememberUnresolvedNetId(netId, now);
      return 0;
    }
  }

  // If the existence native is unavailable (older runtimes), retain the direct
  // resolver as a compatibility fallback. On current BestMP it is called only
  // for ids which the silent native has already confirmed.
  if (typeof NetworkGetEntityFromNetworkId === "function") {
    const handle = NetworkGetEntityFromNetworkId(netId);
    if (handle && (typeof DoesEntityExist !== "function" || DoesEntityExist(handle))) {
      unresolvedNetIds.delete(netId);
      return handle;
    }
  }
  return 0;
}
