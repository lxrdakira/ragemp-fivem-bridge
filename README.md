# RAGE:MP → FiveM Bridge

Run a RAGE:MP gamemode on a FiveM server with minimal changes. The bridge
reimplements the `mp.*` API surface on top of FiveM natives — players,
vehicles, events, commands, blips, checkpoints, markers, colshapes, pickups,
dummies, browsers (NUI/DUI), world, and game utilities.

The upstream bridge supports JavaScript resources. This branch also contains a
CitizenFX C# host and a complete NeptuneEvo/7Hills `GTANetworkAPI`
compatibility assembly. See [docs/csharp-bridge.md](docs/csharp-bridge.md) for
the Neptune build, resource layout, configuration, and verification gate.

## 📖 Documentation

**Everything — installation, server setup, migrating a gamemode, NUI & chat, plugins, configuration, and the full API — lives in the docs:**

## → **https://ragemp-fivem-bridge.vercel.app/**

That site is the single source of truth for setting up and using the bridge. Start there.

## Credits

Built with collaboration from [ghosty2004](https://github.com/ghosty2004). Thank you.

Thanks to [Adryan](https://github.com/AdrianOficial) for the collaboration, valuable feedback and ideas, and thorough in-game testing that drove many fixes and improvements to the bridge.

## Support

- **Discord:** https://discord.gg/RFxYBeEN8H

## License

[MIT](LICENSE) — free to use and modify for personal or commercial projects. A mention or a star is appreciated but not required.
