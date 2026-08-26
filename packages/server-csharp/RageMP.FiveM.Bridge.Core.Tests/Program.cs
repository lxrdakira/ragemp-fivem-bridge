using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GTANetworkAPI;
using RageMP.FiveM.Bridge;

var tests = new (string Name, Func<Task> Run)[]
{
    ("Vector3 contract", TestVector),
    ("Entity data contract", TestEntityData),
    ("Remote event dispatch", TestRemoteEvent),
    ("Static remote event dispatch", TestStaticRemoteEvent),
    ("Duplicate remote event dispatch", TestDuplicateRemoteEvent),
    ("Remote event failure isolation", TestRemoteEventFailureIsolation),
    ("Server event dispatch", TestServerEvent),
    ("Server event failure isolation", TestServerEventFailureIsolation),
    ("Command dispatch", TestCommand),
    ("NAPI client event runtime", TestRuntime),
    ("NAPI server settings", TestServerSettings),
    ("NAPI world state", TestWorldState),
    ("Player state synchronization", TestPlayerStateSynchronization),
    ("Network argument serialization", TestNetworkArguments),
    ("Network entity argument dispatch", TestNetworkEntityDispatch),
    ("Variadic remote event dispatch", TestVariadicRemoteEvent),
    ("Optional remote event contract", TestOptionalRemoteContract),
    ("Broadcast entity synchronization", TestEntityNetworkSync)
    ,("Native entity synchronization", TestNativeEntitySync),
    ("Vehicle class catalog", TestVehicleClassCatalog)
};

var failures = 0;
foreach (var test in tests)
{
    try { await test.Run(); Console.WriteLine("PASS " + test.Name); }
    catch (Exception error) { failures++; Console.Error.WriteLine("FAIL " + test.Name + ": " + error); }
}
return failures;

static Task TestVector()
{
    var vector = new Vector3(3, 4, 0);
    Equal(5f, vector.Length());
    Equal(new Vector3(4, 5, 1), vector.Add(new Vector3(1, 1, 1)));
    Equal(25f, vector.DistanceToSquared(Vector3Zero()));
    return Task.CompletedTask;
}

static Task TestEntityData()
{
    var runtime = new FakeRuntime();
    BridgeRuntime.Configure(runtime);
    var player = NewPlayer(7);
    player.SetData("uuid", 42);
    player.SetSharedData("dimension", 3u);
    Equal(42, player.GetData<int>("uuid"));
    Equal("uuid", NAPI.Data.GetAllEntityData(player).Single());
    Equal(3u, player.GetSharedData<uint>("dimension"));
    Equal("dimension", runtime.SharedData[0].Key);
    player.SetSharedData("dimension", null);
    Equal(false, player.HasSharedData("dimension"));
    Equal("dimension", runtime.ResetSharedDataKeys.Single().Key);
    player.SetData<string?>("nullable", null);
    Equal(false, player.HasData("nullable"));
    return Task.CompletedTask;
}

static async Task TestRemoteEvent()
{
    var script = new ExampleScript();
    var dispatcher = new EventDispatcher();
    dispatcher.Register(script);
    await dispatcher.DispatchRemoteAsync("auth.login", NewPlayer(11), "alice", 19L);
    Equal("alice:19:11", script.LoginResult);
    Equal(2, dispatcher.RemoteEventCount);
}

static async Task TestServerEvent()
{
    var script = new ExampleScript();
    var dispatcher = new EventDispatcher();
    dispatcher.Register(script);
    await dispatcher.DispatchServerAsync(Event.ResourceStart);
    Equal(true, script.Started);
}

static async Task TestServerEventFailureIsolation()
{
    var dispatcher = new EventDispatcher();
    var errors = new List<string>();
    dispatcher.ErrorSink = errors.Add;
    dispatcher.Register(new ThrowingServerScript());
    dispatcher.Register(new FollowingServerScript());

    FollowingServerScript.CallCount = 0;
    await dispatcher.DispatchServerAsync(Event.ResourceStart);

    Equal(1, FollowingServerScript.CallCount);
    Equal(1, errors.Count);
}

static async Task TestStaticRemoteEvent()
{
    ExampleScript.StaticPlayerId = 0;
    var dispatcher = new EventDispatcher();
    dispatcher.Register(new ExampleScript());
    await dispatcher.DispatchRemoteAsync("anticheat.hitBox", NewPlayer(33));
    Equal((ushort)33, ExampleScript.StaticPlayerId);
}

static async Task TestDuplicateRemoteEvent()
{
    DuplicateScript.CallCount = 0;
    var dispatcher = new EventDispatcher();
    dispatcher.Register(new DuplicateScript());
    dispatcher.Register(new DuplicateScriptTwo());
    await dispatcher.DispatchRemoteAsync("shared.action", NewPlayer(34), 2);
    Equal(4, DuplicateScript.CallCount);
}

static async Task TestRemoteEventFailureIsolation()
{
    var dispatcher = new EventDispatcher();
    var errors = new List<string>();
    dispatcher.ErrorSink = errors.Add;
    dispatcher.Register(new ThrowingRemoteScript());
    dispatcher.Register(new FollowingRemoteScript());

    FollowingRemoteScript.CallCount = 0;
    await dispatcher.DispatchRemoteAsync("isolated.remote", NewPlayer(35), 4);

    Equal(4, FollowingRemoteScript.CallCount);
    Equal(1, errors.Count);
}

static async Task TestCommand()
{
    var script = new ExampleScript();
    var dispatcher = new EventDispatcher();
    dispatcher.Register(script);
    Equal(2, dispatcher.CommandCount);
    Equal(true, await dispatcher.DispatchCommandAsync(NewPlayer(41), "/teleport 12 3.5"));
    Equal("41:12:3.5", script.CommandResult);
    Equal(true, await dispatcher.DispatchCommandAsync(NewPlayer(42), "announce hello quoted world"));
    Equal("42:hello quoted world", script.CommandResult);
    Equal(false, await dispatcher.DispatchCommandAsync(NewPlayer(42), "missing"));
}

static Task TestRuntime()
{
    var runtime = new FakeRuntime();
    BridgeRuntime.Configure(runtime);
    NAPI.ClientEvent.TriggerClientEvent(NewPlayer(21), "hud.show", true);
    Equal("hud.show", runtime.ClientEvents[0].EventName);
    Equal(true, runtime.ClientEvents[0].Arguments[0]);
    return Task.CompletedTask;
}

static Task TestServerSettings()
{
    var runtime = new FakeRuntime();
    BridgeRuntime.Configure(runtime);
    NAPI.Server.SetAutoRespawnAfterDeath(false);
    NAPI.Server.SetAutoSpawnOnConnect(false);
    NAPI.Server.SetCommandErrorMessage("unknown");
    NAPI.Server.SetGlobalDefaultCommandMessages(false);
    NAPI.Server.SetGlobalServerChat(false);
    NAPI.Server.SetServerName("Neptune FiveM");
    NAPI.Server.ApplyRuntimeMaxPlayers(64);

    Equal(false, NAPI.Server.AutoRespawnAfterDeath);
    Equal(false, NAPI.Server.AutoSpawnOnConnect);
    Equal("unknown", NAPI.Server.CommandErrorMessage);
    Equal(false, NAPI.Server.GlobalDefaultCommandMessages);
    Equal(false, NAPI.Server.GlobalServerChat);
    Equal("Neptune FiveM", NAPI.Server.ServerName);
    Equal(64, NAPI.Server.GetMaxPlayers());
    Equal("ragemp:setAutoRespawn", runtime.BroadcastEvents.Single().EventName);
    Equal(false, runtime.BroadcastEvents.Single().Arguments[0]);
    return Task.CompletedTask;
}

static Task TestWorldState()
{
    var runtime = new FakeRuntime();
    BridgeRuntime.Configure(runtime);
    NAPI.World.SetWeather("RAIN");
    NAPI.World.SetTime(21, 15, 30);
    NAPI.World.RequestIpl("test_ipl");
    NAPI.World.DeleteWorldProp(123u, new Vector3(1, 2, 3), 4f);

    Equal("RAIN", NAPI.World.WeatherName);
    Equal(21, NAPI.World.Hour);
    Equal(15, NAPI.World.Minute);
    Equal(30, NAPI.World.Second);
    Equal("ragemp:setWeather", runtime.BroadcastEvents[0].EventName);
    Equal("ragemp:setTime", runtime.BroadcastEvents[1].EventName);
    Equal("ragemp:requestIpl", runtime.BroadcastEvents[2].EventName);
    Equal("ragemp:deleteWorldProp", runtime.BroadcastEvents[3].EventName);
    return Task.CompletedTask;
}

static Task TestVehicleClassCatalog()
{
    Equal(8, NAPI.Vehicle.GetVehicleClass((VehicleHash)6774487u));
    var vehicle = NAPI.Vehicle.CreateVehicle(6774487u, new Vector3(), 0f, 0, 0);
    Equal(8, vehicle.Class);
    Equal("CHIMERA", vehicle.DisplayName);
    vehicle.Delete();
    Equal(-1, NAPI.Vehicle.GetVehicleClass((VehicleHash)uint.MaxValue));
    return Task.CompletedTask;
}

static Task TestPlayerStateSynchronization()
{
    var runtime = new FakeRuntime();
    BridgeRuntime.Configure(runtime);
    var player = NewPlayer(22);
    player.ApplyNetworkState(new Vector3(1, 2, 3), 45f, 80, 25, 30, 4, true);
    Equal(0, runtime.ClientEvents.Count);
    Equal(new Vector3(1, 2, 3), player.Position);
    Equal(80, player.Health);
    Equal(true, player.IsInCover);
    player.Position = new Vector3(4, 5, 6);
    player.Health = 90;
    player.Armor = 40;
    player.Transparency = 128;
    player.Dimension = 7;
    Equal("ragemp:setPosition", runtime.ClientEvents[0].EventName);
    Equal("ragemp:setHealth", runtime.ClientEvents[1].EventName);
    Equal("ragemp:setArmour", runtime.ClientEvents[2].EventName);
    Equal("ragemp:setAlpha", runtime.ClientEvents[3].EventName);
    Equal("ragemp:setDimension", runtime.ClientEvents[4].EventName);
    return Task.CompletedTask;
}

static Task TestNetworkArguments()
{
    BridgeRuntime.Configure(new FakeRuntime());
    var player = NewPlayer(25);
    var vehicle = NAPI.Vehicle.CreateVehicle(123u, new Vector3(), 0f, 0, 0);
    var output = NetArgumentSerializer.Sanitize(new object[] { player, new object[] { vehicle } });
    var playerRef = (Dictionary<string, object>)output[0];
    var nested = (List<object?>)output[1];
    var vehicleRef = (Dictionary<string, object>)nested[0]!;
    Equal("player", playerRef["__mpRef"]);
    Equal((ushort)25, playerRef["id"]);
    Equal(vehicle.NetworkId, vehicleRef["netId"]);
    vehicle.Delete();
    return Task.CompletedTask;
}

static async Task TestNetworkEntityDispatch()
{
    BridgeRuntime.Configure(new FakeRuntime());
    var vehicle = NAPI.Vehicle.CreateVehicle(124u, new Vector3(), 0f, 0, 0);
    var script = new EntityRefScript();
    var dispatcher = new EventDispatcher();
    dispatcher.Register(script);
    await dispatcher.DispatchRemoteAsync(
        "vehicle.select",
        NewPlayer(26),
        new Dictionary<string, object> { ["__mpRef"] = "vehicle", ["id"] = -1, ["netId"] = vehicle.NetworkId });
    Equal(vehicle, script.Vehicle);
    vehicle.Delete();
}

static async Task TestVariadicRemoteEvent()
{
    var script = new VariadicScript();
    var dispatcher = new EventDispatcher();
    dispatcher.Register(script);
    Equal("variadic", dispatcher.VariadicRemoteEvents.Single());
    await dispatcher.DispatchRemoteAsync("variadic", NewPlayer(27), new object?[] { new object[] { 1L, "two" } });
    Equal(2, script.Count);
}

static Task TestOptionalRemoteContract()
{
    var dispatcher = new EventDispatcher();
    dispatcher.Register(new OptionalRemoteScript());
    var contract = dispatcher.RemoteEvents.Single();
    Equal(1, contract.RequiredArgumentCount);
    Equal(3, contract.ArgumentCount);
    Equal(7, contract.DefaultArguments[1]);
    Equal("cash", contract.DefaultArguments[2]);
    return Task.CompletedTask;
}

static Task TestEntityNetworkSync()
{
    var runtime = new FakeRuntime();
    BridgeRuntime.Configure(runtime);
    var marker = NAPI.Marker.CreateMarker(1, new Vector3(10, 20, 30), new Vector3(), new Vector3(), 2f, new Color(1, 2, 3, 4));
    Equal("ragemp:markerCreate", runtime.BroadcastEvents[0].EventName);
    marker.Scale = 3f;
    Equal("ragemp:markerUpdate", runtime.BroadcastEvents[1].EventName);
    marker.Delete();
    Equal("ragemp:markerDestroy", runtime.BroadcastEvents[2].EventName);
    Equal(false, RAGE.Entities.Markers.All.Contains(marker));
    return Task.CompletedTask;
}

static Task TestNativeEntitySync()
{
    var runtime = new FakeRuntime();
    BridgeRuntime.Configure(runtime);
    var vehicle = NAPI.Vehicle.CreateVehicle(123u, new Vector3(1, 2, 3), 90f, 1, 2, "TEST");
    Equal(vehicle.Id + 1000, vehicle.NetworkId);
    Equal(true, vehicle.NativeHandle != 0);
    Equal("ragemp:entity:create", runtime.BroadcastEvents[0].EventName);
    Equal("ragemp:entity:netid", runtime.BroadcastEvents[1].EventName);
    Equal("ragemp:vehicle:batch", runtime.BroadcastEvents[2].EventName);
    vehicle.Health = 650f;
    Equal("ragemp:vehicle:batch", runtime.BroadcastEvents[3].EventName);
    Equal(650f, vehicle.BodyHealth);
    Equal(650f, vehicle.EngineHealth);
    var passenger = NewPlayer(26);
    passenger.Vehicle = vehicle;
    passenger.VehicleSeat = (int)VehicleSeat.RightFront;
    var driver = NewPlayer(27);
    driver.Vehicle = vehicle;
    driver.VehicleSeat = (int)VehicleSeat.Driver;
    vehicle.Occupants.Add(passenger);
    vehicle.Occupants.Add(driver);
    Equal(driver, NAPI.Vehicle.GetVehicleDriver(vehicle.Handle));
    var oldNetworkId = vehicle.NetworkId;
    NAPI.Entity.SetEntityModel(vehicle.Handle, 456u);
    Equal(456u, vehicle.Model);
    Equal(2, runtime.CreatedEntities.Count);
    Equal(1, runtime.DeletedEntities.Count);
    Equal(vehicle, runtime.DeletedEntities.Single());
    Equal(true, vehicle.NetworkId != oldNetworkId);
    Equal("ragemp:entity:create", runtime.BroadcastEvents[4].EventName);
    Equal("ragemp:entity:netid", runtime.BroadcastEvents[5].EventName);
    Equal("ragemp:vehicle:batch", runtime.BroadcastEvents[6].EventName);
    Equal(2, runtime.ClientEvents.Count);
    Equal(vehicle.NetworkId, runtime.ClientEvents[0].Arguments[0]);
    runtime.ClientEvents.Clear();
    NAPI.Player.SetPlayerIntoVehicle(NewPlayer(28), vehicle.Handle, 1);
    Equal("ragemp:putIntoVehicle", runtime.ClientEvents.Single().EventName);
    Equal(vehicle.NetworkId, runtime.ClientEvents.Single().Arguments[0]);
    vehicle.Delete();
    Equal("ragemp:entity:destroy", runtime.BroadcastEvents[7].EventName);
    Equal(0, vehicle.NetworkId);
    Equal(false, RAGE.Entities.Vehicles.All.Contains(vehicle));

    runtime.ClientEvents.Clear();
    var ped = NAPI.Ped.CreatePed(123u, new Vector3(), 0f, dynamic: true, invincible: true, frozen: true, controlLocked: true);
    Equal(true, ped.Dynamic);
    Equal(true, ped.Invincible);
    Equal(true, ped.Frozen);
    Equal(true, ped.ControlLocked);
    var controller = NewPlayer(29);
    ped.Controller = controller;
    Equal("ragemp:requestEntityControl", runtime.ClientEvents.Single().EventName);
    Equal(ped.NetworkId, runtime.ClientEvents.Single().Arguments[0]);
    ped.Delete();
    return Task.CompletedTask;
}

static Player NewPlayer(ushort id) => new Player(new NetHandle(id, EntityType.Player));
static Vector3 Vector3Zero() => new Vector3(0, 0, 0);
static void Equal<T>(T expected, T actual)
{
    if (!EqualityComparer<T>.Default.Equals(expected, actual))
        throw new InvalidOperationException($"Expected {expected}, received {actual}");
}

sealed class ExampleScript : Script
{
    public static ushort StaticPlayerId { get; set; }
    public string? LoginResult { get; private set; }
    public bool Started { get; private set; }
    public string? CommandResult { get; private set; }

    [RemoteEvent("auth.login")]
    private void Login(Player player, string login, int age) => LoginResult = $"{login}:{age}:{player.Id}";

    [ServerEvent(Event.ResourceStart)]
    private void Start() => Started = true;

    [RemoteEvent("anticheat.hitBox")]
    private static void StaticRemote(Player player) => StaticPlayerId = player.Id;

    [Command("teleport")]
    private void Teleport(Player player, int id, float distance = 1) => CommandResult = $"{player.Id}:{id}:{distance}";

    [Command("announce", GreedyArg = true)]
    private void Announce(Player player, string text) => CommandResult = $"{player.Id}:{text}";
}

sealed class FakeRuntime : IBridgeRuntime
{
    public List<(Player Player, string EventName, object[] Arguments)> ClientEvents { get; } = new();
    public List<(Entity Entity, string Key, object? Value)> SharedData { get; } = new();
    public List<(Entity Entity, string Key)> ResetSharedDataKeys { get; } = new();
    public List<(string EventName, object[] Arguments)> BroadcastEvents { get; } = new();
    public List<Entity> CreatedEntities { get; } = new();
    public List<Entity> DeletedEntities { get; } = new();
    public void Schedule(Action action, long delayMilliseconds = 0) => action();
    public void TriggerClientEvent(Player player, string eventName, object[] arguments) => ClientEvents.Add((player, eventName, arguments));
    public void TriggerClientEventForAll(string eventName, object[] arguments) => BroadcastEvents.Add((eventName, arguments));
    public Task<object?> TriggerClientProcedure(Player player, string procedureName, object[] arguments) => Task.FromResult<object?>(null);
    public void SetSharedData(Entity entity, string key, object? value) => SharedData.Add((entity, key, value));
    public void ResetSharedData(Entity entity, string key) => ResetSharedDataKeys.Add((entity, key));
    public void SendChatMessage(Player player, string message) { }
    public void Kick(Player player, string reason) { }
    public NetworkEntityReference CreateNetworkEntity(Entity entity)
    {
        CreatedEntities.Add(entity);
        var generation = (CreatedEntities.Count - 1) * 1000;
        return new NetworkEntityReference { Handle = entity.Id + generation, NetworkId = entity.Id + generation + 1000 };
    }
    public void UpdateNetworkEntity(Entity entity) { }
    public void DeleteNetworkEntity(Entity entity) => DeletedEntities.Add(entity);
    public void SetPlayerDimension(Player player, uint dimension) { }
}

sealed class DuplicateScript : Script
{
    public static int CallCount { get; set; }
    [RemoteEvent("shared.action")]
    private void Handle(Player player, int value) => CallCount += value;
}

sealed class DuplicateScriptTwo : Script
{
    [RemoteEvent("shared.action")]
    private void Handle(Player player, int value) => DuplicateScript.CallCount += value;
}

sealed class ThrowingRemoteScript : Script
{
    [RemoteEvent("isolated.remote")]
    private void Handle(Player player, int value) => throw new InvalidOperationException("expected test failure");
}

sealed class FollowingRemoteScript : Script
{
    public static int CallCount { get; set; }
    [RemoteEvent("isolated.remote")]
    private void Handle(Player player, int value) => CallCount += value;
}

sealed class ThrowingServerScript : Script
{
    [ServerEvent(Event.ResourceStart)]
    private void Start() => throw new InvalidOperationException("expected test failure");
}

sealed class FollowingServerScript : Script
{
    public static int CallCount { get; set; }
    [ServerEvent(Event.ResourceStart)]
    private void Start() => CallCount++;
}

sealed class EntityRefScript : Script
{
    public Vehicle? Vehicle { get; private set; }
    [RemoteEvent("vehicle.select")]
    private void Select(Player player, Vehicle vehicle) => Vehicle = vehicle;
}

sealed class VariadicScript : Script
{
    public int Count { get; private set; }
    [RemoteEvent("variadic")]
    private void Handle(Player player, params object[] args) => Count = args.Length;
}

sealed class OptionalRemoteScript : Script
{
    [RemoteEvent("optional")]
    private void Handle(Player player, string name, int amount = 7, string payment = "cash") { }
}
