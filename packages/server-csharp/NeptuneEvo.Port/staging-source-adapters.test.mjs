import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { adaptStagingSource, entryGuards } from "./staging-source-adapters.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../dotnet/resources/NeptuneEvo");

for (const [relative, entries] of Object.entries(entryGuards)) {
  test(`isolation guards cover current ${relative}`, () => {
    const source = fs.readFileSync(path.join(sourceRoot, relative), "utf8");
    const result = adaptStagingSource(source, relative);
    for (const [signature, action] of entries) {
      assert.ok(result.includes(`if (NeptuneEvo.PortCompatibility.StagingIsolation.Enabled) ${action}`), signature);
    }
    assert.notEqual(result, source);
  });
  test(`adapter fails closed on drift in ${relative}`, () => {
    assert.throws(() => adaptStagingSource("", relative), /source shape/);
  });
}

test("unrelated sources remain unchanged", () => {
  const source = "public static void Start() {}";
  assert.equal(adaptStagingSource(source, "Other.cs"), source);
});
