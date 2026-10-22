# NeptuneEvo C# compatibility bridge

The port compiles the complete NeptuneEvo server source against a FiveM-backed
`GTANetworkAPI` compatibility layer. The original files under
`dotnet/resources` remain read-only. At build time they are copied into `obj`,
where the port mechanically replaces legacy thread-name guards with FiveM-safe
main-thread checks; all FiveM-specific behavior lives in this repository.

## Implemented runtime path

- CitizenFX C# host and main-thread `NAPI.Task` scheduler;
- `[RemoteEvent]`, `[ServerEvent]`, and `[Command]` discovery/dispatch;
- isolated multicast handlers so one feature cannot abort the rest;
- player lifecycle, identity, health, armour, cover, weapon and vehicle seat state;
- server vehicles, objects, peds, controller ownership and entity recreation;
- markers, labels, blips, checkpoints, colshapes and routing buckets;
- shared data/state bags, client events and client procedures;
- return-value-preserving CEF-to-client calls and the legacy `rage-rpc`
  CEF-to-C# tunnel;
- real FiveM DUI-backed RAGE headless browsers for world-space CEF markers;
- weather, time, IPL and world-prop state replay for joining clients;
- original JavaScript client plus original Svelte/legacy CEF interfaces;
- automatic runtime settings/bootstrap and a legacy-account FiveM identity bridge.

The complete compile/audit gate is:

```powershell
pnpm run verify:neptune
```

It audits the original client API calls, verifies 851 literal and dynamically
constructed client/server event contracts, 48 active CEF-to-client routes, 13
active CEF server procedures, and all server lifecycle emitters. It then runs
the C# contract suite, builds the bridge/client/CEF, compiles the complete
NeptuneEvo assembly, and repacks the development resources. This is a static
gate; an end-to-end gameplay claim still requires an allowed FXServer + MySQL
test run.

## Resource packaging

Build the C# server resource and the fast local UI overlay:

```powershell
pnpm run build:neptune:all
```

Outputs:

- `dist/ragemp-fivem-bridge`
- `dist/neptuneevo-ui-dev`
- `dist/neptuneevo-ui-assets-common`
- `dist/neptuneevo-ui-assets-player`

The development UI uses directory junctions for the roughly 10 GB original
asset tree. To create a self-contained UI resource that can be copied to a
different machine, run:

```powershell
pnpm run pack:neptune:ui:portable
```

This creates `dist/neptuneevo-ui` plus the two split asset resources and can
take substantial time and disk space.

Start order in `server.cfg`:

```cfg
add_ace resource.ragemp-fivem-bridge command.quit allow
ensure ragemp-fivem-bridge
ensure neptuneevo-ui-assets-common
ensure neptuneevo-ui-assets-player
ensure neptuneevo-ui
```

The ACE is required for the scheduled restart path: after saving, the port
asks FXServer to run `quit` instead of calling `Environment.Exit` from a
resource thread. Keep the grant scoped to this resource, and verify a full
stop/reconnect cycle with a player on an isolated server before deployment.

Use `neptuneevo-ui-dev` instead of `neptuneevo-ui` for the local overlay.

Phone-camera uploads and the legacy asset screenshot commands require the
official `screenshot-basic` FiveM resource to be started before the UI:

```cfg
ensure screenshot-basic
ensure ragemp-fivem-bridge
ensure neptuneevo-ui
```

The bridge keeps the original `mp.gui.takeScreenshot(name, ...)` and
`http://screenshots/name` contract in memory, so the unchanged CEF code can
continue reading and uploading captured images.

The original YouTube vehicle-audio feature also requires `ffmpeg` to be
available on the FXServer process `PATH`. Its writable cache is automatically
redirected to `audio_cache` in the server working directory.

## Legacy account identity

FiveM exposes a stable `license` identifier but not the legacy RAGE:MP Social
Club name used by NeptuneEvo account ownership checks. The port creates the
`fivem_identities` table on startup. The first successful credential login may
claim an unbound legacy account; the unique identifier/account constraints then
enforce the binding on later connections.

Automatic first-login claiming is enabled by default. It can be disabled before
resource start:

```cfg
set ragemp_fivem_identity_claim false
```

The equivalent manual schema is available in `sql/fivem_identity_bridge.sql`.

## Voice compatibility

Neptune's RAGE:MP voice graph is preserved: server-side
`EnableVoiceTo`/`DisableVoiceTo` authorizes each incoming peer, while the
original client controls proximity, phone/radio mode and per-player volume.
The FiveM client bridge keeps connected players addressable even while their
ped is outside streaming range, so long-distance phone and radio events can
resolve their player references.

On FiveM for GTAV Enhanced, enable the documented legacy-Mumble compatibility
layer until the port moves to Enhanced's server-owned voice-channel API:

```cfg
setr sv_mumble true
```
