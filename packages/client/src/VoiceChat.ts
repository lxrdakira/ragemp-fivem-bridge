import { getPlayerServerId } from "./internal/playerInternals";

const LISTEN_CHANNEL = 31;

export class VoiceChatMp {
  _enabled = true;
  _muted = false;

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
    const serverId = typeof player === "number" ? player : player ? getPlayerServerId(player) : null;
    if (serverId != null) {
      MumbleAddVoiceTargetPlayerByServerId(LISTEN_CHANNEL, serverId);
      MumbleAddVoiceChannelListen(LISTEN_CHANNEL);
    }
  }

  stopListenTo(player: number | any) {
    const serverId = typeof player === "number" ? player : player ? getPlayerServerId(player) : null;
    if (serverId != null) {
      MumbleRemoveVoiceTargetPlayerByServerId(LISTEN_CHANNEL, serverId);
    }
  }

  stopListenToAll() {
    MumbleClearVoiceTarget(LISTEN_CHANNEL);
    MumbleRemoveVoiceChannelListen(LISTEN_CHANNEL);
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
