using System.Collections.Generic;
using RageMP.FiveM.Bridge;

namespace GTANetworkAPI
{
    public static class EntityNetworkSync
    {
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
                entity.NetworkPublished = reference.Handle != 0;
                if (entity.NetworkPublished) PublishNativeReference(entity);
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
                if (entity is Vehicle vehicle) SendVehicleStateForAll(vehicle);
            }
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
            entity.NetworkPublished = reference.Handle != 0;
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
        }

        internal static void Destroy(Entity entity)
        {
            if (entity == null) return;
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
                entity.NetworkPublished = false;
            }
            RemoveFromPool(entity);
        }

        public static void SendAll(Player player)
        {
            Send(player, RAGE.Entities.Markers.All);
            Send(player, RAGE.Entities.TextLabels.All);
            Send(player, RAGE.Entities.Blips.All);
            Send(player, RAGE.Entities.Checkpoints.All);
            Send(player, RAGE.Entities.Colshapes.All);
            SendNative(player, RAGE.Entities.Vehicles.All);
            SendNative(player, RAGE.Entities.Objects.All);
            SendNative(player, RAGE.Entities.Peds.All);
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

        private static void SendNative<T>(Player player, IEnumerable<T> entities) where T : Entity
        {
            foreach (var entity in entities)
            {
                if (!entity.NetworkPublished || !entity.IsInstanceAlive || entity.NetworkId == 0) continue;
                SendNativeReference(player, entity);
            }
        }

        private static void PublishNativeReference(Entity entity)
        {
            BridgeRuntime.Current.TriggerClientEventForAll("ragemp:entity:create", NativeCreateArguments(entity));
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
            BridgeRuntime.Current.TriggerClientEvent(player, "ragemp:entity:netid", new object[] { NativeType(entity), entity.Id, entity.NetworkId });
            if (entity is Vehicle vehicle) SendVehicleState(player, vehicle);
            else if (entity is Ped ped) SendPedState(player, ped);
        }

        private static void SendPedStateForAll(Ped ped) =>
            BridgeRuntime.Current.TriggerClientEventForAll("ragemp:ped:batch", PedState(ped));

        private static void SendPedState(Player player, Ped ped) =>
            BridgeRuntime.Current.TriggerClientEvent(player, "ragemp:ped:batch", PedState(ped));

        private static object[] PedState(Ped ped) => new object[]
        {
            ped.NetworkId, ped.Dynamic, ped.Invincible, ped.Frozen, ped.ControlLocked
        };

        private static void SendVehicleStateForAll(Vehicle vehicle) =>
            BridgeRuntime.Current.TriggerClientEventForAll("ragemp:vehicle:batch", new object[] { vehicle.NetworkId, VehicleState(vehicle) });

        private static void SendVehicleState(Player player, Vehicle vehicle) =>
            BridgeRuntime.Current.TriggerClientEvent(player, "ragemp:vehicle:batch", new object[] { vehicle.NetworkId, VehicleState(vehicle) });

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
            entity.Position.X, entity.Position.Y, entity.Position.Z, entity.Dimension
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
                data["text"] = label.Text; AddColor(data, label.Color); data["drawDistance"] = label.Range; data["los"] = label.Seethrough; data["font"] = label.Font;
            }
            else if (entity is Blip blip)
            {
                data["sprite"] = blip.Sprite; data["color"] = blip.Color; data["scale"] = blip.Scale; data["name"] = blip.Name;
                data["shortRange"] = blip.ShortRange; data["alpha"] = blip.Transparency; data["drawDistance"] = 0f; data["rotation"] = 0;
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
