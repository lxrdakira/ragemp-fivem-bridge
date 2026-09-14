using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GTANetworkAPI;
using Newtonsoft.Json;
using RageMP.FiveM.Bridge;

var tests = new (string Name, Func<Task> Run)[]
{
    ("Vector3 contract", TestVector),
    ("Entity data contract", TestEntityData),
    ("Remote event dispatch", TestRemoteEvent),
    ("Remote event return value", TestRemoteEventReturnValue),
    ("Static remote event dispatch", TestStaticRemoteEvent),
    ("Duplicate remote event dispatch", TestDuplicateRemoteEvent),
    ("Ordered async remote event dispatch", TestOrderedAsyncRemoteEvent),
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
    ("Bare entity id argument dispatch", TestBareEntityIdDispatch),
    ("Variadic remote event dispatch", TestVariadicRemoteEvent),
    ("Optional remote event contract", TestOptionalRemoteContract),
    ("Broadcast entity synchronization", TestEntityNetworkSync),
    ("Native entity synchronization", TestNativeEntitySync),
    ("Native entity shared data synchronization", TestNativeEntitySharedDataSync),
    ("Native entity creation failure", TestNativeEntityCreationFailure),
    ("Native ped creation retry", TestNativePedCreationRetry),
    ("Native entity bootstrap snapshot", TestNativeEntityBootstrapSnapshot),
    ("Native entity resolver", TestNativeEntityResolver),
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
    var json = JsonConvert.SerializeObject(vector);
    Equal(false, json.Contains("Normalized"));
    Equal(vector, JsonConvert.DeserializeObject<Vector3>(json));
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

static async Task TestRemoteEventReturnValue()
{
    var dispatcher = new EventDispatcher();
    dispatcher.Register(new ReturningRemoteScript());
    Equal("sync:4", await dispatcher.DispatchRemoteAsync("return.sync", NewPlayer(12), 4));
    Equal("async:5", await dispatcher.DispatchRemoteAsync("return.async", NewPlayer(12), 5));
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

static async Task TestOrderedAsyncRemoteEvent()
{
    OrderedAsyncScript.Sequence.Clear();
    var dispatcher = new EventDispatcher();
    dispatcher.Register(new OrderedAsyncScript());
    dispatcher.Register(new OrderedFollowingScript());

    await dispatcher.DispatchRemoteAsync("ordered.signin", NewPlayer(36));

    Equal("identity,legacy", string.Join(',', OrderedAsyncScript.Sequence));
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
    player.Name = "John_Doe";
    Equal("John_Doe", player.Name);
    Equal("__bridgeName", runtime.SharedData.Single().Key);
    Equal("John_Doe", runtime.SharedData.Single().Value);
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
    runtime.ClientEvents.Clear();
    NAPI.Player.SpawnPlayer(player, new Vector3(12, 13, 14), 180f);
    Equal(new Vector3(12, 13, 14), player.Position);
    Equal(180f, player.Rotation.Z);
    Equal("ragemp:spawnmanager:spawn", runtime.ClientEvents.Single().EventName);
    return Task.CompletedTask;
}

static Task TestNetworkArguments()
{
    BridgeRuntime.Configure(new FakeRuntime());
    var player = NewPlayer(25);
    var vehicle = NAPI.Vehicle.CreateVehicle(123u, new Vector3(), 0f, 0, 0);
    var output = NetArgumentSerializer.Sanitize(new object[]
    {
        player,
        new object[] { vehicle },
        new Vector3(12.5f, -3f, 44f),
        new Color(10, 20, 30, 40)
    });
    var playerRef = (Dictionary<string, object>)output[0];
    var nested = (List<object?>)output[1];
    var vehicleRef = (Dictionary<string, object>)nested[0]!;
    var vector = (Dictionary<string, object>)output[2];
    var color = (Dictionary<string, object>)output[3];
    Equal("player", playerRef["__mpRef"]);
    Equal((ushort)25, playerRef["id"]);
    Equal(vehicle.NetworkId, vehicleRef["netId"]);
    Equal(12.5f, vector["X"]);
    Equal(-3f, vector["Y"]);
    Equal(44f, vector["Z"]);
    Equal(false, vector.ContainsKey("Normalized"));
    Equal(10, color["Red"]);
    Equal(40, color["Alpha"]);
    vehicle.Delete();
    return Task.CompletedTask;
}

static async Task TestNetworkEntityDispatch()
{
    var runtime = new FakeRuntime();
    BridgeRuntime.Configure(runtime);
    var vehicle = NAPI.Vehicle.CreateVehicle(124u, new Vector3(), 0f, 0, 0);
    var clientNetworkId = vehicle.NetworkId + 50000;
    runtime.NetworkHandles[clientNetworkId] = vehicle.NativeHandle;
    var script = new EntityRefScript();
    var dispatcher = new EventDispatcher();
    dispatcher.Register(script);
    await dispatcher.DispatchRemoteAsync(
        "vehicle.select",
        NewPlayer(26),
        new Dictionary<string, object> { ["__mpRef"] = "vehicle", ["id"] = ushort.MaxValue, ["netId"] = clientNetworkId });
    Equal(vehicle, script.Vehicle);
    Equal(clientNetworkId, vehicle.NetworkId);
    vehicle.Delete();
}

static async Task TestBareEntityIdDispatch()
{
    BridgeRuntime.Configure(new FakeRuntime());
    var vehicle = NAPI.Vehicle.CreateVehicle(125u, new Vector3(), 0f, 0, 0);
    var script = new EntityRefScript();
    var dispatcher = new EventDispatcher();
    dispatcher.Register(script);
    await dispatcher.DispatchRemoteAsync(
        "vehicle.select",
        NewPlayer(26),
        new Dictionary<string, object> { ["id"] = (int)vehicle.Id });
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
    var label = NAPI.TextLabel.CreateTextLabel("Bridge", new Vector3(1, 2, 3), 50f, 0.8f, 4, new Color(10, 20, 30, 40));
    Equal("ragemp:labelCreate", runtime.BroadcastEvents[3].EventName);
    var labelPayload = (Dictionary<string, object>)runtime.BroadcastEvents[3].Arguments[0];
    Equal(0.8f, labelPayload["size"]);
    Equal(true, labelPayload["los"]);
    label.Delete();
    var tube = NAPI.ColShape.CreateCylinderColShape(new Vector3(5, 6, 10), 2f, 4f);
    Equal(true, tube.IsPointWithin(new Vector3(5, 6, 10)));
    Equal(true, tube.IsPointWithin(new Vector3(5, 6, 14)));
    Equal(true, tube.IsPointWithin(new Vector3(5, 6, 9.9f)));
    Equal(false, tube.IsPointWithin(new Vector3(5, 6, 8.7f)));
    tube.Delete();
    var blip = NAPI.Blip.CreateBlip(7, new Vector3(8, 9, 10), 1.25f, 4, "Range", 180, 75f, true, 45, 12);
    Equal("ragemp:blipCreate", runtime.BroadcastEvents.Last().EventName);
    var blipPayload = (Dictionary<string, object>)runtime.BroadcastEvents.Last().Arguments[0];
    Equal(75f, blipPayload["drawDistance"]);
    Equal((short)45, blipPayload["rotation"]);
    Equal((uint)12, blipPayload["dimension"]);
    blip.Delete();
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
    Equal(vehicle.NetworkId, runtime.BroadcastEvents[0].Arguments[8]);
    Equal("ragemp:entity:netid", runtime.BroadcastEvents[1].EventName);
    Equal("ragemp:vehicle:batch", runtime.BroadcastEvents[2].EventName);
    Equal(vehicle.Id, runtime.BroadcastEvents[2].Arguments[2]);
    vehicle.Health = 650f;
    Equal("ragemp:vehicle:batch", runtime.BroadcastEvents[3].EventName);
    Equal(650f, vehicle.BodyHealth);
    Equal(650f, vehicle.EngineHealth);
    vehicle.NumberPlate = "UPDATED";
    Equal("ragemp:entity:create", runtime.BroadcastEvents[4].EventName);
    Equal("UPDATED", runtime.BroadcastEvents[4].Arguments[7]);
    Equal(vehicle.NetworkId, runtime.BroadcastEvents[4].Arguments[8]);
    Equal("ragemp:vehicle:batch", runtime.BroadcastEvents[5].EventName);
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
    Equal("ragemp:entity:create", runtime.BroadcastEvents[6].EventName);
    Equal(vehicle.NetworkId, runtime.BroadcastEvents[6].Arguments[8]);
    Equal("ragemp:entity:netid", runtime.BroadcastEvents[7].EventName);
    Equal("ragemp:vehicle:batch", runtime.BroadcastEvents[8].EventName);
    Equal(vehicle.Id, runtime.BroadcastEvents[8].Arguments[2]);
    Equal(2, runtime.ClientEvents.Count);
    Equal(vehicle.NetworkId, runtime.ClientEvents[0].Arguments[0]);
    runtime.ClientEvents.Clear();
    NAPI.Player.SetPlayerIntoVehicle(NewPlayer(28), vehicle.Handle, 1);
    Equal("ragemp:putIntoVehicle", runtime.ClientEvents.Single().EventName);
    Equal(vehicle.NetworkId, runtime.ClientEvents.Single().Arguments[0]);
    vehicle.Delete();
    Equal("ragemp:entity:destroy", runtime.BroadcastEvents[9].EventName);
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

static Task TestNativeEntitySharedDataSync()
{
    var runtime = new FakeRuntime();
    BridgeRuntime.Configure(runtime);
    var vehicle = NAPI.Vehicle.CreateVehicle(988u, new Vector3(), 0f, 0, 0, "SHARED");
    runtime.BroadcastEvents.Clear();

    vehicle.SetSharedData("PETROL", 80);
    var update = runtime.BroadcastEvents.Single(e => e.EventName == "ragemp:entity:sharedData");
    Equal("vehicle", update.Arguments[0]);
    Equal(vehicle.Id, update.Arguments[1]);
    Equal("PETROL", update.Arguments[2]);
    Equal(80, update.Arguments[3]);

    vehicle.Delete();
    return Task.CompletedTask;
}

static Task TestNativeEntityCreationFailure()
{
    var runtime = new FakeRuntime { FailEntityCreation = true };
    BridgeRuntime.Configure(runtime);

    var vehicle = NAPI.Vehicle.CreateVehicle(987u, new Vector3(1, 2, 3), 45f, 1, 2, "FAIL");

    Equal(false, vehicle.Exists);
    Equal(0, vehicle.NativeHandle);
    Equal(0, vehicle.NetworkId);
    Equal(false, RAGE.Entities.Vehicles.All.Contains(vehicle));
    Equal(0, runtime.BroadcastEvents.Count);
    return Task.CompletedTask;
}

static Task TestNativePedCreationRetry()
{
    var runtime = new FakeRuntime { FailEntityCreation = true };
    BridgeRuntime.Configure(runtime);

    var ped = NAPI.Ped.CreatePed(988u, new Vector3(10, 20, 30), 90f, frozen: true);

    Equal(true, ped.Exists);
    Equal(0, ped.NativeHandle);
    Equal(0, ped.NetworkId);
    Equal(true, RAGE.Entities.Peds.All.Contains(ped));
    Equal(4, runtime.CreatedEntities.Count(entity => entity == ped));
    Equal(1, runtime.BroadcastEvents.Count(e => e.EventName == "ragemp:entity:create"));
    Equal(1, runtime.BroadcastEvents.Count(e => e.EventName == "ragemp:ped:localCreate"));
    Equal(1, runtime.BroadcastEvents.Count(e => e.EventName == "ragemp:ped:batch"));

    ped.Delete();
    Equal(false, RAGE.Entities.Peds.All.Contains(ped));
    return Task.CompletedTask;
}

static Task TestNativeEntityBootstrapSnapshot()
{
    var runtime = new FakeRuntime();
    BridgeRuntime.Configure(runtime);
    var vehicle = NAPI.Vehicle.CreateVehicle(321u, new Vector3(4, 5, 6), 45f, 3, 4, "SNAP");
    var target = NewPlayer(30);
    runtime.ClientEvents.Clear();
    runtime.BroadcastEvents.Clear();

    EntityNetworkSync.SendAll(target);

    var snapshot = runtime.ClientEvents.FirstOrDefault(e => e.EventName == "ragemp:entity:snapshot");
    Equal("ragemp:entity:snapshot", snapshot.EventName);
    var chunk = (object[])snapshot.Arguments[0];
    var entry = (object[])chunk.Single(item => ((object[])item)[0]?.ToString() == "vehicle");
    Equal("vehicle", entry[0]);
    Equal(vehicle.Id, entry[1]);
    Equal(vehicle.NetworkId, entry[7]);
    var snapshotIndex = runtime.ClientEvents.FindIndex(e => e.EventName == "ragemp:entity:snapshot");
    var stateIndex = runtime.ClientEvents.FindIndex(e => e.EventName == "ragemp:vehicle:batch");
    Equal(true, snapshotIndex >= 0 && stateIndex > snapshotIndex);

    vehicle.Delete();
    return Task.CompletedTask;
}

static Task TestNativeEntityResolver()
{
    var runtime = new FakeRuntime();
    BridgeRuntime.Configure(runtime);
    var vehicle = NAPI.Vehicle.CreateVehicle(322u, new Vector3(), 0f, 0, 0);
    var target = NewPlayer(31);
    runtime.ClientEvents.Clear();

    Equal(true, EntityNetworkSync.SendNativeReferenceByNetworkId(target, "vehicle", vehicle.NetworkId));
    Equal("ragemp:entity:create", runtime.ClientEvents[0].EventName);
    Equal(vehicle.Id, runtime.ClientEvents[0].Arguments[1]);
    Equal(vehicle.NetworkId, runtime.ClientEvents[0].Arguments[8]);
    Equal("ragemp:entity:netid", runtime.ClientEvents[1].EventName);
    Equal(vehicle.NetworkId, runtime.ClientEvents[1].Arguments[2]);
    runtime.ClientEvents.Clear();
    var remappedNetworkId = vehicle.NetworkId + 40000;
    runtime.NetworkHandles[remappedNetworkId] = vehicle.NativeHandle;
    Equal(true, EntityNetworkSync.SendNativeReferenceByNetworkId(target, "vehicle", remappedNetworkId));
    Equal(remappedNetworkId, vehicle.NetworkId);
    Equal(remappedNetworkId, runtime.ClientEvents[1].Arguments[2]);
    runtime.ClientEvents.Clear();
    Equal(false, EntityNetworkSync.SendNativeReferenceByNetworkId(target, "vehicle", remappedNetworkId + 99999));
    Equal(0, runtime.ClientEvents.Count);

    vehicle.Delete();
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
    public bool FailEntityCreation { get; set; }
    public List<(Player Player, string EventName, object[] Arguments)> ClientEvents { get; } = new();
    public List<(Entity Entity, string Key, object? Value)> SharedData { get; } = new();
    public List<(Entity Entity, string Key)> ResetSharedDataKeys { get; } = new();
    public List<(string EventName, object[] Arguments)> BroadcastEvents { get; } = new();
    public List<Entity> CreatedEntities { get; } = new();
    public List<Entity> DeletedEntities { get; } = new();
    public Dictionary<int, int> NetworkHandles { get; } = new();
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
        if (FailEntityCreation) return new NetworkEntityReference();
        var generation = (CreatedEntities.Count - 1) * 1000;
        return new NetworkEntityReference { Handle = entity.Id + generation, NetworkId = entity.Id + generation + 1000 };
    }
    public int ResolveNetworkEntityHandle(int networkId) => NetworkHandles.TryGetValue(networkId, out var handle) ? handle : 0;
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

sealed class ReturningRemoteScript : Script
{
    [RemoteEvent("return.sync")]
    private object HandleSync(Player player, int value) => $"sync:{value}";

    [RemoteEvent("return.async")]
    private async Task<object> HandleAsync(Player player, int value)
    {
        await Task.Yield();
        return $"async:{value}";
    }
}

sealed class DuplicateScriptTwo : Script
{
    [RemoteEvent("shared.action")]
    private void Handle(Player player, int value) => DuplicateScript.CallCount += value;
}

sealed class OrderedAsyncScript : Script
{
    public static List<string> Sequence { get; } = new();

    [RemoteEvent("ordered.signin")]
    private async Task Handle(Player player)
    {
        await Task.Yield();
        Sequence.Add("identity");
    }
}

sealed class OrderedFollowingScript : Script
{
    [RemoteEvent("ordered.signin")]
    private void Handle(Player player) => OrderedAsyncScript.Sequence.Add("legacy");
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
