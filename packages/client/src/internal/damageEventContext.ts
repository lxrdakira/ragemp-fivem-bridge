export interface DamageEventState {
  cancelled: boolean;
  amount: number | null;
  critical: boolean | null;
}

let active: DamageEventState | null = null;

export function isDamageEventActive(): boolean { return active !== null; }

export function beginDamageEvent(): void {
  active = { cancelled: false, amount: null, critical: null };
}

export function endDamageEvent(): DamageEventState | null {
  const result = active;
  active = null;
  return result;
}

export function cancelDamageEvent(): void {
  if (active) active.cancelled = true;
  if (typeof CancelEvent === "function") CancelEvent();
}

export function setDamageEventAmount(amount: number): void {
  if (active && Number.isFinite(amount)) active.amount = Math.max(0, amount);
}

export function setDamageEventCritical(critical: boolean): void {
  if (active) active.critical = !!critical;
}
