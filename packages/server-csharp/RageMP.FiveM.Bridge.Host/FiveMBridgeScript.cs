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
        private readonly HashSet<ushort> _connectedPlayers = new HashSet<ushort>();
        private readonly Dictionary<string, string> _pendingClientReady = new Dictionary<string, string>(StringComparer.Ordinal);
        private readonly HashSet<string> _readyClientHandles = new HashSet<string>(StringComparer.Ordinal);
        private readonly HashSet<string> _bootstrappingClientHandles = new HashSet<string>(StringComparer.Ordinal);
        private readonly Dictionary<string, List<(string EventName, object[] Arguments)>> _pendingClientEvents = new Dictionary<string, List<(string, object[])>>(StringComparer.Ordinal);
        private string[] _variadicRemoteEvents = Array.Empty<string>();
        private object[] _remoteEventContracts = Array.Empty<object>();
        private readonly Dictionary<int, (float Body, float Engine)> _vehicleHealth = new Dictionary<int, (float Body, float Engine)>();
        private readonly ConcurrentDictionary<int, PendingClientProcedure> _pendingClientProcedures = new ConcurrentDictionary<int, PendingClientProcedure>();
        private readonly ConcurrentQueue<ScheduledAction> _scheduledInbound = new ConcurrentQueue<ScheduledAction>();
        private readonly SortedDictionary<long, Queue<Action>> _scheduledByDue = new SortedDictionary<long, Queue<Action>>();
        private int _clientProcedureRequestId;
        private long _nextNativeEntityRefreshTicks;

        public FiveMBridgeScript()
        {
            BridgeRuntime.Configure(new CitizenFxRuntime(this));
            _dispatcher.ErrorSink = message => Debug.WriteLine("[ragemp-csharp] " + message);
            Tick += DispatchScheduledActions;
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
            EventHandlers["ragemp:clientNotReady"] += new Action<CitizenFX.Core.Player, string>(OnClientNotReady);
            EventHandlers["ragemp:playerState"] += new Action<CitizenFX.Core.Player, float, float, float, float, int, int, bool, int, int>(OnPlayerState);
            EventHandlers["ragemp:playerEnterVehicle"] += new Action<CitizenFX.Core.Player, int, int>(OnPlayerEnterVehicle);
            EventHandlers["ragemp:playerExitVehicle"] += new Action<CitizenFX.Core.Player, int>(OnPlayerExitVehicle);
            EventHandlers["ragemp:playerStartEnterVehicle"] += new Action<CitizenFX.Core.Player, int, int>(OnPlayerStartEnterVehicle);
            EventHandlers["ragemp:playerStartExitVehicle"] += new Action<CitizenFX.Core.Player, int>(OnPlayerStartExitVehicle);
            EventHandlers["ragemp:vehicleHealthReport"] += new Action<CitizenFX.Core.Player, int, float, float>(OnVehicleHealthReport);
            EventHandlers["ragemp:vehicleDeath"] += new Action<CitizenFX.Core.Player, int>(OnVehicleDeath);
            EventHandlers["ragemp:vehicleClassReport"] += new Action<CitizenFX.Core.Player, int, int, string>(OnVehicleClassReport);
            EventHandlers["ragemp:colshape:enter"] += new Action<CitizenFX.Core.Player, int>(OnColshapeEnter);
            EventHandlers["ragemp:colshape:exit"] += new Action<CitizenFX.Core.Player, int>(OnColshapeExit);
            EventHandlers["ragemp:callProcResult"] += new Action<CitizenFX.Core.Player, int, string?, object?>(OnClientProcedureResult);
            EventHandlers["onResourceStop"] += new Action<string>(OnResourceStop);
        }

        internal CitizenFX.Core.Player? FindCitizenPlayer(ushort id) => Players[(int)id];

        internal void TriggerClientEventWhenReady(CitizenFX.Core.Player player, string eventName, object[] arguments)
        {
            if (_readyClientHandles.Contains(player.Handle) || _bootstrappingClientHandles.Contains(player.Handle))
            {
                BaseScript.TriggerClientEvent(player, eventName, arguments);
                return;
            }

            if (!_pendingClientEvents.TryGetValue(player.Handle, out var pending))
            {
                pending = new List<(string, object[])>();
                _pendingClientEvents[player.Handle] = pending;
            }
            // A broken client must not be able to retain unbounded server
            // memory while never completing its resource handshake.
            if (pending.Count >= 4096) pending.RemoveAt(0);
            pending.Add((eventName, arguments));
        }

        internal void TriggerClientEventForReadyPlayers(string eventName, object[] arguments)
        {
            foreach (var player in Players)
                TriggerClientEventWhenReady(player, eventName, arguments);
        }

        internal Task Schedule(Action action, long delayMilliseconds)
        {
            if (action == null) throw new ArgumentNullException(nameof(action));
            var delayTicks = delayMilliseconds <= 0
                ? 0
                : checked(delayMilliseconds * TimeSpan.TicksPerMillisecond);
            _scheduledInbound.Enqueue(new ScheduledAction(DateTime.UtcNow.Ticks + delayTicks, action));
            return Task.CompletedTask;
        }

        private Task DispatchScheduledActions()
        {
            while (_scheduledInbound.TryDequeue(out var pending))
            {
                if (!_scheduledByDue.TryGetValue(pending.DueTicks, out var actions))
                {
                    actions = new Queue<Action>();
                    _scheduledByDue.Add(pending.DueTicks, actions);
                }
                actions.Enqueue(pending.Action);
            }

            var now = DateTime.UtcNow.Ticks;
            while (_scheduledByDue.Count > 0)
            {
                var next = _scheduledByDue.First();
                if (next.Key > now) break;
                _scheduledByDue.Remove(next.Key);
                while (next.Value.Count > 0)
                {
                    try { next.Value.Dequeue()(); }
                    catch (Exception error) { Debug.WriteLine("[ragemp-csharp] scheduled action failed: " + error); }
                }
            }
            return Task.CompletedTask;
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
            Tick -= InitializeOnFirstTick;

            RuntimeFileBootstrap.Prepare(API.GetResourcePath(API.GetCurrentResourceName()));
            if (int.TryParse(API.GetConvar("sv_maxclients", "48"), out var maxPlayers))
                NAPI.Server.ApplyRuntimeMaxPlayers(maxPlayers);
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
            _initialized = true;

            foreach (var citizenPlayer in Players)
                await DispatchPlayerConnected(citizenPlayer);

            foreach (var ready in _pendingClientReady.ToArray())
            {
                var citizenPlayer = Players.FirstOrDefault(player => player.Handle == ready.Key);
                if (citizenPlayer != null) SendClientBootstrap(citizenPlayer, ready.Value);
            }
            _pendingClientReady.Clear();
        }

        private void OnPlayerJoining([FromSource] CitizenFX.Core.Player source)
        {
            if (!_initialized) return;
            _ = DispatchPlayerConnected(source);
        }

        private void OnPlayerDropped([FromSource] CitizenFX.Core.Player source, string reason)
        {
            _pendingClientReady.Remove(source.Handle);
            _readyClientHandles.Remove(source.Handle);
            _bootstrappingClientHandles.Remove(source.Handle);
            _pendingClientEvents.Remove(source.Handle);
            foreach (var pair in _pendingClientProcedures)
            {
                if (pair.Value.PlayerHandle != source.Handle || !_pendingClientProcedures.TryRemove(pair.Key, out var pending)) continue;
                pending.Completion.TrySetException(new InvalidOperationException("Player disconnected during client procedure: " + pending.Name));
            }
            if (!_players.Remove(source, out var player) || player == null) return;
            _connectedPlayers.Remove(player.Id);
            if (player.Vehicle != null) player.Vehicle.Occupants.Remove(player);
            player.Vehicle = null;
            player.VehicleSeat = -1;
            foreach (var ped in RAGE.Entities.Peds.All)
                if (ped.Controller == player) ped.Controller = null;
            BaseScript.TriggerClientEvent("ragemp:player:unmap", player.Id);
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

        private void OnPlayerWeaponChange([FromSource] CitizenFX.Core.Player source, uint oldWeapon, uint newWeapon)
        {
            var player = _players.GetOrCreate(source);
            player.CurrentWeapon = (WeaponHash)newWeapon;
            _ = _dispatcher.DispatchServerAsync(Event.PlayerWeaponSwitch, player, (WeaponHash)oldWeapon, (WeaponHash)newWeapon);
        }

        private void OnPlayerReady([FromSource] CitizenFX.Core.Player source, string resourceName)
        {
            if (!_initialized)
            {
                _pendingClientReady[source.Handle] = resourceName ?? string.Empty;
                return;
            }
            SendClientBootstrap(source, resourceName);
        }

        private void OnClientNotReady([FromSource] CitizenFX.Core.Player source, string resourceName)
        {
            _readyClientHandles.Remove(source.Handle);
            _bootstrappingClientHandles.Remove(source.Handle);
        }

        private void SendClientBootstrap(CitizenFX.Core.Player source, string resourceName)
        {
            _bootstrappingClientHandles.Add(source.Handle);
            try
            {
                EntityNetworkSync.SendAll(_players.GetOrCreate(source));
                var playerSnapshot = _players.All
                    .Select(player => (object)new object[] { (int)player.Id, (int)player.Id })
                    .ToArray();
                BaseScript.TriggerClientEvent(source, "ragemp:player:snapshot", new object[] { playerSnapshot });
                BaseScript.TriggerClientEvent(source, "ragemp:csharp:variadicEvents", new object[] { _variadicRemoteEvents });
                BaseScript.TriggerClientEvent(source, "ragemp:csharp:eventContracts", new object[] { _remoteEventContracts });
                BaseScript.TriggerClientEvent(source, "ragemp:setAutoRespawn", NAPI.Server.AutoRespawnAfterDeath);
                BaseScript.TriggerClientEvent(source, "ragemp:setWeather", NAPI.World.WeatherName);
                BaseScript.TriggerClientEvent(source, "ragemp:setTime", NAPI.World.Hour, NAPI.World.Minute, NAPI.World.Second);
                foreach (var ipl in NAPI.World.GetRequestedIpls())
                    BaseScript.TriggerClientEvent(source, "ragemp:requestIpl", ipl);
                foreach (var deletion in NAPI.World.GetWorldPropDeletions())
                    BaseScript.TriggerClientEvent(source, "ragemp:deleteWorldProp", deletion.Model, deletion.Position.X, deletion.Position.Y, deletion.Position.Z, deletion.Radius);
                // The consuming client resource waits for this acknowledgement
                // to raise RAGE:MP's local playerReady event.
                BaseScript.TriggerClientEvent(source, "ragemp:playerReady", resourceName ?? string.Empty);
            }
            finally
            {
                _bootstrappingClientHandles.Remove(source.Handle);
            }
            _readyClientHandles.Add(source.Handle);
            if (_pendingClientEvents.TryGetValue(source.Handle, out var pending))
            {
                _pendingClientEvents.Remove(source.Handle);
                foreach (var clientEvent in pending)
                    BaseScript.TriggerClientEvent(source, clientEvent.EventName, clientEvent.Arguments);
            }
        }

        private void OnPlayerState([FromSource] CitizenFX.Core.Player source, float x, float y, float z, float heading, int health, int armor, bool isInCover, int vehicleNetworkId, int nativeSeat)
        {
            if (!IsFinite(x) || !IsFinite(y) || !IsFinite(z) || !IsFinite(heading)) return;
            var player = _players.GetOrCreate(source);
            player.ApplyNetworkState(
                new GTANetworkAPI.Vector3(x, y, z),
                heading,
                Math.Max(0, Math.Min(100, health)),
                Math.Max(0, Math.Min(100, armor)),
                source.Ping,
                isInCover: isInCover);
            ReconcilePlayerVehicle(player, vehicleNetworkId, nativeSeat);
        }

        private static void ReconcilePlayerVehicle(GTANetworkAPI.Player player, int networkId, int nativeSeat)
        {
            var vehicle = networkId > 0 ? RAGE.Entities.Vehicles.GetByNetworkId(networkId) : null;
            if (player.Vehicle != vehicle)
            {
                if (player.Vehicle != null) player.Vehicle.Occupants.Remove(player);
                player.Vehicle = vehicle;
                if (vehicle != null && !vehicle.Occupants.Contains(player)) vehicle.Occupants.Add(player);
            }
            player.VehicleSeat = vehicle != null && nativeSeat >= -1
                ? nativeSeat + 1
                : -1;
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

        private static void OnVehicleClassReport([FromSource] CitizenFX.Core.Player source, int networkId, int vehicleClass, string displayName)
        {
            var vehicle = RAGE.Entities.Vehicles.GetByNetworkId(networkId);
            if (vehicle == null || vehicleClass < 0 || vehicleClass > 31) return;
            var safeName = string.IsNullOrWhiteSpace(displayName)
                ? string.Empty
                : displayName.Substring(0, Math.Min(displayName.Length, 64));
            vehicle.ApplyNetworkMetadata(vehicleClass, safeName);
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

        private Task DispatchUpdateTick()
        {
            var now = DateTime.UtcNow.Ticks;
            if (now >= _nextNativeEntityRefreshTicks)
            {
                _nextNativeEntityRefreshTicks = now + TimeSpan.TicksPerMillisecond * 500;
                RefreshNativeEntityState();
            }
            return _dispatcher.DispatchServerAsync(Event.Update);
        }

        private static void RefreshNativeEntityState()
        {
            var entities = RAGE.Entities.Vehicles.All.Cast<GTANetworkAPI.Entity>()
                .Concat(RAGE.Entities.Objects.All)
                .Concat(RAGE.Entities.Peds.All);
            foreach (var entity in entities)
            {
                var handle = entity.NativeHandle;
                if (handle == 0 || !API.DoesEntityExist(handle)) continue;
                var position = API.GetEntityCoords(handle);
                var rotation = API.GetEntityRotation(handle);
                entity.ApplyNetworkTransform(
                    new GTANetworkAPI.Vector3(position.X, position.Y, position.Z),
                    new GTANetworkAPI.Vector3(rotation.X, rotation.Y, rotation.Z),
                    unchecked((uint)API.GetEntityRoutingBucket(handle)));
                if (entity is GTANetworkAPI.Vehicle vehicle)
                    vehicle.ApplyNetworkHealth(API.GetEntityHealth(handle), API.GetVehicleBodyHealth(handle), API.GetVehicleEngineHealth(handle));
            }
        }

        private async Task DispatchCommand(CitizenFX.Core.Player source, string commandText)
        {
            try
            {
                var handled = await _dispatcher.DispatchCommandAsync(_players.GetOrCreate(source), commandText);
                if (!handled && NAPI.Server.GlobalDefaultCommandMessages)
                    BaseScript.TriggerClientEvent(source, "ragemp:chatMessage", NAPI.Server.CommandErrorMessage);
            }
            catch (Exception error)
            {
                Debug.WriteLine("[ragemp-csharp] command failed: " + error);
                if (NAPI.Server.GlobalDefaultCommandMessages)
                    BaseScript.TriggerClientEvent(source, "ragemp:chatMessage", "Ошибка аргументов команды.");
            }
        }

        private Task DispatchPlayerConnected(CitizenFX.Core.Player source)
        {
            var player = _players.GetOrCreate(source);
            if (!_connectedPlayers.Add(player.Id)) return Task.CompletedTask;
            BaseScript.TriggerClientEvent("ragemp:player:map", (int)player.Id, (int)player.Id);
            if (NAPI.Server.AutoSpawnOnConnect)
                NAPI.Player.SpawnPlayer(player, new GTANetworkAPI.Vector3(0f, 0f, 72f));
            return _dispatcher.DispatchServerAsync(Event.PlayerConnected, player);
        }

        private static System.Collections.Generic.IEnumerable<Script> DiscoverScripts()
        {
            var scripts = new System.Collections.Generic.List<Script>();
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
                    if (script != null) scripts.Add(script);
                }
            }

            // NeptuneEvo.Main loads settings, database state, entity factories and
            // the shared SDK. RAGE:MP creates that entry script before dispatching
            // ResourceStart to feature scripts. AppDomain assembly/type order is
            // unspecified on FiveM, so preserve discovery order but promote the
            // resource entry point to the front of the registration list.
            foreach (var script in scripts.OrderBy(ResourcePriority)) yield return script;
        }

        private static int ResourcePriority(Script script)
        {
            var name = script.GetType().FullName;
            if (string.Equals(name, "NeptuneEvo.Main", StringComparison.Ordinal)) return 0;
            if (string.Equals(name, "NeptuneEvo.FiveM.FiveMIdentityBridge", StringComparison.Ordinal)) return 1;
            return 2;
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

        private sealed class ScheduledAction
        {
            public ScheduledAction(long dueTicks, Action action)
            {
                DueTicks = dueTicks;
                Action = action;
            }

            public long DueTicks { get; }
            public Action Action { get; }
        }
    }
}
