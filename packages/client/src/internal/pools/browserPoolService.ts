import { registerBrowserProcChannel, browserDomReady } from "../browserInternals";
import type { BrowserMpPool } from "../../Pools/BrowserMpPool";

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

export function setupBrowserPool(pool: BrowserMpPool): void {
  registerBrowserProcChannel();

  if (typeof RegisterNuiCallbackType !== "function") return;

  RegisterNuiCallbackType("ragemp:browserError");
  on("__cfx_nui:ragemp:browserError", (data: any, cb: (result: Record<string, never>) => void) => {
    const browser = pool.at(data && data.browserId);
    console.error(formatError(data));
    if (data && data.stack) console.error(data.stack);
    globalThis.mp?.events?.call("browserError", browser ?? null, data);
    cb({});
  });

  RegisterNuiCallbackType("ragemp:browserLifecycle");
  on("__cfx_nui:ragemp:browserLifecycle", (data: any, cb: (result: Record<string, never>) => void) => {
    const browser = pool.at(data && data.browserId);
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
      globalThis.mp?.events?.call("browserLoadError", browser, data);
    }
    cb({});
  });

  RegisterNuiCallbackType("ragemp:browserEvent");
  on("__cfx_nui:ragemp:browserEvent", (data: any, cb: (result: Record<string, never>) => void) => {
    const { event, args } = data;
    if (event === "command") {
      const command = String(args?.[0] ?? "").trim();
      if (command) emitNet("ragemp:command", command);
      cb({});
      return;
    }
    if (event === "chatMessage") {
      const message = String(args?.[0] ?? "");
      if (message) emitNet("ragemp:chat:message", message);
      cb({});
      return;
    }
    if (event && globalThis.mp?.events) {
      globalThis.mp.events.call(event, ...(args ?? []));
    }
    cb({});
  });
}
