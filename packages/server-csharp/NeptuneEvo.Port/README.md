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
