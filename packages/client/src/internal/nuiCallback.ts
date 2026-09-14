export type NuiCallback = (data: any, cb: (result: any) => void) => void;

// b3889's NUI router no longer dispatches callback paths containing a colon.
// The injected wrapper keeps the public RAGE:MP channel names unchanged while
// translating only the HTTP callback path used inside CEF.
export const NUI_FETCH_COMPATIBILITY_CODE = `(() => {
  if (window.__ragempNuiChannelCompat || typeof window.fetch !== "function") return;
  window.__ragempNuiChannelCompat = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === "string") {
      input = input.replace(/(https:\\/\\/[^/]+\\/)ragemp:/, "$1ragemp_");
    } else if (typeof URL !== "undefined" && input instanceof URL) {
      input = new URL(input.href.replace(/(https:\\/\\/[^/]+\\/)ragemp:/, "$1ragemp_"));
    }
    return originalFetch(input, init);
  };
})()`;

function callbackAlias(name: string): string | null {
  return name.includes(":") ? name.replace(":", "_") : null;
}

function registerOne(name: string, callback: NuiCallback): boolean {
  const direct = (globalThis as any).RegisterNuiCallback;
  if (typeof direct === "function") {
    direct(name, callback);
    return true;
  }

  if (typeof RegisterNuiCallbackType !== "function") return false;
  RegisterNuiCallbackType(name);
  on(`__cfx_nui:${name}`, callback);
  return true;
}

/**
 * Register a NUI callback using the direct API used by current FiveM runtimes.
 * Older runtimes only expose RegisterNuiCallbackType + __cfx_nui events, so
 * keep that path as a compatibility fallback.
 */
export function registerNuiCallback(name: string, callback: NuiCallback): boolean {
  if (!registerOne(name, callback)) return false;
  const alias = callbackAlias(name);
  if (alias) registerOne(alias, callback);
  return true;
}

export function installHostNuiFetchCompatibility(): void {
  if (typeof SendNuiMessage !== "function") return;
  SendNuiMessage(JSON.stringify({ type: "__ragemp:exec", code: NUI_FETCH_COMPATIBILITY_CODE }));
}
