using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using RageMP.FiveM.Bridge;

namespace GTANetworkAPI
{
    public class Entity : IEquatable<Entity>
    {
        private readonly ConcurrentDictionary<string, object?> _data = new ConcurrentDictionary<string, object?>();
        private readonly ConcurrentDictionary<string, object?> _sharedData = new ConcurrentDictionary<string, object?>();

        public Entity(NetHandle handle) => Handle = handle ?? throw new ArgumentNullException(nameof(handle));

        public NetHandle Handle { get; set; }
        public NetHandle HandleCopy => new NetHandle(Handle.Value, Handle.Type);
        public int HashCode => GetHashCode();
        public int Value => Handle.Value;
        public ushort Id => Handle.Value;
        public Vector3 Position { get; set; } = new Vector3();
        public Vector3 Rotation { get; set; } = new Vector3();
        public float Heading => Rotation.Z;
        public bool IsNull => Handle.IsNull;
        public bool Exists => !IsNull && IsInstanceAlive;
        public bool IsInstanceAlive { get; set; } = true;
        public EntityType Type => Handle.Type;
        public int Transparency { get; set; } = 255;
        public uint Dimension { get; set; }
        public uint Model { get; protected set; }

        public bool HasData(string key) => _data.ContainsKey(key);
        public T? GetData<T>(string key) => _data.TryGetValue(key, out var value) ? ConvertValue<T>(value) : default;
        public void SetData<T>(string key, T value) => _data[key] = value;
        public bool ResetData(string key) => _data.TryRemove(key, out _);
        public void ResetData() => _data.Clear();

        public bool HasSharedData(string key) => _sharedData.ContainsKey(key);
        public T? GetSharedData<T>(string key) => _sharedData.TryGetValue(key, out var value) ? ConvertValue<T>(value) : default;
        public void SetSharedData(string key, object? value)
        {
            _sharedData[key] = value;
            BridgeRuntime.Current.SetSharedData(this, key, value);
        }
        public void SetSharedData(Dictionary<string, object> values)
        {
            foreach (var pair in values) SetSharedData(pair.Key, pair.Value);
        }
        public void ResetSharedData(string key)
        {
            _sharedData.TryRemove(key, out _);
            BridgeRuntime.Current.ResetSharedData(this, key);
        }

        public virtual void Delete() => IsInstanceAlive = false;
        public bool Equals(Entity? other) => other != null && Handle.Equals(other.Handle);
        public override bool Equals(object? obj) => Equals(obj as Entity);
        public override int GetHashCode() => Handle.GetHashCode();
        public static bool operator ==(Entity? left, Entity? right) => Equals(left, right);
        public static bool operator !=(Entity? left, Entity? right) => !Equals(left, right);

        private static T? ConvertValue<T>(object? value)
        {
            if (value == null) return default;
            if (value is T typed) return typed;
            return (T)Convert.ChangeType(value, typeof(T));
        }
    }

    public class Player : Entity
    {
        public Player(NetHandle handle) : base(handle) { }
        public string Name { get; set; } = string.Empty;
        public string Serial { get; internal set; } = string.Empty;
        public string SocialClubName { get; internal set; } = string.Empty;
        public ulong SocialClubId { get; internal set; }
        public int Ping { get; internal set; }
        public int Health { get; set; } = 100;
        public int Armor { get; set; }
        public bool OutgoingSyncDisabled { get; set; }
        public bool IsInVehicle => Vehicle != null;
        public Vehicle? Vehicle { get; internal set; }
        public int VehicleSeat { get; internal set; } = -1;

        public void TriggerEvent(string eventName, params object[] arguments) =>
            BridgeRuntime.Current.TriggerClientEvent(this, eventName, arguments);
        public Task<object?> TriggerProcedure(string eventName, params object[] arguments) =>
            System.Threading.Tasks.Task.FromResult<object?>(null);
        public void SendChatMessage(string message) => BridgeRuntime.Current.SendChatMessage(this, message);
        public void SendChatMessage(string sender, string message) => SendChatMessage(sender + ": " + message);
        public void Kick(string reason) => BridgeRuntime.Current.Kick(this, reason);
        public void Kick() => Kick(string.Empty);
    }

    public class Vehicle : Entity
    {
        public Vehicle(NetHandle handle) : base(handle) { }
        public string NumberPlate { get; set; } = string.Empty;
        public bool EngineStatus { get; set; }
        public bool Locked { get; set; }
        public float Health { get; set; } = 1000f;
        public int PrimaryColor { get; set; }
        public int SecondaryColor { get; set; }
        public bool Siren { get; internal set; }
        public List<Entity> Occupants { get; } = new List<Entity>();
        public void Repair() => Health = 1000f;
    }
}
