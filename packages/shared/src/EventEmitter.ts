import { EventEmitterInternals, initEventEmitterInternals, type EventHandler } from "./internal/eventEmitterInternals";

export type { EventHandler };

let traceNextRenderDispatch = false;

export abstract class EventEmitter {
  constructor() {
    initEventEmitterInternals(this);
  }

  call(eventName: string, ...args: any[]): void {
    const handlers = EventEmitterInternals.get(this).handlers.get(eventName);
    if (!handlers) return;

    const traceDispatch = eventName === "client:OnBrowserInit" || (eventName === "render" && traceNextRenderDispatch);
    if (eventName === "render" && traceNextRenderDispatch) traceNextRenderDispatch = false;

    let index = 0;
    for (const handler of handlers) {
      if (traceDispatch) console.log(`[bridge:event-trace] start ${eventName} #${index} ${handler.name || "anonymous"}`);
      handler(...args);
      if (traceDispatch) console.log(`[bridge:event-trace] end ${eventName} #${index}`);
      index += 1;
    }

    if (eventName === "client:OnBrowserInit") traceNextRenderDispatch = true;
  }

  add(eventNameOrObject: string | Record<string, EventHandler>, handler?: EventHandler): void {
    if (typeof eventNameOrObject === "object" && handler === undefined) {
      for (const [name, fn] of Object.entries(eventNameOrObject)) {
        this.add(name, fn);
      }
      return;
    }
    const eventName = eventNameOrObject as string;
    const handlers = EventEmitterInternals.get(this).handlers;
    let set = handlers.get(eventName);
    if (!set) {
      set = new Set();
      handlers.set(eventName, set);
    }
    set.add(handler!);
  }

  remove(eventName: string, handler?: EventHandler): void {
    const handlers = EventEmitterInternals.get(this).handlers.get(eventName);
    if (!handlers) return;
    if (handler) {
      handlers.delete(handler);
    } else {
      handlers.clear();
    }
  }

  getAllOf(eventName: string): EventHandler[] {
    return [...(EventEmitterInternals.get(this).handlers.get(eventName) ?? [])];
  }
}
