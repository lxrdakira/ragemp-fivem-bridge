import assert from "node:assert/strict";
import test from "node:test";
import { fxManifest } from "./pack-bridge.mjs";

for (const flags of [
  { withCsharp: false, withNeptune: false },
  { withCsharp: true, withNeptune: false },
  { withCsharp: true, withNeptune: true },
]) {
  test(`manifest keeps server assemblies private for ${JSON.stringify(flags)}`, () => {
    const manifest = fxManifest(flags);
    const filesBlock = manifest.match(/files\s*\{([^}]*)\}/)?.[1];
    assert.ok(filesBlock);
    assert.match(filesBlock, /ui\/_bridge\.js/);
    assert.doesNotMatch(filesBlock, /csharp|\.dll/);
    if (flags.withCsharp)
      assert.match(manifest, /server_scripts\s*\{[^}]*csharp\/RageMP\.FiveM\.Bridge\.Host\.net\.dll/s);
    if (flags.withNeptune)
      assert.match(manifest, /server_scripts\s*\{[^}]*csharp\/NeptuneEvo\.Port\.net\.dll/s);
  });
}
