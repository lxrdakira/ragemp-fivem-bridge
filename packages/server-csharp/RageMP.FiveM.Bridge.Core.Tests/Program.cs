using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GTANetworkAPI;
using RageMP.FiveM.Bridge;

var tests = new (string Name, Func<Task> Run)[]
{
    ("Vector3 contract", TestVector),
    ("Entity data contract", TestEntityData),
    ("Remote event dispatch", TestRemoteEvent),
    ("Static remote event dispatch", TestStaticRemoteEvent),
    ("Server event dispatch", TestServerEvent),
    ("NAPI client event runtime", TestRuntime)
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
    Equal(3u, player.GetSharedData<uint>("dimension"));
    Equal("dimension", runtime.SharedData[0].Key);
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

static async Task TestStaticRemoteEvent()
{
    ExampleScript.StaticPlayerId = 0;
    var dispatcher = new EventDispatcher();
    dispatcher.Register(new ExampleScript());
    await dispatcher.DispatchRemoteAsync("anticheat.hitBox", NewPlayer(33));
    Equal((ushort)33, ExampleScript.StaticPlayerId);
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

    [RemoteEvent("auth.login")]
    private void Login(Player player, string login, int age) => LoginResult = $"{login}:{age}:{player.Id}";

    [ServerEvent(Event.ResourceStart)]
    private void Start() => Started = true;

    [RemoteEvent("anticheat.hitBox")]
    private static void StaticRemote(Player player) => StaticPlayerId = player.Id;
}

sealed class FakeRuntime : IBridgeRuntime
{
    public List<(Player Player, string EventName, object[] Arguments)> ClientEvents { get; } = new();
    public List<(Entity Entity, string Key, object? Value)> SharedData { get; } = new();
    public void Schedule(Action action, long delayMilliseconds = 0) => action();
    public void TriggerClientEvent(Player player, string eventName, object[] arguments) => ClientEvents.Add((player, eventName, arguments));
    public void TriggerClientEventForAll(string eventName, object[] arguments) { }
    public void SetSharedData(Entity entity, string key, object? value) => SharedData.Add((entity, key, value));
    public void ResetSharedData(Entity entity, string key) { }
    public void SendChatMessage(Player player, string message) { }
    public void Kick(Player player, string reason) { }
}
