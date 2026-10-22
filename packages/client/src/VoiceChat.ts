import { getPlayerServerId } from "./internal/playerInternals";

// Legacy Mumble accepts targets 1..30; 31 is reserved/invalid.
const VOICE_TARGET = 30;
const MUTED_TARGET = 29;

// The launcher initializes these before GTA loads its archived preferences.
// Client resources cannot reliably execute privileged `seta` commands.
const VOICE_PROFILE_DEFAULTS = [
  ["profile_voiceEnable", 1, false],
  ["profile_voiceTalkEnabled", 1, false],
  ["profile_voiceChatMode", 1, false], // 1 = push to talk, 0 = voice activity
  ["profile_voiceOutputVolume", 10, true],
  ["profile_voiceMicVolume", 10, true],
] as const;

export function isPlayerVoiceTalking(playerIndex: number): boolean {
  if (playerIndex < 0 || !MumbleIsConnected()) return false;
  const voice = (globalThis as any).mp?.voiceChat;
  if (voice && !voice.enabled) return false;
  // An input meter / VAD flag is not evidence of authorized transmission.
  if (playerIndex === PlayerId() && (!voice || voice.muted)) return false;
  return MumbleIsPlayerTalking(playerIndex);
}

function resolveServerId(player: number | any): number {
  return typeof player === "number" ? player : player ? getPlayerServerId(player) : -1;
}

function clampVolume(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : 1;
}

export class VoiceChatMp {
  _enabled = true;
  _muted = true;
  private readonly listeners = new Set<number>();
  private readonly volumes = new Map<number, number>();
  private connectedLastFrame = false;
  private tick: number | null = null;
  private proximityValue = 12;
  private targetsRefreshAt = 0;
  private profileDefaultsPending = true;
  private profileCheckAt = 0;
  private profileWarningShown = false;

  constructor() {
    // NETWORK_SET_VOICE_ACTIVE controls the connection, not just capture.
    // Keep it alive while PTT is released so incoming voice keeps working.
    if (typeof NetworkSetVoiceActive === "function") NetworkSetVoiceActive(true);
    if (typeof setTick === "function") this.tick = setTick(() => this.update());
    if (typeof on === "function") on("onClientResourceStop", (resource: string) => {
      if (resource !== GetCurrentResourceName()) return;
      if (this.tick !== null) clearTick(this.tick);
      this.tick = null;
      if (MumbleIsConnected()) {
        MumbleClearVoiceTarget(VOICE_TARGET);
        MumbleClearVoiceTarget(MUTED_TARGET);
        MumbleSetVoiceTarget(MUTED_TARGET);
      }
      NetworkSetVoiceActive(false);
    });
  }

  private update() {
    if (!this._enabled) return;
    this.prepareProfileDefaults();
    const connected = MumbleIsConnected();
    if (connected !== this.connectedLastFrame) {
      this.connectedLastFrame = connected;
      console.log(`[plmp-voice] connected=${connected ? 1 : 0} muted=${this._muted ? 1 : 0} listeners=${this.listeners.size}`);
      if (connected) {
        MumbleSetVoiceChannel(GetPlayerServerId(PlayerId()));
        MumbleSetTalkerProximity(this.proximityValue);
        MumbleClearVoiceTarget(MUTED_TARGET);
        this.restoreTargets();
        this.targetsRefreshAt = Date.now() + 1000;
      }
    }
    if (!connected) return;
    // Peer Mumble names can arrive after the GTA player has streamed in.
    // Retry authorized targets, otherwise the first add may be silently lost.
    if (Date.now() >= this.targetsRefreshAt) {
      this.restoreTargets();
      this.targetsRefreshAt = Date.now() + 1000;
    }
    // An empty explicit target silences outgoing audio in both PTT and VAD
    // settings, without disconnecting or muting incoming peers.
    MumbleSetVoiceTarget(this._muted ? MUTED_TARGET : VOICE_TARGET);
    if (this._muted) DisableControlAction(0, 249, true);
    else {
      EnableControlAction(0, 249, true);
      SetControlNormal(0, 249, 1.0);
    }
  }

  private prepareProfileDefaults() {
    if (!this.profileDefaultsPending || Date.now() < this.profileCheckAt) return;
    this.profileCheckAt = Date.now() + 1000;
    const values = VOICE_PROFILE_DEFAULTS.map(([name]) => GetConvarInt(name, -1));
    // At resource startup GTA may not have registered its profile yet. Do not
    // create zero/default convars early and let that later overwrite the fix.
    if (values.some(value => value < 0)) return;
    const ready = VOICE_PROFILE_DEFAULTS.every(([, fallback, onlyIfSilent], index) =>
      onlyIfSilent ? values[index] > 0 : values[index] === fallback);
    if (ready) {
      this.profileDefaultsPending = false;
      console.log("[plmp-voice] profile=ready mode=ptt");
    } else if (!this.profileWarningShown) {
      this.profileWarningShown = true;
      console.warn("[plmp-voice] profile=not-ready; launch using the updated PLMP launcher or enable voice/microphone and PTT in game settings");
    }
  }

  private restoreTargets() {
    MumbleClearVoiceTarget(VOICE_TARGET);
    for (const serverId of this.listeners) {
      MumbleAddVoiceTargetPlayerByServerId(VOICE_TARGET, serverId);
    }
    for (const [serverId, volume] of this.volumes)
      MumbleSetVolumeOverrideByServerId(serverId, this.listeners.has(serverId) ? volume : 0);
  }

  get connected() {
    return MumbleIsConnected();
  }

  get enabled() {
    return this._enabled;
  }

  set enabled(value) {
    this._enabled = !!value;
    if (this._enabled) this.resetProfileDefaults();
    NetworkSetVoiceActive(this._enabled);
    this.connectedLastFrame = false;
  }

  get muted() {
    return this._muted;
  }

  set muted(value) {
    this._muted = !!value;
    // Do not use NetworkSetVoiceActive(false): it also disconnects receiving.
    if (this._enabled && MumbleIsConnected())
      MumbleSetVoiceTarget(this._muted ? MUTED_TARGET : VOICE_TARGET);
  }

  get proximity() {
    return MumbleGetTalkerProximity();
  }

  set proximity(value) {
    this.proximityValue = value;
    MumbleSetTalkerProximity(value);
  }

  listenTo(player: number | any) {
    const serverId = resolveServerId(player);
    if (serverId <= 0) return;
    this.listeners.add(serverId);
    const volume = typeof player === "number" ? 1 : clampVolume(player?.voiceVolume);
    this.volumes.set(serverId, volume);
    MumbleSetVolumeOverrideByServerId(serverId, volume);

    // A RAGE listener relationship is usually bidirectional in Neptune. Keeping
    // the peer in the Mumble target also transports radio/phone audio outside
    // normal proximity; incoming authorization is enforced by the override.
    MumbleAddVoiceTargetPlayerByServerId(VOICE_TARGET, serverId);
  }

  stopListenTo(player: number | any) {
    const serverId = resolveServerId(player);
    if (serverId <= 0) return;
    this.listeners.delete(serverId);
    this.volumes.delete(serverId);
    MumbleSetVolumeOverrideByServerId(serverId, 0);
    MumbleRemoveVoiceTargetPlayerByServerId(VOICE_TARGET, serverId);
  }

  stopListenToAll() {
    for (const serverId of this.listeners) MumbleSetVolumeOverrideByServerId(serverId, 0);
    this.listeners.clear();
    this.volumes.clear();
    MumbleClearVoiceTarget(VOICE_TARGET);
  }

  setPlayerVolume(player: number | any, value: number) {
    const serverId = resolveServerId(player);
    if (serverId <= 0) return;
    this.volumes.set(serverId, clampVolume(value));
    MumbleSetVolumeOverrideByServerId(serverId, this.listeners.has(serverId) ? clampVolume(value) : 0);
  }

  muteUntilEnabled(player: number | any) {
    const serverId = resolveServerId(player);
    if (serverId > 0 && !this.listeners.has(serverId)) {
      this.volumes.set(serverId, 0);
      MumbleSetVolumeOverrideByServerId(serverId, 0);
    }
  }

  forgetPlayer(serverId: number) {
    if (serverId <= 0) return;
    this.listeners.delete(serverId);
    this.volumes.delete(serverId);
    MumbleSetVolumeOverrideByServerId(serverId, -1);
    MumbleRemoveVoiceTargetPlayerByServerId(VOICE_TARGET, serverId);
  }

  cleanupAndReload(_resetInput = true, _resetOutput = true, _resetTargets = true) {
    // Keep authorizations and muted/volume state; rebuilding them only from
    // stream-in loses already nearby peers after /v_reload or a reconnect.
    NetworkSetVoiceActive(this._enabled);
    this.resetProfileDefaults();
    this.connectedLastFrame = false;
    this.update();
  }

  isTalking(player: number | any) {
    const p = typeof player === "number" ? player : player ? getPlayerServerId(player) : null;
    return isPlayerVoiceTalking(p == null ? PlayerId() : GetPlayerFromServerId(p));
  }

  private resetProfileDefaults() {
    this.profileDefaultsPending = true;
    this.profileCheckAt = 0;
    this.profileWarningShown = false;
  }

  setChannel(channel: number) {
    MumbleSetVoiceChannel(channel);
  }

  setAudioInputDistance(distance: number) {
    MumbleSetAudioInputDistance(distance);
  }

  setAudioOutputDistance(distance: number) {
    MumbleSetAudioOutputDistance(distance);
  }
}
