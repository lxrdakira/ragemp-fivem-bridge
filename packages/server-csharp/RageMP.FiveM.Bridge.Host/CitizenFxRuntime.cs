using System;
using System.Threading.Tasks;
using CitizenFX.Core;
using GTANetworkAPI;
using RageMP.FiveM.Bridge;
using CfxEntity = CitizenFX.Core.Entity;
using CfxPlayer = CitizenFX.Core.Player;
using RageEntity = GTANetworkAPI.Entity;
using RagePlayer = GTANetworkAPI.Player;
using API = CitizenFX.Core.Native.API;

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
            BaseScript.TriggerClientEvent(target, eventName, NetArgumentSerializer.Sanitize(arguments));
        }

        public void TriggerClientEventForAll(string eventName, object[] arguments) =>
            BaseScript.TriggerClientEvent(eventName, NetArgumentSerializer.Sanitize(arguments));

        public Task<object?> TriggerClientProcedure(RagePlayer player, string procedureName, object[] arguments) =>
            _owner.CallClientProcedure(RequirePlayer(player), procedureName, NetArgumentSerializer.Sanitize(arguments));

        public void SetSharedData(RageEntity entity, string key, object? value)
        {
            if (entity is RagePlayer player)
            {
                RequirePlayer(player).State.Set(key, value, true);
                return;
            }
            var target = CfxEntity.FromNetworkId(entity.NetworkId != 0 ? entity.NetworkId : entity.Value);
            target?.State.Set(key, value, true);
        }

        public void ResetSharedData(RageEntity entity, string key) => SetSharedData(entity, key, null);

        public void SendChatMessage(RagePlayer player, string message)
        {
            var target = RequirePlayer(player);
            BaseScript.TriggerClientEvent(target, "chat:addMessage", new { args = new[] { message } });
        }

        public void Kick(RagePlayer player, string reason) => RequirePlayer(player).Drop(reason);

        public NetworkEntityReference CreateNetworkEntity(RageEntity entity)
        {
            var position = entity.Position;
            var handle = 0;
            if (entity is GTANetworkAPI.Vehicle vehicle)
                handle = API.CreateVehicle(vehicle.Model, position.X, position.Y, position.Z, vehicle.Heading, true, true);
            else if (entity is GTANetworkAPI.Object)
                handle = API.CreateObjectNoOffset(entity.Model, position.X, position.Y, position.Z, true, true, false);
            else if (entity is GTANetworkAPI.Ped)
                handle = API.CreatePed(4, entity.Model, position.X, position.Y, position.Z, entity.Heading, true, true);

            if (handle == 0) return new NetworkEntityReference();
            API.SetEntityRoutingBucket(handle, unchecked((int)entity.Dimension));
            ApplyEntityState(handle, entity);
            return new NetworkEntityReference { Handle = handle, NetworkId = API.NetworkGetNetworkIdFromEntity(handle) };
        }

        public void UpdateNetworkEntity(RageEntity entity)
        {
            var handle = entity.NativeHandle;
            if (handle == 0 || !API.DoesEntityExist(handle)) return;
            ApplyEntityState(handle, entity);
        }

        private static void ApplyEntityState(int handle, RageEntity entity)
        {
            var position = entity.Position;
            API.SetEntityCoords(handle, position.X, position.Y, position.Z, false, false, false, false);
            API.SetEntityRotation(handle, entity.Rotation.X, entity.Rotation.Y, entity.Rotation.Z, 2, true);
            API.SetEntityRoutingBucket(handle, unchecked((int)entity.Dimension));
            if (entity is GTANetworkAPI.Vehicle vehicle)
            {
                API.SetVehicleColours(handle, vehicle.PrimaryColor, vehicle.SecondaryColor);
                API.SetVehicleNumberPlateText(handle, vehicle.NumberPlate ?? string.Empty);
                API.SetVehicleDoorsLocked(handle, vehicle.Locked ? 2 : 1);
            }
        }

        public void DeleteNetworkEntity(RageEntity entity)
        {
            if (entity.NativeHandle != 0 && API.DoesEntityExist(entity.NativeHandle)) API.DeleteEntity(entity.NativeHandle);
        }

        public void SetPlayerDimension(RagePlayer player, uint dimension) =>
            API.SetPlayerRoutingBucket(RequirePlayer(player).Handle, unchecked((int)dimension));

        private CfxPlayer RequirePlayer(RagePlayer player) =>
            _owner.FindCitizenPlayer(player.Id) ?? throw new InvalidOperationException("FiveM player is no longer connected: " + player.Id);
    }
}
