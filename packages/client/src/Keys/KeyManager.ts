import { isCursorVisible } from "../utils/nuiFocus";
import { registerNuiCallback } from "../internal/nuiCallback";

const MODIFIER_KEY_ALIASES: Record<number, readonly number[]> = {
  16: [16, 160, 161],
  160: [160, 16],
  161: [161, 16],
  17: [17, 162, 163],
  162: [162, 17],
  163: [163, 17],
  18: [18, 164, 165],
  164: [164, 18],
  165: [165, 18],
};

function keyAliases(code: number): readonly number[] {
  return MODIFIER_KEY_ALIASES[code] ?? [code];
}

export class KeyManager {
  _bindings: Map<string, Set<() => void>> = new Map();
  _keyCodeCache: Map<string, number> = new Map();
  _pressedKeys: Set<number> = new Set();
  _nuiPressed: Set<number> = new Set();
  _tick: number | null = null;

  constructor() {
    registerNuiCallback(
      "ragemp:__keyEvent",
      (
        data: { code?: number; down?: boolean },
        cb: (result: Record<string, never>) => void,
      ) => {
        if (data && typeof data.code === "number") {
          this._setNuiKey(data.code, !!data.down);
        }
        cb({});
      },
    );
  }

  _getKey(keyCode: number | string, isDown: boolean): string {
    return `${keyCode}_${isDown ? "down" : "up"}`;
  }

  isDown(keyCode: number | string): boolean {
    const code = typeof keyCode === "number" ? keyCode : parseInt(keyCode, 10);
    const codes = keyAliases(code);
    if (isCursorVisible()) {
      return codes.some((c) => this._nuiPressed.has(c));
    }
    if (typeof IsDisabledRawKeyDown === "function") {
      return codes.some((c) => IsDisabledRawKeyDown(c) || IsRawKeyDown(c));
    }
    return codes.some((c) => this._pressedKeys.has(c));
  }

  isUp(keyCode: number | string): boolean {
    return !this.isDown(keyCode);
  }

  _setNuiKey(code: number, down: boolean): void {
    if (down) this._nuiPressed.add(code);
    else this._nuiPressed.delete(code);
  }

  call(keyCode: number, isDown: boolean): void {
    const handlers = this._bindings.get(this._getKey(keyCode, isDown));
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        handler();
      } catch (e) {}
    }
  }

  bind(keyCode: number | string, isDown: boolean, handler: () => void): void {
    const key = this._getKey(keyCode, isDown);
    if (!this._bindings.has(key)) {
      this._bindings.set(key, new Set());
      this._keyCodeCache.set(key, parseInt(String(keyCode), 10));
    }
    this._bindings.get(key)!.add(handler);
    this._ensureTick();
  }

  unbind(
    keyCode: number | string,
    isDown: boolean,
    handler?: () => void,
  ): void {
    const key = this._getKey(keyCode, isDown);
    const handlers = this._bindings.get(key);
    if (!handlers) return;
    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this._bindings.delete(key);
        this._keyCodeCache.delete(key);
      }
    } else {
      this._bindings.delete(key);
      this._keyCodeCache.delete(key);
    }
    if (this._bindings.size === 0) this._cleanupTick();
  }

  _ensureTick(): void {
    if (this._tick !== null) return;
    this._tick = setTick(() => {
      const cursorVisible = isCursorVisible();
      if (!cursorVisible && this._nuiPressed.size) this._nuiPressed.clear();
      for (const key of this._bindings.keys()) {
        const keyCode = this._keyCodeCache.get(key)!;
        const codes = keyAliases(keyCode);
        const isDown = cursorVisible
          ? codes.some((c) => this._nuiPressed.has(c))
          : codes.some((c) => IsDisabledRawKeyDown(c) || IsRawKeyDown(c));
        const wasDown = this._pressedKeys.has(keyCode);
        if (isDown && !wasDown) {
          this._pressedKeys.add(keyCode);
          this.call(keyCode, true);
        } else if (!isDown && wasDown) {
          this._pressedKeys.delete(keyCode);
          this.call(keyCode, false);
        }
      }
    });
  }

  _cleanupTick(): void {
    if (this._tick !== null) {
      clearTick(this._tick);
      this._tick = null;
    }
  }
}
