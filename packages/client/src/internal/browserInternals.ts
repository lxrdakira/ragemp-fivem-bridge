import { defineInternals } from "@ragemp-fivem-bridge/shared/internal";
import type { BrowserMp } from "../Entities/BrowserMp";
import type { BrowserMpPool } from "../Pools/BrowserMpPool";

export interface BrowserInternalsRec {
  url: string;
  active: boolean;
  isChatBrowser: boolean;
  destroyed: boolean;
  inputEnabled: boolean;
  mouseInputEnabled: boolean;
  orderId: number;
  domReady: boolean;
  cachedExec: string[];
  headless: HeadlessBrowserState | null;
}

export interface HeadlessBrowserState {
  dui: number;
  resolvedUrl: string;
  textureDict: string;
  textureName: string;
  readyTimer: ReturnType<typeof setInterval> | null;
}

export const BrowserInternals = defineInternals<BrowserInternalsRec>();

export function initBrowserInternals(browser: BrowserMp, url: string): BrowserInternalsRec {
  return BrowserInternals.init(browser, {
    url,
    active: false,
    isChatBrowser: false,
    destroyed: false,
    inputEnabled: true,
    mouseInputEnabled: true,
    orderId: 0,
    domReady: false,
    cachedExec: [],
    headless: null,
  });
}

export function browserDomReady(browser: BrowserMp): void {
  const rec = BrowserInternals.get(browser);
  rec.domReady = true;
  if (rec.cachedExec.length === 0) return;
  for (const code of rec.cachedExec.splice(0)) browser.execute(code);
}

export function applyBrowserPointerEvents(browser: BrowserMp): void {
  const rec = BrowserInternals.get(browser);
  if (rec.headless) return;
  if (rec.destroyed || typeof SendNuiMessage !== "function") return;
  SendNuiMessage(
    JSON.stringify({
      type: "__ragemp:browser:pointerEvents",
      browserId: browser.id,
      enabled: rec.inputEnabled && rec.mouseInputEnabled,
    })
  );
}

export function setHeadlessBrowser(browser: BrowserMp, state: HeadlessBrowserState): void {
  BrowserInternals.get(browser).headless = state;
}

export function sendHeadlessPayload(browser: BrowserMp, payload: Record<string, unknown>): boolean {
  const state = BrowserInternals.get(browser).headless;
  if (!state || !state.dui) return false;
  SendDuiMessage(state.dui, JSON.stringify({ __ragempForward: true, inner: payload }));
  return true;
}

export function beginHeadlessReadyHandshake(browser: BrowserMp): void {
  const rec = BrowserInternals.get(browser);
  const state = rec.headless;
  if (!state || !state.dui) return;
  if (state.readyTimer !== null) clearInterval(state.readyTimer);
  let attempts = 0;
  state.readyTimer = setInterval(() => {
    attempts++;
    if (rec.destroyed || rec.domReady) {
      clearInterval(state.readyTimer!);
      state.readyTimer = null;
      return;
    }
    if (IsDuiAvailable(state.dui)) {
      sendHeadlessPayload(browser, {
        type: "__ragemp:assignId",
        browserId: String(browser.id),
        resource: GetCurrentResourceName(),
      });
    }
    if (attempts < 300) return;
    clearInterval(state.readyTimer!);
    state.readyTimer = null;
    globalThis.mp?.events?.call("browserLoadingFailed", browser);
  }, 100);
}

export function reloadHeadlessBrowser(browser: BrowserMp): boolean {
  const rec = BrowserInternals.get(browser);
  const state = rec.headless;
  if (!state || !state.dui) return false;
  rec.domReady = false;
  SetDuiUrl(state.dui, state.resolvedUrl);
  beginHeadlessReadyHandshake(browser);
  return true;
}

export function destroyHeadlessBrowser(browser: BrowserMp): boolean {
  const state = BrowserInternals.get(browser).headless;
  if (!state) return false;
  if (state.readyTimer !== null) clearInterval(state.readyTimer);
  if (state.dui) DestroyDui(state.dui);
  state.readyTimer = null;
  state.dui = 0;
  return true;
}

interface BrowserPoolRec {
  chatBrowser: BrowserMp | null;
}

const BrowserPoolInternals = defineInternals<BrowserPoolRec>();

export function initBrowserPoolInternals(pool: BrowserMpPool): void {
  BrowserPoolInternals.init(pool, { chatBrowser: null });
}

export function getChatBrowser(pool: BrowserMpPool): BrowserMp | null {
  return BrowserPoolInternals.get(pool).chatBrowser;
}

export function setChatBrowser(pool: BrowserMpPool, browser: BrowserMp | null): void {
  BrowserPoolInternals.get(pool).chatBrowser = browser;
}

interface PendingProc {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

const pendingProcs = new Map<number, PendingProc>();
let procCounter = 0;
let procTimeout = 10000;

export function setBrowserProcTimeout(ms: number): void {
  if (typeof ms === "number" && ms > 0) procTimeout = ms;
}

export function getBrowserProcTimeout(): number {
  return procTimeout;
}

export function callBrowserProc<T = any>(browser: BrowserMp, procName: string, args: any[]): Promise<T> {
  const browserId = browser.id;
  const requestId = ++procCounter;
  return new Promise<T>((resolve, reject) => {
    pendingProcs.set(requestId, { resolve, reject });
    if (!sendHeadlessPayload(browser, { proc: procName, requestId, args }))
      SendNuiMessage(JSON.stringify({ type: "__ragemp:browser:proc", browserId, proc: procName, requestId, args }));
    setTimeout(() => {
      if (pendingProcs.has(requestId)) {
        pendingProcs.delete(requestId);
        reject(new Error(`Proc "${procName}" timed out after ${procTimeout}ms`));
      }
    }, procTimeout);
  });
}

let procChannelRegistered = false;

export function registerBrowserProcChannel(): void {
  if (procChannelRegistered) return;
  if (typeof RegisterNuiCallbackType !== "function") return;
  procChannelRegistered = true;

  RegisterNuiCallbackType("ragemp:cefProcResult");
  on("__cfx_nui:ragemp:cefProcResult", (data: any, cb: (result: any) => void) => {
    const pending = pendingProcs.get(data.requestId);
    if (pending) {
      pendingProcs.delete(data.requestId);
      if (data.error) pending.reject(new Error(data.error));
      else pending.resolve(data.result);
    }
    cb({});
  });

  RegisterNuiCallbackType("ragemp:cefProc");
  on("__cfx_nui:ragemp:cefProc", (data: any, cb: (result: any) => void) => {
    const { procName, requestId, args, browserId } = data;
    const browser = globalThis.mp?.browsers?.at(Number(browserId));
    const sendResult = (payload: Record<string, unknown>) => {
      if (browser && sendHeadlessPayload(browser, payload)) return;
      SendNuiMessage(JSON.stringify({ type: "__ragemp:browser:procResult", browserId, ...payload }));
    };
    const handler = globalThis.mp?.events?._procs?.get(procName);
    if (!handler) {
      sendResult({ procResult: true, requestId, error: `Unknown proc: ${procName}` });
      cb({});
      return;
    }
    Promise.resolve()
      .then(() => handler(...(args ?? [])))
      .then((result) => sendResult({ procResult: true, requestId, result }))
      .catch((err) => sendResult({ procResult: true, requestId, error: String(err) }));
    cb({});
  });
}
