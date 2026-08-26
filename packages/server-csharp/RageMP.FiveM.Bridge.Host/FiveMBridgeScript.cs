using System;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using CitizenFX.Core;
using CitizenFX.Core.Native;
using GTANetworkAPI;
using RageMP.FiveM.Bridge;

namespace RageMP.FiveM.Bridge.Host
{
    public sealed class FiveMBridgeScript : BaseScript
    {
        private readonly EventDispatcher _dispatcher = new EventDispatcher();
        private readonly PlayerFactory _players = new PlayerFactory();
        private bool _initialized;

        public FiveMBridgeScript()
        {
            BridgeRuntime.Configure(new CitizenFxRuntime(this));
            Tick += InitializeOnFirstTick;
            EventHandlers["playerJoining"] += new Action<CitizenFX.Core.Player>(OnPlayerJoining);
            EventHandlers["playerDropped"] += new Action<CitizenFX.Core.Player, string>(OnPlayerDropped);
        }

        internal CitizenFX.Core.Player? FindCitizenPlayer(ushort id) => Players[(int)id];

        internal async Task Schedule(Action action, long delayMilliseconds)
        {
            if (delayMilliseconds > 0) await Delay(checked((int)delayMilliseconds)).ConfigureAwait(false);
            action();
        }

        private async Task InitializeOnFirstTick()
        {
            if (_initialized) return;
            _initialized = true;
            Tick -= InitializeOnFirstTick;

            var scripts = DiscoverScripts().ToArray();
            foreach (var script in scripts) _dispatcher.Register(script);
            foreach (var remoteEvent in _dispatcher.RemoteEvents)
            {
                var adapter = new RemoteEventAdapter(
                    remoteEvent.Name,
                    _dispatcher,
                    _players,
                    error => Debug.WriteLine("[ragemp-csharp] " + error));
                EventHandlers[remoteEvent.Name] += adapter.CreateDelegate(remoteEvent.ArgumentCount);
            }

            Debug.WriteLine($"[ragemp-csharp] registered {_dispatcher.RemoteEventCount} remote and {_dispatcher.ServerEventCount} server events from {scripts.Length} scripts");

            if (string.Equals(API.GetConvar("ragemp_bridge_smoke_only", "false"), "true", StringComparison.OrdinalIgnoreCase))
            {
                Debug.WriteLine("[ragemp-csharp] smoke-only mode: resource and player lifecycle dispatch is disabled");
                return;
            }

            await _dispatcher.DispatchServerAsync(Event.ResourceStart).ConfigureAwait(false);

            foreach (var citizenPlayer in Players)
                await DispatchPlayerConnected(citizenPlayer).ConfigureAwait(false);
        }

        private void OnPlayerJoining([FromSource] CitizenFX.Core.Player source)
        {
            if (!_initialized) return;
            _ = DispatchPlayerConnected(source);
        }

        private void OnPlayerDropped([FromSource] CitizenFX.Core.Player source, string reason)
        {
            if (!_players.Remove(source, out var player) || player == null) return;
            _ = _dispatcher.DispatchServerAsync(Event.PlayerDisconnected, player, DisconnectionType.Left, reason ?? string.Empty);
        }

        private Task DispatchPlayerConnected(CitizenFX.Core.Player source)
        {
            var player = _players.GetOrCreate(source);
            return _dispatcher.DispatchServerAsync(Event.PlayerConnected, player);
        }

        private static System.Collections.Generic.IEnumerable<Script> DiscoverScripts()
        {
            foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
            {
                Type[] types;
                try { types = assembly.GetTypes(); }
                catch (ReflectionTypeLoadException error) { types = error.Types.Where(type => type != null).Cast<Type>().ToArray(); }

                foreach (var type in types)
                {
                    if (type.IsAbstract || !typeof(Script).IsAssignableFrom(type)) continue;
                    if (type.GetConstructor(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic, null, Type.EmptyTypes, null) == null) continue;
                    Script? script = null;
                    try { script = Activator.CreateInstance(type, true) as Script; }
                    catch (Exception error) { Debug.WriteLine($"[ragemp-csharp] failed to create {type.FullName}: {error}"); }
                    if (script != null) yield return script;
                }
            }
        }
    }
}
