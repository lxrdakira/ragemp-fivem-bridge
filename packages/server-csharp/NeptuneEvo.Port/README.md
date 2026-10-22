# NeptuneEvo FiveM port assembly

This project links and compiles the complete sibling NeptuneEvo C# source tree.
It does not fork or overwrite the original gameplay code. FiveM-only additions,
including legacy account identity binding and RAGE runtime-owned event adapters,
are compiled beside the linked source. Generated sources also redirect the
legacy `client_packages/audio_cache` path to the writable FiveM server runtime.

Build:

```powershell
dotnet build NeptuneEvo.Port.csproj -c Release
```

The expected output is `NeptuneEvo.Port.net.dll`. Warnings currently originate
from the linked production source and the pinned legacy dependencies; any build
error fails the migration gate.

An isolated staging build uses the same assembly but requires
`PLMP_ISOLATED_STAGING=1`, `PLMP_REDIS_ENDPOINT=127.0.0.1:6380`, and a
separately provisioned `PLMP_REDIS_PASSWORD` (at least 32 characters).
In that mode generated source disables SMTP, photo upload, analytics,
donation polling, and MP3 download/server entry points. Missing or changed
entry-point signatures fail source generation. This is only one layer of
isolation: audit database, outbound endpoints, and full server configuration
before starting gameplay against a staging snapshot. The normal mode keeps
the legacy Redis endpoint and behavior.

## Clothing regression guard (22 October 2026)

The taxi rebuild previously used the September 14 checkout, omitting clothing
adapters from the September integration branch. Recovery restores only the
clothing portions of `c1eecf5`, `52c8c47`, `421db25` and integration `691f651`;
it does not replay unrelated historical gameplay patches over newer fixes.
`clothing-source-adapters.mjs` is mandatory during generation, and
`LegacyNpcClothing.cs` is compiled explicitly. All seven expected source files
must pass exact-shape guards. The UI packer separately translates the driving
instructor preset. `pnpm test:clothing` checks all 1090 wardrobe indices,
genders, textures, four NPC publishers and the actual compiled NPC translator.
It is part of `pnpm verify:neptune`; never skip it for a taxi-only rebuild.

These are generated-build translations: do not run them over saved player
outfits or change the database catalog, otherwise drawables can be shifted
twice. Preserve current gameplay source fixes and the existing male-leg
normalization in the gameplay code.
