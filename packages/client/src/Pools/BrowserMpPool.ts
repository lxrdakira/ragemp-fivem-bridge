import { Pool } from "@ragemp-fivem-bridge/shared";
import { CONSTRUCT } from "@ragemp-fivem-bridge/shared/internal";
import { addLocal } from "../internal/pools/clientPool";
import { BrowserMp, setBrowserProcTimeout, getBrowserProcTimeout } from "../Entities/BrowserMp";
import { setupBrowserPool } from "../internal/pools/browserPoolService";
import {
  applyBrowserPointerEvents,
  initBrowserPoolInternals,
  setHeadlessBrowser,
} from "../internal/browserInternals";
import { NUI_FETCH_COMPATIBILITY_CODE } from "../internal/nuiCallback";

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
    // Queue the b3889 callback-path compatibility shim behind assignId. The
    // CEF manager flushes this as soon as the nested legacy browser is ready.
    browser.execute(NUI_FETCH_COMPATIBILITY_CODE);
    // New visual browsers start inactive. Disable their full-screen iframe
    // immediately so an invisible helper browser cannot cover the active UI.
    applyBrowserPointerEvents(browser);

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

    // These public fields are the legacy readiness contract used by Neptune's
    // marker renderers. Keep them empty until CreateDui and its runtime texture
    // actually exist; publishing names here made a not-yet-created surface look
    // ready and silently drew a missing texture.
    browser.headlessTextureDict = "";
    browser.headlessTextureName = "";
    browser.headlessTextureHeightScale = 1;
    setHeadlessBrowser(browser, {
      dui: 0,
      resolvedUrl,
      textureDict,
      textureName,
      width: Math.max(1, width | 0),
      height: Math.max(1, height | 0),
      surfaceGeneration: generation,
      readyTimer: null,
      activationTimer: null,
      idleTimer: null,
      pendingPayloads: [],
      replayPayloads: [],
    });

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
