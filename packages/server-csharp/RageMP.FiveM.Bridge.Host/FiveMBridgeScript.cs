using System;
using System.Linq;
using System.Reflection;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Threading;
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
        private string[] _variadicRemoteEvents = Array.Empty<string>();
        private object[] _remoteEventContracts = Array.Empty<object>();
        private readonly Dictionary<int, (float Body, float Engine)> _vehicleHealth = new Dictionary<int, (float Body, float Engine)>();
        private readonly ConcurrentDictionary<int, PendingClientProcedure> _pendingClientProcedures = new ConcurrentDictionary<int, PendingClientProcedure>();
        private int _clientProcedureRequestId;

        public FiveMBridgeScript()
        {
            BridgeRuntime.Configure(new CitizenFxRuntime(this));
            Tick += InitializeOnFirstTick;
            EventHandlers["playerJoining"] += new Action<CitizenFX.Core.Player>(OnPlayerJoining);
            EventHandlers["playerDropped"] += new Action<CitizenFX.Core.Player, string>(OnPlayerDropped);
            EventHandlers["ragemp:command"] += new Action<CitizenFX.Core.Player, string>(OnCommand);
            EventHandlers["ragemp:chat:message"] += new Action<CitizenFX.Core.Player, string>(OnChatMessage);
            EventHandlers["ragemp:playerSpawn"] += new Action<CitizenFX.Core.Player>(OnPlayerSpawn);
            EventHandlers["ragemp:playerDeath"] += new Action<CitizenFX.Core.Player, uint, object?>(OnPlayerDeath);
            EventHandlers["ragemp:csharp:playerDamage"] += new Action<CitizenFX.Core.Player, int, uint, int>(OnPlayerDamage);
            EventHandlers["ragemp:playerWeaponChange"] += new Action<CitizenFX.Core.Player, uint, uint>(OnPlayerWeaponChange);
            EventHandlers["ragemp:playerReady"] += new Action<CitizenFX.Core.Player, string>(OnPlayerReady);
            EventHandlers["ragemp:playerState"] += new Action<CitizenFX.Core.Player, float, float, float, float, int, int>(OnPlayerState);
            EventHandlers["ragemp:playerEnterVehicle"] += new Action<CitizenFX.Core.Player, int, int>(OnPlayerEnterVehicle);
            EventHandlers["ragemp:playerExitVehicle"] += new Action<CitizenFX.Core.Player, int>(OnPlayerExitVehicle);
            EventHandlers["ragemp:playerStartEnterVehicle"] += new Action<CitizenFX.Core.Player, int, int>(OnPlayerStartEnterVehicle);
            EventHandlers["ragemp:playerStartExitVehicle"] += new Action<CitizenFX.Core.Player, int>(OnPlayerStartExitVehicle);
            EventHandlers["ragemp:vehicleHealthReport"] += new Action<CitizenFX.Core.Player, int, float, float>(OnVehicleHealthReport);
            EventHandlers["ragemp:vehicleDeath"] += new Action<CitizenFX.Core.Player, int>(OnVehicleDeath);
            EventHandlers["ragemp:colshape:enter"] += new Action<CitizenFX.Core.Player, int>(OnColshapeEnter);
            EventHandlers["ragemp:colshape:exit"] += new Action<CitizenFX.Core.Player, int>(OnColshapeExit);
            EventHandlers["ragemp:callProcResult"] += new Action<CitizenFX.Core.Player, int, string?, object?>(OnClientProcedureResult);
            EventHandlers["onResourceStop"] += new Action<string>(OnResourceStop);
        }

        internal CitizenFX.Core.Player? FindCitizenPlayer(ushort id) => Players[(int)id];

        internal async Task Schedule(Action action, long delayMilliseconds)
        {
            if (delayMilliseconds > 0) await Delay(checked((int)delayMilliseconds));
            action();
        }

        internal Task<object?> CallClientProcedure(CitizenFX.Core.Player player, string procedureName, object[] arguments)
        {
            if (string.IsNullOrWhiteSpace(procedureName)) throw new ArgumentException("Procedure name is required", nameof(procedureName));
            var requestId = Interlocked.Increment(ref _clientProcedureRequestId);
            if (requestId <= 0)
            {
                Interlocked.Exchange(ref _clientProcedureRequestId, 1);
                requestId = 1;
            }

            var completion = new TaskCompletionSource<object?>(TaskCreationOptions.RunContinuationsAsynchronously);
            _pendingClientProcedures[requestId] = new PendingClientProcedure(player.Handle, procedureName, completion);
            var payload = new object[arguments.Length + 2];
            payload[0] = procedureName;
            payload[1] = requestId;
            Array.Copy(arguments, 0, payload, 2, arguments.Length);
            BaseScript.TriggerClientEvent(player, "ragemp:callProc", payload);
            _ = ExpireClientProcedure(requestId);
            return completion.Task;
        }

        private async Task ExpireClientProcedure(int requestId)
        {
            await Delay(30000);
            if (_pendingClientProcedures.TryRemove(requestId, out var pending))
                pending.Completion.TrySetException(new TimeoutException($"Client procedure timed out: {pending.Name}"));
        }

        private void OnClientProcedureResult([FromSource] CitizenFX.Core.Player source, int requestId, string? error, object? result)
        {
            if (!_pendingClientProcedures.TryGetValue(requestId, out var pending) || pending.PlayerHandle != source.Handle) return;
            if (!_pendingClientProcedures.TryRemove(requestId, out pending)) return;
            if (!string.IsNullOrEmpty(error)) pending.Completion.TrySetException(new InvalidOperationException(error));
            else pending.Completion.TrySetResult(result);
        }

        private async Task InitializeOnFirstTick()
        {
            if (_initialized) return;
            _initialized = true;
            Tick -= InitializeOnFirstTick;

            RuntimeFileBootstrap.Prepare(API.GetResourcePath(API.GetCurrentResourceName()));
            DerivedEntityFactory.Configure();
            var scripts = DiscoverScripts().ToArray();
            foreach (var script in scripts) _dispatcher.Register(script);
            var remoteEvents = _dispatcher.RemoteEvents.ToArray();
            foreach (var remoteEvent in remoteEvents)
            {
                var adapter = new RemoteEventAdapter(
                    remoteEvent.Name,
                    _dispatcher,
                    _players,
                    error => Debug.WriteLine("[ragemp-csharp] " + error));
                EventHandlers[remoteEvent.Name] += adapter.CreateDelegate(remoteEvent.ArgumentCount);
            }
            _variadicRemoteEvents = _dispatcher.VariadicRemoteEvents.ToArray();
            _remoteEventContracts = remoteEvents
                .Where(remoteEvent => remoteEvent.RequiredArgumentCount < remoteEvent.ArgumentCount)
                .Select(remoteEvent => (object)new object[]
                {
                    remoteEvent.Name,
                    remoteEvent.RequiredArgumentCount,
                    remoteEvent.ArgumentCount,
                    remoteEvent.DefaultArguments
                })
                .ToArray();

            Debug.WriteLine($"[ragemp-csharp] registered {_dispatcher.RemoteEventCount} remote, {_dispatcher.ServerEventCount} server events and {_dispatcher.CommandCount} commands from {scripts.Length} scripts");

            if (string.Equals(API.GetConvar("ragemp_bridge_smoke_only", "false"), "true", StringComparison.OrdinalIgnoreCase))
            {
                Debug.WriteLine("[ragemp-csharp] smoke-only mode: resource and player lifecycle dispatch is disabled");
                return;
            }

            await _dispatcher.DispatchServerAsync(Event.ResourceStart);
            Tick += DispatchUpdateTick;

            foreach (var citizenPlayer in Players)
                await DispatchPlayerConnected(citizenPlayer);
        }

        private void OnPlayerJoining([FromSource] CitizenFX.Core.Player source)
        {
            if (!_initialized) return;
            _ = DispatchPlayerConnected(source);
        }

        private void OnPlayerDropped([FromSource] CitizenFX.Core.Player source, string reason)
        {
            foreach (var pair in _pendingClientProcedures)
            {
                if (pair.Value.PlayerHandle != source.Handle || !_pendingClientProcedures.TryRemove(pair.Key, out var pending)) continue;
                pending.Completion.TrySetException(new InvalidOperationException("Player disconnected during client procedure: " + pending.Name));
            }
            if (!_players.Remove(source, out var player) || player == null) return;
            _ = _dispatcher.DispatchServerAsync(Event.PlayerDisconnected, player, DisconnectionType.Left, reason ?? string.Empty);
        }

        private void OnCommand([FromSource] CitizenFX.Core.Player source, string commandText)
        {
            _ = DispatchCommand(source, commandText);
        }

        private void OnChatMessage([FromSource] CitizenFX.Core.Player source, string message) =>
            _ = _dispatcher.DispatchServerAsync(Event.ChatMessage, _players.GetOrCreate(source), message ?? string.Empty);

        private void OnPlayerSpawn([FromSource] CitizenFX.Core.Player source) =>
            _ = _dispatcher.DispatchServerAsync(Event.PlayerSpawn, _players.GetOrCreate(source));

        private void OnPlayerDeath([FromSource] CitizenFX.Core.Player source, uint weapon, object? killerSource)
        {
            GTANetworkAPI.Player? killer = null;
            if (killerSource != null && ushort.TryParse(Convert.ToString(killerSource), out var killerId))
                killer = _players.Get(killerId);
            _ = _dispatcher.DispatchServerAsync(Event.PlayerDeath, _players.GetOrCreate(source), killer, weapon);
        }

        private void OnPlayerDamage([FromSource] CitizenFX.Core.Player source, int attackerSource, uint weapon, int healthLoss)
        {
            var attacker = attackerSource >= 0 && attackerSource <= ushort.MaxValue
                ? _players.Get((ushort)attackerSource)
                : null;
            _ = _dispatcher.DispatchServerAsync(Event.PlayerDamage, _players.GetOrCreate(source), attacker, weapon, healthLoss);
        }

        private void OnPlayerWeaponChange([FromSource] CitizenFX.Core.Player source, uint oldWeapon, uint newWeapon) =>
            _ = _dispatcher.DispatchServerAsync(Event.PlayerWeaponSwitch, _players.GetOrCreate(source), (WeaponHash)oldWeapon, (WeaponHash)newWeapon);

        private void OnPlayerReady([FromSource] CitizenFX.Core.Player source, string resourceName)
        {
            EntityNetworkSync.SendAll(_players.GetOrCreate(source));
            BaseScript.TriggerClientEvent(source, "ragemp:csharp:variadicEvents", new object[] { _variadicRemoteEvents });
            BaseScript.TriggerClientEvent(source, "ragemp:csharp:eventContracts", new object[] { _remoteEventContracts });
        }

        private void OnPlayerState([FromSource] CitizenFX.Core.Player source, float x, float y, float z, float heading, int health, int armor)
        {
            if (!IsFinite(x) || !IsFinite(y) || !IsFinite(z) || !IsFinite(heading)) return;
            var player = _players.GetOrCreate(source);
            player.ApplyNetworkState(
                new GTANetworkAPI.Vector3(x, y, z),
                heading,
                Math.Max(0, Math.Min(100, health)),
                Math.Max(0, Math.Min(100, armor)),
                source.Ping);
        }

        private static bool IsFinite(float value) => !float.IsNaN(value) && !float.IsInfinity(value);

        private void OnPlayerEnterVehicle([FromSource] CitizenFX.Core.Player source, int networkId, int nativeSeat)
        {
            var player = _players.GetOrCreate(source);
            var vehicle = RAGE.Entities.Vehicles.GetByNetworkId(networkId);
            if (vehicle == null) return;
            var seat = checked((sbyte)(nativeSeat + 1));
            player.Vehicle = vehicle;
            player.VehicleSeat = seat;
            if (!vehicle.Occupants.Contains(player)) vehicle.Occupants.Add(player);
            _ = _dispatcher.DispatchServerAsync(Event.PlayerEnterVehicle, player, vehicle, seat);
        }

        private void OnPlayerExitVehicle([FromSource] CitizenFX.Core.Player source, int networkId)
        {
            var player = _players.GetOrCreate(source);
            var vehicle = RAGE.Entities.Vehicles.GetByNetworkId(networkId) ?? player.Vehicle;
            if (vehicle == null) return;
            vehicle.Occupants.Remove(player);
            player.Vehicle = null;
            player.VehicleSeat = -1;
            _ = _dispatcher.DispatchServerAsync(Event.PlayerExitVehicle, player, vehicle);
        }

        private void OnPlayerStartEnterVehicle([FromSource] CitizenFX.Core.Player source, int networkId, int nativeSeat)
        {
            var vehicle = RAGE.Entities.Vehicles.GetByNetworkId(networkId);
            if (vehicle != null) _ = _dispatcher.DispatchServerAsync(Event.PlayerEnterVehicleAttempt, _players.GetOrCreate(source), vehicle, checked((sbyte)(nativeSeat + 1)));
        }

        private void OnPlayerStartExitVehicle([FromSource] CitizenFX.Core.Player source, int networkId)
        {
            var player = _players.GetOrCreate(source);
            var vehicle = RAGE.Entities.Vehicles.GetByNetworkId(networkId) ?? player.Vehicle;
            if (vehicle != null) _ = _dispatcher.DispatchServerAsync(Event.PlayerExitVehicleAttempt, player, vehicle);
        }

        private void OnVehicleHealthReport([FromSource] CitizenFX.Core.Player source, int networkId, float bodyHealth, float engineHealth)
        {
            var vehicle = RAGE.Entities.Vehicles.GetByNetworkId(networkId);
            if (vehicle == null) return;
            if (_vehicleHealth.TryGetValue(networkId, out var previous))
            {
                var bodyLoss = Math.Max(0f, previous.Body - bodyHealth);
                var engineLoss = Math.Max(0f, previous.Engine - engineHealth);
                if (bodyLoss > 0 || engineLoss > 0) _ = _dispatcher.DispatchServerAsync(Event.VehicleDamage, vehicle, bodyLoss, engineLoss);
            }
            _vehicleHealth[networkId] = (bodyHealth, engineHealth);
            vehicle.ApplyNetworkHealth(bodyHealth, bodyHealth, engineHealth);
        }

        private void OnVehicleDeath([FromSource] CitizenFX.Core.Player source, int networkId)
        {
            var vehicle = RAGE.Entities.Vehicles.GetByNetworkId(networkId);
            if (vehicle != null) _ = _dispatcher.DispatchServerAsync(Event.VehicleDeath, vehicle);
        }

        private void OnColshapeEnter([FromSource] CitizenFX.Core.Player source, int id)
        {
            if (id < 0 || id > ushort.MaxValue) return;
            var shape = RAGE.Entities.Colshapes.Get((ushort)id);
            if (shape == null) return;
            var player = _players.GetOrCreate(source);
            shape.RaiseEnter(player);
            _ = _dispatcher.DispatchServerAsync(Event.PlayerEnterColshape, shape, player);
        }

        private void OnColshapeExit([FromSource] CitizenFX.Core.Player source, int id)
        {
            if (id < 0 || id > ushort.MaxValue) return;
            var shape = RAGE.Entities.Colshapes.Get((ushort)id);
            if (shape == null) return;
            var player = _players.GetOrCreate(source);
            shape.RaiseExit(player);
            _ = _dispatcher.DispatchServerAsync(Event.PlayerExitColshape, shape, player);
        }

        private void OnResourceStop(string resourceName)
        {
            if (!_initialized || resourceName != API.GetCurrentResourceName()) return;
            Tick -= DispatchUpdateTick;
            _ = _dispatcher.DispatchServerAsync(Event.ResourceStop);
        }

        private Task DispatchUpdateTick() => _dispatcher.DispatchServerAsync(Event.Update);

        private async Task DispatchCommand(CitizenFX.Core.Player source, string commandText)
        {
            try
            {
                var handled = await _dispatcher.DispatchCommandAsync(_players.GetOrCreate(source), commandText);
                if (!handled) BaseScript.TriggerClientEvent(source, "ragemp:chatMessage", "Команда не найдена!");
            }
            catch (Exception error)
            {
                Debug.WriteLine("[ragemp-csharp] command failed: " + error);
                BaseScript.TriggerClientEvent(source, "ragemp:chatMessage", "Ошибка аргументов команды.");
            }
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

        private sealed class PendingClientProcedure
        {
            public PendingClientProcedure(string playerHandle, string name, TaskCompletionSource<object?> completion)
            {
                PlayerHandle = playerHandle;
                Name = name;
                Completion = completion;
            }

            public string PlayerHandle { get; }
            public string Name { get; }
            public TaskCompletionSource<object?> Completion { get; }
        }
    }
}
