import { createRuntime } from "./core.js";
import { log, resourceName, preventReload, toClient } from "./transport.js";

export function startView(): void {
  const { handlePayload, getSelfId } = createRuntime();

  log("view ready in", typeof window !== "undefined" ? window.location.href : "?", "resource =", resourceName());

  let readyAcked = false;
  let directReadyAnnounced = false;
  function announceReady(attempt: number): void {
    if (readyAcked) return;
    if (!window.parent || window.parent === window) return;
    try {
      window.parent.postMessage({ type: "__ragemp:viewReady" }, "*");
    } catch (e) {}
    if (attempt < 40) setTimeout(() => announceReady(attempt + 1), 100);
  }
  function beginAnnounce(): void {
    announceReady(0);
  }
  if (typeof document === "undefined" || document.readyState !== "loading") {
    beginAnnounce();
  } else {
    document.addEventListener("DOMContentLoaded", beginAnnounce, { once: true });
  }

  function forwardNativeKey(e: KeyboardEvent, down: boolean): void {
    if (!e.isTrusted) return;
    preventReload(e);
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
    if (code && window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({ type: "__ragemp:keyFromFrame", code, down }, "*");
      } catch (err) {}
    }
  }
  window.addEventListener("keydown", (e) => forwardNativeKey(e, true), true);
  window.addEventListener("keyup", (e) => forwardNativeKey(e, false), true);

  window.addEventListener("message", (nativeEvent) => {
    const data = nativeEvent.data as Record<string, unknown> | null;
    if (!data || typeof data !== "object") return;
    if (data.__ragempForward && data.inner) {
      const inner = data.inner as Record<string, unknown>;
      if (inner.type === "__ragemp:assignId") readyAcked = true;
      log("view recv", inner.type || (inner.event ? "event:" + inner.event : inner.proc ? "proc:" + inner.proc : "msg"));
      handlePayload(inner as Parameters<typeof handlePayload>[0]);
      if (
        inner.type === "__ragemp:assignId" &&
        !directReadyAnnounced &&
        (!window.parent || window.parent === window)
      ) {
        directReadyAnnounced = true;
        void toClient("ragemp:browserLifecycle", {
          browserId: String(inner.browserId ?? ""),
          event: "domReady",
        });
      }
    }
  });

  void getSelfId;
}
