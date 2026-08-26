import { createUnkProxy, toVec3 } from "./_helpers.js";
import { Vector3 } from "@ragemp-fivem-bridge/shared";
import { cancelDamageEvent, setDamageEventAmount, setDamageEventCritical } from "../internal/damageEventContext";

export class GameWeaponNs {
  unk: any = createUnkProxy();

  unequipEmptyWeapons: boolean = true;

  cancelCurrentDamageEvent(): void { cancelDamageEvent(); }
  setCurrentDamageEventAmount(amount: number): void { setDamageEventAmount(amount); }
  setCurrentDamageEventCritical(critical: boolean): void { setDamageEventCritical(critical); }
  setEnableLocalOutgoingDamage(enabled: boolean): void
  {
    NetworkSetFriendlyFireOption(!!enabled);
    SetCanAttackFriendly(PlayerPedId(), !!enabled, false);
  }

  giveToPed(ped: number, weaponHash: number, ammoCount: number, isHidden: boolean, bForceInHand: boolean): void {
    GiveWeaponToPed(ped, weaponHash, ammoCount, isHidden ?? false, bForceInHand ?? true);
  }
  removeFromPed(ped: number, weaponHash: number): void { RemoveWeaponFromPed(ped, weaponHash); }
  getAmmoInClip(ped: number, weaponHash: number): number {
    const [, ammo] = GetAmmoInClip(ped, weaponHash);
    return ammo;
  }
  setAmmoInClip(ped: number, weaponHash: number, ammo: number): boolean { return SetAmmoInClip(ped, weaponHash, ammo); }

  createObject(weaponHash: number, ammoCount: number, x: number, y: number, z: number, showWorldModel: boolean, scale: number): number {
    return (CreateWeaponObject as any)(weaponHash, ammoCount, x, y, z, showWorldModel ?? true, scale ?? 1.0, 0);
  }
  enableLaserSightRendering(toggle: boolean): void { EnableLaserSightRendering(toggle); }

  getWeaponComponentTypeModel(componentHash: number): number { return GetWeaponComponentTypeModel(componentHash); }
  getWeapontypeModel(weaponHash: number): number { return GetWeapontypeModel(weaponHash); }
  getWeapontypeSlot(weaponHash: number): number { return GetWeapontypeSlot(weaponHash); }
  getWeapontypeGroup(weaponHash: number): number { return GetWeapontypeGroup(weaponHash); }
  isWeaponValid(weaponHash: number): boolean { return IsWeaponValid(weaponHash); }
  requestWeaponAsset(weaponHash: number, p1: number, p2: number): void { RequestWeaponAsset(weaponHash, p1, p2); }
  hasWeaponAssetLoaded(weaponHash: number): boolean { return HasWeaponAssetLoaded(weaponHash); }
  removeWeaponAsset(weaponHash: number): void { RemoveWeaponAsset(weaponHash); }
  giveWeaponComponentToWeaponObject(weaponObject: number, addonHash: number): void { GiveWeaponComponentToWeaponObject(weaponObject, addonHash); }
  removeWeaponComponentFromWeaponObject(p0: number, p1: number): void { RemoveWeaponComponentFromWeaponObject(p0, p1); }
  hasWeaponGotWeaponComponent(weapon: number, addonHash: number): boolean { return HasWeaponGotWeaponComponent(weapon, addonHash); }
  giveWeaponObjectToPed(weaponObject: number, ped: number): void { GiveWeaponObjectToPed(weaponObject, ped); }
  doesWeaponTakeWeaponComponent(weaponHash: number, componentHash: number): boolean { return DoesWeaponTakeWeaponComponent(weaponHash, componentHash); }
  setWeaponObjectTintIndex(weapon: number, tintIndex: number): void { SetWeaponObjectTintIndex(weapon, tintIndex); }
  getWeaponObjectTintIndex(weapon: number): number { return GetWeaponObjectTintIndex(weapon); }
  getWeaponTintCount(weaponHash: number): number { return GetWeaponTintCount(weaponHash); }
  getWeaponHudStats(weaponHash: number): number { const r = GetWeaponHudStats(weaponHash); return Array.isArray(r) ? r[1] : r; }
  getWeaponComponentHudStats(componentHash: number): number { const r = GetWeaponComponentHudStats(componentHash); return Array.isArray(r) ? r[1] : r; }
  getWeaponClipSize(weaponHash: number): number { return GetWeaponClipSize(weaponHash); }
  requestWeaponHighDetailModel(weaponObject: number): void { RequestWeaponHighDetailModel(weaponObject); }
  getWeaponDamageType(weaponHash: number): number { return GetWeaponDamageType(weaponHash); }
  canUseWeaponOnParachute(weaponHash: number): boolean { return CanUseWeaponOnParachute(weaponHash); }
  getComponentTypeModel(componentHash: number): number { return GetWeaponComponentTypeModel(componentHash); }
  getTypeModel(weaponHash: number): number { return GetWeapontypeModel(weaponHash); }
  getTypeSlot(weaponHash: number): number { return GetWeapontypeSlot(weaponHash); }
  getTypeGroup(weaponHash: number): number { return GetWeapontypeGroup(weaponHash); }

  setCurrentPed(ped: number, weaponHash: number, bForceInHand: boolean): void { SetCurrentPedWeapon(ped, weaponHash, bForceInHand); }
  getCurrentPed(ped: number, p2: boolean): number { const [, hash] = GetCurrentPedWeapon(ped, p2); return hash; }
  getBestPed(ped: number, p1: boolean): number { return GetBestPedWeapon(ped, p1); }
  setCurrentPedVehicle(ped: number, weaponHash: number): boolean { return SetCurrentPedVehicleWeapon(ped, weaponHash); }
  getCurrentPedVehicle(ped: number): number { const [, hash] = GetCurrentPedVehicleWeapon(ped); return hash; }
  isPedArmed(ped: number, typeFlags: number): boolean { return IsPedArmed(ped, typeFlags); }
  isValid(weaponHash: number): boolean { return IsWeaponValid(weaponHash); }
  hasPedGot(ped: number, weaponHash: number, p2: boolean): boolean { return HasPedGotWeapon(ped, weaponHash, p2); }
  getAmmoInPed(ped: number, weaponhash: number): number { return GetAmmoInPedWeapon(ped, weaponhash); }
  addAmmoToPed(ped: number, weaponHash: number, ammo: number): void { AddAmmoToPed(ped, weaponHash, ammo); }
  setPedAmmo(ped: number, weaponHash: number, ammo: number, p3: boolean): void { (SetPedAmmo as any)(ped, weaponHash, ammo, p3); }
  setPedInfiniteAmmo(ped: number, toggle: boolean, weaponHash: number): void { SetPedInfiniteAmmo(ped, toggle, weaponHash); }
  setPedInfiniteAmmoClip(ped: number, toggle: boolean): void { SetPedInfiniteAmmoClip(ped, toggle); }
  setPedDropsWeaponsWhenDead(ped: number, toggle: boolean): void { SetPedDropsWeaponsWhenDead(ped, toggle); }
  hasPedBeenDamagedBy(ped: number, weaponHash: number, weaponType: number): boolean { return HasPedBeenDamagedByWeapon(ped, weaponHash, weaponType); }
  hasEntityBeenDamagedBy(entity: number, weaponHash: number, weaponType: number): boolean { return HasEntityBeenDamagedByWeapon(entity, weaponHash, weaponType); }
  setPedDrops(ped: number): void { SetPedDropsWeapon(ped); }
  setPedDropsInventory(ped: number, weaponHash: number, xOffset: number, yOffset: number, zOffset: number, ammoCount: number): void { SetPedDropsInventoryWeapon(ped, weaponHash, xOffset, yOffset, zOffset, ammoCount); }
  getMaxAmmoInClip(ped: number, weaponHash: number, p2: boolean): number { return GetMaxAmmoInClip(ped, weaponHash, p2); }
  getMaxAmmo(ped: number, weaponHash: number): number { const [, ammo] = GetMaxAmmo(ped, weaponHash); return ammo; }
  getMaxAmmoByType(ped: number, ammoTypeHash: number): number { const [, ammo] = GetMaxAmmoByType(ped, ammoTypeHash); return ammo; }
  setPedAmmoByType(ped: number, ammoTypeHash: number, ammo: number): void { SetPedAmmoByType(ped, ammoTypeHash, ammo); }
  getPedAmmoByType(ped: number, ammoTypeHash: number): number { return GetPedAmmoByType(ped, ammoTypeHash); }
  setPedAmmoToDrop(ped: number, p1: number): void { SetPedAmmoToDrop(ped, p1); }
  setPickupAmmoAmountScaler(p0: number): void { SetPickupAmmoAmountScaler(p0); }
  getPedAmmoTypeFrom(ped: number, weaponHash: number): number { return GetPedAmmoTypeFromWeapon(ped, weaponHash); }
  setPedGadget(ped: number, gadgetHash: number, p2: boolean): void { SetPedGadget(ped, gadgetHash, p2); }
  getIsPedGadgetEquipped(ped: number, gadgetHash: number): boolean { return GetIsPedGadgetEquipped(ped, gadgetHash); }
  getSelectedPed(ped: number): number { return GetSelectedPedWeapon(ped); }
  explodeProjectiles(ped: number, weaponHash: number, p2: boolean): void { ExplodeProjectiles(ped, weaponHash, p2); }
  removeAllProjectilesOfType(weaponHash: number, explode: boolean): void { RemoveAllProjectilesOfType(weaponHash, explode); }
  getLockonDistanceOfCurrentPed(ped: number): number { return GetLockonDistanceOfCurrentPedWeapon(ped); }
  getMaxRangeOfCurrentPed(ped: number): number { return GetMaxRangeOfCurrentPedWeapon(ped); }
  hasVehicleGotProjectileAttached(driver: number, vehicle: number, weaponHash: number, p3: number): boolean { return HasVehicleGotProjectileAttached(driver, vehicle, weaponHash, p3); }
  giveComponentToPed(ped: number, weaponHash: number, componentHash: number): void { GiveWeaponComponentToPed(ped, weaponHash, componentHash); }
  removeComponentFromPed(ped: number, weaponHash: number, componentHash: number): void { RemoveWeaponComponentFromPed(ped, weaponHash, componentHash); }
  refillAmmoInstantly(ped: number): boolean { return RefillAmmoInstantly(ped); }
  makePedReload(ped: number): boolean { return MakePedReload(ped); }
  requestAsset(weaponHash: number, p1: number, p2: number): void { RequestWeaponAsset(weaponHash, p1, p2); }
  hasAssetLoaded(weaponHash: number): boolean { return HasWeaponAssetLoaded(weaponHash); }
  removeAsset(weaponHash: number): void { RemoveWeaponAsset(weaponHash); }
  giveComponentToWeaponObject(weaponObject: number, addonHash: number): void { GiveWeaponComponentToWeaponObject(weaponObject, addonHash); }
  removeComponentFromWeaponObject(p0: number, p1: number): void { RemoveWeaponComponentFromWeaponObject(p0, p1); }
  giveObjectToPed(weaponObject: number, ped: number): void { GiveWeaponObjectToPed(weaponObject, ped); }
  doesTakeWeaponComponent(weaponHash: number, componentHash: number): boolean { return DoesWeaponTakeWeaponComponent(weaponHash, componentHash); }
  getObjectFromPed(ped: number, p1: boolean): number { return GetWeaponObjectFromPed(ped, p1); }
  giveLoadoutToPed(ped: number, loadoutHash: number): void { GiveLoadoutToPed(ped, loadoutHash); }
  setObjectTintIndex(weapon: number, tintIndex: number): void { SetWeaponObjectTintIndex(weapon, tintIndex); }
  getObjectTintIndex(weapon: number): number { return GetWeaponObjectTintIndex(weapon); }
  getTintCount(weaponHash: number): number { return GetWeaponTintCount(weaponHash); }
  getHudStats(weaponHash: number): number { const r = GetWeaponHudStats(weaponHash); return Array.isArray(r) ? r[1] : r; }
  getComponentHudStats(componentHash: number): number { const r = GetWeaponComponentHudStats(componentHash); return Array.isArray(r) ? r[1] : r; }
  getDamage(weaponHash: number, componentHash: number): number { return GetWeaponDamage(weaponHash, componentHash); }
  getClipSize(weaponHash: number): number { return GetWeaponClipSize(weaponHash); }
  getTimeBetweenShots(weaponHash: number): number { return GetWeaponTimeBetweenShots(weaponHash); }
  setPedChanceOfFiringBlanks(ped: number, xBias: number, yBias: number): void { SetPedChanceOfFiringBlanks(ped, xBias, yBias); }
  setPedShootOrdnance(ped: number, p1: number): number { return SetPedShootOrdnanceWeapon(ped, p1); }
  requestHighDetailModel(weaponObject: number): void { RequestWeaponHighDetailModel(weaponObject); }
  isFlashLightOn(ped: number): boolean { return IsFlashLightOn(ped); }
  setFlashLightFadeDistance(distance: number): number { return SetFlashLightFadeDistance(distance); }
  setAnimationOverride(ped: number, animStyle: number): void { SetWeaponAnimationOverride(ped, animStyle); }
  getDamageType(weaponHash: number): number { return GetWeaponDamageType(weaponHash); }

  createWeaponObject(weaponHash: number, ammoCount: number, x: number, y: number, z: number, showWorldModel: boolean, scale: number, p7: number, p8: number, p9: number): number { return (CreateWeaponObject as any)(weaponHash, ammoCount, x, y, z, showWorldModel ?? true, scale ?? 1.0, p7 ?? 0, p8 ?? 0, p9 ?? 0); }
  getComponentVariantExtraComponentCount(componentHash: number): number { return GetWeaponComponentVariantExtraComponentCount(componentHash); }
  getComponentVariantExtraComponentModel(componentHash: number, extraComponentIndex: number): number { return GetWeaponComponentVariantExtraComponentModel(componentHash, extraComponentIndex); }
  getCurrentPedEntityIndex(ped: number, p1: number): number { return (GetCurrentPedWeaponEntityIndex as any)(ped, p1); }
  isPedReadyToShoot(ped: number): boolean { return IsPedWeaponReadyToShoot(ped); }
  getPedTypeInSlot(ped: number, weaponSlot: number): number { return GetPedWeapontypeInSlot(ped, weaponSlot); }
  giveDelayedToPed(ped: number, weaponHash: number, ammoCount: number, bForceInHand: boolean): void { GiveDelayedWeaponToPed(ped, weaponHash, ammoCount, bForceInHand); }
  removeAllPedS(ped: number, p1: boolean): void { RemoveAllPedWeapons(ped, p1 ?? true); }
  hidePedForScriptedCutscene(ped: number, toggle: boolean): void { HidePedWeaponForScriptedCutscene(ped, toggle); }
  setPedCurrentVisible(ped: number, visible: boolean, deselectWeapon: boolean, p3: boolean, p4: boolean): void { SetPedCurrentWeaponVisible(ped, visible, deselectWeapon, p3, p4); }
  clearPedLastDamage(ped: number): void { ClearPedLastWeaponDamage(ped); }
  clearEntityLastDamage(entity: number): void { ClearEntityLastWeaponDamage(entity); }
  addAmmoToPedByType(ped: number, ammoTypeHash: number, ammo: number): void { AddAmmoToPedByType(ped, ammoTypeHash, ammo); }
  getPedAmmoTypeFrom2(ped: number, weaponHash: number): number { return GetPedAmmoTypeFromWeapon_2(ped, weaponHash); }
  getPedLastImpactCoord(ped: number): Vector3 { const r: any = GetPedLastWeaponImpactCoord(ped); return toVec3(Array.isArray(r) && Array.isArray(r[1]) ? r[1] : r); }
  hasPedGotComponent(ped: number, weaponHash: number, componentHash: number): boolean { return HasPedGotWeaponComponent(ped, weaponHash, componentHash); }
  isPedComponentActive(ped: number, weaponHash: number, componentHash: number): boolean { return IsPedWeaponComponentActive(ped, weaponHash, componentHash); }
  hasGotWeaponComponent(weapon: number, addonHash: number): boolean { return HasWeaponGotWeaponComponent(weapon, addonHash); }
  setPedTintIndex(ped: number, weaponHash: number, tintIndex: number): void { SetPedWeaponTintIndex(ped, weaponHash, tintIndex); }
  getPedTintIndex(ped: number, weaponHash: number): number { return GetPedWeaponTintIndex(ped, weaponHash); }
  setPedLiveryColor(ped: number, weaponHash: number, camoComponentHash: number, colorIndex: number): void { SetPedWeaponLiveryColor(ped, weaponHash, camoComponentHash, colorIndex); }
  getPedLiveryColor(ped: number, weaponHash: number, camoComponentHash: number): number { return GetPedWeaponLiveryColor(ped, weaponHash, camoComponentHash); }
  setObjectLiveryColor(weaponObject: number, camoComponentHash: number, colorIndex: number): void { SetWeaponObjectLiveryColor(weaponObject, camoComponentHash, colorIndex); }
  getObjectLiveryColor(weaponObject: number, camoComponentHash: number): number { return GetWeaponObjectLiveryColor(weaponObject, camoComponentHash); }
  setDamageModifierThisFrame(weaponHash: number, damageMultiplier: number): void { SetWeaponDamageModifierThisFrame(weaponHash, damageMultiplier); }
  isPedCurrentSilenced(ped: number): boolean { return IsPedCurrentWeaponSilenced(ped); }
  setFlashLightEnabled(ped: number, toggle: boolean): void { SetFlashLightEnabled(ped, toggle); }
  canUseOnParachute(weaponHash: number): boolean { return CanUseWeaponOnParachute(weaponHash); }
  createAirDefenseSphere(x: number, y: number, z: number, radius: number, p4: number, p5: number, p6: number, weaponHash: number): number { return CreateAirDefenceSphere(x, y, z, radius, p4, p5, p6, weaponHash); }
  createAirDefenseArea(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, weaponHash: number): number { return CreateAirDefenceAngledArea(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, weaponHash); }
  removeAirDefenseZone(zoneId: number): boolean { return RemoveAirDefenseZone(zoneId); }
  removeAllAirDefenseZones(): void { RemoveAllAirDefenseZones(); }
  setPlayerAirDefenseZoneFlag(player: number, zoneId: number, enable: boolean): void { SetPlayerAirDefenseZoneFlag(player, zoneId, enable); }
  isAnyAirDefenseZoneInsideSphere(x: number, y: number, z: number, radius: number): number { return IsAirDefenceSphereInArea(x, y, z, radius); }
  fireAirDefense(zoneId: number, x: number, y: number, z: number): void { FireAirDefenseWeapon(zoneId, x, y, z); }
  doesAirDefenseZoneExist(zoneId: number): boolean { return DoesAirDefenseZoneExist(zoneId); }
  setCanPedEquip(ped: number, weaponHash: number, toggle: boolean): void { SetCanPedEquipWeapon(ped, weaponHash, toggle); }
  setCanPedEquipAllS(ped: number, toggle: boolean): void { SetCanPedEquipAllWeapons(ped, toggle); }
  setExplosionRadiusMultiplier(weaponHash: number, multiplier: number): void { SetWeaponExplosionRadiusMultiplier(weaponHash, multiplier); }
  getAllWeaponNames(): number[] { return GetAllWeaponNames(); }


  ["_0x50276EF8172F5F12"](...args: any[]): any { return Citizen.invokeNative("0x50276EF8172F5F12", ...args); }
  ["_0x24C024BA8379A70A"](...args: any[]): any { return Citizen.invokeNative("0x24C024BA8379A70A", ...args); }
  ["_0xA2C9AC24B4061285"](...args: any[]): any { return Citizen.invokeNative("0xA2C9AC24B4061285", ...args); }
  ["_0x977CA98939E82E4B"](...args: any[]): any { return Citizen.invokeNative("0x977CA98939E82E4B", ...args); }
  ["_0xE4DCEC7FD5B739A5"](...args: any[]): any { return Citizen.invokeNative("0xE4DCEC7FD5B739A5", ...args); }
}
