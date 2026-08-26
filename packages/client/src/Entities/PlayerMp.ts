import { Vector3 } from "@ragemp-fivem-bridge/shared";
import { EntityInternals } from "@ragemp-fivem-bridge/shared/internal";
import { PedMpBase } from "./PedMpBase";
import { toVec3 } from "../utils/vec";
import { getLocalDimension } from "../utils/dimension";
import { PlayerInternals, initPlayerInternals, getPlayerServerId } from "../internal/playerInternals";

// Voice FX parameter shapes (from ragemp d.ts)
interface VoiceFxChorus { fWetDryMix: number; fDepth: number; fFeedback: number; fFrequency: number; lWaveform: number; fDelay: number; lPhase: number; }
interface VoiceFxCompressor { fGain: number; fAttack: number; fRelease: number; fThreshold: number; fRatio: number; fPredelay: number; }
interface VoiceFxDistortion { fGain: number; fEdge: number; fPostEQCenterFrequency: number; fPostEQBandwidth: number; fPreLowpassCutoff: number; }
interface VoiceFxEcho { fWetDryMix: number; fFeedback: number; fLeftDelay: number; fRightDelay: number; lPanDelay: number; }
interface VoiceFxFlanger { fWetDryMix: number; fDepth: number; fFeedback: number; fFrequency: number; lWaveform: number; fDelay: number; lPhase: number; }
interface VoiceFxGargle { dwRateHz: number; dwWaveShape: number; }
interface VoiceFxParamEq { fCenter: number; fBandwidth: number; fGain: number; }
interface VoiceFxReverb { fInGain: number; fReverbMix: number; fReverbTime: number; fHighFreqRTRatio: number; }
interface VoiceFxVolume { fTarget: number; fCurrent: number; fTime: number; lCurve: number; }
interface VoiceFxPeakEq { lBand: number; fBandwidth: number; fQ: number; fCenter: number; fGain: number; lChannel: number; }
interface VoiceFxBQF { lFilter: number; fCenter: number; fGain: number; fBandwidth: number; fQ: number; fS: number; lChannel: number; }

export class PlayerMp extends PedMpBase {
  constructor(token: symbol, id: number, playerIndex: number) {
    super(token, id, "player");
    initPlayerInternals(this, playerIndex);
    EntityInternals.get(this).stateBag = () => globalThis.Player(getPlayerServerId(this)).state;
  }

  get ped(): number {
    return GetPlayerPed(PlayerInternals.get(this).playerIndex);
  }
  override get netId(): number {
    return getPlayerServerId(this);
  }
  override get handle(): number {
    return GetPlayerPed(PlayerInternals.get(this).playerIndex);
  }

  get name(): string {
    return GetPlayerName(PlayerInternals.get(this).playerIndex);
  }

  override get dimension(): number {
    if ((globalThis as any).mp?.players?.local === this) return getLocalDimension();
    return PlayerInternals.get(this).dimension ?? 0;
  }
  override set dimension(value: number) {
    PlayerInternals.get(this).dimension = value;
  }

  get vehicle(): any {
    const veh = GetVehiclePedIsIn(this.ped, false);
    if (!veh || veh === 0) return null;
    return (globalThis as any).mp?.vehicles?.atHandle?.(veh) ?? null;
  }

  get aimTarget(): any {
    const [found, entity] = GetPlayerTargetEntity(PlayerInternals.get(this).playerIndex);
    return found ? entity : null;
  }

  get isTypingInTextChat(): boolean {
    return false;
  }

  get isVoiceActive(): boolean {
    return NetworkIsPlayerTalking(PlayerInternals.get(this).playerIndex);
  }

  get ping(): number {
    return GetPlayerPing(PlayerInternals.get(this).playerIndex);
  }

  get eyeColour(): number { return GetPedEyeColor(this.ped); }
  get hairColour(): number { return GetPedHairColor(this.ped); }
  get hairHighlightColour(): number { return GetPedHairHighlightColor(this.ped); }

  get action(): string {
    const ped = this.ped;
    if (!ped) return "unknown";
    if (IsEntityDead(ped)) return "dead";
    if (IsPedInAnyVehicle(ped, false)) return "in_vehicle";
    if (IsPedRagdoll(ped)) return "ragdoll";
    if (IsPedSwimming(ped)) return "swimming";
    if (IsPedFalling(ped)) return "falling";
    if (IsPedJumping(ped)) return "jumping";
    if (IsPedClimbing(ped)) return "climbing";
    if (IsPedInCover(ped, false)) return "in_cover";
    if (IsPedReloading(ped)) return "reloading";
    if (IsPedShooting(ped)) return "shooting";
    if (IsPedRunning(ped)) return "running";
    if (IsPedSprinting(ped)) return "sprinting";
    if (IsPedWalking(ped)) return "walking";
    return "idle";
  }

  get ip(): string { return ""; }
  get rgscId(): string { return ""; }
  get serial(): string { return ""; }
  get socialClub(): string { return ""; }
  get p2pEnabled(): boolean { return false; }
  set p2pEnabled(_v: boolean) {}
  get p2pConnected(): boolean { return false; }

  getId(): number {
    return GetPlayerServerId(PlayerInternals.get(this).playerIndex);
  }

  getIndex(): number {
    return PlayerInternals.get(this).playerIndex;
  }

  call(eventName: string, ...args: any[]): void {
    (globalThis as any).mp?.events?.call(eventName, this, ...args);
  }

  canPedHear(ped: number): boolean { return CanPedHearPlayer(PlayerInternals.get(this).playerIndex, ped); }
  changePed(ped: number, b2: boolean, b3: boolean): void { ChangePlayerPed(PlayerInternals.get(this).playerIndex, ped, !!b2, !!b3); }
  clearHasDamagedAtLeastOneNonAnimalPed(): void { ClearPlayerHasDamagedAtLeastOneNonAnimalPed(PlayerInternals.get(this).playerIndex); }
  clearHasDamagedAtLeastOnePed(): void { ClearPlayerHasDamagedAtLeastOnePed(PlayerInternals.get(this).playerIndex); }
  clearParachuteModelOverride(): void { ClearPlayerParachuteModelOverride(PlayerInternals.get(this).playerIndex); }
  clearParachutePackModelOverride(): void { ClearPlayerParachutePackModelOverride(PlayerInternals.get(this).playerIndex); }
  clearParachuteVariationOverride(): void { ClearPlayerParachuteVariationOverride(PlayerInternals.get(this).playerIndex); }
  clearWantedLevel(): void { ClearPlayerWantedLevel(PlayerInternals.get(this).playerIndex); }
  getCurrentStealthNoise(): number { return GetPlayerCurrentStealthNoise(PlayerInternals.get(this).playerIndex); }
  getGroup(): number { return GetPlayerGroup(PlayerInternals.get(this).playerIndex); }
  getHasReserveParachute(): boolean { return GetPlayerHasReserveParachute(PlayerInternals.get(this).playerIndex); }
  getInvincible(): boolean { return GetPlayerInvincible(PlayerInternals.get(this).playerIndex); }
  getMaxArmour(): number { return GetPlayerMaxArmour(PlayerInternals.get(this).playerIndex); }
  getName(): string { return GetPlayerName(PlayerInternals.get(this).playerIndex); }
  getParachutePackTintIndex(tintIndex?: number): number { return GetPlayerParachutePackTintIndex(PlayerInternals.get(this).playerIndex); }
  getPed(): number { return GetPlayerPed(PlayerInternals.get(this).playerIndex); }
  getPedScriptIndex(): number { return GetPlayerPedScriptIndex(PlayerInternals.get(this).playerIndex); }
  getReserveParachuteTintIndex(tintIndex?: number): number { return GetPlayerReserveParachuteTintIndex(PlayerInternals.get(this).playerIndex); }
  getSprintStaminaRemaining(): number { return GetPlayerSprintStaminaRemaining(PlayerInternals.get(this).playerIndex); }
  getSprintTimeRemaining(): number { return GetPlayerSprintTimeRemaining(PlayerInternals.get(this).playerIndex); }
  getTeam(): number { return GetPlayerTeam(PlayerInternals.get(this).playerIndex); }
  getUnderwaterTimeRemaining(): number { return GetPlayerUnderwaterTimeRemaining(PlayerInternals.get(this).playerIndex); }
  getWantedCentrePosition(): Vector3 { return toVec3(GetPlayerWantedCentrePosition(PlayerInternals.get(this).playerIndex) as any); }
  getWantedLevel(): number { return GetPlayerWantedLevel(PlayerInternals.get(this).playerIndex); }
  giveRagdollControl(toggle: boolean): void { GivePlayerRagdollControl(PlayerInternals.get(this).playerIndex, !!toggle); }
  hasBeenSpottedInStolenVehicle(): boolean { return HasPlayerBeenSpottedInStolenVehicle(PlayerInternals.get(this).playerIndex); }
  hasDamagedAtLeastOneNonAnimalPed(): boolean { return HasPlayerDamagedAtLeastOneNonAnimalPed(PlayerInternals.get(this).playerIndex); }
  hasDamagedAtLeastOnePed(): boolean { return HasPlayerDamagedAtLeastOnePed(PlayerInternals.get(this).playerIndex); }
  hasLeftTheWorld(): boolean { return HasPlayerLeftTheWorld(PlayerInternals.get(this).playerIndex); }
  isControlOn(): boolean { return IsPlayerControlOn(PlayerInternals.get(this).playerIndex); }
  isFreeForAmbientTask(): boolean { return IsPlayerFreeForAmbientTask(PlayerInternals.get(this).playerIndex); }
  isPlaying(): boolean { return IsPlayerPlaying(PlayerInternals.get(this).playerIndex); }
  isPressingHorn(): boolean { return IsPlayerPressingHorn(PlayerInternals.get(this).playerIndex); }
  isReadyForCutscene(): boolean { return IsPlayerReadyForCutscene(PlayerInternals.get(this).playerIndex); }
  isRidingTrain(): boolean { return IsPlayerRidingTrain(PlayerInternals.get(this).playerIndex); }
  isScriptControlOn(): boolean { return IsPlayerScriptControlOn(PlayerInternals.get(this).playerIndex); }
  isTargettingAnything(): boolean { return IsPlayerTargettingAnything(PlayerInternals.get(this).playerIndex); }
  isWantedLevelGreater(wantedLevel: number): boolean { return IsPlayerWantedLevelGreater(PlayerInternals.get(this).playerIndex, wantedLevel); }
  resetArrestState(): void { ResetPlayerArrestState(PlayerInternals.get(this).playerIndex); }
  resetInputGait(): void { ResetPlayerInputGait(PlayerInternals.get(this).playerIndex); }
  resetStamina(): void { ResetPlayerStamina(PlayerInternals.get(this).playerIndex); }
  setCanBeHassledByGangs(toggle: boolean): void { SetPlayerCanBeHassledByGangs(PlayerInternals.get(this).playerIndex, !!toggle); }
  setCanDoDriveBy(toggle: boolean): void { SetPlayerCanDoDriveBy(PlayerInternals.get(this).playerIndex, !!toggle); }
  setCanLeaveParachuteSmokeTrail(enabled: boolean): void { SetPlayerCanLeaveParachuteSmokeTrail(PlayerInternals.get(this).playerIndex, !!enabled); }
  setCanUseCover(toggle: boolean): void { SetPlayerCanUseCover(PlayerInternals.get(this).playerIndex, !!toggle); }
  setControl(toggle: boolean, possiblyFlags: number): void { SetPlayerControl(PlayerInternals.get(this).playerIndex, !!toggle, possiblyFlags ?? 0); }
  setEveryoneIgnore(toggle: boolean): void { SetEveryoneIgnorePlayer(PlayerInternals.get(this).playerIndex, !!toggle); }
  setForcedAim(toggle: boolean): void { SetPlayerForcedAim(PlayerInternals.get(this).playerIndex, !!toggle); }
  setForcedZoom(toggle: boolean): void { SetPlayerForcedZoom(PlayerInternals.get(this).playerIndex, !!toggle); }
  setForceSkipAimIntro(toggle: boolean): void { SetPlayerForceSkipAimIntro(PlayerInternals.get(this).playerIndex, !!toggle); }
  setHasReserveParachute(): void { SetPlayerHasReserveParachute(PlayerInternals.get(this).playerIndex); }
  setLockon(toggle: boolean): void { SetPlayerLockon(PlayerInternals.get(this).playerIndex, !!toggle); }
  setLockonRangeOverride(range: number): void { SetPlayerLockonRangeOverride(PlayerInternals.get(this).playerIndex, range); }
  setMaxArmour(value: number): void { SetPlayerMaxArmour(PlayerInternals.get(this).playerIndex, value); }
  setMayNotEnterAnyVehicle(): void { SetPlayerMayNotEnterAnyVehicle(PlayerInternals.get(this).playerIndex); }
  setMayOnlyEnterThisVehicle(vehicle: any): void { SetPlayerMayOnlyEnterThisVehicle(PlayerInternals.get(this).playerIndex, vehicle?.handle ?? vehicle); }
  setMeleeWeaponDamageModifier(modifier: number): void { (SetPlayerMeleeWeaponDamageModifier as any)(PlayerInternals.get(this).playerIndex, modifier, false); }
  setModel(model: number | string): void {
    const hash = typeof model === "string" ? GetHashKey(model) : model;
    SetPlayerModel(PlayerInternals.get(this).playerIndex, hash);
  }
  setNoiseMultiplier(multiplier: number): void { SetPlayerNoiseMultiplier(PlayerInternals.get(this).playerIndex, multiplier); }
  setParachuteModelOverride(model: number): void { SetPlayerParachuteModelOverride(PlayerInternals.get(this).playerIndex, model); }
  setParachutePackModelOverride(model: number): void { SetPlayerParachutePackModelOverride(PlayerInternals.get(this).playerIndex, model); }
  setParachutePackTintIndex(tintIndex: number): void { SetPlayerParachutePackTintIndex(PlayerInternals.get(this).playerIndex, tintIndex); }
  setParachuteSmokeTrailColor(r: number, g: number, b: number): void { SetPlayerParachuteSmokeTrailColor(PlayerInternals.get(this).playerIndex, r, g, b); }
  setParachuteVariationOverride(component: number, drawable: number, texture: number, p4: boolean): void { SetPlayerParachuteVariationOverride(PlayerInternals.get(this).playerIndex, component, drawable, texture, !!p4); }
  setPoliceIgnore(toggle: boolean): void { SetPoliceIgnorePlayer(PlayerInternals.get(this).playerIndex, !!toggle); }
  setReserveParachuteTintIndex(tintIndex: number): void { SetPedReserveParachuteTintIndex(this.ped, tintIndex); }
  setSimulateAiming(toggle: boolean): void { SetPlayerSimulateAiming(PlayerInternals.get(this).playerIndex, !!toggle); }
  setSneakingNoiseMultiplier(multiplier: number): void { SetPlayerSneakingNoiseMultiplier(PlayerInternals.get(this).playerIndex, multiplier); }
  setSprint(toggle: boolean): void { SetPlayerSprint(PlayerInternals.get(this).playerIndex, !!toggle); }
  setStealthPerceptionModifier(value: number): void { SetPlayerStealthPerceptionModifier(PlayerInternals.get(this).playerIndex, value); }
  setTeam(team: number): void { SetPlayerTeam(PlayerInternals.get(this).playerIndex, team); }
  setVehicleDamageModifier(damageAmount: number): void { SetPlayerVehicleDamageModifier(PlayerInternals.get(this).playerIndex, damageAmount); }
  setVehicleDefenseModifier(modifier: number): void { SetPlayerVehicleDefenseModifier(PlayerInternals.get(this).playerIndex, modifier); }
  setWantedCentrePosition(x: number, y: number, z: number): void { (SetPlayerWantedCentrePosition as any)(PlayerInternals.get(this).playerIndex, x, y, z, false, false); }
  setWantedLevel(wantedLevel: number, disableNoMission: boolean): void { SetPlayerWantedLevel(PlayerInternals.get(this).playerIndex, wantedLevel, disableNoMission ?? false); }
  setWantedLevelNoDrop(wantedLevel: number, p2: boolean): void { SetPlayerWantedLevelNoDrop(PlayerInternals.get(this).playerIndex, wantedLevel, !!p2); }
  setWantedLevelNow(delayLawResponse: boolean): void { SetPlayerWantedLevel(PlayerInternals.get(this).playerIndex, arguments.length ? this.getWantedLevel() : 0, false); SetPlayerWantedLevelNow(PlayerInternals.get(this).playerIndex, !!delayLawResponse); }
  setWeaponDamageModifier(damageAmount: number): void { SetPlayerWeaponDamageModifier(PlayerInternals.get(this).playerIndex, damageAmount); }
  setWeaponDefenseModifier(modifier: number): void { SetPlayerWeaponDefenseModifier(PlayerInternals.get(this).playerIndex, modifier); }

  addVehicleSubtaskAttack(ped2: number): void { AddVehicleSubtaskAttackPed(this.ped, ped2); }
  addVehicleSubtaskAttackCoord(x: number, y: number, z: number): void { AddVehicleSubtaskAttackCoord(this.ped, x, y, z); }
  clearSecondaryTask(): void { ClearPedSecondaryTask(this.ped); }
  explodeHead(weaponHash: number): void { ExplodePedHead(this.ped, weaponHash); }
  hideBloodDamageByZone(p1: any, p2: boolean): void { HidePedBloodDamageByZone(this.ped, p1, !!p2); }
  isClimbing(): boolean { return IsPedClimbing(this.ped); }
  isJumping(): boolean { return IsPedJumping(this.ped); }
  isInCover(exceptUseWeapon: boolean): boolean { return IsPedInCover(this.ped, !!exceptUseWeapon); }
  setClothPinFrames(toggle: boolean): void { SetPedClothPinFrames(this.ped, toggle); }
  taskVehicleShootAt(target: number, p2: number): void { TaskVehicleShootAtPed(this.ped, target, p2 ?? 1.0); }
  updateTaskSweepAim(entity: number): void { UpdateTaskSweepAimEntity(this.ped, entity); }

  getCurrentScriptedAnim(): string { return GetEntityCurrentAnimDict(this.ped); }
  getCurrentScenarioId(): number { return GetScriptTaskStatus(this.ped, 0x6E0B9A8F); }
  taskBleedingDeath(): void { TaskPedDieInVehicle(this.ped, 0); }
  taskRevive(): void { (NetworkResurrectLocalPlayer as any)(0, 0, 0, 0, true, false); }
  taskCrawl(isOnBack?: boolean): void { (TaskGoToCoordsWhilstAimingAtCoords as any)(this.ped, 0, 0, 0, 0, 0, 0, 0, 0, true, 0, 0, false, false, 0); }
  taskCrawlToCoords(position: Vector3, _isOnBack: boolean, _timeout: number): void { TaskGoToCoordAnyMeans(this.ped, position.x, position.y, position.z, 1.0, 0, false, 786603, 0.0); }

  hasTeleportFinished(): boolean { return true; }
  hasUseScenarioTask(): boolean { return IsPedUsingAnyScenario(this.ped); }
  getVoiceAttribute(_attribute: any): any { return undefined; }
  setVoiceAttribute(_attribute: any, _value: any): void {}
  closeVoiceStream(): void {}
  get voiceAutoVolume(): number { return 1.0; }
  set voiceAutoVolume(_v: number) {}
  get voiceVolume(): number { return 1.0; }
  set voiceVolume(v: number) { MumbleSetAudioInputDistance(v * 20); }
  get voice3d(): any { return false; }
  set voice3d(_v: any) {}
  setVoiceFx(_fxType: number, _priority: number): void {}
  removeVoiceFx(_fxHandle: number): void {}
  resetVoiceFx(_fxHandle: number): void {}
  setVoiceFxChorus(_fxHandle: number, _opts: VoiceFxChorus): void {}
  setVoiceFxCompressor(_fxHandle: number, _opts: VoiceFxCompressor): void {}
  setVoiceFxDistortion(_fxHandle: number, _opts: VoiceFxDistortion): void {}
  setVoiceFxEcho(_fxHandle: number, _opts: VoiceFxEcho): void {}
  setVoiceFxFlanger(_fxHandle: number, _opts: VoiceFxFlanger): void {}
  setVoiceFxGargle(_fxHandle: number, _opts: VoiceFxGargle): void {}
  setVoiceFxParamEq(_fxHandle: number, _opts: VoiceFxParamEq): void {}
  setVoiceFxReverb(_fxHandle: number, _opts: VoiceFxReverb): void {}
  setVoiceFxVolume(_fxHandle: number, _opts: VoiceFxVolume): void {}
  setVoiceFxPeakEq(_fxHandle: number, _opts: VoiceFxPeakEq): void {}
  setVoiceFxBQF(_fxHandle: number, _opts: VoiceFxBQF): void {}

  get isPositionFrozen(): boolean {
    return IsEntityPositionFrozen(this.ped);
  }
  set isPositionFrozen(value: boolean) {
    FreezeEntityPosition(this.ped, !!value);
  }

  get voiceFX(): any {
    const rec = PlayerInternals.get(this);
    if (!rec.voiceFX) {
      rec.voiceFX = {
        setFX() {}, removeFX() {}, resetFX() {}, getFXType() { return 0; },
        setFXChorus() {}, setFXCompressor() {}, setFXDistortion() {}, setFXEcho() {},
        setFXFlanger() {}, setFXGargle() {}, setFXI3DL2Reverb() {}, setFXParamEQ() {}, setFXReverb() {},
      };
    }
    return rec.voiceFX;
  }
}
