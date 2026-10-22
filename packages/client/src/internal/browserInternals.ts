import { defineInternals } from "@ragemp-fivem-bridge/shared/internal";
import type { BrowserMp } from "../Entities/BrowserMp";
import type { BrowserMpPool } from "../Pools/BrowserMpPool";
import { registerNuiCallback } from "./nuiCallback";

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
  width: number;
  height: number;
  surfaceGeneration: number;
  readyTimer: ReturnType<typeof setInterval> | null;
  publishTimer: ReturnType<typeof setTimeout> | null;
  activationTimer: ReturnType<typeof setTimeout> | null;
  idleTimer: ReturnType<typeof setTimeout> | null;
  pendingPayloads: Record<string, unknown>[];
  replayPayloads: Record<string, unknown>[];
}

export const BrowserInternals = defineInternals<BrowserInternalsRec>();
const visualBrowsers = new Set<BrowserMp>();

export function initBrowserInternals(browser: BrowserMp, url: string): BrowserInternalsRec {
  const rec = BrowserInternals.init(browser, {
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
  visualBrowsers.add(browser);
  return rec;
}

export function unregisterBrowserPointerState(browser: BrowserMp): void {
  visualBrowsers.delete(browser);
  applyAllBrowserPointerEvents();
}

function hasActiveVisualBrowserExcept(browser: BrowserMp): boolean {
  for (const candidate of visualBrowsers) {
    if (candidate === browser) continue;
    const rec = BrowserInternals.get(candidate);
    if (!rec.destroyed && !rec.headless && rec.active) return true;
  }
  return false;
}

export function browserDomReady(browser: BrowserMp): void {
  const rec = BrowserInternals.get(browser);
  rec.domReady = true;
  if (rec.headless?.dui && rec.headless.replayPayloads.length) {
    for (const payload of rec.headless.replayPayloads) {
      SendDuiMessage(rec.headless.dui, JSON.stringify({ __ragempForward: true, inner: payload }));
    }
  }
  if (rec.headless?.pendingPayloads.length) {
    for (const payload of rec.headless.pendingPayloads.splice(0))
      sendHeadlessPayload(browser, payload);
  }
  for (const code of rec.cachedExec.splice(0)) browser.execute(code);

  const state = rec.headless;
  if (!state?.dui) return;
  if (state.publishTimer !== null) clearTimeout(state.publishTimer);
  const readyDui = state.dui;
  const readyGeneration = state.surfaceGeneration;
  // DOMContentLoaded can arrive before Chromium has painted the transparent
  // page into the DUI texture. Keep the public RAGE texture contract hidden
  // for a short paint grace period instead of exposing a white frame.
  state.publishTimer = setTimeout(() => {
    state.publishTimer = null;
    const current = BrowserInternals.get(browser);
    const surface = current.headless;
    if (
      current.destroyed ||
      !current.domReady ||
      !surface ||
      surface.dui !== readyDui ||
      surface.surfaceGeneration !== readyGeneration
    ) return;
    browser.headlessTextureDict = surface.textureDict;
    browser.headlessTextureName = surface.textureName;
  }, 100);
}

export function applyBrowserPointerEvents(browser: BrowserMp): void {
  const rec = BrowserInternals.get(browser);
  if (rec.headless) return;
  if (rec.destroyed || typeof SendNuiMessage !== "function") return;
  SendNuiMessage(
    JSON.stringify({
      type: "__ragemp:browser:pointerEvents",
      browserId: browser.id,
      // A RAGE:MP browser that is neither active nor the main/chat browser
      // must not intercept mouse input. Every FiveM browser is represented by
      // a full-screen iframe, so leaving pointer events enabled on transparent
      // sound/helper browsers creates an invisible click-blocking layer.
      enabled:
        rec.inputEnabled &&
        rec.mouseInputEnabled &&
        (rec.active || (rec.isChatBrowser && !hasActiveVisualBrowserExcept(browser))),
    })
  );
}

export function applyAllBrowserPointerEvents(): void {
  for (const browser of visualBrowsers) applyBrowserPointerEvents(browser);
}

export function setHeadlessBrowser(browser: BrowserMp, state: HeadlessBrowserState): void {
  BrowserInternals.get(browser).headless = state;
}

// Creating every RAGE:MP headless browser eagerly is prohibitively expensive in
// FiveM: each one owns a Chromium DUI renderer and a GPU command buffer. Neptune
// registers many world markers at login and marks unused ones inactive on the
// following render tick. Debounce allocation so those invisible markers never
// create a DUI in the first place, and retire surfaces that stay hidden.
const HEADLESS_ACTIVATION_DELAY_MS = 200;
const HEADLESS_IDLE_DESTROY_MS = 30_000;
const HEADLESS_CREATE_SPACING_MS = 100;
let nextHeadlessCreateAt = 0;

function clearHeadlessActivationTimer(state: HeadlessBrowserState): void {
  if (state.activationTimer === null) return;
  clearTimeout(state.activationTimer);
  state.activationTimer = null;
}

function clearHeadlessIdleTimer(state: HeadlessBrowserState): void {
  if (state.idleTimer === null) return;
  clearTimeout(state.idleTimer);
  state.idleTimer = null;
}

function clearHeadlessPublishTimer(state: HeadlessBrowserState): void {
  if (state.publishTimer === null) return;
  clearTimeout(state.publishTimer);
  state.publishTimer = null;
}

function destroyHeadlessSurface(browser: BrowserMp, clearPayloads: boolean): void {
  const rec = BrowserInternals.get(browser);
  const state = rec.headless;
  if (!state) return;
  if (state.readyTimer !== null) clearInterval(state.readyTimer);
  state.readyTimer = null;
  clearHeadlessPublishTimer(state);
  // Marker renderers treat non-empty names as a ready surface. Clear them
  // before destroying the DUI so no frame can draw a stale/white texture.
  browser.headlessTextureDict = "";
  browser.headlessTextureName = "";
  if (state.dui) DestroyDui(state.dui);
  state.dui = 0;
  rec.domReady = false;
  if (clearPayloads) state.pendingPayloads.length = 0;
}

function createHeadlessSurface(browser: BrowserMp): void {
  const rec = BrowserInternals.get(browser);
  const state = rec.headless;
  if (!state || rec.destroyed || !rec.active || state.dui) return;

  const now = Date.now();
  if (now < nextHeadlessCreateAt) {
    state.activationTimer = setTimeout(() => {
      state.activationTimer = null;
      createHeadlessSurface(browser);
    }, nextHeadlessCreateAt - now);
    return;
  }
  nextHeadlessCreateAt = now + HEADLESS_CREATE_SPACING_MS;

  try {
    const dui = CreateDui(state.resolvedUrl, state.width, state.height);
    if (!dui) throw new Error("CreateDui returned an invalid handle");

    state.surfaceGeneration++;
    state.textureDict = `ragemp_dui_${browser.id}_${state.surfaceGeneration}`;
    const runtimeTxd = CreateRuntimeTxd(state.textureDict);
    CreateRuntimeTextureFromDuiHandle(runtimeTxd, state.textureName, GetDuiHandle(dui));
    state.dui = dui;
    rec.domReady = false;
    beginHeadlessReadyHandshake(browser);
  } catch (error) {
    state.dui = 0;
    console.error(`[ragemp:headless] Failed to create browser ${browser.id}: ${String(error)}`);
    globalThis.mp?.events?.call("browserLoadingFailed", browser);
    if (!rec.destroyed && rec.active) {
      state.activationTimer = setTimeout(() => {
        state.activationTimer = null;
        createHeadlessSurface(browser);
      }, 1000);
    }
  }
}

export function setHeadlessBrowserActive(browser: BrowserMp, active: boolean): boolean {
  const rec = BrowserInternals.get(browser);
  const state = rec.headless;
  if (!state) return false;

  if (active) {
    // Marker render loops assign `active = true` every frame. Re-arming the
    // debounce timer on every assignment means that its callback can never
    // fire, so no DUI/3D CEF surface is ever created. Keep an already pending
    // activation intact and only cancel a pending idle teardown.
    clearHeadlessIdleTimer(state);
    if (state.dui || state.activationTimer !== null) return true;
    state.activationTimer = setTimeout(() => {
      state.activationTimer = null;
      createHeadlessSurface(browser);
    }, HEADLESS_ACTIVATION_DELAY_MS);
    return true;
  }

  clearHeadlessActivationTimer(state);
  if (!state.dui || state.idleTimer !== null) return true;
  state.idleTimer = setTimeout(() => {
    state.idleTimer = null;
    const current = BrowserInternals.get(browser);
    if (!current.destroyed && !current.active) destroyHeadlessSurface(browser, false);
  }, HEADLESS_IDLE_DESTROY_MS);
  return true;
}

export function sendHeadlessPayload(browser: BrowserMp, payload: Record<string, unknown>): boolean {
  const rec = BrowserInternals.get(browser);
  const state = rec.headless;
  if (!state) return false;
  if ((!state.dui || !rec.domReady) && payload.type !== "__ragemp:assignId") {
    if (state.pendingPayloads.length >= 4096) state.pendingPayloads.shift();
    state.pendingPayloads.push(payload);
    return true;
  }
  if (!state.dui) return true;
  SendDuiMessage(state.dui, JSON.stringify({ __ragempForward: true, inner: payload }));
  // DUI pages lose their JavaScript state when an inactive surface is retired.
  // Browser events/exec calls are UI state updates, so replay a bounded history
  // after the next domReady. RPC requests are deliberately excluded.
  if (payload.type === "__ragemp:exec" || typeof payload.event === "string") {
    if (state.replayPayloads.length >= 128) state.replayPayloads.shift();
    state.replayPayloads.push(payload);
  }
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
  if (!state) return false;
  if (!state.dui) {
    if (rec.active) setHeadlessBrowserActive(browser, true);
    return true;
  }
  clearHeadlessPublishTimer(state);
  browser.headlessTextureDict = "";
  browser.headlessTextureName = "";
  rec.domReady = false;
  SetDuiUrl(state.dui, state.resolvedUrl);
  beginHeadlessReadyHandshake(browser);
  return true;
}

export function destroyHeadlessBrowser(browser: BrowserMp): boolean {
  const state = BrowserInternals.get(browser).headless;
  if (!state) return false;
  clearHeadlessActivationTimer(state);
  clearHeadlessIdleTimer(state);
  destroyHeadlessSurface(browser, true);
  state.replayPayloads.length = 0;
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
  if (!registerNuiCallback("ragemp:cefProcResult", (data: any, cb: (result: any) => void) => {
    const pending = pendingProcs.get(data.requestId);
    if (pending) {
      pendingProcs.delete(data.requestId);
      if (data.error) pending.reject(new Error(data.error));
      else pending.resolve(data.result);
    }
    cb({});
  })) return;
  procChannelRegistered = true;

  registerNuiCallback("ragemp:cefProc", (data: any, cb: (result: any) => void) => {
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
