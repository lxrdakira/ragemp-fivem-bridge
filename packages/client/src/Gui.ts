import { getNuiFocusDebugState, releaseAllNuiFocus, setCursorVisible } from "./utils/nuiFocus";
import { getChatBrowser } from "./internal/browserInternals";

function callChatBrowser(event: string, ...args: any[]): void {
  const pool = globalThis.mp?.browsers;
  if (pool) getChatBrowser(pool)?.call(event, ...args);
}

export class GuiMp {
  chat: ChatMp;
  cursor: CursorMp;

  constructor() {
    this.chat = new ChatMp();
    this.cursor = new CursorMp();
  }

  execute(code: string): void {
    SendNuiMessage(JSON.stringify({ type: "execute", code }));
  }

  releaseInputFocus(reason = "legacy-client"): void {
    this.cursor.resetAfterForcedRelease();
    releaseAllNuiFocus(reason);
  }

  getInputFocusDebugState(): Record<string, unknown> {
    return {
      ...getNuiFocusDebugState(),
      cursorObjectVisible: this.cursor.visible,
    };
  }

  takeScreenshot(target: string | ((data: string | null) => void) | null, type: number, quality?: number, _compression?: number): void {
    const encodings = ["jpg", "png", "webp"];
    const encoding = encodings[type] ?? "jpg";
    const q = typeof quality === "number" ? Math.max(0, Math.min(1, quality / 100)) : 0.85;
    const hasScreenshotBasic = typeof GetResourceState === "function" && GetResourceState("screenshot-basic") === "started";
    if (!hasScreenshotBasic) {
      console.warn("[bridge] mp.gui.takeScreenshot requires the 'screenshot-basic' FiveM resource (no pure-JS screenshot API exists). Install it from https://github.com/citizenfx/screenshot-basic and add 'ensure screenshot-basic' to server.cfg.");
      if (typeof target === "function") target(null);
      return;
    }
    try {
      global.exports["screenshot-basic"].requestScreenshot(
        { encoding, quality: q },
        (data: string | null) => {
          if (typeof target === "function") {
            target(data);
          } else if (typeof target === "string" && target.length > 0 && data && typeof SendNuiMessage === "function") {
            SendNuiMessage(JSON.stringify({
              type: "__ragemp:screenshot:store",
              name: target.replace(/^.*[\\/]/, ""),
              data,
            }));
          }
        }
      );
    } catch (err) {
      console.warn("[bridge] screenshot-basic call failed:", err);
      if (typeof target === "function") target(null);
    }
  }
}

class ChatMp {
  _active: boolean = true;
  _visible: boolean = true;
  _colors: boolean = true;
  _safeMode: boolean = false;

  activate(state: boolean): void {
    this._active = state;
    emit("chat:toggleActive", state);
    callChatBrowser("chat:activate", state);
  }

  get colors(): boolean {
    return this._colors;
  }

  set colors(value: boolean) {
    this._colors = value;
  }

  get safeMode(): boolean {
    return this._safeMode;
  }

  set safeMode(value: boolean) {
    this._safeMode = value;
  }

  push(text: string): void {
    const out = this._colors
      ? text
      : String(text).replace(/!\{#[0-9a-fA-F]{3,6}\}/g, "").replace(/\^[0-9]/g, "");
    emit("chat:addMessage", { args: [out] });
    callChatBrowser("chat:push", out);
  }

  show(state: boolean): void {
    this._visible = state;
    emit("chat:toggleVisibility", state);
    callChatBrowser("chat:show", state);
  }

  clear(): void {
    emit("chat:clear");
    callChatBrowser("chat:clear");
  }
}

class CursorMp {
  _visible: boolean = false;
  _freeze: boolean = false;
  _freezeTick: number | null = null;

  get visible(): boolean {
    return this._visible;
  }

  set visible(value: boolean) {
    this.show(true, !!value);
  }

  show(freezeControls: boolean, state: boolean): void {
    this._visible = !!state;
    this._freeze = !!freezeControls;
    setCursorVisible(this._visible, !this._freeze);
    this._updateFreezeTick();
  }

  _updateFreezeTick(): void {
    const shouldFreeze = this._visible && this._freeze;
    if (shouldFreeze && this._freezeTick === null) {
      this._freezeTick = setTick(() => {
        DisableAllControlActions(0);
      });
    } else if (!shouldFreeze && this._freezeTick !== null) {
      clearTick(this._freezeTick);
      this._freezeTick = null;
    }
  }

  resetAfterForcedRelease(): void {
    this._visible = false;
    this._freeze = false;
    this._updateFreezeTick();
  }

  get position(): [number, number] {
    if (typeof GetNuiCursorPosition === "function") {
      const [x, y] = GetNuiCursorPosition();
      return [x ?? 0, y ?? 0];
    }
    return [0, 0];
  }
}
