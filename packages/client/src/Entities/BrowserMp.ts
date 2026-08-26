import { Entity } from "@ragemp-fivem-bridge/shared";
import { removeFromPool } from "@ragemp-fivem-bridge/shared/internal";
import { freeClientId } from "../internal/pools/clientPool";
import { setBrowserFocus } from "../utils/nuiFocus";
import {
  BrowserInternals,
  initBrowserInternals,
  applyBrowserPointerEvents,
  getChatBrowser,
  setChatBrowser,
  callBrowserProc,
  sendHeadlessPayload,
  reloadHeadlessBrowser,
  destroyHeadlessBrowser,
  setBrowserProcTimeout,
  getBrowserProcTimeout,
} from "../internal/browserInternals";

export { setBrowserProcTimeout, getBrowserProcTimeout };

function postFocusState(browserId: number, active: boolean): void {
  if (typeof SendNuiMessage !== "function") return;
  SendNuiMessage(
    JSON.stringify({
      type: active ? "__ragemp:browser:focus" : "__ragemp:browser:blur",
      browserId,
    })
  );
}

export class BrowserMp extends Entity {
  headlessTextureDict = "";
  headlessTextureName = "";
  headlessTextureHeightScale = 1;

  constructor(token: symbol, id: number, url: string) {
    super(token, id, "browser");
    initBrowserInternals(this, url);
  }

  get url(): string {
    return BrowserInternals.get(this).url;
  }

  get active(): boolean {
    return BrowserInternals.get(this).active;
  }

  set active(value: boolean) {
    const rec = BrowserInternals.get(this);
    rec.active = !!value;
    if (rec.headless) return;
    setBrowserFocus("browser:" + this.id, rec.active);
    postFocusState(this.id, rec.active);
  }

  execute(code: string): void {
    if (BrowserInternals.get(this).destroyed) return;
    if (!sendHeadlessPayload(this, { type: "__ragemp:exec", code }))
      SendNuiMessage(JSON.stringify({ type: "__ragemp:browser:exec", browserId: this.id, code }));
  }

  executeCached(code: string): void {
    const rec = BrowserInternals.get(this);
    if (rec.destroyed) return;
    rec.cachedExec.push(code);
    if (rec.domReady) this.execute(code);
  }

  get inputEnabled(): boolean {
    return BrowserInternals.get(this).inputEnabled;
  }

  set inputEnabled(value: boolean) {
    BrowserInternals.get(this).inputEnabled = !!value;
    applyBrowserPointerEvents(this);
  }

  get mouseInputEnabled(): boolean {
    return BrowserInternals.get(this).mouseInputEnabled;
  }

  set mouseInputEnabled(value: boolean) {
    BrowserInternals.get(this).mouseInputEnabled = !!value;
    applyBrowserPointerEvents(this);
  }

  get orderId(): number {
    return BrowserInternals.get(this).orderId;
  }

  set orderId(value: number) {
    const rec = BrowserInternals.get(this);
    rec.orderId = value | 0;
    if (rec.headless) return;
    if (rec.destroyed || typeof SendNuiMessage !== "function") return;
    SendNuiMessage(
      JSON.stringify({
        type: "__ragemp:browser:orderId",
        browserId: this.id,
        orderId: rec.orderId,
      })
    );
  }

  // d.ts: markAsChat(): void — but implementation accepts optional flag not in d.ts
  markAsChat(flag?: boolean): void {
    const enabled = flag === undefined ? true : !!flag;
    BrowserInternals.get(this).isChatBrowser = enabled;
    const pool = globalThis.mp?.browsers;
    if (pool) {
      if (enabled) setChatBrowser(pool, this);
      else if (getChatBrowser(pool) === this) setChatBrowser(pool, null);
    }
  }

  reload(ignoreCache: boolean): void {
    if (!reloadHeadlessBrowser(this))
      SendNuiMessage(JSON.stringify({ type: "__ragemp:browser:reload", browserId: this.id, ignoreCache: !!ignoreCache }));
  }

  call(eventName: string, ...args: any[]): void {
    if (BrowserInternals.get(this).destroyed) return;
    if (!sendHeadlessPayload(this, { event: eventName, args }))
      SendNuiMessage(JSON.stringify({ type: "__ragemp:browser:event", browserId: this.id, event: eventName, args }));
  }

  callProc<T = any>(procName: string, ...args: any[]): Promise<T> {
    if (BrowserInternals.get(this).destroyed) return Promise.reject(new Error("Browser destroyed"));
    return callBrowserProc<T>(this, procName, args);
  }

  override destroy(): void {
    const rec = BrowserInternals.get(this);
    if (rec.destroyed) return;
    rec.destroyed = true;
    const headless = rec.headless !== null;
    if (rec.active && !headless) {
      rec.active = false;
      setBrowserFocus("browser:" + this.id, false);
    }
    if (!headless) postFocusState(this.id, false);
    const pool = globalThis.mp?.browsers;
    if (pool && getChatBrowser(pool) === this) setChatBrowser(pool, null);
    if (!destroyHeadlessBrowser(this))
      SendNuiMessage(JSON.stringify({ type: "__ragemp:browser:destroy", browserId: this.id }));
    if (pool) {
      removeFromPool(pool, this.id);
      freeClientId(pool, this.id);
    }
  }
}
