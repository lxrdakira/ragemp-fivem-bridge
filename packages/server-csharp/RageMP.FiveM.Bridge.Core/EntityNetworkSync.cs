using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Diagnostics;
using RageMP.FiveM.Bridge;

namespace GTANetworkAPI
{
    public static class EntityNetworkSync
    {
        private const int NativeSnapshotChunkSize = 128;
        private static readonly long[] PedPublishRetryDelays = { 500, 1500, 5000 };
        private static readonly ConcurrentDictionary<ushort, int> PedPublishAttempts =
            new ConcurrentDictionary<ushort, int>();

        public static void Publish(Entity entity)
        {
            if (entity == null || entity.NetworkPublished) return;
            var eventName = EventName(entity, "Create");
            if (eventName == null)
            {
                if (!(entity is Vehicle) && !(entity is Object) && !(entity is Ped)) return;
                var reference = BridgeRuntime.Current.CreateNetworkEntity(entity);
                entity.NativeHandle = reference.Handle;
                entity.NetworkId = reference.NetworkId;
                entity.NetworkPublished = reference.Handle != 0 && reference.NetworkId != 0;
                if (entity.NetworkPublished)
                {
                    if (entity is Ped) PedPublishAttempts.TryRemove(entity.Id, out _);
                    PublishNativeReference(entity);
                }
                else if (entity is Ped ped && entity.IsInstanceAlive)
                {
                    // A failed native ped must not invalidate the server-side
                    // NPC. Its id is already embedded in interaction colshapes
                    // and PedsData. Retry after OneSync settles; creation-time
                    // shared data remains stored on the wrapper and is applied
                    // when publication succeeds.
                    entity.NativeHandle = 0;
                    entity.NetworkId = 0;
                    SchedulePedPublishRetry(ped);
                }
                else
                {
                    // Do not leave a C# wrapper in the RAGE pool when FiveM
                    // rejected the native entity. Legacy gameplay checks
                    // Entity.Exists to decide whether a vehicle was spawned;
                    // keeping the wrapper alive turns a native failure into a
                    // false success (money charged, waypoint set, no vehicle).
                    entity.NativeHandle = 0;
                    entity.NetworkId = 0;
                    entity.IsInstanceAlive = false;
                    RemoveFromPool(entity);
                }
                return;
            }
            entity.NetworkPublished = true;
            BridgeRuntime.Current.TriggerClientEventForAll(eventName, new object[] { Serialize(entity) });
        }

        internal static void Update(Entity entity)
        {
            if (entity == null || !entity.NetworkPublished || !entity.IsInstanceAlive) return;
            var eventName = EventName(entity, "Update");
            if (eventName != null) BridgeRuntime.Current.TriggerClientEventForAll(eventName, new object[] { entity.Id, Serialize(entity) });
            else if (entity.NativeHandle != 0)
            {
                BridgeRuntime.Current.UpdateNetworkEntity(entity);
                if (entity is Vehicle vehicle)
                {
                    // Vehicle identity on the client is matched by the stable
                    // RAGE id plus model/plate. Legacy resources commonly set
                    // the final plate immediately after CreateVehicle returns.
                    // Refresh the create metadata together with native state;
                    // otherwise the client keeps the initial random plate and
                    // later exposes the physical vehicle as remoteId 65535.
                    if (!string.Equals(
                        vehicle.PublishedVehiclePlate,
                        vehicle.NumberPlate,
                        StringComparison.Ordinal))
                    {
                        BridgeRuntime.Current.TriggerClientEventForAll(
                            "ragemp:entity:create",
                            NativeCreateArguments(vehicle));
                        vehicle.PublishedVehiclePlate = vehicle.NumberPlate;
                    }
                    SendVehicleStateForAll(vehicle);
                }
            }
        }

        internal static void SharedDataChanged(Entity entity, string key, object? value)
        {
            if (entity == null || !entity.NetworkPublished || !entity.IsInstanceAlive) return;
            if (!(entity is Vehicle) && !(entity is Object) && !(entity is Ped)) return;
            BridgeRuntime.Current.TriggerClientEventForAll(
                "ragemp:entity:sharedData",
                new object[] { NativeType(entity), entity.Id, key, value! });
        }

        internal static void RecreateNative(Entity entity)
        {
            if (entity == null || !entity.NetworkPublished || !entity.IsInstanceAlive) return;
            if (!(entity is Vehicle) && !(entity is Object) && !(entity is Ped)) return;

            if (entity.NativeHandle != 0) BridgeRuntime.Current.DeleteNetworkEntity(entity);
            entity.NativeHandle = 0;
            entity.NetworkId = 0;

            var reference = BridgeRuntime.Current.CreateNetworkEntity(entity);
            entity.NativeHandle = reference.Handle;
            entity.NetworkId = reference.NetworkId;
            entity.NetworkPublished = reference.Handle != 0 && reference.NetworkId != 0;
            if (entity.NetworkPublished)
            {
                PublishNativeReference(entity);
                if (entity is Vehicle vehicle)
                {
                    foreach (var occupant in new List<Entity>(vehicle.Occupants))
                    {
                        if (occupant is Player player && player.Vehicle == vehicle)
                            player.TriggerEvent("ragemp:putIntoVehicle", vehicle.NetworkId, player.VehicleSeat);
                    }
                }
            }
            else
            {
                entity.NativeHandle = 0;
                entity.NetworkId = 0;
                entity.IsInstanceAlive = false;
                RemoveFromPool(entity);
            }
        }

        internal static void Destroy(Entity entity)
        {
            if (entity == null) return;
            if (entity is Ped) PedPublishAttempts.TryRemove(entity.Id, out _);
            if (entity is Vehicle vehicle)
            {
                Debug.WriteLine(
                    $"[bridge-vehicle-destroy-trace] id={vehicle.Id} handle={vehicle.NativeHandle} net={vehicle.NetworkId} " +
                    $"plate={vehicle.NumberPlate} health={vehicle.Health} occupants={vehicle.Occupants.Count}\n{Environment.StackTrace}");
            }
            if (entity.NetworkPublished)
            {
                var eventName = EventName(entity, "Destroy");
                if (eventName != null) BridgeRuntime.Current.TriggerClientEventForAll(eventName, new object[] { entity.Id });
                else if (entity.NativeHandle != 0)
                {
                    BridgeRuntime.Current.TriggerClientEventForAll("ragemp:entity:destroy", new object[] { NativeType(entity), entity.Id });
                    BridgeRuntime.Current.DeleteNetworkEntity(entity);
                    entity.NativeHandle = 0;
                    entity.NetworkId = 0;
                }
                else if (entity is Ped)
                {
                    // Static peds may be represented by client-owned fallback
                    // natives when the runtime rejects their OneSync creation.
                    BridgeRuntime.Current.TriggerClientEventForAll(
                        "ragemp:entity:destroy",
                        new object[] { NativeType(entity), entity.Id });
                }
                entity.NetworkPublished = false;
            }
            RemoveFromPool(entity);
        }

        private static void SchedulePedPublishRetry(Ped ped)
        {
            var attempt = PedPublishAttempts.AddOrUpdate(ped.Id, 1, (_, current) => current + 1);
            if (attempt > PedPublishRetryDelays.Length)
            {
                if (ped.Frozen && !ped.Dynamic)
                {
                    PublishLocalPedFallback(ped);
                    return;
                }

                // Dynamic peds (pets, mission actors) need a real network
                // owner. Keep retrying them at a bounded interval instead of
                // silently deleting the server-side entity.
                PedPublishAttempts[ped.Id] = PedPublishRetryDelays.Length;
                Debug.WriteLine(
                    $"[ragemp-csharp] dynamic ped publication deferred id={ped.Id} model={ped.Model} " +
                    $"position={ped.Position.X:F3},{ped.Position.Y:F3},{ped.Position.Z:F3}");
                BridgeRuntime.Current.Schedule(() =>
                {
                    if (!ped.IsInstanceAlive || ped.NetworkPublished) return;
                    Publish(ped);
                }, 30000);
                return;
            }

            var delay = PedPublishRetryDelays[attempt - 1];
            Debug.WriteLine(
                $"[ragemp-csharp] ped publication retry id={ped.Id} model={ped.Model} " +
                $"attempt={attempt} delay={delay}ms");
            BridgeRuntime.Current.Schedule(() =>
            {
                if (!ped.IsInstanceAlive || ped.NetworkPublished) return;
                Publish(ped);
            }, delay);
        }

        private static void PublishLocalPedFallback(Ped ped)
        {
            if (!ped.IsInstanceAlive || ped.NetworkPublished) return;
            ped.NativeHandle = 0;
            ped.NetworkId = 0;
            ped.NetworkPublished = true;
            PedPublishAttempts.TryRemove(ped.Id, out _);
            Debug.WriteLine(
                $"[ragemp-csharp] static ped using local fallback id={ped.Id} model={ped.Model} " +
                $"position={ped.Position.X:F3},{ped.Position.Y:F3},{ped.Position.Z:F3} dimension={ped.Dimension}");
            PublishNativeReference(ped);
        }

        public static void SendAll(Player player)
        {
            Send(player, RAGE.Entities.Markers.All);
            Send(player, RAGE.Entities.TextLabels.All);
            Send(player, RAGE.Entities.Blips.All);
            Send(player, RAGE.Entities.Checkpoints.All);
            Send(player, RAGE.Entities.Colshapes.All);
            SendNativeSnapshot(player);
        }

        public static bool SendNativeReferenceByNetworkId(Player player, string type, int networkId)
        {
            if (player == null || networkId <= 0) return false;
            var entity = ResolveNativeReference(type, networkId);
            if (entity == null || !entity.NetworkPublished || !entity.IsInstanceAlive) return false;
            SendNativeReference(player, entity);
            return true;
        }

        public static bool SendNativeReferenceByRemoteId(Player player, string type, int remoteId)
        {
            if (player == null) return false;
            var entity = ResolveByBridgeId((type ?? string.Empty).Trim().ToLowerInvariant(), remoteId);
            if (entity == null || !entity.NetworkPublished || !entity.IsInstanceAlive) return false;
            SendNativeReference(player, entity);
            return true;
        }

        public static Entity? ResolveNativeReference(string type, int networkId, int remoteId = -1)
        {
            var normalizedType = (type ?? string.Empty).Trim().ToLowerInvariant();
            Entity? entity = ResolveByBridgeId(normalizedType, remoteId);
            if (entity != null) return entity;
            if (networkId <= 0) return null;

            entity = ResolveByStoredNetworkId(normalizedType, networkId);
            if (entity != null) return entity;

            // BestMP can remap a freshly-created OneSync network id after the
            // server has stored it. Convert the id currently reported by the
            // client back into the stable server native handle and repair the
            // pool mapping in place.
            var nativeHandle = BridgeRuntime.Current.ResolveNetworkEntityHandle(networkId);
            if (nativeHandle == 0) return null;
            entity = ResolveByNativeHandle(normalizedType, nativeHandle);
            if (entity != null && entity.NetworkId != networkId) entity.NetworkId = networkId;
            return entity;
        }

        private static Entity? ResolveByBridgeId(string type, int remoteId)
        {
            if (remoteId <= 0 || remoteId >= ushort.MaxValue) return null;
            var id = (ushort)remoteId;
            switch (type)
            {
                case "vehicle": return RAGE.Entities.Vehicles.Get(id);
                case "object": return RAGE.Entities.Objects.Get(id);
                case "ped": return RAGE.Entities.Peds.Get(id);
                default: return null;
            }
        }

        private static Entity? ResolveByStoredNetworkId(string type, int networkId)
        {
            switch (type)
            {
                case "vehicle": return RAGE.Entities.Vehicles.GetByNetworkId(networkId);
                case "object": return RAGE.Entities.Objects.GetByNetworkId(networkId);
                case "ped": return RAGE.Entities.Peds.GetByNetworkId(networkId);
                default: return null;
            }
        }

        private static Entity? ResolveByNativeHandle(string type, int nativeHandle)
        {
            switch (type)
            {
                case "vehicle": return RAGE.Entities.Vehicles.GetByNativeHandle(nativeHandle);
                case "object": return RAGE.Entities.Objects.GetByNativeHandle(nativeHandle);
                case "ped": return RAGE.Entities.Peds.GetByNativeHandle(nativeHandle);
                default: return null;
            }
        }

        private static void Send<T>(Player player, IEnumerable<T> entities) where T : Entity
        {
            foreach (var entity in entities)
            {
                if (!entity.NetworkPublished || !entity.IsInstanceAlive) continue;
                var eventName = EventName(entity, "Create");
                if (eventName != null) BridgeRuntime.Current.TriggerClientEvent(player, eventName, new object[] { Serialize(entity) });
            }
        }

        private static void SendNativeSnapshot(Player player)
        {
            var entries = new List<object>();
            AppendNativeSnapshot(entries, RAGE.Entities.Vehicles.All);
            AppendNativeSnapshot(entries, RAGE.Entities.Objects.All);
            AppendNativeSnapshot(entries, RAGE.Entities.Peds.All);

            // A restart can create thousands of native entities before a player
            // becomes ready. Sending create/netid as separate events lets the
            // first client world scan win the race and expose temporary
            // INVALID_REMOTE_ID wrappers. Ordered chunks bind every native
            // handle before the legacy gameplay bootstrap continues.
            for (var offset = 0; offset < entries.Count; offset += NativeSnapshotChunkSize)
            {
                var count = System.Math.Min(NativeSnapshotChunkSize, entries.Count - offset);
                var chunk = new object[count];
                entries.CopyTo(offset, chunk, 0, count);
                BridgeRuntime.Current.TriggerClientEvent(player, "ragemp:entity:snapshot", new object[] { chunk });
            }

            // Dynamic state is sent only after all RAGE ids are known.
            foreach (var vehicle in RAGE.Entities.Vehicles.All)
                if (vehicle.NetworkPublished && vehicle.IsInstanceAlive && vehicle.NetworkId != 0)
                {
                    SendSharedData(player, vehicle);
                    SendVehicleState(player, vehicle);
                }
            foreach (var obj in RAGE.Entities.Objects.All)
                if (obj.NetworkPublished && obj.IsInstanceAlive && obj.NetworkId != 0)
                    SendSharedData(player, obj);
            foreach (var ped in RAGE.Entities.Peds.All)
                if (ped.NetworkPublished && ped.IsInstanceAlive && ped.NetworkId != 0)
                {
                    SendSharedData(player, ped);
                    SendPedState(player, ped);
                }
                else if (ped.NetworkPublished && ped.IsInstanceAlive && ped.NetworkId == 0)
                {
                    SendNativeReference(player, ped);
                }
        }

        private static void AppendNativeSnapshot<T>(List<object> entries, IEnumerable<T> entities) where T : Entity
        {
            foreach (var entity in entities)
            {
                if (!entity.NetworkPublished || !entity.IsInstanceAlive || entity.NetworkId == 0) continue;
                entries.Add(NativeSnapshotArguments(entity));
            }
        }

        private static void PublishNativeReference(Entity entity)
        {
            BridgeRuntime.Current.TriggerClientEventForAll("ragemp:entity:create", NativeCreateArguments(entity));
            if (entity is Ped localPed && entity.NetworkId == 0)
            {
                SendLocalPedCreateForAll(localPed);
                SendSharedDataForAll(localPed);
                SendPedStateForAll(localPed);
                return;
            }
            if (entity is Vehicle publishedVehicle)
                publishedVehicle.PublishedVehiclePlate = publishedVehicle.NumberPlate;
            BridgeRuntime.Current.TriggerClientEventForAll("ragemp:entity:netid", new object[] { NativeType(entity), entity.Id, entity.NetworkId });
            if (entity is Vehicle vehicle) SendVehicleStateForAll(vehicle);
            else if (entity is Ped ped)
            {
                SendPedStateForAll(ped);
                ped.ReapplyController();
            }
        }

        private static void SendNativeReference(Player player, Entity entity)
        {
            BridgeRuntime.Current.TriggerClientEvent(player, "ragemp:entity:create", NativeCreateArguments(entity));
            if (entity is Ped localPed && entity.NetworkId == 0)
            {
                SendLocalPedCreate(player, localPed);
                SendSharedData(player, localPed);
                SendPedState(player, localPed);
                return;
            }
            BridgeRuntime.Current.TriggerClientEvent(player, "ragemp:entity:netid", new object[] { NativeType(entity), entity.Id, entity.NetworkId });
            SendSharedData(player, entity);
            if (entity is Vehicle vehicle) SendVehicleState(player, vehicle);
            else if (entity is Ped ped) SendPedState(player, ped);
        }

        private static void SendSharedData(Player player, Entity entity)
        {
            var items = new List<object>();
            foreach (var pair in entity.GetAllSharedData())
                items.Add(new object[] { pair.Key, pair.Value! });
            if (items.Count == 0) return;
            BridgeRuntime.Current.TriggerClientEvent(
                player,
                "ragemp:entity:sharedBatch",
                new object[] { NativeType(entity), entity.Id, items.ToArray() });
        }

        private static void SendSharedDataForAll(Entity entity)
        {
            var items = new List<object>();
            foreach (var pair in entity.GetAllSharedData())
                items.Add(new object[] { pair.Key, pair.Value! });
            if (items.Count == 0) return;
            BridgeRuntime.Current.TriggerClientEventForAll(
                "ragemp:entity:sharedBatch",
                new object[] { NativeType(entity), entity.Id, items.ToArray() });
        }

        private static void SendPedStateForAll(Ped ped) =>
            BridgeRuntime.Current.TriggerClientEventForAll("ragemp:ped:batch", PedState(ped));

        private static void SendPedState(Player player, Ped ped) =>
            BridgeRuntime.Current.TriggerClientEvent(player, "ragemp:ped:batch", PedState(ped));

        private static object[] PedState(Ped ped) => new object[]
        {
            ped.NetworkId, ped.Dynamic, ped.Invincible, ped.Frozen, ped.ControlLocked, ped.Id
        };

        private static object[] LocalPedCreateArguments(Ped ped) => new object[]
        {
            ped.Id, ped.Model,
            ped.Position.X, ped.Position.Y, ped.Position.Z,
            ped.Heading, ped.Dimension
        };

        private static void SendLocalPedCreateForAll(Ped ped) =>
            BridgeRuntime.Current.TriggerClientEventForAll("ragemp:ped:localCreate", LocalPedCreateArguments(ped));

        private static void SendLocalPedCreate(Player player, Ped ped) =>
            BridgeRuntime.Current.TriggerClientEvent(player, "ragemp:ped:localCreate", LocalPedCreateArguments(ped));

        private static void SendVehicleStateForAll(Vehicle vehicle) =>
            // Keep the native FiveM network id first for wire compatibility,
            // but also carry the stable RAGE remote id. Some custom runtimes
            // expose a different network id to the client; the remote id is
            // then the only reliable way to reach the already adopted wrapper.
            BridgeRuntime.Current.TriggerClientEventForAll("ragemp:vehicle:batch", new object[] { vehicle.NetworkId, VehicleState(vehicle), vehicle.Id });

        private static void SendVehicleState(Player player, Vehicle vehicle) =>
            BridgeRuntime.Current.TriggerClientEvent(player, "ragemp:vehicle:batch", new object[] { vehicle.NetworkId, VehicleState(vehicle), vehicle.Id });

        private static object[] VehicleState(Vehicle vehicle)
        {
            var items = new List<object>
            {
                Item("ragemp:vehicleEngine", vehicle.EngineStatus),
                Item("ragemp:vehicleAlpha", vehicle.Transparency),
                Item("ragemp:vehicleNumberPlateType", vehicle.NumberPlateStyle),
                Item("ragemp:vehicleWindowTint", vehicle.WindowTint),
                Item("ragemp:vehicleWheelType", vehicle.WheelType),
                Item("ragemp:vehicleLocked", vehicle.Locked),
                Item("ragemp:vehicleNumberPlate", vehicle.NumberPlate),
                Item("ragemp:vehicleEngineHealth", vehicle.EngineHealth),
                Item("ragemp:vehicleBodyHealth", vehicle.BodyHealth),
                Item("ragemp:vehicleNeonEnabled", vehicle.NeonEnabled),
                Item("ragemp:vehicleNeonColor", vehicle.NeonColor.Red, vehicle.NeonColor.Green, vehicle.NeonColor.Blue)
            };
            if (vehicle.HasCustomColors)
            {
                items.Add(Item("ragemp:vehicleColorRGB", (object)new object[]
                {
                    new object[] { vehicle.CustomPrimaryColor.Red, vehicle.CustomPrimaryColor.Green, vehicle.CustomPrimaryColor.Blue },
                    new object[] { vehicle.CustomSecondaryColor.Red, vehicle.CustomSecondaryColor.Green, vehicle.CustomSecondaryColor.Blue }
                }));
            }
            else items.Add(Item("ragemp:vehicleColor", vehicle.PrimaryColor, vehicle.SecondaryColor));
            foreach (var mod in vehicle.Mods) items.Add(Item("ragemp:vehicleMod", mod.Key, mod.Value));
            return items.ToArray();
        }

        private static object[] Item(string eventName, params object[] arguments) => new object[] { eventName, arguments };

        private static object[] NativeCreateArguments(Entity entity) => new object[]
        {
            NativeType(entity), entity.Id, entity.Model,
            entity.Position.X, entity.Position.Y, entity.Position.Z, entity.Dimension,
            entity is Vehicle vehicle ? vehicle.NumberPlate : string.Empty,
            entity.NetworkId
        };

        private static object[] NativeSnapshotArguments(Entity entity) => new object[]
        {
            NativeType(entity), entity.Id, entity.Model,
            entity.Position.X, entity.Position.Y, entity.Position.Z, entity.Dimension,
            entity.NetworkId,
            entity is Vehicle vehicle ? vehicle.NumberPlate : string.Empty
        };

        private static string NativeType(Entity entity)
        {
            if (entity is Vehicle) return "vehicle";
            if (entity is Object) return "object";
            if (entity is Ped) return "ped";
            return entity.Type.ToString().ToLowerInvariant();
        }

        private static string? EventName(Entity entity, string suffix)
        {
            if (entity is Marker) return "ragemp:marker" + suffix;
            if (entity is TextLabel) return "ragemp:label" + suffix;
            if (entity is Blip) return "ragemp:blip" + suffix;
            if (entity is Checkpoint) return "ragemp:checkpoint" + suffix;
            if (entity is ColShape) return "ragemp:colshape" + suffix;
            return null;
        }

        private static Dictionary<string, object> Serialize(Entity entity)
        {
            var data = new Dictionary<string, object>
            {
                ["id"] = entity.Id,
                ["x"] = entity.Position.X, ["y"] = entity.Position.Y, ["z"] = entity.Position.Z,
                ["dimension"] = entity.Dimension
            };
            if (entity is Marker marker)
            {
                data["type"] = marker.MarkerType; data["dirX"] = marker.Direction.X; data["dirY"] = marker.Direction.Y; data["dirZ"] = marker.Direction.Z;
                data["rotX"] = marker.Rotation.X; data["rotY"] = marker.Rotation.Y; data["rotZ"] = marker.Rotation.Z; data["scale"] = marker.Scale;
                AddColor(data, marker.Color); data["visible"] = true;
            }
            else if (entity is TextLabel label)
            {
                data["text"] = label.Text; AddColor(data, label.Color); data["drawDistance"] = label.Range; data["size"] = label.Size; data["los"] = !label.Seethrough; data["font"] = label.Font;
            }
            else if (entity is Blip blip)
            {
                data["sprite"] = blip.Sprite; data["color"] = blip.Color; data["scale"] = blip.Scale; data["name"] = blip.Name;
                data["shortRange"] = blip.ShortRange; data["alpha"] = blip.Transparency; data["drawDistance"] = blip.DrawDistance; data["rotation"] = blip.BlipRotation;
            }
            else if (entity is Checkpoint checkpoint)
            {
                data["type"] = 0; data["nextX"] = checkpoint.Direction.X; data["nextY"] = checkpoint.Direction.Y; data["nextZ"] = checkpoint.Direction.Z;
                data["radius"] = checkpoint.Scale; AddColor(data, checkpoint.Color); data["visible"] = true;
            }
            else if (entity is ColShape shape)
            {
                data["shapeType"] = shape.ShapeType;
                data["position"] = new Dictionary<string, object> { ["x"] = shape.Position.X, ["y"] = shape.Position.Y, ["z"] = shape.Position.Z };
                var parameters = new Dictionary<string, object>();
                if (shape.Radius > 0) parameters["radius"] = shape.Radius;
                if (shape.Width > 0) parameters["width"] = shape.Width;
                if (shape.Depth > 0) parameters["depth"] = shape.Depth;
                if (shape.Height > 0) parameters["height"] = shape.Height;
                data["params"] = parameters;
            }
            return data;
        }

        private static void AddColor(Dictionary<string, object> data, Color color)
        {
            data["r"] = color.Red; data["g"] = color.Green; data["b"] = color.Blue; data["a"] = color.Alpha;
        }

        private static void RemoveFromPool(Entity entity)
        {
            if (entity is Marker) RAGE.Entities.Markers.Remove(entity.Id);
            else if (entity is TextLabel) RAGE.Entities.TextLabels.Remove(entity.Id);
            else if (entity is Blip) RAGE.Entities.Blips.Remove(entity.Id);
            else if (entity is Checkpoint) RAGE.Entities.Checkpoints.Remove(entity.Id);
            else if (entity is ColShape) RAGE.Entities.Colshapes.Remove(entity.Id);
            else if (entity is Vehicle) RAGE.Entities.Vehicles.Remove(entity.Id);
            else if (entity is Ped) RAGE.Entities.Peds.Remove(entity.Id);
            else if (entity is Object) RAGE.Entities.Objects.Remove(entity.Id);
            else if (entity is Pickup) RAGE.Entities.Pickups.Remove(entity.Id);
            else if (entity is DummyEntity) RAGE.Entities.DummyEntities.Remove(entity.Id);
        }
    }
}
