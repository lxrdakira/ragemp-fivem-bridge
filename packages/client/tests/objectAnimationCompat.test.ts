import { CONSTRUCT } from "@ragemp-fivem-bridge/shared/internal";
import { ObjectMp } from "../src/Entities/ObjectMp";

const reads: Array<[number, string, string]> = [];
const updates: number[] = [];

(globalThis as any).Entity = () => ({ state: {} });
(globalThis as any).DoesEntityExist = (handle: number) => handle === 77;
(globalThis as any).GetEntityAnimCurrentTime = (handle: number, dict: string, name: string) => {
  reads.push([handle, dict, name]);
  return 0.625;
};
(globalThis as any).ForceEntityAiAndAnimationUpdate = (handle: number) => updates.push(handle);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const table = new ObjectMp(CONSTRUCT, 1, 77);
assert(table.getAnimCurrentTime("anim_casino_a", "intro_wheel") === 0.625,
  "roulette wheel animation time was not returned");
table.forceAiAndAnimationUpdate();
assert(reads.length === 1 && reads[0][0] === 77 && reads[0][1] === "anim_casino_a" && reads[0][2] === "intro_wheel",
  "animation time call did not forward the entity handle and names");
assert(updates.length === 1 && updates[0] === 77,
  "animation update did not forward the entity handle");

const missing = new ObjectMp(CONSTRUCT, 2, 0);
assert(missing.getAnimCurrentTime("anim_casino_a", "intro_ball") === 0,
  "missing streamed object did not return a safe animation time");
missing.forceAiAndAnimationUpdate();
assert(reads.length === 1 && updates.length === 1,
  "missing streamed object reached an animation native");

console.log("object animation compatibility: OK");
