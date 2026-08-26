using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using RageMP.FiveM.Bridge;

namespace GTANetworkAPI
{
    public static class NAPI
    {
        public static uint GlobalDimension { get; set; }
        public static TaskMethods Task { get; } = new TaskMethods();
        public static ClientEventMethods ClientEvent { get; } = new ClientEventMethods();
        public static UtilMethods Util { get; } = new UtilMethods();
        public static WorldMethods World { get; } = new WorldMethods();
        public static PlayerMethods Player { get; } = new PlayerMethods();
        public static EntityMethods Entity { get; } = new EntityMethods();
        public static ChatMethods Chat { get; } = new ChatMethods();
        public static MarkerMethods Marker { get; } = new MarkerMethods();
        public static TextLabelMethods TextLabel { get; } = new TextLabelMethods();
        public static PoolMethods Pools { get; } = new PoolMethods();
        public static VehicleMethods Vehicle { get; } = new VehicleMethods();
        public static ObjectMethods Object { get; } = new ObjectMethods();
        public static BlipMethods Blip { get; } = new BlipMethods();
        public static ColShapeMethods ColShape { get; } = new ColShapeMethods();
        public static PedMethods Ped { get; } = new PedMethods();
        public static ServerMethods Server { get; } = new ServerMethods();
        public static DataMethods Data { get; } = new DataMethods();
        public static NotificationMethods Notification { get; } = new NotificationMethods();
    }

    public sealed class TaskMethods
    {
        public void Run(Action action, long delayTime = 0) => BridgeRuntime.Current.Schedule(action, delayTime);
        public Task<object?> WaitForMainThread(long delay = 0)
        {
            var completion = new TaskCompletionSource<object?>();
            BridgeRuntime.Current.Schedule(() => completion.SetResult(null), delay);
            return completion.Task;
        }
    }

    public sealed class ClientEventMethods
    {
        public void TriggerClientEvent(Player player, string eventName, params object[] arguments) =>
            BridgeRuntime.Current.TriggerClientEvent(player, eventName, arguments);
        public void TriggerClientEventForAll(string eventName, params object[] arguments) =>
            BridgeRuntime.Current.TriggerClientEventForAll(eventName, arguments);
        public void TriggerClientEventToPlayers(Player[] players, string eventName, params object[] arguments)
        {
            foreach (var player in players) TriggerClientEvent(player, eventName, arguments);
        }
        public void TriggerClientEventInRange(Vector3 position, float range, string eventName, params object[] arguments)
        {
            foreach (var player in RAGE.Entities.Players.All)
                if (player.Position.DistanceTo(position) <= range) TriggerClientEvent(player, eventName, arguments);
        }
        public void TriggerClientEventInDimension(uint dimension, string eventName, params object[] arguments)
        {
            foreach (var player in RAGE.Entities.Players.All)
                if (player.Dimension == dimension) TriggerClientEvent(player, eventName, arguments);
        }
    }

    public sealed class UtilMethods
    {
        public object? FromJson(string json) => JsonConvert.DeserializeObject(json);
        public T? FromJson<T>(string json) => JsonConvert.DeserializeObject<T>(json);
        public T? FromJson<T>(object value) => JsonConvert.DeserializeObject<T>(JsonConvert.SerializeObject(value));
        public string ToJson(object value) => JsonConvert.SerializeObject(value);
        public uint GetHashKey(string value)
        {
            uint hash = 0;
            foreach (var character in value.ToLowerInvariant())
            {
                hash += character;
                hash += hash << 10;
                hash ^= hash >> 6;
            }
            hash += hash << 3;
            hash ^= hash >> 11;
            hash += hash << 15;
            return hash;
        }
        public VehicleHash VehicleNameToModel(string value) => (VehicleHash)GetHashKey(value);
        public PedHash PedNameToModel(string value) => (PedHash)GetHashKey(value);
        public string GetHashSha256(string value)
        {
            using (var sha = SHA256.Create())
            {
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(value));
                var builder = new StringBuilder(bytes.Length * 2);
                foreach (var item in bytes) builder.Append(item.ToString("x2"));
                return builder.ToString();
            }
        }
        public void ConsoleOutput(string message) => Console.WriteLine(message);
        public void ConsoleOutput(string format, params object[] arguments) => Console.WriteLine(format, arguments);
    }
}
