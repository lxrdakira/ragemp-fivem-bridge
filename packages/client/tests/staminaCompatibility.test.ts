import assert from "node:assert/strict";
import { GamePlayerNs } from "../src/Game/player";

const calls: number[][] = [];
let localPlayer = 7;
(globalThis as any).PlayerId = () => localPlayer;
(globalThis as any).RestorePlayerStamina = (player: number, amount: number) => calls.push([player, amount]);
const game = new GamePlayerNs();
game.restoreStamina(100);
game.restoreStamina(0.5);
game.restoreStamina(0);
game.restoreStamina(-1);
game.restoreStamina(0, 0.25);
localPlayer = 9;
game.restoreStamina(100);
assert.deepEqual(calls, [[7, 1], [7, 0.5], [7, 0], [7, 0], [0, 0.25], [9, 1]]);
console.log("PASS RAGE stamina compatibility");
