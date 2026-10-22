type PlayerWithSafeZone = {
  getVariable(key: string): unknown;
};

export type WeaponDamageTarget = {
  hitGlobalId?: number;
  hitGlobalIds?: number[];
  weaponType?: number;
};

export type SafeZoneDamageResolver = {
  playerBySource(source: number): PlayerWithSafeZone | null;
  entityFromNetId(netId: number): number;
  entityOwner(entity: number): number;
  playerPed(source: number): number;
};

// Keep the legacy exception: officers can use a stun gun in a green zone.
const WEAPON_STUNGUN = 911657153;

export function shouldCancelSafeZoneWeaponDamage(
  sender: number,
  damage: WeaponDamageTarget | null | undefined,
  resolver: SafeZoneDamageResolver,
): boolean {
  if (!damage) return false;

  const attacker = resolver.playerBySource(Number(sender));
  if (!attacker) return false;
  if (attacker.getVariable("SZ") === true &&
      (Number(damage.weaponType) >>> 0) !== WEAPON_STUNGUN) return true;

  const targetIds = new Set<number>();
  for (const id of Array.isArray(damage.hitGlobalIds) ? damage.hitGlobalIds : []) {
    if (Number.isInteger(id) && id > 0) targetIds.add(id);
  }
  if (Number.isInteger(damage.hitGlobalId) && Number(damage.hitGlobalId) > 0)
    targetIds.add(Number(damage.hitGlobalId));

  for (const netId of targetIds) {
    const entity = resolver.entityFromNetId(netId);
    if (!entity) continue;

    const owner = resolver.entityOwner(entity);
    if (!Number.isInteger(owner) || owner <= 0) continue;
    // An NPC or vehicle can also be owned by a player. Only the player's own
    // ped inherits their green-zone protection.
    if (resolver.playerPed(owner) !== entity) continue;

    const victim = resolver.playerBySource(owner);
    if (victim?.getVariable("SZ") === true) return true;
  }

  return false;
}
