using System;
using GTANetworkAPI;

namespace RageMP.FiveM.Bridge
{
    public interface IBridgeRuntime
    {
        void Schedule(Action action, long delayMilliseconds = 0);
        void TriggerClientEvent(Player player, string eventName, object[] arguments);
        void TriggerClientEventForAll(string eventName, object[] arguments);
        void SetSharedData(Entity entity, string key, object? value);
        void ResetSharedData(Entity entity, string key);
        void SendChatMessage(Player player, string message);
        void Kick(Player player, string reason);
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
            public void SetSharedData(Entity entity, string key, object? value) { }
            public void ResetSharedData(Entity entity, string key) { }
            public void SendChatMessage(Player player, string message) => NotConfigured();
            public void Kick(Player player, string reason) => NotConfigured();
            private static void NotConfigured() => throw new InvalidOperationException("FiveM bridge runtime is not configured");
        }
    }
}
