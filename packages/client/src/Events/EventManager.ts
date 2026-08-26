import { EventEmitter } from "@ragemp-fivem-bridge/shared";
import { sanitizeArgsForNet } from "@ragemp-fivem-bridge/shared";
import { ClientEventManagerInternals, initClientEventManagerInternals } from "../internal/eventManagerInternals";
import { setupEventManager, handleEventAdded, handleEventRemoved } from "../internal/eventManagerService";
import type { EventHandler } from "@ragemp-fivem-bridge/shared/internal";

export class EventManager extends EventEmitter {
  constructor() {
    super();
    initClientEventManagerInternals(this);
    setupEventManager(this);
  }

  override add(eventNameOrObject: string | Record<string, EventHandler>, handler?: EventHandler): void {
    super.add(eventNameOrObject, handler);
    if (typeof eventNameOrObject === "string") handleEventAdded(this, eventNameOrObject);
  }

  override remove(eventName: string, handler?: EventHandler): void {
    super.remove(eventName, handler);
    handleEventRemoved(this, eventName);
  }

  callRemote(eventName: string, ...args: any[]): void {
    const rec = ClientEventManagerInternals.get(this);
    const contract = rec.remoteEventContracts.get(eventName);
    if (contract && args.length >= contract.required && args.length < contract.total) {
      args = args.slice();
      while (args.length < contract.total) args.push(contract.defaults[args.length]);
    }
    const sanitized = sanitizeArgsForNet(args);
    if (rec.variadicRemoteEvents.has(eventName)) {
      emitNet(eventName, sanitized);
    } else {
      emitNet(eventName, ...sanitized);
    }
  }

  addProc(procName: string, handler: (...args: any[]) => any): void {
    const rec = ClientEventManagerInternals.get(this);
    if (!rec.procs) rec.procs = new Map();
    rec.procs.set(procName, handler);
  }

  removeProc(procName: string): void {
    ClientEventManagerInternals.get(this).procs?.delete(procName);
  }

  callRemoteProc(procName: string, ...args: any[]): Promise<any> {
    const rec = ClientEventManagerInternals.get(this);
    if (!rec.pendingProcs) rec.pendingProcs = new Map();
    if (!rec.procCounter) rec.procCounter = 0;
    const requestId = ++rec.procCounter;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (rec.pendingProcs!.has(requestId)) {
          rec.pendingProcs!.delete(requestId);
          reject(new Error(`callRemoteProc timeout (${procName})`));
        }
      }, 30000);
      rec.pendingProcs!.set(requestId, { procName, resolve, reject, timer });
      emitNet("ragemp:proc", procName, requestId, ...args);
    });
  }

  callRemoteUnreliable(eventName: string, ...args: any[]): void {
    this.callRemote(eventName, ...args);
  }

  callBrowser(browser: any, eventName: string, ...args: any[]): void {
    if (browser && typeof browser.call === "function") {
      browser.call(eventName, ...args);
    } else {
      SendNuiMessage(JSON.stringify({ event: eventName, args }));
    }
  }

  addRule(name: string, handler: (...args: any[]) => any): void {
    const rec = ClientEventManagerInternals.get(this);
    if (!rec.rules) rec.rules = new Map();
    rec.rules.set(name, handler);
  }

  removeRule(name: string): void {
    ClientEventManagerInternals.get(this).rules?.delete(name);
  }

  hasPendingProc(procName?: string | null): boolean {
    const rec = ClientEventManagerInternals.get(this);
    if (!rec.pendingProcs) return false;
    if (procName == null) return rec.pendingProcs.size > 0;
    for (const entry of rec.pendingProcs.values()) {
      if (entry.procName === procName) return true;
    }
    return false;
  }

  cancelPendingProc(procName?: string | null): void {
    const rec = ClientEventManagerInternals.get(this);
    if (!rec.pendingProcs) return;
    for (const [reqId, entry] of rec.pendingProcs) {
      if (procName != null && entry.procName !== procName) continue;
      if (entry.timer) clearTimeout(entry.timer);
      entry.reject(new Error("Cancelled"));
      rec.pendingProcs.delete(reqId);
    }
  }

  addDataHandler(key: string, handler: (...args: any[]) => void): void {
    const rec = ClientEventManagerInternals.get(this);
    if (!rec.dataHandlers) rec.dataHandlers = new Map();
    if (!rec.dataHandlers.has(key)) rec.dataHandlers.set(key, []);
    rec.dataHandlers.get(key)!.push(handler);
  }
}
