const _kbHolders = new Set<string>();
let _cursorVisible = false;
let _tick: null | number = null;
let _chatBrowserId: number | null = null;

function _desired() {
  const hasFocus = _kbHolders.size > 0 || _cursorVisible;
  const hasCursor = _cursorVisible;
  const keepInput = _kbHolders.size > 0 && !_cursorVisible;
  return { hasFocus, hasCursor, keepInput };
}

function _focusedBrowserId(): number | null {
  let activeBrowserId: number | null = null;
  for (const holder of _kbHolders) {
    const match = /^browser:(\d+)$/.exec(holder);
    if (match) activeBrowserId = Number(match[1]);
  }
  return activeBrowserId ?? (_cursorVisible ? _chatBrowserId : null);
}

function _restoreBrowserFocus() {
  const browserId = _focusedBrowserId();
  if (browserId === null || typeof SendNuiMessage !== "function") return;
  SendNuiMessage(
    JSON.stringify({
      type: "__ragemp:browser:focus",
      browserId,
    })
  );
}

function _applyFocus(hasFocus: boolean, hasCursor: boolean, keepInput: boolean) {
  if (typeof SetNuiFocus === "function") SetNuiFocus(hasFocus, hasCursor);
  if (typeof SetNuiFocusKeepInput === "function") SetNuiFocusKeepInput(keepInput);
  // SetNuiFocus targets the resource host document. Restore the nested CEF
  // afterwards or Svelte inputs (especially chat) immediately lose keyboard.
  if (hasFocus) _restoreBrowserFocus();
}

function _run() {
  const { hasFocus, hasCursor, keepInput } = _desired();
  if (!hasFocus) {
    if (_tick !== null) {
      clearTick(_tick);
      _tick = null;
    }
    return;
  }
  if (typeof DisableControlAction === "function") {
    DisableControlAction(0, 199, true);
    DisableControlAction(0, 200, true);
    DisableControlAction(2, 199, true);
    DisableControlAction(2, 200, true);
  }
  // Do not renew SetNuiFocus on a timer while it is already focused: CEF 103
  // treats that as a new focus transition and drops Svelte input on keypress.
  if (typeof IsNuiFocused !== "function" || !IsNuiFocused()) {
    _applyFocus(hasFocus, hasCursor, keepInput);
  }
}

function _apply() {
  const { hasFocus, hasCursor, keepInput } = _desired();
  _applyFocus(hasFocus, hasCursor, keepInput);
  if (hasFocus && _tick === null && typeof setTick === "function") {
    _tick = setTick(_run);
  } else if (!hasFocus && _tick !== null) {
    clearTick(_tick);
    _tick = null;
  }
}

export function setBrowserFocus(holder: string, on: boolean): void {
  if (on) {
    // Reinsert so Set order mirrors the most recently activated browser.
    _kbHolders.delete(holder);
    _kbHolders.add(holder);
  } else _kbHolders.delete(holder);
  console.log(`[nui-focus] browser holder=${holder} on=${on ? 1 : 0} holders=${JSON.stringify(Array.from(_kbHolders))} cursor=${_cursorVisible ? 1 : 0}`);
  _apply();
}

export function setCursorVisible(visible: boolean): void {
  _cursorVisible = !!visible;
  console.log(`[nui-focus] cursor=${_cursorVisible ? 1 : 0} holders=${JSON.stringify(Array.from(_kbHolders))}`);
  _apply();
}

export function releaseAllNuiFocus(reason = "unspecified"): void {
  _kbHolders.clear();
  _cursorVisible = false;
  console.log(`[nui-focus] force release reason=${reason}`);
  _apply();
}

export function getNuiFocusDebugState(): Record<string, unknown> {
  const desired = _desired();
  return {
    holders: Array.from(_kbHolders),
    cursorVisible: _cursorVisible,
    desired,
    nativeFocused: typeof IsNuiFocused === "function" ? IsNuiFocused() : null,
  };
}

export function setChatBrowserFocusTarget(browserId: number | null): void {
  _chatBrowserId = browserId;
  if (_cursorVisible && _kbHolders.size === 0) _apply();
}

export function isCursorVisible(): boolean {
  return _cursorVisible;
}

export function isNuiInputCaptured(): boolean {
  return _kbHolders.size > 0 || _cursorVisible;
}
