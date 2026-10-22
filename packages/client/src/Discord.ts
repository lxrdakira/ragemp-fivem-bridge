export class DiscordMp {
  constructor() {
    SetDiscordAppId("1553686775027863573");
    SetDiscordRichPresenceAsset(GetConvar("plmp_discord_asset", "photoast2"));
    SetDiscordRichPresenceAssetText("PLMP | PiterLive");
    SetDiscordRichPresenceAssetSmall("");
    this.update();
  }

  // Legacy gameplay statuses can contain character IDs. Keep this public
  // presence fixed to the project's requested server status instead.
  update(_status?: string, _state?: string): void {
    SetRichPresence("\u0418\u0433\u0440\u0430\u0435\u0442 \u043d\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435 PiterLive");
  }

  requestOAuth2(_appId: string): Promise<never> {
    return Promise.reject(new Error("Discord OAuth2 not available in FiveM"));
  }
}
