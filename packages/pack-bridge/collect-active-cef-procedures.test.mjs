import assert from "node:assert/strict";
import test from "node:test";
import { collectActiveCefServerProcedures } from "./collect-active-cef-procedures.mjs";

test("production-minified CEF RPC calls remain visible to the contract audit", () => {
  const sources = [
    `executeServer('Binds-SetKey', [key]); executeServer('Vehicle-GetPlayerList');
     rpc.callServer('BetterNoty-Accept');
     if (false) executeServer('BattlePass-RequestData');
     // executeServer('Commented-Out');`,
  ];
  const bundle = `(0,f.bS)("Binds-SetKey",[e]);(0,f.bS)("Vehicle-GetPlayerList");
    (0,f.zc)("BetterNoty-Accept");`;
  assert.deepEqual(
    [...collectActiveCefServerProcedures(sources, bundle)].sort(),
    ["Binds-SetKey", "Vehicle-GetPlayerList"],
  );
});

test("direct callServer is included, but a non-call literal is not", () => {
  assert.deepEqual(
    [...collectActiveCefServerProcedures(
      [`executeServer('Binds-SetKey'); const label = 'Only-Text';`],
      `(0,f.bS)("Binds-SetKey");rpc.callServer("Quest-ClaimExp");"Only-Text"`,
    )].sort(),
    ["Binds-SetKey", "Quest-ClaimExp"],
  );
});

test("an unknown minified import fails closed", () => {
  assert.throws(
    () => collectActiveCefServerProcedures([`executeServer('Binds-SetKey');`], `"Binds-SetKey"`),
    /cannot identify production executeServer calls/,
  );
});
