import { getPlayerServerId } from "./internal/playerInternals";

const VOICE_TARGET = 31;

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
  _muted = false;
  private readonly listeners = new Set<number>();

  get connected() {
    return MumbleIsConnected();
  }

  get enabled() {
    return this._enabled;
  }

  set enabled(value) {
    this._enabled = !!value;
    NetworkSetVoiceActive(this._enabled && !this._muted);
  }

  get muted() {
    return this._muted;
  }

  set muted(value) {
    this._muted = !!value;
    NetworkSetVoiceActive(this._enabled && !this._muted);
  }

  get proximity() {
    return MumbleGetTalkerProximity();
  }

  set proximity(value) {
    MumbleSetTalkerProximity(value);
  }

  listenTo(player: number | any) {
    const serverId = resolveServerId(player);
    if (serverId <= 0) return;
    this.listeners.add(serverId);
    const volume = typeof player === "number" ? 1 : clampVolume(player?.voiceVolume);
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
    MumbleSetVolumeOverrideByServerId(serverId, 0);
    MumbleRemoveVoiceTargetPlayerByServerId(VOICE_TARGET, serverId);
  }

  stopListenToAll() {
    for (const serverId of this.listeners) MumbleSetVolumeOverrideByServerId(serverId, 0);
    this.listeners.clear();
    MumbleClearVoiceTarget(VOICE_TARGET);
  }

  setPlayerVolume(player: number | any, value: number) {
    const serverId = resolveServerId(player);
    if (serverId <= 0) return;
    MumbleSetVolumeOverrideByServerId(serverId, this.listeners.has(serverId) ? clampVolume(value) : 0);
  }

  muteUntilEnabled(player: number | any) {
    const serverId = resolveServerId(player);
    if (serverId > 0 && !this.listeners.has(serverId)) MumbleSetVolumeOverrideByServerId(serverId, 0);
  }

  forgetPlayer(serverId: number) {
    if (serverId <= 0) return;
    this.listeners.delete(serverId);
    MumbleSetVolumeOverrideByServerId(serverId, -1);
    MumbleRemoveVoiceTargetPlayerByServerId(VOICE_TARGET, serverId);
  }

  cleanupAndReload(_resetInput = true, _resetOutput = true, _resetTargets = true) {
    const wasEnabled = this._enabled;
    const wasMuted = this._muted;
    const proximity = this.proximity;

    this.stopListenToAll();
    NetworkSetVoiceActive(false);

    setTimeout(() => {
      if (Number.isFinite(proximity) && proximity > 0) {
        MumbleSetTalkerProximity(proximity);
      }
      NetworkSetVoiceActive(wasEnabled && !wasMuted);
    }, 0);
  }

  isTalking(player: number | any) {
    const p = typeof player === "number" ? player : player ? getPlayerServerId(player) : null;
    if (p == null) return NetworkIsPlayerTalking(PlayerId());
    return MumbleIsPlayerTalking(GetPlayerFromServerId(p));
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
