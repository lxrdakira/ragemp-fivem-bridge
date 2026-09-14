using System;
using System.Collections.Generic;
using System.Linq;
using RageMP.FiveM.Bridge;
using RageObject = GTANetworkAPI.Object;

namespace GTANetworkAPI
{
    public sealed class WorldMethods
    {
        private readonly object _sync = new object();
        private readonly HashSet<string> _requestedIpls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        private readonly List<(uint Model, Vector3 Position, float Radius)> _worldPropDeletions = new List<(uint, Vector3, float)>();

        public int Hour { get; private set; } = 12;
        public int Minute { get; private set; }
        public int Second { get; private set; }
        public string WeatherName { get; private set; } = "CLEAR";

        public void SetTime(int hour, int minute, int second)
        {
            Hour = hour; Minute = minute; Second = second;
            BridgeRuntime.Current.TriggerClientEventForAll("ragemp:setTime", new object[] { hour, minute, second });
        }
        public void SetWeather(string weather)
        {
            WeatherName = weather ?? "CLEAR";
            BridgeRuntime.Current.TriggerClientEventForAll("ragemp:setWeather", new object[] { WeatherName });
        }
        public void SetWeather(Weather weather) => SetWeather(weather.ToString());
        public void RequestIpl(string ipl)
        {
            if (string.IsNullOrWhiteSpace(ipl)) return;
            lock (_sync) _requestedIpls.Add(ipl);
            BridgeRuntime.Current.TriggerClientEventForAll("ragemp:requestIpl", new object[] { ipl });
        }
        public void DeleteWorldProp(uint model, Vector3 position, float radius)
        {
            var point = position ?? new Vector3();
            lock (_sync) _worldPropDeletions.Add((model, new Vector3(point.X, point.Y, point.Z), radius));
            BridgeRuntime.Current.TriggerClientEventForAll("ragemp:deleteWorldProp", new object[] { model, point.X, point.Y, point.Z, radius });
        }
        public void DeleteWorldProp(int model, Vector3 position, float radius) => DeleteWorldProp(unchecked((uint)model), position, radius);

        internal string[] GetRequestedIpls() { lock (_sync) return _requestedIpls.ToArray(); }
        internal (uint Model, Vector3 Position, float Radius)[] GetWorldPropDeletions() { lock (_sync) return _worldPropDeletions.ToArray(); }
    }

    public sealed class PlayerMethods
    {
        public Player? GetPlayerFromHandle(NetHandle handle) => RAGE.Entities.Players.Get(handle.Value);
        public Player? GetPlayerFromName(string name) => RAGE.Entities.Players.All.FirstOrDefault(player => string.Equals(player.Name, name, StringComparison.OrdinalIgnoreCase));
        public int GetPlayerHealth(Player player) => player.Health;
        public void SetPlayerHealth(Player player, int health) => player.Health = health;
        public bool IsPlayerInAnyVehicle(Player player) => player.IsInVehicle;
        public List<Player> GetPlayersInRadiusOfPosition(double radius, Vector3 position) => RAGE.Entities.Players.All.Where(player => player.Position.DistanceTo(position) <= radius).ToList();
        public void KickPlayer(Player player, string reason) => player.Kick(reason);
        public void KickPlayer(Player player) => player.Kick();
        public void SpawnPlayer(Player player, Vector3 position, float heading = 0)
        {
            var spawn = position ?? new Vector3();
            player.ApplyNetworkState(spawn, heading, player.Health, player.Armor, player.Ping, player.Dimension);
            player.TriggerEvent("ragemp:spawnmanager:spawn", new Dictionary<string, object> { ["x"] = spawn.X, ["y"] = spawn.Y, ["z"] = spawn.Z, ["heading"] = heading, ["model"] = player.Model });
        }
        public void PlayPlayerAnimation(Player player, int flags, string dictionary, string name, float speed = 8f) => player.TriggerEvent("ragemp:playAnimation", dictionary, name, speed, flags);
        public void StopPlayerAnimation(Player player) => player.TriggerEvent("ragemp:stopAnimation");
        public void SetPlayerClothes(Player player, int component, int drawable, int texture) => player.TriggerEvent("ragemp:setClothes", component, drawable, texture, 0);
        public void SetPlayerClothes(Player player, Dictionary<int, ComponentVariation> clothes) { foreach (var pair in clothes) player.TriggerEvent("ragemp:setClothes", pair.Key, pair.Value.Drawable, pair.Value.Texture, pair.Value.Palette); }
        public void SetPlayerAccessory(Player player, int slot, int drawable, int texture) => player.TriggerEvent("ragemp:setProp", slot, drawable, texture);
        public void ClearPlayerAccessory(Player player, int slot) => player.TriggerEvent("ragemp:setProp", slot, -1, 0);
        public void SetPlayerEyeColor(Player player, byte color) => player.TriggerEvent("ragemp:setEyeColor", color);
        public void SetPlayerHairColor(Player player, byte color, byte highlight) => player.TriggerEvent("ragemp:setHairColor", color, highlight);
        public void SetPlayerFaceFeature(Player player, int index, float scale) => player.TriggerEvent("ragemp:setFaceFeature", index, scale);
        public void SetPlayerHeadBlend(Player player, HeadBlend blend) => player.TriggerEvent("ragemp:setHeadBlend", blend.ShapeFirst, blend.ShapeSecond, blend.ShapeThird, blend.SkinFirst, blend.SkinSecond, blend.SkinThird, blend.ShapeMix, blend.SkinMix, blend.ThirdMix);
        public void SetPlayerHeadOverlay(Player player, int overlay, HeadOverlay data) => player.TriggerEvent("ragemp:setHeadOverlay", overlay, new object[] { data.Index, data.Opacity, data.Color, data.SecondaryColor });
        public void SetPlayerIntoVehicle(Player player, NetHandle vehicle, int seat)
        {
            var target = RAGE.Entities.Vehicles.Get(vehicle.Value);
            player.TriggerEvent("ragemp:putIntoVehicle", target?.NetworkId ?? vehicle.Value, seat);
        }
        public void ReloadResources(Player player) => player.TriggerEvent("ragemp:reloadResources");
    }

    public sealed class EntityMethods
    {
        private static Entity? Find(NetHandle handle) => RAGE.Entities.Resolve(handle);
        public uint GetEntityDimension(NetHandle handle) => Find(handle)?.Dimension ?? 0;
        public Vector3 GetEntityPosition(NetHandle handle) => Find(handle)?.Position ?? new Vector3();
        public Vector3 GetEntityRotation(NetHandle handle) => Find(handle)?.Rotation ?? new Vector3();
        public void SetEntityDimension(NetHandle handle, uint value) { var entity = Find(handle); if (entity != null) entity.Dimension = value; }
        public void SetEntityModel(NetHandle handle, uint model)
        {
            var entity = Find(handle);
            if (entity == null || entity.Model == model) return;
            entity.SetModelInternal(model);
            if (entity is Player player) player.TriggerEvent("ragemp:setModel", model);
            else
            {
                if (entity is Vehicle vehicle)
                {
                    vehicle.Class = NAPI.Vehicle.GetVehicleClass((VehicleHash)model);
                    vehicle.ResetNetworkMetadata();
                }
                EntityNetworkSync.RecreateNative(entity);
            }
        }
        public void SetEntityModel(NetHandle handle, int model) => SetEntityModel(handle, unchecked((uint)model));
        public void SetEntityPosition(NetHandle handle, Vector3 position) { var entity = Find(handle); if (entity != null) entity.Position = position; }
        public void SetEntityRotation(NetHandle handle, Vector3 rotation) { var entity = Find(handle); if (entity != null) entity.Rotation = rotation; }
        public void AttachEntityToEntity(NetHandle entity, NetHandle target, string bone, Vector3 positionOffset, Vector3 rotationOffset) { }
    }

    public sealed class ChatMethods
    {
        public void SendChatMessageToAll(string message, bool color = true) => BridgeRuntime.Current.TriggerClientEventForAll("ragemp:chatMessage", new object[] { message });
        public void SendChatMessageToAll(string sender, string message, bool color = true) => SendChatMessageToAll(sender + ": " + message, color);
        public void SendChatMessageToPlayer(Player player, string message, bool color = true) => player.SendChatMessage(message);
        public void SendChatMessageToPlayer(Player player, string sender, string message, bool color = true) => player.SendChatMessage(sender, message);
    }

    public sealed class PoolMethods
    {
        public List<Player> GetAllPlayers() => RAGE.Entities.Players.All.ToList();
        public List<Vehicle> GetAllVehicles() => RAGE.Entities.Vehicles.All.ToList();
        public List<RageObject> GetAllObjects() => RAGE.Entities.Objects.All.ToList();
        public List<Ped> GetAllPeds() => RAGE.Entities.Peds.All.ToList();
    }

    public sealed class DataMethods
    {
        public string[] GetAllEntityData(Entity entity) => entity.GetAllDataKeys();
        public void SetEntitySharedData(Entity entity, string key, object value) => entity.SetSharedData(key, value);
        public void SetEntitySharedData(Entity entity, Dictionary<string, object> values) => entity.SetSharedData(values);
    }

    public sealed class ServerMethods
    {
        private int _maxPlayers = 1024;
        public bool AutoRespawnAfterDeath { get; private set; } = true;
        public bool AutoSpawnOnConnect { get; private set; } = true;
        public string CommandErrorMessage { get; private set; } = "Command not found.";
        public bool GlobalDefaultCommandMessages { get; private set; } = true;
        public bool GlobalServerChat { get; private set; } = true;
        public string ServerName { get; private set; } = string.Empty;

        public int GetMaxPlayers() => _maxPlayers;
        public void ApplyRuntimeMaxPlayers(int value) => _maxPlayers = Math.Max(1, value);
        public void SetAutoRespawnAfterDeath(bool value)
        {
            AutoRespawnAfterDeath = value;
            BridgeRuntime.Current.TriggerClientEventForAll("ragemp:setAutoRespawn", new object[] { value });
        }
        public void SetAutoSpawnOnConnect(bool value) => AutoSpawnOnConnect = value;
        public void SetCommandErrorMessage(string value) => CommandErrorMessage = value ?? string.Empty;
        public void SetGlobalDefaultCommandMessages(bool value) => GlobalDefaultCommandMessages = value;
        public void SetGlobalServerChat(bool value) => GlobalServerChat = value;
        public void SetServerName(string value) => ServerName = value ?? string.Empty;
    }

    public sealed class NotificationMethods
    {
        public void SendNotificationToPlayer(Player player, string message, bool flashing = false) => player.TriggerEvent("ragemp:notify", message);
        public void SendPictureNotificationToPlayer(Player player, string message, string picture, int flash, int iconType, string sender, string subject) => player.TriggerEvent("ragemp:notify", message);
    }

    public sealed class MarkerMethods
    {
        public Marker CreateMarker(uint type, Vector3 position, Vector3 direction, Vector3 rotation, float scale, Color color, bool bobUpAndDown = false, uint dimension = 0) { var marker = RAGE.Entities.Markers.Create(); marker.MarkerType = type; marker.Position = position; marker.Direction = direction; marker.Rotation = rotation; marker.Scale = scale; marker.Color = color; marker.Dimension = dimension; EntityNetworkSync.Publish(marker); return marker; }
        public Marker CreateMarker(int type, Vector3 position, Vector3 direction, Vector3 rotation, float scale, Color color, bool bobUpAndDown = false, uint dimension = 0) => CreateMarker(unchecked((uint)type), position, direction, rotation, scale, color, bobUpAndDown, dimension);
        public Marker CreateMarker(MarkerType type, Vector3 position, Vector3 direction, Vector3 rotation, float scale, Color color, bool bobUpAndDown = false, uint dimension = 0) => CreateMarker((uint)type, position, direction, rotation, scale, color, bobUpAndDown, dimension);
    }

    public sealed class TextLabelMethods
    {
        public TextLabel CreateTextLabel(string text, Vector3 position, float range, float size, int font, Color color, bool seethrough = false, uint dimension = 0) { var label = RAGE.Entities.TextLabels.Create(); label.Text = text; label.Position = position; label.Range = range; label.Size = size; label.Font = font; label.Color = color; label.Seethrough = seethrough; label.Dimension = dimension; EntityNetworkSync.Publish(label); return label; }
        public void SetTextLabelText(NetHandle handle, string text) { var label = RAGE.Entities.TextLabels.Get(handle.Value); if (label != null) label.Text = text; }
    }

    public sealed class VehicleMethods
    {
        public Vehicle CreateVehicle(uint model, Vector3 position, float heading, int primaryColor, int secondaryColor, string numberPlate = "", byte alpha = 255, bool locked = false, bool engine = false, uint dimension = 0) { var vehicle = RAGE.Entities.Vehicles.Create(); vehicle.SetModelInternal(model); vehicle.Class = GetVehicleClass((VehicleHash)model); vehicle.Position = position; vehicle.Rotation = new Vector3(0, 0, heading); vehicle.PrimaryColor = primaryColor; vehicle.SecondaryColor = secondaryColor; vehicle.NumberPlate = numberPlate; vehicle.Transparency = alpha; vehicle.Locked = locked; vehicle.EngineStatus = engine; vehicle.Dimension = dimension; EntityNetworkSync.Publish(vehicle); return vehicle; }
        public Vehicle CreateVehicle(int model, Vector3 position, float heading, int primaryColor, int secondaryColor, string numberPlate = "", byte alpha = 255, bool locked = false, bool engine = false, uint dimension = 0) => CreateVehicle(unchecked((uint)model), position, heading, primaryColor, secondaryColor, numberPlate, alpha, locked, engine, dimension);
        public Vehicle CreateVehicle(VehicleHash model, Vector3 position, float heading, int primaryColor, int secondaryColor, string numberPlate = "", byte alpha = 255, bool locked = false, bool engine = false, uint dimension = 0) => CreateVehicle((uint)model, position, heading, primaryColor, secondaryColor, numberPlate, alpha, locked, engine, dimension);
        public int GetVehicleClass(VehicleHash model) => VehicleClassCatalog.Get(unchecked((uint)model));
        public Entity? GetVehicleDriver(NetHandle handle) => RAGE.Entities.Vehicles.Get(handle.Value)?.Occupants
            .OfType<Player>()
            .FirstOrDefault(player => player.VehicleSeat == (int)VehicleSeat.Driver);
        public string GetVehicleNumberPlate(NetHandle handle) => RAGE.Entities.Vehicles.Get(handle.Value)?.NumberPlate ?? string.Empty;
        public void SetVehicleNumberPlate(NetHandle handle, string plate) { var vehicle = RAGE.Entities.Vehicles.Get(handle.Value); if (vehicle != null) vehicle.NumberPlate = plate; }
        public void SetVehicleLocked(NetHandle handle, bool locked) { var vehicle = RAGE.Entities.Vehicles.Get(handle.Value); if (vehicle != null) vehicle.Locked = locked; }
        public void SetVehicleNeonColor(NetHandle handle, int red, int green, int blue) { var vehicle = RAGE.Entities.Vehicles.Get(handle.Value); if (vehicle == null) return; vehicle.NeonColor = new Color(red, green, blue); EntityNetworkSync.Update(vehicle); }
        public void SetVehicleNeonState(NetHandle handle, bool enabled) { var vehicle = RAGE.Entities.Vehicles.Get(handle.Value); if (vehicle == null) return; vehicle.NeonEnabled = enabled; EntityNetworkSync.Update(vehicle); }
    }

    public sealed class ObjectMethods { public RageObject CreateObject(uint model, Vector3 position, Vector3 rotation, byte alpha = 255, uint dimension = 0) { var value = RAGE.Entities.Objects.Create(); value.SetModelInternal(model); value.Position = position; value.Rotation = rotation; value.Transparency = alpha; value.Dimension = dimension; EntityNetworkSync.Publish(value); return value; } public RageObject CreateObject(int model, Vector3 position, Vector3 rotation, byte alpha = 255, uint dimension = 0) => CreateObject(unchecked((uint)model), position, rotation, alpha, dimension); }
    public sealed class BlipMethods { public Blip CreateBlip(uint sprite, Vector3 position, float scale, byte color, string name, byte alpha = 255, float drawDistance = 0, bool shortRange = false, short rotation = 0, uint dimension = 0) { var value = RAGE.Entities.Blips.Create(); value.Sprite = sprite; value.Position = position; value.Scale = scale; value.Color = color; value.Name = name; value.Transparency = alpha; value.DrawDistance = drawDistance; value.ShortRange = shortRange; value.BlipRotation = rotation; value.Dimension = dimension; EntityNetworkSync.Publish(value); return value; } public Blip CreateBlip(int sprite, Vector3 position, float scale, byte color, string name, byte alpha = 255, float drawDistance = 0, bool shortRange = false, short rotation = 0, uint dimension = 0) => CreateBlip(unchecked((uint)sprite), position, scale, color, name, alpha, drawDistance, shortRange, rotation, dimension); public Blip CreateBlip(int sprite, Vector3 position, float scale, byte color, byte alpha = 255, float drawDistance = 0, bool shortRange = false, short rotation = 0, uint dimension = 0) => CreateBlip(sprite, position, scale, color, string.Empty, alpha, drawDistance, shortRange, rotation, dimension); public Blip CreateBlip(Vector3 position, float scale, uint dimension = 0) => CreateBlip(0u, position, scale, 0, string.Empty, 255, 0, false, 0, dimension); public Blip CreateBlip(Vector3 position, uint dimension = 0) => CreateBlip(position, 1f, dimension); public Blip CreateBlip(NetHandle attachedTo) => CreateBlip(RAGE.Entities.Resolve(attachedTo)?.Position ?? new Vector3()); public void SetBlipColor(NetHandle handle, int color) { var value = RAGE.Entities.Blips.Get(handle.Value); if (value != null) value.Color = color; } public void SetBlipTransparency(NetHandle handle, int alpha) { var value = RAGE.Entities.Blips.Get(handle.Value); if (value != null) value.Transparency = alpha; } }
    public sealed class ColShapeMethods { private static ColShape Create(string type, Vector3 position, float radius, float width, float depth, float height, uint dimension) { var value = RAGE.Entities.Colshapes.Create(); value.ShapeType = type; value.Position = position; value.Radius = radius; value.Width = width; value.Depth = depth; value.Height = height; value.Dimension = dimension; EntityNetworkSync.Publish(value); return value; } public ColShape CreateSphereColShape(Vector3 position, float radius, uint dimension = 0) => Create("sphere", position, radius, 0, 0, 0, dimension); public ColShape CreateCylinderColShape(Vector3 position, float radius, float height, uint dimension = 0) => Create("tube", position, radius, 0, 0, height, dimension); public ColShape CreatCircleColShape(float x, float y, float radius, uint dimension = 0) => Create("circle", new Vector3(x, y, 0), radius, 0, 0, 0, dimension); public ColShape Create2DColShape(float x, float y, float width, float height, uint dimension = 0) => Create("rectangle", new Vector3(x, y, 0), 0, width, 0, height, dimension); public ColShape Create3DColShape(Vector3 start, Vector3 end, uint dimension = 0) => Create("cuboid", start, 0, Math.Abs(end.X - start.X), Math.Abs(end.Y - start.Y), Math.Abs(end.Z - start.Z), dimension); public bool IsPointWithinColshape(ColShape shape, Vector3 point) => shape.IsPointWithin(point); }
    public sealed class PedMethods
    {
        private const int PedPublishBaseDelayMilliseconds = 750;
        private const int PedPublishSpreadSlots = 100;
        private const int PedPublishSpreadStepMilliseconds = 15;
        private static int _pedPublishSequence;

        public Ped CreatePed(PedHash model, Vector3 position, float heading, uint dimension = 0) =>
            CreatePed((uint)model, position, heading, dimension);

        public Ped CreatePed(uint model, Vector3 position, float heading, uint dimension = 0) =>
            CreatePed(model, position, heading, false, false, false, false, dimension);

        public Ped CreatePed(uint model, Vector3 position, float heading, bool dynamic = false, bool invincible = false, bool frozen = false, bool controlLocked = false, uint dimension = 0)
        {
            var value = RAGE.Entities.Peds.Create();
            value.SetModelInternal(model);
            value.Position = position;
            value.Rotation = new Vector3(0, 0, heading);
            value.Dynamic = dynamic;
            value.Invincible = invincible;
            value.Frozen = frozen;
            value.ControlLocked = controlLocked;
            value.Dimension = dimension;

            // BestMP b3788 can reject CREATE_PED while the resource graph and
            // OneSync world are still being initialized. Neptune creates more
            // than five hundred static quest NPCs from OnResourceStart, so a
            // synchronous burst permanently removed a random part of the ped
            // pool. Keep the stable RAGE wrapper available to gameplay code and
            // publish the native entities shortly after startup in small waves.
            var sequence = System.Threading.Interlocked.Increment(ref _pedPublishSequence);
            var delay = PedPublishBaseDelayMilliseconds +
                (sequence % PedPublishSpreadSlots) * PedPublishSpreadStepMilliseconds;
            BridgeRuntime.Current.Schedule(() =>
            {
                if (value.IsInstanceAlive && !value.NetworkPublished)
                    EntityNetworkSync.Publish(value);
            }, delay);

            return value;
        }
    }
}
