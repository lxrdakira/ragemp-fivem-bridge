import { retryBrowserCreateUntilReady } from "../src/utils/browserCreateRetry";
import { BrowserMpPool } from "../src/Pools/BrowserMpPool";
import { BrowserInternals } from "../src/internal/browserInternals";

const globals = globalThis as any;
const realSetTimeout = globals.setTimeout;
const scheduled: Array<{ callback: () => void; delay: number }> = [];
globals.setTimeout = (callback: () => void, delay: number) => {
  scheduled.push({ callback, delay });
  return scheduled.length;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

try {
  let sends = 0;
  let ready = false;
  retryBrowserCreateUntilReady(() => ready, () => { sends++; });
  assert(scheduled.length === 1 && scheduled[0].delay === 1000, "first retry was not scheduled");
  scheduled.shift()!.callback();
  assert(sends === 1 && scheduled.length === 1 && scheduled[0].delay === 2000, "first retry did not back off");
  ready = true;
  scheduled.shift()!.callback();
  assert(sends === 1 && scheduled.length === 0, "ready browser kept sending create messages");

  ready = false;
  sends = 0;
  retryBrowserCreateUntilReady(() => ready, () => { sends++; }, [10, 20]);
  scheduled.shift()!.callback();
  scheduled.shift()!.callback();
  assert(sends === 2 && scheduled.length === 0, "retry did not stop at its bounded limit");

  sends = 0;
  let destroyed = false;
  retryBrowserCreateUntilReady(() => destroyed, () => { sends++; }, [10]);
  destroyed = true;
  scheduled.shift()!.callback();
  assert(sends === 0 && scheduled.length === 0, "destroyed browser was resent");

  const messages: Array<{ type: string; browserId?: number; enabled?: boolean }> = [];
  globals.SendNuiMessage = (payload: string) => { messages.push(JSON.parse(payload)); };
  globals.RegisterNuiCallback = () => {};
  globals.GetCurrentResourceName = () => "test-ui";
  globals.on = () => {};
  globals.mp = { events: { call: () => {} } };
  const pool = new BrowserMpPool();
  const browser = pool.new("package://sounds/index.html");
  const created = () => messages.filter((message) => message.type === "__ragemp:browser:create" && message.browserId === browser.id);
  assert(created().length === 1, "browser pool did not send its initial create message");
  assert(scheduled.length === 1, "browser pool did not schedule creation recovery");
  scheduled.shift()!.callback();
  assert(created().length === 2, "browser pool did not resend a lost create message");
  assert(messages.some((message) => message.type === "__ragemp:browser:pointerEvents" && message.browserId === browser.id && message.enabled === false), "helper browser could intercept clicks after recovery");
  BrowserInternals.get(browser).domReady = true;
  scheduled.shift()!.callback();
  assert(created().length === 2 && scheduled.length === 0, "browser pool kept resending after DOM readiness");

  console.log("PASS browser create retry: delayed host, DOM-ready stop, bounded retries, destroyed stop");
} finally {
  globals.setTimeout = realSetTimeout;
}
