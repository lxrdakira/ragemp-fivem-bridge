import { Entity, Vector3 } from "@ragemp-fivem-bridge/shared";
import { removeFromPool } from "@ragemp-fivem-bridge/shared/internal";
import { freeClientId } from "../internal/pools/clientPool";
import { toVec3 } from "../utils/vec";
import { applyBlipName } from "../utils/blipName";
import { BlipInternals, initBlipInternals } from "../internal/blipInternals";
import { applyBlipVisibility } from "../internal/pools/blipPoolService";

export class BlipMp extends Entity {
  constructor(token: symbol, id: number, handle: number | null) {
    super(token, id, "blip", handle);
    initBlipInternals(this);
  }

  override get position(): Vector3 {
    return toVec3(GetBlipCoords(this.handle));
  }
  override set position(value: Vector3) {
    SetBlipCoords(this.handle, value.x, value.y, value.z);
  }

  get sprite(): number { return GetBlipSprite(this.handle); }
  set sprite(value: number) { SetBlipSprite(this.handle, value); }

  get color(): number { return GetBlipColour(this.handle); }
  set color(value: number) { SetBlipColour(this.handle, value); }

  get scale(): number { return BlipInternals.get(this).scale ?? 1.0; }
  set scale(value: number) { BlipInternals.get(this).scale = value; SetBlipScale(this.handle, value); }

  get name(): string { return BlipInternals.get(this).name ?? ""; }
  set name(value: string) { BlipInternals.get(this).name = value; applyBlipName(this.handle, value); }

  get shortRange(): boolean { return BlipInternals.get(this).shortRange ?? false; }
  set shortRange(value: boolean) { BlipInternals.get(this).shortRange = value; SetBlipAsShortRange(this.handle, value); }

  get drawDistance(): number { return BlipInternals.get(this).drawDistance; }
  set drawDistance(value: number) { BlipInternals.get(this).drawDistance = Math.max(0, value || 0); applyBlipVisibility(this); }

  get rotation(): number { return BlipInternals.get(this).rotation; }
  set rotation(value: number) { BlipInternals.get(this).rotation = value || 0; SetBlipRotation(this.handle, Math.round(value || 0)); }

  override get alpha(): number { return BlipInternals.get(this).alpha; }
  override set alpha(value: number) { BlipInternals.get(this).alpha = value; applyBlipVisibility(this); }

  override get dimension(): number { return BlipInternals.get(this).dimension; }
  override set dimension(value: number) { BlipInternals.get(this).dimension = value; applyBlipVisibility(this); }

  doesExist(): boolean { return DoesBlipExist(this.handle); }
  getAlpha(): number { return GetBlipAlpha(this.handle); }
  getColour(): number { return GetBlipColour(this.handle); }
  getCoords(): Vector3 { return toVec3(GetBlipCoords(this.handle)); }
  getHudColour(): number { return GetBlipHudColour(this.handle); }
  getInfoIdDisplay(): number { return GetBlipInfoIdDisplay(this.handle); }
  getInfoIdEntityIndex(): number { return GetBlipInfoIdEntityIndex(this.handle); }
  getInfoIdPickupIndex(): number { return GetBlipInfoIdPickupIndex(this.handle); }
  getInfoIdType(): number { return GetBlipInfoIdType(this.handle); }
  getSprite(): number { return GetBlipSprite(this.handle); }
  getFirstInfoId(): number { return GetFirstBlipInfoId(this.handle); }
  getNextInfoId(): number { return GetNextBlipInfoId(this.handle); }
  isFlashing(): boolean { return IsBlipFlashing(this.handle); }
  isMissionCreator(): boolean { return IsMissionCreatorBlip(this.handle); }
  isOnMinimap(): boolean { return IsBlipOnMinimap(this.handle); }
  isShortRange(): boolean { return IsBlipShortRange(this.handle); }
  setAlpha(alpha: number): void { this.alpha = alpha; }
  setAsFriendly(toggle: boolean): void { SetBlipAsFriendly(this.handle, !!toggle); }
  setAsMissionCreator(toggle: boolean): void { SetBlipAsMissionCreatorBlip(this.handle, !!toggle); }
  setAsShortRange(toggle: boolean): void { SetBlipAsShortRange(this.handle, !!toggle); }
  setBright(toggle: boolean): void { SetBlipBright(this.handle, !!toggle); }
  setCategory(index: number): void { SetBlipCategory(this.handle, index); }
  setColour(color: number): void { SetBlipColour(this.handle, color); }
  setCoords(position: Vector3): void { SetBlipCoords(this.handle, position.x, position.y, position.z); }
  setDisplay(displayId: number): void { SetBlipDisplay(this.handle, displayId); }
  setFade(opacity: number, duration: number): void { SetBlipFade(this.handle, opacity, duration); }
  setFlashes(toggle: boolean): void { SetBlipFlashes(this.handle, !!toggle); }
  setFlashesAlternate(toggle: boolean): void { SetBlipFlashesAlternate(this.handle, !!toggle); }
  setFlashInterval(p1: any): void { SetBlipFlashInterval(this.handle, p1); }
  setFlashTimer(duration: number): void { SetBlipFlashTimer(this.handle, duration); }
  setHighDetail(toggle: boolean): void { SetBlipHighDetail(this.handle, !!toggle); }
  setNameFromTextFile(gxtEntry: string): void { SetBlipNameFromTextFile(this.handle, gxtEntry); }
  setNameToPlayerName(player: any): void { SetBlipNameToPlayerName(this.handle, player?._playerIndex ?? player); }
  setPosition(posX: number, posY: number, posZ: number): void { SetBlipCoords(this.handle, posX, posY, posZ ?? 0); }
  setPriority(priority: number): void { SetBlipPriority(this.handle, priority); }
  setRotation(rotation: number): void { SetBlipRotation(this.handle, rotation); }
  setRoute(enabled: boolean): void { SetBlipRoute(this.handle, !!enabled); }
  setRouteColour(colour: number): void { SetBlipRouteColour(this.handle, colour); }
  setScale(scale: number): void { SetBlipScale(this.handle, scale); }
  setSecondaryColour(r: number, g: number, b: number): void { SetBlipSecondaryColour(this.handle, r, g, b); }
  setShowCone(toggle: boolean): void { (SetBlipShowCone as (...args: any[]) => void)(this.handle, !!toggle, 6); }
  setShowHeadingIndicator(toggle: boolean): void { ShowHeadingIndicatorOnBlip(this.handle, !!toggle); }
  setSprite(spriteId: number): void { SetBlipSprite(this.handle, spriteId); }
  addTextComponentSubstringName(text: string): void { AddTextComponentSubstringPlayerName(text); }
  endTextCommandSetName(): void { EndTextCommandSetBlipName(this.handle); }
  pulse(): void { PulseBlip(this.handle); }
  showNumberOn(number: number): void { ShowNumberOnBlip(this.handle, number); }
  hideNumberOn(): void { HideNumberOnBlip(this.handle); }

  override destroy(): void {
    RemoveBlip(this.handle);
    if (globalThis.mp.blips) {
      removeFromPool(globalThis.mp.blips, this.id);
      freeClientId(globalThis.mp.blips, this.id);
    }
  }
}
