import esbuild from "rollup-plugin-esbuild";
import resolve from "@rollup/plugin-node-resolve";
import { workspaceAlias, tsResolve, onwarn } from "../../../rollup.workspace.js";

export default [
  ["entityIdentity", "entity-identity"],
  ["vehicleExtras", "vehicle-extras"],
  ["playerReconnect", "player-reconnect"],
  ["staminaCompatibility", "stamina-compatibility"],
  ["serverPedState", "server-ped-state"],
  ["pedLocalFallbackRetry", "ped-local-fallback-retry"],
  ["objectAnimationCompat", "object-animation-compat"],
  ["browserCreateRetry", "browser-create-retry"],
].map(([input, output]) => ({
  input: `tests/${input}.test.ts`,
  output: { file: `tests/.tmp/${output}.cjs`, format: "cjs" },
  onwarn,
  plugins: [
    workspaceAlias(),
    tsResolve(),
    resolve({ extensions: [".ts", ".tsx", ".mjs", ".js", ".json"] }),
    esbuild({ target: "es2020" }),
  ],
}));
