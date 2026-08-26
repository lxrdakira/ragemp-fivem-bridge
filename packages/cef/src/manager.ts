import { createRuntime } from "./core.js";
import { log, resourceName, toClient, preventReload } from "./transport.js";

interface FrameEntry {
  iframe: HTMLIFrameElement;
  ready: boolean;
  queue: unknown[];
}

export function startManager(): void {
  const { handlePayload } = createRuntime();
  const frames: Map<string, FrameEntry> = new Map();
  const pointerState: Map<string, boolean> = new Map();
  const orderState: Map<string, number> = new Map();
  const screenshots: Map<string, string> = new Map();
  const pendingScreenshotBrowsers: Map<string, Array<{ browserId: string; url: string }>> = new Map();
  const HOST_RESOURCE = resourceName();
  let focusedBrowserId: string | null = null;

  function applyPointer(browserId: string): void {
    const entry = frames.get(browserId);
    if (!entry || !entry.iframe) return;
    entry.iframe.style.pointerEvents =
      pointerState.get(browserId) === false ? "none" : "auto";
  }

  function applyOrder(browserId: string): void {
    const entry = frames.get(browserId);
    if (!entry || !entry.iframe) return;
    const z = orderState.get(browserId);
    entry.iframe.style.zIndex = z == null ? "" : String(z);
  }

  function focusFrame(browserId: string): void {
    const entry = frames.get(browserId);
    if (!entry || !entry.iframe) return;
    try {
      if (entry.iframe.contentWindow) entry.iframe.contentWindow.focus();
    } catch (e) {}
    try {
      entry.iframe.focus();
    } catch (e) {}
  }

  function setFocusedBrowser(browserId: string | null): void {
    focusedBrowserId = browserId;
    if (browserId !== null && browserId !== undefined) focusFrame(browserId);
  }

  log(
    "manager ready on",
    typeof window !== "undefined" ? window.location.href : "?",
    "resource =",
    HOST_RESOURCE,
  );

  function ensureContainer(): HTMLElement {
    let c = document.getElementById("__ragemp_browsers");
    if (!c) {
      c = document.createElement("div");
      c.id = "__ragemp_browsers";
      c.style.cssText =
        "position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;border:0;margin:0;padding:0;pointer-events:none;background:transparent;z-index:0;";
      (document.body || document.documentElement).appendChild(c);
    }
    return c;
  }

  function resolveUrl(url: string): string {
    let resolved = url;
    const atMatch = /^@([^/]+)\/(.+)$/.exec(url);
    const ragePackageMatch = /^(?:package:\/\/|https?:\/\/package\/)(.+)$/i.exec(url);
    if (ragePackageMatch) {
      // RAGE:MP resolves package:// from client_packages. In an integrated
      // FiveM resource those files live at the NUI resource root.
      resolved = `https://cfx-nui-${HOST_RESOURCE}/${ragePackageMatch[1]}`;
    } else if (atMatch) {
      resolved = `https://cfx-nui-${atMatch[1]}/${atMatch[2]}`;
    } else if (!/^(https?:|nui:|file:|blob:|data:)/i.test(url)) {
      try {
        resolved = new URL(url, location.href).href;
      } catch (e) {
        resolved = url;
      }
    }
    return (
      resolved +
      (resolved.indexOf("#") === -1 ? "#__ragemp_view" : "&__ragemp_view")
    );
  }

  const BRIDGE_URL = `https://cfx-nui-${HOST_RESOURCE}/ui/_bridge.js`;

  function tryInjectBridge(iframe: HTMLIFrameElement, browserId: string, done: () => void): void {
    try {
      const doc = iframe.contentDocument;
      if (!doc) {
        done();
        return;
      }
      if (doc.querySelector("script[data-ragemp-bridge]")) {
        done();
        return;
      }
      const existing = doc.querySelector('script[src*="_bridge"]');
      if (existing) {
        done();
        return;
      }
      const script = doc.createElement("script");
      script.setAttribute("data-ragemp-bridge", "1");
      script.src = BRIDGE_URL;
      script.onload = done;
      script.onerror = done;
      (doc.head || doc.documentElement).appendChild(script);
    } catch (e) {
      done();
    }
  }

  function flush(entry: FrameEntry, browserId: string): void {
    if (entry.ready) return;
    entry.ready = true;
    try {
      entry.iframe.contentWindow!.postMessage(
        {
          __ragempForward: true,
          inner: {
            type: "__ragemp:assignId",
            browserId,
            resource: HOST_RESOURCE,
          },
        },
        "*",
      );
    } catch (e) {
      log("assignId post failed", String(e));
    }
    const pending = entry.queue.splice(0);
    for (const inner of pending) {
      try {
        entry.iframe.contentWindow!.postMessage(
          { __ragempForward: true, inner },
          "*",
        );
      } catch (e) {
        log("flush post failed", String(e));
      }
    }
  }

  function decodeDataHtml(url: string): string | null {
    const m = /^data:text\/html([^,]*),([\s\S]*)$/i.exec(url);
    if (!m) return null;
    const meta = m[1] || "";
    const content = m[2];
    try {
      if (/;base64/i.test(meta)) return atob(content);
      return decodeURIComponent(content);
    } catch (e) {
      try {
        return decodeURIComponent(content);
      } catch (_) {
        return content;
      }
    }
  }

  function createBrowser(browserId: string, url: string): void {
    if (frames.has(browserId)) {
      log("create ignored, exists", browserId);
      return;
    }

    const screenshotMatch = /^https?:\/\/screenshots\/([^?#]+)/i.exec(url);
    if (screenshotMatch) {
      let screenshotFile = screenshotMatch[1];
      try { screenshotFile = decodeURIComponent(screenshotFile); } catch (_) {}
      screenshotFile = screenshotFile.replace(/^.*[\\/]/, "");
      if (!screenshots.has(screenshotFile)) {
        const waiters = pendingScreenshotBrowsers.get(screenshotFile) ?? [];
        waiters.push({ browserId, url });
        pendingScreenshotBrowsers.set(screenshotFile, waiters);
        return;
      }
      // The legacy browser is used only as a readiness signal. The actual
      // image is exposed through the emulated http://screenshots URL below.
      url = "data:text/html,%3C!doctype%20html%3E%3Ctitle%3Escreenshot%3C/title%3E";
    }

    const iframe = document.createElement("iframe");
    iframe.dataset.browserId = String(browserId);
    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("frameborder", "0");
    iframe.style.cssText =
      "position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;border:0;margin:0;padding:0;background:transparent;pointer-events:auto;display:block;";

    const entry: FrameEntry = { iframe, ready: false, queue: [] };
    for (const [name, data] of screenshots) {
      entry.queue.push({ type: "__ragemp:screenshot:store", name, data });
    }

    iframe.addEventListener("load", () => {
      log("iframe loaded", browserId);
      tryInjectBridge(iframe, browserId, () => {
        if (!entry.ready) {
          flush(entry, browserId);
          toClient("ragemp:browserLifecycle", { browserId, event: "domReady" });
        }
        if (focusedBrowserId === browserId) focusFrame(browserId);
      });
    });

    const inlineHtml = /^data:text\/html/i.test(url)
      ? decodeDataHtml(url)
      : null;

    if (inlineHtml !== null) {
      log("create browser", browserId, "(inline html via srcdoc)");
      iframe.setAttribute("name", "__ragemp_view");
      iframe.setAttribute(
        "sandbox",
        "allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock allow-downloads allow-top-navigation-by-user-activation",
      );
      iframe.addEventListener("error", () => {
        log("iframe error", browserId, "srcdoc");
        toClient("ragemp:browserLifecycle", {
          browserId,
          event: "loadError",
          url: "srcdoc",
        });
      });
      iframe.srcdoc = inlineHtml;
    } else {
      const resolved = resolveUrl(url);
      log("create browser", browserId, url, "->", resolved);
      iframe.addEventListener("error", () => {
        log("iframe error", browserId, resolved);
        toClient("ragemp:browserLifecycle", {
          browserId,
          event: "loadError",
          url: resolved,
        });
      });
      iframe.src = resolved;
    }

    ensureContainer().appendChild(iframe);
    frames.set(browserId, entry);
    applyPointer(browserId);
    applyOrder(browserId);

    setTimeout(() => {
      if (!entry.ready) {
        log("iframe still not ready after 5s", browserId);
        toClient("ragemp:browserLifecycle", {
          browserId,
          event: "loadError",
          url: url,
          message:
            "Browser did not signal ready within 5s. If it is a cross-origin page (e.g. a dev server or another resource), include _bridge.js in that page so it can talk to the client.",
        });
      }
    }, 5000);
  }

  function destroyBrowser(browserId: string): void {
    const entry = frames.get(browserId);
    if (entry) {
      entry.iframe.remove();
      frames.delete(browserId);
      log("destroyed browser", browserId);
    }
    if (focusedBrowserId === browserId) focusedBrowserId = null;
  }

  function forward(browserId: string, inner: unknown): void {
    const entry = frames.get(browserId);
    if (!entry) {
      log("forward to unknown browser", browserId);
      return;
    }
    if (!entry.ready) {
      entry.queue.push(inner);
      return;
    }
    if (entry.iframe.contentWindow) {
      entry.iframe.contentWindow.postMessage(
        { __ragempForward: true, inner },
        "*",
      );
    }
  }

  function forwardKey(e: KeyboardEvent, down: boolean): void {
    if (down && e.repeat) return;
    const t = e.target as HTMLElement | null;
    if (
      t &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT" ||
        (t as HTMLElement & { isContentEditable?: boolean }).isContentEditable)
    ) {
      return;
    }
    const code = e.keyCode || e.which;
    if (code) toClient("ragemp:__keyEvent", { code, down });
  }

  function forwardKeyToFrames(e: KeyboardEvent, down: boolean): void {
    const init = {
      key: e.key,
      code: e.code,
      keyCode: e.keyCode || e.which || 0,
      which: e.which || e.keyCode || 0,
      location: e.location || 0,
      altKey: !!e.altKey,
      ctrlKey: !!e.ctrlKey,
      shiftKey: !!e.shiftKey,
      metaKey: !!e.metaKey,
      repeat: !!e.repeat,
    };
    for (const entry of frames.values()) {
      if (!entry.ready || !entry.iframe.contentWindow) continue;
      try {
        entry.iframe.contentWindow.postMessage(
          { __ragempForward: true, inner: { type: "__ragemp:key", down, init } },
          "*",
        );
      } catch (err) {
        log("key forward failed", String(err));
      }
    }
  }

  window.addEventListener(
    "keydown",
    (e) => {
      preventReload(e);
      forwardKey(e, true);
      forwardKeyToFrames(e, true);
    },
    true,
  );
  window.addEventListener(
    "keyup",
    (e) => {
      preventReload(e);
      forwardKey(e, false);
      forwardKeyToFrames(e, false);
    },
    true,
  );

  window.addEventListener("message", (nativeEvent) => {
    const data = nativeEvent.data as Record<string, unknown> | null;
    if (!data || typeof data !== "object") return;

    if (data.type === "__ragemp:keyFromFrame") {
      toClient("ragemp:__keyEvent", { code: data.code, down: !!data.down });
      return;
    }

    const src = nativeEvent.source;

    if (data.type === "__ragemp:viewReady" && src) {
      for (const [bid, entry] of frames) {
        if (entry.iframe && entry.iframe.contentWindow === src) {
          if (!entry.ready) {
            flush(entry, bid);
            toClient("ragemp:browserLifecycle", { browserId: bid, event: "domReady" });
            if (focusedBrowserId === bid) focusFrame(bid);
          }
          return;
        }
      }
      return;
    }

    if (src) {
      for (const entry of frames.values()) {
        if (entry.iframe && entry.iframe.contentWindow === src) return;
      }
    }

    if (
      typeof data.type === "string" &&
      data.type.indexOf("__ragemp:browser:") === 0
    ) {
      log("manager recv", data.type, (data.browserId as string) ?? "");
    }

    switch (data.type) {
      case "__ragemp:screenshot:store": {
        const name = String(data.name ?? "").replace(/^.*[\\/]/, "");
        const screenshotData = String(data.data ?? "");
        if (!name || !screenshotData) return;
        screenshots.set(name, screenshotData);
        handlePayload({ type: "__ragemp:screenshot:store", name, data: screenshotData });
        for (const browserId of frames.keys()) {
          forward(browserId, { type: "__ragemp:screenshot:store", name, data: screenshotData });
        }
        const waiters = pendingScreenshotBrowsers.get(name) ?? [];
        pendingScreenshotBrowsers.delete(name);
        for (const waiter of waiters) createBrowser(waiter.browserId, waiter.url);
        return;
      }
      case "__ragemp:browser:create":
        createBrowser(data.browserId as string, data.url as string);
        return;
      case "__ragemp:browser:focus":
        setFocusedBrowser(data.browserId as string);
        return;
      case "__ragemp:browser:blur":
        if (focusedBrowserId === data.browserId) focusedBrowserId = null;
        return;
      case "__ragemp:browser:destroy":
        pointerState.delete(data.browserId as string);
        orderState.delete(data.browserId as string);
        destroyBrowser(data.browserId as string);
        return;
      case "__ragemp:browser:pointerEvents":
        pointerState.set(data.browserId as string, data.enabled !== false);
        applyPointer(data.browserId as string);
        return;
      case "__ragemp:browser:orderId":
        orderState.set(data.browserId as string, (data.orderId as number) | 0);
        applyOrder(data.browserId as string);
        return;
      case "__ragemp:browser:exec":
        forward(data.browserId as string, { type: "__ragemp:exec", code: data.code });
        return;
      case "__ragemp:browser:reload": {
        forward(data.browserId as string, { type: "__ragemp:reload" });
        const entry = frames.get(data.browserId as string);
        if (entry) entry.ready = false;
        return;
      }
      case "__ragemp:browser:event":
        forward(data.browserId as string, { event: data.event, args: data.args });
        return;
      case "__ragemp:browser:proc":
        forward(data.browserId as string, {
          proc: data.proc,
          requestId: data.requestId,
          args: data.args,
        });
        return;
      case "__ragemp:browser:procResult":
        forward(data.browserId as string, {
          procResult: true,
          requestId: data.requestId,
          result: data.result,
          error: data.error,
        });
        return;
    }

    handlePayload(data as Parameters<typeof handlePayload>[0]);
  });
}
