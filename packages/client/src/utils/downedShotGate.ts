type Origin = "damage" | "shot";

export class DownedShotGate {
  private readonly reports = new Map<string, { time: number; origin: Origin }>();

  accept(target: number, weapon: number, ammo: number, origin: Origin, now: number): boolean {
    if (!Number.isInteger(target) || target <= 0 || !Number.isFinite(ammo) || ammo < 0) return true;
    const key = `${target}:${weapon}:${ammo}`;
    const previous = this.reports.get(key);
    // Neptune reports downed firearm hits from outgoingDamage and again from
    // playerWeaponShot. Coalesce only the opposite callback for the same ammo
    // snapshot, not consecutive rounds or multiple native damage callbacks.
    if (previous && previous.origin !== origin && now >= previous.time && now - previous.time <= 250) return false;
    if (this.reports.size >= 128) this.reports.clear();
    this.reports.set(key, { time: now, origin });
    return true;
  }
}
