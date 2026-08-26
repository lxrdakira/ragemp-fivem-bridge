import { EventManager } from "./events.js";
import { toClient, log, setDebug, isDebug, setResourceName } from "./transport.js";
import { installErrorCapture, serializeError, report } from "./errors.js";

interface KeyInit {
  key?: string;
  code?: string;
  location?: number;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  repeat?: boolean;
  keyCode?: number;
  which?: number;
}

function dispatchSyntheticKey(down: boolean, init: KeyInit): void {
  if (typeof document === "undefined") return;
  const type = down ? "keydown" : "keyup";
  let event: Event;
  try {
    event = new KeyboardEvent(type, {
      key: init.key,
      code: init.code,
      location: init.location || 0,
      altKey: !!init.altKey,
      ctrlKey: !!init.ctrlKey,
      shiftKey: !!init.shiftKey,
      metaKey: !!init.metaKey,
      repeat: !!init.repeat,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
  } catch (e) {
    event = document.createEvent("Event");
    event.initEvent(type, true, true);
  }
  const kc = init.keyCode || init.which || 0;
  try {
    Object.defineProperty(event, "keyCode", { configurable: true, get: () => kc });
    Object.defineProperty(event, "which", { configurable: true, get: () => kc });
    Object.defineProperty(event, "key", { configurable: true, get: () => init.key });
    Object.defineProperty(event, "code", { configurable: true, get: () => init.code });
  } catch (e) {  }
  const target =
    document.activeElement || document.body || document.documentElement || document;
  target.dispatchEvent(event);
}

interface PayloadData {
  type?: string;
  code?: string;
  down?: boolean;
  init?: KeyInit;
  browserId?: string;
  resource?: string;
  event?: string;
  args?: unknown[];
  proc?: string;
  requestId?: number;
  result?: unknown;
  error?: string;
  procResult?: boolean;
  name?: string;
  data?: string;
}

const screenshotUrls = new Map<string, string>();
let screenshotProtocolInstalled = false;

function screenshotName(url: unknown): string | null {
  const match = /^https?:\/\/screenshots\/([^?#]+)/i.exec(String(url ?? ""));
  if (!match) return null;
  try { return decodeURIComponent(match[1]).replace(/^.*[\\/]/, ""); }
  catch (_) { return match[1].replace(/^.*[\\/]/, ""); }
}

function storeScreenshot(name: string, data: string): void {
  if (!name || !data || typeof URL === "undefined" || typeof Blob === "undefined") return;
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/i.exec(data);
  if (!match) return;
  try {
    const raw = match[2] ? atob(match[3]) : decodeURIComponent(match[3]);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const next = URL.createObjectURL(new Blob([bytes], { type: match[1] || "image/jpeg" }));
    const safeName = name.replace(/^.*[\\/]/, "");
    const previous = screenshotUrls.get(safeName);
    if (previous) URL.revokeObjectURL(previous);
    screenshotUrls.set(safeName, next);
  } catch (error) {
    log("failed to store screenshot", name, String(error));
  }
}

function resolveScreenshotUrl(value: unknown): unknown {
  const name = screenshotName(value);
  return name ? (screenshotUrls.get(name) ?? value) : value;
}

function installScreenshotProtocol(): void {
  if (screenshotProtocolInstalled || typeof window === "undefined") return;
  screenshotProtocolInstalled = true;

  if (typeof XMLHttpRequest !== "undefined") {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: any[]): void {
      return (originalOpen as any).call(this, method, resolveScreenshotUrl(url), ...rest);
    } as typeof XMLHttpRequest.prototype.open;
  }

  if (typeof window.fetch === "function") {
    const originalFetch = window.fetch.bind(window);
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === "string" || input instanceof URL) {
        return originalFetch(resolveScreenshotUrl(input) as RequestInfo | URL, init);
      }
      return originalFetch(input, init);
    }) as typeof window.fetch;
  }
}

export function createRuntime(): {
  mp: Record<string, unknown>;
  events: EventManager;
  handlePayload: (data: PayloadData) => void;
  setSelfId: (id: string) => void;
  getSelfId: () => string;
} {
  installScreenshotProtocol();
  let selfId = "host";
  const getSelfId = (): string => selfId;

  const events = new EventManager(getSelfId);

  const mp: Record<string, unknown> = {
    async trigger(eventName: string, ...args: unknown[]): Promise<unknown> {
      log("trigger ->client", eventName, "from", selfId);
      const response = await toClient("ragemp:browserEvent", { browserId: selfId, event: eventName, args });
      if (!response) return undefined;
      const payload = await response.json().catch(() => ({})) as { result?: unknown; error?: string };
      if (payload.error) throw new Error(payload.error);
      return payload.result;
    },
    invoke(eventName: string, ...args: unknown[]): Promise<unknown> {
      return (mp.trigger as (...a: unknown[]) => Promise<unknown>)(eventName, ...args);
    },
    events,
    cef: {
      setDebugMode: setDebug,
      get debug() { return isDebug(); },
      get id() { return selfId; },
    },
  };

  (globalThis as Record<string, unknown>).mp = mp;

  installErrorCapture(
    (info) => toClient("ragemp:browserError", info),
    getSelfId,
  );

  function setSelfId(id: string): void {
    selfId = id;
  }

  function handlePayload(data: PayloadData): void {
    if (!data || typeof data !== "object") return;

    if (data.type === "__ragemp:screenshot:store" && data.name && data.data) {
      storeScreenshot(data.name, data.data);
      return;
    }

    if (data.type === "__ragemp:exec" && data.code) {
      try {
        (0, eval)(data.code);
      } catch (e) {
        log("exec error", String(e));
        console.error("[ragemp:exec]", e);
        report({ kind: "exec", ...serializeError(e) });
      }
      return;
    }

    if (data.type === "__ragemp:reload") {
      location.reload();
      return;
    }

    if (data.type === "__ragemp:key") {
      dispatchSyntheticKey(data.down ?? false, data.init || {});
      return;
    }

    if (data.type === "__ragemp:assignId") {
      setSelfId(data.browserId!);
      if (data.resource) setResourceName(data.resource);
      log("assigned id", data.browserId);
      return;
    }

    if (data.event) {
      log("recv event", data.event);
      events._fire(data.event, ...(Array.isArray(data.args) ? data.args : []));
      return;
    }

    if (data.proc) {
      log("recv proc call", data.proc);
      events.runProc(data.proc, data.args ?? [])
        .then((result) => toClient("ragemp:cefProcResult", { browserId: selfId, requestId: data.requestId, result }))
        .catch((err) => toClient("ragemp:cefProcResult", { browserId: selfId, requestId: data.requestId, error: err instanceof Error ? err.message : String(err) }));
      return;
    }

    if (data.procResult) {
      events.resolveProc(data.requestId!, data.result, data.error);
    }
  }

  return { mp, events, handlePayload, setSelfId, getSelfId };
}
