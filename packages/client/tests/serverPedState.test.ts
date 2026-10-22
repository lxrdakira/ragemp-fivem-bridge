import { applyServerPedState } from "../src/utils/serverPedState";

const calls: unknown[][] = [];
for (const name of ["SetEntityDynamic", "SetEntityInvincible", "SetBlockingOfNonTemporaryEvents", "SetPedCanRagdoll", "SetPedCanRagdollFromPlayerImpact", "ClearPedTasksImmediately", "FreezeEntityPosition", "SetEntityCanBeDamaged", "SetEntityProofs", "SetPedCanPlayInjuredAnims", "SetPedCanPlayGestureAnims", "SetPedCanEvasiveDive"]) {
  (globalThis as any)[name] = (...args: unknown[]) => calls.push([name, ...args]);
}
let combat = false;
let fleeing = false;
(globalThis as any).IsPedInCombat = () => combat;
(globalThis as any).IsPedFleeing = () => fleeing;
let ragdoll = false;
(globalThis as any).IsPedRagdoll = () => ragdoll;
(globalThis as any).IsPedGettingUp = () => false;
function check(name: string, value: unknown) {
  if (!calls.some(call => call[0] === name && call[1] === 42 && call[2] === value)) throw new Error(`Missing ${name}=${value}`);
}
applyServerPedState(42, [false, false, true, false]);
check("SetEntityInvincible", true);
check("SetBlockingOfNonTemporaryEvents", true);
check("SetPedCanRagdoll", false);
check("FreezeEntityPosition", true);
check("SetEntityCanBeDamaged", false);
check("SetPedCanPlayInjuredAnims", false);
check("SetPedCanPlayGestureAnims", false);
const proofs = calls.find(call => call[0] === "SetEntityProofs");
if (!proofs || !proofs.slice(2).every(value => value === true)) throw new Error("Incomplete damage proofs");
if (calls.some(call => call[0] === "ClearPedTasksImmediately")) throw new Error("Idle scripted task was cleared");
calls.length = 0;
combat = true;
applyServerPedState(42, [false, true, true, true]);
if (!calls.some(call => call[0] === "ClearPedTasksImmediately")) throw new Error("Combat not stopped");
calls.length = 0;
combat = false;
fleeing = true;
applyServerPedState(42, [false, false, true, false]);
if (!calls.some(call => call[0] === "ClearPedTasksImmediately")) throw new Error("Flee not stopped");
calls.length = 0;
applyServerPedState(42, [true, false, false, false]);
check("SetEntityInvincible", false);
check("SetBlockingOfNonTemporaryEvents", false);
check("SetPedCanRagdoll", true);
check("FreezeEntityPosition", false);
if (calls.some(call => call[0] === "ClearPedTasksImmediately")) throw new Error("Dynamic NPC task was cleared");
if (calls.some(call => call[0] === "SetEntityProofs")) throw new Error("Ordinary dynamic NPC proofs changed");
calls.length = 0;
applyServerPedState(42, [true, false, false, false], true);
check("SetEntityCanBeDamaged", true);
check("SetPedCanPlayInjuredAnims", true);
calls.length = 0;
ragdoll = true;
applyServerPedState(42, [false, true, true, true]);
if (!calls.some(call => call[0] === "ClearPedTasksImmediately")) throw new Error("Ragdoll not recovered");
console.log("PASS static NPC hit proofs, reaction suppression/recovery, and dynamic transition");
