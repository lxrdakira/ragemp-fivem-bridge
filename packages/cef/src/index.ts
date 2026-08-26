import { startManager } from "./manager.js";
import { startView } from "./view.js";
import { log } from "./transport.js";

type BridgeWindow = Window & {
  __ragempNuiBase?: string;
  __ragempResolvePackageUrl?: (url: string) => string;
};

if (typeof window !== "undefined") {
  const bridgeWindow = window as BridgeWindow;
  const resource =
    typeof GetParentResourceName === "function"
      ? GetParentResourceName()
      : window.location.hostname.replace(/^cfx-nui-/, "");
  bridgeWindow.__ragempNuiBase = `https://cfx-nui-${resource}`;
  bridgeWindow.__ragempResolvePackageUrl = (url: string): string => {
    const match = /^(?:package:\/\/|https?:\/\/package\/)(.+)$/i.exec(String(url));
    return match ? `${bridgeWindow.__ragempNuiBase}/${match[1]}` : String(url);
  };
}

function hasViewMarker() {
  if (typeof window === "undefined") return false;
  const hash = window.location && window.location.hash ? String(window.location.hash) : "";
  if (hash.indexOf("__ragemp_view") !== -1) return true;
  if (typeof window.name === "string" && window.name.indexOf("__ragemp_view") !== -1) return true;
  return false;
}

const IS_VIEW = hasViewMarker();

log("boot", IS_VIEW ? "view (iframe)" : "manager (host)");

if (IS_VIEW) startView();
else startManager();
