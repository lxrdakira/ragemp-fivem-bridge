using System;
using CitizenFX.Core;
using GTANetworkAPI;
using RageMP.FiveM.Bridge;
using CfxEntity = CitizenFX.Core.Entity;
using CfxPlayer = CitizenFX.Core.Player;
using RageEntity = GTANetworkAPI.Entity;
using RagePlayer = GTANetworkAPI.Player;

namespace RageMP.FiveM.Bridge.Host
{
    internal sealed class CitizenFxRuntime : IBridgeRuntime
    {
        private readonly FiveMBridgeScript _owner;
        public CitizenFxRuntime(FiveMBridgeScript owner) => _owner = owner;

        public void Schedule(Action action, long delayMilliseconds = 0) => _ = _owner.Schedule(action, delayMilliseconds);

        public void TriggerClientEvent(RagePlayer player, string eventName, object[] arguments)
        {
            var target = RequirePlayer(player);
            BaseScript.TriggerClientEvent(target, eventName, arguments);
        }

        public void TriggerClientEventForAll(string eventName, object[] arguments) =>
            BaseScript.TriggerClientEvent(eventName, arguments);

        public void SetSharedData(RageEntity entity, string key, object? value)
        {
            if (entity is RagePlayer player)
            {
                RequirePlayer(player).State.Set(key, value, true);
                return;
            }
            var target = CfxEntity.FromNetworkId(entity.Value);
            target?.State.Set(key, value, true);
        }

        public void ResetSharedData(RageEntity entity, string key) => SetSharedData(entity, key, null);

        public void SendChatMessage(RagePlayer player, string message)
        {
            var target = RequirePlayer(player);
            BaseScript.TriggerClientEvent(target, "chat:addMessage", new { args = new[] { message } });
        }

        public void Kick(RagePlayer player, string reason) => RequirePlayer(player).Drop(reason);

        private CfxPlayer RequirePlayer(RagePlayer player) =>
            _owner.FindCitizenPlayer(player.Id) ?? throw new InvalidOperationException("FiveM player is no longer connected: " + player.Id);
    }
}
