import { registerBrowserProcChannel, browserDomReady } from "../browserInternals";
import type { BrowserMpPool } from "../../Pools/BrowserMpPool";
import { installHostNuiFetchCompatibility, registerNuiCallback } from "../nuiCallback";

function formatError(info: any): string {
  const id = info && info.browserId;
  const kind = (info && info.kind) || "error";
  const where = info && info.event ? ` [event: ${info.event}]` : "";
  const loc =
    info && info.source
      ? ` (${info.source}:${info.lineno ?? "?"}:${info.colno ?? "?"})`
      : "";
  const msg = (info && info.message) || "Unknown error";
  return `[browser ${id}] ${kind}${where}: ${msg}${loc}`;
}

function callCancelable(eventName: string, ...args: any[]): boolean {
  const events = globalThis.mp?.events;
  if (!events) return false;
  let cancelled = false;
  for (const handler of events.getAllOf?.(eventName) ?? []) {
    try {
      if (handler(...args) === true) cancelled = true;
    } catch (error) {
      console.error(`[ragemp:${eventName}]`, error);
    }
  }
  return cancelled;
}

function callWithResult(eventName: string, ...args: any[]): any {
  const events = globalThis.mp?.events;
  if (!events) return undefined;
  let result: any = undefined;
  let pending: Promise<void> | null = null;
  for (const handler of events.getAllOf?.(eventName) ?? []) {
    if (pending) {
      pending = pending.then(async () => {
        const value = await handler(...args);
        if (value !== undefined) result = value;
      });
      continue;
    }

    const value = handler(...args);
    if (value && typeof value.then === "function") {
      pending = Promise.resolve(value).then((resolved) => {
        if (resolved !== undefined) result = resolved;
      });
    } else if (value !== undefined) {
      result = value;
    }
  }
  return pending ? pending.then(() => result) : result;
}

function findBrowser(pool: BrowserMpPool, id: unknown) {
  const numericId = typeof id === "number" ? id : Number(id);
  return Number.isFinite(numericId) ? pool.at(numericId) : null;
}

export function setupBrowserPool(pool: BrowserMpPool): void {
  registerBrowserProcChannel();
  installHostNuiFetchCompatibility();

  on("onResourceStop", (name: string) => {
    if (name !== GetCurrentResourceName()) return;
    for (const browser of pool.toArray()) browser.destroy();
  });

  if (!registerNuiCallback("ragemp:browserError", (data: any, cb: (result: Record<string, never>) => void) => {
    const browser = findBrowser(pool, data && data.browserId);
    console.error(formatError(data));
    if (data && data.stack) console.error(data.stack);
    globalThis.mp?.events?.call("browserError", browser ?? null, data);
    cb({});
  })) return;

  registerNuiCallback("ragemp:browserLifecycle", (data: any, cb: (result: Record<string, never>) => void) => {
    const browser = findBrowser(pool, data && data.browserId);
    if (!browser) {
      cb({});
      return;
    }
    if (data.event === "domReady") {
      browserDomReady(browser);
      globalThis.mp?.events?.call("browserDomReady", browser);
    } else if (data.event === "loadError") {
      console.error(
        `[browser ${data.browserId}] failed to load: ${data.url ?? "(unknown url)"}`,
      );
      globalThis.mp?.events?.call("browserLoadingFailed", browser);
    }
    cb({});
  });

  registerNuiCallback("ragemp:browserEvent", (data: any, cb: (result: Record<string, unknown>) => void) => {
    const { event, args } = data;
    if (event === "Authorization-Login" || event === "__codexAuthTransportProbe") {
      console.log(`[ragemp:nui] received browser event ${event}`);
    }
    if (event === "command") {
      const command = String(args?.[0] ?? "").trim();
      if (command && !callCancelable("playerCommand", command)) {
        emitNet("ragemp:command", command);
      }
      cb({});
      return;
    }
    if (event === "chatMessage") {
      const message = String(args?.[0] ?? "");
      if (message && !callCancelable("playerChat", message)) {
        emitNet("ragemp:chat:message", message);
      }
      cb({});
      return;
    }
    if (event === "setTypingInChatState") {
      const localPlayer = globalThis.mp?.players?.local;
      if (localPlayer) localPlayer.isTypingInTextChat = !!args?.[0];
      cb({});
      return;
    }
    if (event && globalThis.mp?.events) {
      try {
        const result = callWithResult(event, ...(args ?? []));
        if (result && typeof result.then === "function") {
          Promise.resolve(result)
            .then((resolved) => cb({ result: resolved }))
            .catch((error) => {
              console.error(`[ragemp:${event}] browser handler error`, error);
              cb({ error: error instanceof Error ? error.message : String(error) });
            });
        } else {
          // FiveM NUI callbacks must be completed in the originating event turn
          // for ordinary synchronous RAGE:MP handlers. Deferring this through an
          // unconditional await leaves CEF fetch() pending on some runtimes.
          cb({ result });
        }
      } catch (error) {
        console.error(`[ragemp:${event}] browser handler error`, error);
        cb({ error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }
    cb({});
  });
  console.log(`[ragemp:nui] direct-compatible browser callbacks registered in ${GetCurrentResourceName()}`);
}
