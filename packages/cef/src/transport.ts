let DEBUG = false;

export function setDebug(state: boolean): void {
  DEBUG = !!state;
}

export function isDebug(): boolean {
  return DEBUG;
}

export function log(...args: unknown[]): void {
  if (DEBUG) console.log("[cef]", ...args);
}

let RESOURCE_OVERRIDE: string | null = null;

export function setResourceName(name: string): void {
  if (name && typeof name === "string") RESOURCE_OVERRIDE = name;
}

export function resourceName(): string {
  if (RESOURCE_OVERRIDE) return RESOURCE_OVERRIDE;
  if (typeof GetParentResourceName === "function") {
    try {
      const owner = GetParentResourceName();
      if (owner) return owner;
    } catch (e) {}
  }
  if (
    typeof window !== "undefined" &&
    window.location &&
    typeof window.location.hostname === "string"
  ) {
    const host = window.location.hostname;
    if (host.indexOf("cfx-nui-") === 0) return host.slice(8);
    if (host && host !== "localhost") return host;
  }
  return "";
}

export function isReloadKey(e: KeyboardEvent): boolean {
  const code = e.keyCode || e.which;
  if (code === 116) return true;
  if (e.ctrlKey && code === 82) return true;
  return false;
}

export function preventReload(e: KeyboardEvent): boolean {
  if (e.isTrusted === false) return false;
  if (!isReloadKey(e)) return false;
  if (typeof e.preventDefault === "function") e.preventDefault();
  return true;
}

export async function toClient(channel: string, body?: Record<string, unknown>): Promise<Response | void> {
  // BestMP/FiveM b3889 does not dispatch NUI callback paths containing a
  // colon. The game-side bridge registers both the public RAGE-style name and
  // this underscore alias, but direct DUI/headless pages do not pass through
  // the manager iframe that injects the fetch compatibility shim. Normalize
  // bridge-owned requests here so browserDomReady and RPC work in both normal
  // CEF frames and standalone DUI pages.
  const callbackPath = channel.includes(":") ? channel.replace(":", "_") : channel;
  const url = `https://${resourceName()}/${callbackPath}`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  }).catch((err) => log("toClient failed", channel, String(err)));
}
