using System;
using System.Threading.Tasks;
using GTANetworkAPI;

namespace RageMP.FiveM.Bridge
{
    public interface IBridgeRuntime
    {
        void Schedule(Action action, long delayMilliseconds = 0);
        void TriggerClientEvent(Player player, string eventName, object[] arguments);
        void TriggerClientEventForAll(string eventName, object[] arguments);
        Task<object?> TriggerClientProcedure(Player player, string procedureName, object[] arguments);
        void SetSharedData(Entity entity, string key, object? value);
        void ResetSharedData(Entity entity, string key);
        void SendChatMessage(Player player, string message);
        void Kick(Player player, string reason);
        NetworkEntityReference CreateNetworkEntity(Entity entity);
        int ResolveNetworkEntityHandle(int networkId);
        void UpdateNetworkEntity(Entity entity);
        void DeleteNetworkEntity(Entity entity);
        void SetPlayerDimension(Player player, uint dimension);
    }

    public static class BridgeRuntime
    {
        private static IBridgeRuntime _current = new NullBridgeRuntime();
        public static IBridgeRuntime Current => _current;

        public static void Configure(IBridgeRuntime runtime)
        {
            _current = runtime ?? throw new ArgumentNullException(nameof(runtime));
        }

        private sealed class NullBridgeRuntime : IBridgeRuntime
        {
            public void Schedule(Action action, long delayMilliseconds = 0) => action();
            public void TriggerClientEvent(Player player, string eventName, object[] arguments) => NotConfigured();
            public void TriggerClientEventForAll(string eventName, object[] arguments) => NotConfigured();
            public Task<object?> TriggerClientProcedure(Player player, string procedureName, object[] arguments)
            {
                NotConfigured();
                return Task.FromResult<object?>(null);
            }
            public void SetSharedData(Entity entity, string key, object? value) { }
            public void ResetSharedData(Entity entity, string key) { }
            public void SendChatMessage(Player player, string message) => NotConfigured();
            public void Kick(Player player, string reason) => NotConfigured();
            public NetworkEntityReference CreateNetworkEntity(Entity entity) { NotConfigured(); return new NetworkEntityReference(); }
            public int ResolveNetworkEntityHandle(int networkId) => 0;
            public void UpdateNetworkEntity(Entity entity) => NotConfigured();
            public void DeleteNetworkEntity(Entity entity) => NotConfigured();
            public void SetPlayerDimension(Player player, uint dimension) => NotConfigured();
            private static void NotConfigured() => throw new InvalidOperationException("FiveM bridge runtime is not configured");
        }
    }

    public sealed class NetworkEntityReference
    {
        public int Handle { get; set; }
        public int NetworkId { get; set; }
    }
}
