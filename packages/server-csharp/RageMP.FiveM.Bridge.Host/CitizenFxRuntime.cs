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
        internal const float RageGroundZCompensation = 1.12f;
        private const string SharedDataPrefix = "rmp:";
        private const string RemoteIdStateKey = SharedDataPrefix + "__bridgeRemoteId";
        private readonly FiveMBridgeScript _owner;
        public CitizenFxRuntime(FiveMBridgeScript owner) => _owner = owner;

        public void Schedule(Action action, long delayMilliseconds = 0) => _ = _owner.Schedule(action, delayMilliseconds);

        public void TriggerClientEvent(RagePlayer player, string eventName, object[] arguments)
        {
            var target = RequirePlayer(player);
            _owner.TriggerClientEventWhenReady(target, eventName, NetArgumentSerializer.Sanitize(arguments));
        }

        public void TriggerClientEventForAll(string eventName, object[] arguments) =>
            _owner.TriggerClientEventForReadyPlayers(eventName, NetArgumentSerializer.Sanitize(arguments));

        public Task<object?> TriggerClientProcedure(RagePlayer player, string procedureName, object[] arguments) =>
            _owner.CallClientProcedure(RequirePlayer(player), procedureName, NetArgumentSerializer.Sanitize(arguments));

        public void SetSharedData(RageEntity entity, string key, object? value)
        {
            if (entity is RagePlayer player)
            {
                RequirePlayer(player).State.Set(SharedDataKey(key), value, true);
                return;
            }
            // RAGE entities store a server native handle and a separate OneSync
            // network id. FromNetworkId was previously called with both kinds of
            // values here, so most vehicle state bags were never written. The
            // handle is authoritative inside this server process.
            var target = NativeEntityFromHandle(entity.NativeHandle);
            target?.State.Set(SharedDataKey(key), value, true);
        }

        public void ResetSharedData(RageEntity entity, string key) => SetSharedData(entity, key, null);

        public void SendChatMessage(RagePlayer player, string message)
        {
            var target = RequirePlayer(player);
            BaseScript.TriggerClientEvent(target, "chat:addMessage", new { args = new[] { message } });
        }

        public void Kick(RagePlayer player, string reason) => RequirePlayer(player).Drop(reason);

        public void RequestServerQuit(string reason)
        {
            // Let FXServer run its own shutdown path. In the observed restart
            // logs, Environment.Exit reached ProcessExit but svMain stayed alive.
            var safeReason = (reason ?? string.Empty).Replace('"', ' ').Replace('\n', ' ').Replace('\r', ' ').Trim();
            API.ExecuteCommand(safeReason.Length == 0 ? "quit" : $"quit \"{safeReason}\"");
        }

        public NetworkEntityReference CreateNetworkEntity(RageEntity entity)
        {
            var position = entity.Position;
            if (entity is GTANetworkAPI.Vehicle vehicle)
            {
                // A non-zero unpublished handle belongs to an earlier
                // CREATE_VEHICLE RPC. Finalize that request instead of issuing
                // another native and producing a duplicate vehicle.
                if (entity.NativeHandle != 0)
                    return FinalizeNetworkEntity(entity.NativeHandle, entity, requireImmediateExistence: false);

                // BestMP b3788 accepts CREATE_VEHICLE_SERVER_SETTER and returns
                // a server handle/network id, but the resulting entity never
                // enters client scope. CREATE_VEHICLE is the compatible path
                // that actually materializes both stock and streamed vehicles.
                // Stable RAGE identity is supplied separately by the embedded
                // create payload and replicated __bridgeRemoteId state bag.
                var rpcHandle = API.CreateVehicle(
                    vehicle.Model,
                    position.X, position.Y, position.Z,
                    vehicle.Heading,
                    true, true);
                var rpcReference = FinalizeNetworkEntity(rpcHandle, entity, requireImmediateExistence: false);
                if (rpcReference.Handle != 0)
                    return rpcReference;

                // Keep the server setter as a fallback for runtimes where the
                // regular creation RPC is unavailable.
                var setterHandle = API.CreateVehicleServerSetter(
                    vehicle.Model,
                    ServerVehicleType(vehicle),
                    position.X, position.Y, position.Z,
                    vehicle.Heading);
                var setterReference = FinalizeNetworkEntity(setterHandle, entity, requireImmediateExistence: true);
                if (setterReference.Handle == 0)
                    Debug.WriteLine($"[ragemp-csharp] vehicle creation failed on both paths model={vehicle.Model} position={position.X:F3},{position.Y:F3},{position.Z:F3}");
                return setterReference;
            }

            var handle = 0;
            if (entity is GTANetworkAPI.Object)
                handle = API.CreateObjectNoOffset(entity.Model, position.X, position.Y, position.Z, true, true, false);
            else if (entity is GTANetworkAPI.Ped)
                handle = API.CreatePed(
                    4,
                    entity.Model,
                    position.X,
                    position.Y,
                    position.Z - RageGroundZCompensation,
                    entity.Heading,
                    true,
                    true);

            return FinalizeNetworkEntity(handle, entity, requireImmediateExistence: true);
        }

        private NetworkEntityReference FinalizeNetworkEntity(int handle, RageEntity entity, bool requireImmediateExistence)
        {
            if (handle == 0) return new NetworkEntityReference();
            if (!API.DoesEntityExist(handle))
            {
                if (requireImmediateExistence) return new NetworkEntityReference();
                return new NetworkEntityReference { Handle = handle, Pending = true };
            }
            try
            {
                if (API.DoesEntityExist(handle))
                    API.SetEntityOrphanMode(handle, 2);
                API.SetEntityRoutingBucket(handle, unchecked((int)entity.Dimension));
                ApplyEntityState(handle, entity);
                var networkId = API.NetworkGetNetworkIdFromEntity(handle);
                if (networkId == 0)
                {
                    if (API.DoesEntityExist(handle)) API.DeleteEntity(handle);
                    return new NetworkEntityReference();
                }
                // Registry events can race the first client-side world scan. Keep
                // the authoritative RAGE id on the native entity as well so an
                // already-streamed wrapper never remains at INVALID_REMOTE_ID.
                SetRemoteIdentity(handle, entity.Id);
                // RPC-created entities can receive their usable state bag only
                // after a client has materialized the native. Reassert the full
                // RAGE shared-data snapshot, not only the bridge id: otherwise
                // creation-time values such as PETROL, MAXTANK and vEngine are
                // silently lost while the entity itself remains valid.
                ScheduleStateBagReassertion(handle, entity, 250);
                ScheduleStateBagReassertion(handle, entity, 1000);
                ScheduleStateBagReassertion(handle, entity, 3000);
                ApplySharedData(handle, entity);
                return new NetworkEntityReference { Handle = handle, NetworkId = networkId };
            }
            catch (Exception error)
            {
                Debug.WriteLine($"[ragemp-csharp] native entity creation rejected model={entity.Model} handle={handle}: {error.Message}");
                if (API.DoesEntityExist(handle)) API.DeleteEntity(handle);
                return new NetworkEntityReference();
            }
        }

        public void UpdateNetworkEntity(RageEntity entity, bool updateTransform)
        {
            var handle = entity.NativeHandle;
            if (handle == 0 || !API.DoesEntityExist(handle)) return;
            ApplyEntityState(handle, entity, updateTransform);
        }

        public int ResolveNetworkEntityHandle(int networkId)
        {
            if (networkId <= 0) return 0;
            try
            {
                var handle = API.NetworkGetEntityFromNetworkId(networkId);
                return handle != 0 && API.DoesEntityExist(handle) ? handle : 0;
            }
            catch (Exception error)
            {
                Debug.WriteLine($"[ragemp-csharp] network id {networkId} cannot be resolved: {error.Message}");
                return 0;
            }
        }

        private static void ApplyEntityState(int handle, RageEntity entity, bool updateTransform = true)
        {
            if (updateTransform)
            {
                var position = entity.Position;
                var nativeZ = entity is GTANetworkAPI.Ped
                    ? position.Z - RageGroundZCompensation
                    : position.Z;
                // Creation and explicit Position/Rotation writes move entities;
                // property updates must not snap driven vehicles to spawn.
                API.SetEntityCoords(handle, position.X, position.Y, nativeZ, false, false, false, false);
                API.SetEntityRotation(handle, entity.Rotation.X, entity.Rotation.Y, entity.Rotation.Z, 2, true);
            }
            API.SetEntityRoutingBucket(handle, unchecked((int)entity.Dimension));
            if (entity is GTANetworkAPI.Vehicle vehicle)
            {
                API.SetVehicleColours(handle, vehicle.PrimaryColor, vehicle.SecondaryColor);
                API.SetVehicleNumberPlateText(handle, vehicle.NumberPlate ?? string.Empty);
                API.SetVehicleDoorsLocked(handle, vehicle.Locked ? 2 : 1);
            }
            else if (entity is GTANetworkAPI.Ped ped)
            {
                API.FreezeEntityPosition(handle, ped.Frozen);
            }
        }

        public void DeleteNetworkEntity(RageEntity entity)
        {
            if (entity.NativeHandle != 0 && API.DoesEntityExist(entity.NativeHandle)) API.DeleteEntity(entity.NativeHandle);
        }

        public void SetPlayerDimension(RagePlayer player, uint dimension) =>
            API.SetPlayerRoutingBucket(RequirePlayer(player).Handle, unchecked((int)dimension));

        private static void ApplySharedData(int handle, RageEntity entity)
        {
            var target = NativeEntityFromHandle(handle);
            if (target == null) return;
            foreach (var pair in entity.GetAllSharedData())
                target.State.Set(SharedDataKey(pair.Key), pair.Value, true);
        }

        private void ScheduleStateBagReassertion(int handle, RageEntity entity, long delayMilliseconds)
        {
            _owner.Schedule(() =>
            {
                // A native handle may be recycled after an entity was deleted.
                // Never write a delayed snapshot into another entity.
                if (!entity.IsInstanceAlive ||
                    !entity.NetworkPublished ||
                    entity.NativeHandle != handle ||
                    handle == 0 ||
                    !API.DoesEntityExist(handle))
                    return;

                SetRemoteIdentity(handle, entity.Id);
                ApplySharedData(handle, entity);
            }, delayMilliseconds);
        }

        private static void SetRemoteIdentity(int handle, ushort remoteId)
        {
            if (handle == 0 || !API.DoesEntityExist(handle)) return;
            var target = NativeEntityFromHandle(handle);
            target?.State.Set(RemoteIdStateKey, (int)remoteId, true);
        }

        private static string ServerVehicleType(GTANetworkAPI.Vehicle vehicle)
        {
            switch (vehicle.Class)
            {
                case 8:  // motorcycles
                case 13: return "bike";
                case 14: return "boat";
                case 15: return "heli";
                case 16: return "plane";
                case 21: return "train";
                default: return "automobile";
            }
        }

        private static CfxEntity? NativeEntityFromHandle(int handle)
        {
            if (handle == 0 || !API.DoesEntityExist(handle)) return null;
            try
            {
                API.EnsureEntityStateBag(handle);
                return CfxEntity.FromHandle(handle);
            }
            catch (Exception error)
            {
                Debug.WriteLine($"[ragemp-csharp] state bag handle {handle} is unavailable: {error.Message}");
                return null;
            }
        }

        private static string SharedDataKey(string key) => SharedDataPrefix + key;

        private CfxPlayer RequirePlayer(RagePlayer player) =>
            _owner.FindCitizenPlayer(player.Id) ?? throw new InvalidOperationException("FiveM player is no longer connected: " + player.Id);
    }
}
