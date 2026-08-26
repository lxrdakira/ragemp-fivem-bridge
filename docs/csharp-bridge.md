# C# compatibility bridge

The upstream FiveM bridge supports JavaScript gamemodes. NeptuneEvo uses the
RAGE Multiplayer `GTANetworkAPI` C# surface, so this repository also contains a
source-compatible C# facade.

The facade is split into two layers:

1. `RageMP.FiveM.Bridge.Core` defines RAGE-compatible types and discovers
   `[RemoteEvent]`, `[ServerEvent]`, and `[Command]` handlers.
2. A CitizenFX host (next milestone) implements `IBridgeRuntime` and translates
   calls to FiveM events, natives, State Bags, and routing buckets.

Keeping CitizenFX out of the core makes the compatibility contract testable
without FXServer or GTA V. It also lets us compare the facade against the
original NeptuneEvo `Bootstrapper.dll` by reflection.

## Status

- attributes and script base class: implemented;
- remote/server event discovery and dispatch: implemented;
- entity identity and local/shared data: implemented;
- client event dispatch abstraction: implemented;
- `NAPI.Task` and `NAPI.Util`: initial implementation;
- CitizenFX runtime host: pending;
- full `NAPI.*` surface: incremental, driven by NeptuneEvo compilation.

`packages/server-csharp/NeptuneEvo.Port` references the original source tree and
is the compile gate for gradual migration. It currently includes the real
`NeptuneEvo/Main.cs` entry type.

Build a ready-to-copy resource containing the JavaScript bridge, C# host, and
current NeptuneEvo migration assembly with:

```powershell
npx pnpm@10.28.2 run build:resource:csharp
```
