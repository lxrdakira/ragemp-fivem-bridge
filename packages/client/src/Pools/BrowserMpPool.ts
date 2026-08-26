import { Pool } from "@ragemp-fivem-bridge/shared";
import { CONSTRUCT } from "@ragemp-fivem-bridge/shared/internal";
import { addLocal } from "../internal/pools/clientPool";
import { BrowserMp, setBrowserProcTimeout, getBrowserProcTimeout } from "../Entities/BrowserMp";
import { setupBrowserPool } from "../internal/pools/browserPoolService";
import {
  beginHeadlessReadyHandshake,
  initBrowserPoolInternals,
  setHeadlessBrowser,
} from "../internal/browserInternals";

let headlessGeneration = 0;

function resolveHeadlessUrl(url: string): string {
  const resource = GetCurrentResourceName();
  const packageMatch = /^(?:package:\/\/|https?:\/\/package\/)(.+)$/i.exec(url);
  let resolved = packageMatch ? `https://cfx-nui-${resource}/${packageMatch[1]}` : url;
  resolved += resolved.includes("#") ? "&__ragemp_view" : "#__ragemp_view";
  return resolved;
}

export class BrowserMpPool extends Pool<BrowserMp> {
  constructor() {
    super();
    initBrowserPoolInternals(this);
    setupBrowserPool(this);
  }

  new(url: string): BrowserMp {
    const browser = new BrowserMp(CONSTRUCT, 0, url);
    addLocal(this, browser);
    const id = browser.id;

    if (typeof SendNuiMessage === "function") {
      SendNuiMessage(JSON.stringify({ type: "__ragemp:browser:create", browserId: id, url }));
    }

    browser.orderId = id;

    globalThis.mp?.events?.call("browserCreated", browser);

    return browser;
  }

  newHeadless(url: string, width = 1280, height = 720, _useLocal = false): BrowserMp {
    const browser = new BrowserMp(CONSTRUCT, 0, url);
    addLocal(this, browser);

    const generation = ++headlessGeneration;
    const textureDict = `ragemp_dui_${browser.id}_${generation}`;
    const textureName = "browser";
    const resolvedUrl = resolveHeadlessUrl(url);
    const dui = CreateDui(resolvedUrl, Math.max(1, width | 0), Math.max(1, height | 0));
    const runtimeTxd = CreateRuntimeTxd(textureDict);
    CreateRuntimeTextureFromDuiHandle(runtimeTxd, textureName, GetDuiHandle(dui));

    browser.headlessTextureDict = textureDict;
    browser.headlessTextureName = textureName;
    browser.headlessTextureHeightScale = 1;
    setHeadlessBrowser(browser, {
      dui,
      resolvedUrl,
      textureDict,
      textureName,
      readyTimer: null,
    });
    beginHeadlessReadyHandshake(browser);

    browser.orderId = browser.id;
    globalThis.mp?.events?.call("browserCreated", browser);
    return browser;
  }

  setProcTimeout(ms: number): void {
    setBrowserProcTimeout(ms);
  }

  get procTimeout(): number {
    return getBrowserProcTimeout();
  }
}
