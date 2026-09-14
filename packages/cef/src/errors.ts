type ErrorRecord = { message?: string; name?: string; stack?: string; [key: string]: unknown };
type ForwardFn = (info: Record<string, unknown>) => void;

let _forward: ForwardFn | null = null;
let _getId: () => string = () => "host";
let _installed = false;

export function serializeError(value: unknown): ErrorRecord {
  if (value && value instanceof Error) {
    return { message: value.message, name: value.name, stack: value.stack };
  }
  if (value && typeof value === "object") {
    try {
      return { message: JSON.stringify(value) };
    } catch (e) {
      return { message: String(value) };
    }
  }
  return { message: String(value) };
}

export function report(info: Record<string, unknown>): void {
  if (!_forward) return;
  try {
    _forward({ browserId: _getId(), ...info });
  } catch (e) {}
}

export function installErrorCapture(forward: ForwardFn, getId: () => string): void {
  _forward = forward;
  if (typeof getId === "function") _getId = getId;
  if (_installed || typeof window === "undefined") return;
  _installed = true;

  window.addEventListener(
    "error",
    (e) => {
      const t = e.target as (EventTarget & { tagName?: string; src?: string; href?: string }) | null;
      if (t && t !== window && t.tagName) {
        let resourceUrl = t.src || t.href || "";
        if (!resourceUrl && t instanceof HTMLElement) {
          const importMatch = /@import\s+(?:url\()?['\"]?([^'\")\s;]+)/i.exec(t.textContent || "");
          resourceUrl = importMatch?.[1] || "";
        }
        report({
          kind: "resource",
          message:
            "Failed to load " +
            String(t.tagName).toLowerCase() +
            ": " +
            (resourceUrl || "(unknown)"),
          tag: t.tagName,
          outerHTML: t instanceof HTMLElement ? t.outerHTML.slice(0, 1000) : undefined,
        });
        return;
      }
      const ser = serializeError(e.error);
      report({
        kind: "error",
        message: e.message || ser.message,
        source: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        name: ser.name,
        stack: ser.stack,
      });
    },
    true,
  );

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e && "reason" in e ? e.reason : e;
    report({ kind: "unhandledrejection", ...serializeError(reason) });
  });
}
