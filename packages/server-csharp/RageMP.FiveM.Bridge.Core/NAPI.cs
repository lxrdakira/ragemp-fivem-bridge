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
    }

    public sealed class TaskMethods
    {
        public void Run(Action action, long delay = 0) => BridgeRuntime.Current.Schedule(action, delay);
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
