using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using RageMP.FiveM.Bridge;

namespace GTANetworkAPI
{
    public class Entity : IEquatable<Entity>
    {
        private readonly ConcurrentDictionary<string, object?> _data = new ConcurrentDictionary<string, object?>();
        private readonly ConcurrentDictionary<string, object?> _sharedData = new ConcurrentDictionary<string, object?>();
        private Vector3 _position = new Vector3();
        private Vector3 _rotation = new Vector3();
        private int _transparency = 255;
        private uint _dimension;

        public Entity(NetHandle handle) => Handle = handle ?? throw new ArgumentNullException(nameof(handle));

        public NetHandle Handle { get; set; }
        public NetHandle HandleCopy => new NetHandle(Handle.Value, Handle.Type);
        public int HashCode => GetHashCode();
        public int Value => Handle.Value;
        public ushort Id => Handle.Value;
        public virtual Vector3 Position { get => _position; set { _position = value ?? new Vector3(); SyncNetworkState(); } }
        public virtual Vector3 Rotation { get => _rotation; set { _rotation = value ?? new Vector3(); SyncNetworkState(); } }
        public float Heading { get => Rotation.Z; set => Rotation = new Vector3(Rotation.X, Rotation.Y, value); }
        public bool IsNull => Handle.IsNull;
        public bool Exists => !IsNull && IsInstanceAlive;
        public bool IsInstanceAlive { get; set; } = true;
        public EntityType Type => Handle.Type;
        public virtual int Transparency { get => _transparency; set { _transparency = value; SyncNetworkState(); } }
        public virtual uint Dimension { get => _dimension; set { _dimension = value; SyncNetworkState(); } }
        public uint Model { get; protected set; }
        public void SetModelInternal(uint model) => Model = model;
        public int NativeHandle { get; internal set; }
        public int NetworkId { get; internal set; }
        internal bool NetworkPublished { get; set; }
        protected void SyncNetworkState() => EntityNetworkSync.Update(this);

        internal void ApplyNetworkTransform(Vector3 position, Vector3 rotation, uint dimension)
        {
            _position = position ?? new Vector3();
            _rotation = rotation ?? new Vector3();
            _dimension = dimension;
        }

        public bool HasData(string key) => _data.ContainsKey(key);
        public T? GetData<T>(string key) => _data.TryGetValue(key, out var value) ? ConvertValue<T>(value) : default;
        public void SetData<T>(string key, T value)
        {
            if (value == null) _data.TryRemove(key, out _);
            else _data[key] = value;
        }
        internal string[] GetAllDataKeys() => _data.Keys.ToArray();
        public bool ResetData(string key) => _data.TryRemove(key, out _);
        public void ResetData() => _data.Clear();

        public bool HasSharedData(string key) => _sharedData.ContainsKey(key);
        public T? GetSharedData<T>(string key) => _sharedData.TryGetValue(key, out var value) ? ConvertValue<T>(value) : default;
        internal IEnumerable<KeyValuePair<string, object?>> GetAllSharedData() => _sharedData.ToArray();
        public void SetSharedData(string key, object? value)
        {
            if (value == null)
            {
                ResetSharedData(key);
                return;
            }
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

        public virtual void Delete()
        {
            if (!IsInstanceAlive) return;
            IsInstanceAlive = false;
            EntityNetworkSync.Destroy(this);
        }
        public bool Equals(Entity? other) => other != null && Handle.Equals(other.Handle);
        public override bool Equals(object? obj) => Equals(obj as Entity);
        public override int GetHashCode() => Handle.GetHashCode();
        public static bool operator ==(Entity? left, Entity? right) => Equals(left, right);
        public static bool operator !=(Entity? left, Entity? right) => !Equals(left, right);
        public static implicit operator NetHandle(Entity entity) => entity.Handle;

        private static T? ConvertValue<T>(object? value)
        {
            if (value == null) return default;
            if (value is T typed) return typed;
            return (T)Convert.ChangeType(value, typeof(T));
        }
    }

    public class Player : Entity
    {
        private int _health = 100;
        private int _armor;

        public Player(NetHandle handle) : base(handle) { }
        public string Name { get; set; } = string.Empty;
        public string Serial { get; internal set; } = string.Empty;
        public string SocialClubName { get; internal set; } = string.Empty;
        public ulong SocialClubId { get; internal set; }
        public int Ping { get; internal set; }
        public override Vector3 Position
        {
            get => base.Position;
            set
            {
                base.Position = value;
                var position = base.Position;
                TriggerEvent("ragemp:setPosition", position.X, position.Y, position.Z);
            }
        }
        public override Vector3 Rotation
        {
            get => base.Rotation;
            set
            {
                base.Rotation = value;
                var rotation = base.Rotation;
                TriggerEvent("ragemp:setRotation", rotation.X, rotation.Y, rotation.Z);
            }
        }
        public override int Transparency
        {
            get => base.Transparency;
            set { base.Transparency = value; TriggerEvent("ragemp:setAlpha", value); }
        }
        public override uint Dimension
        {
            get => base.Dimension;
            set
            {
                base.Dimension = value;
                BridgeRuntime.Current.SetPlayerDimension(this, value);
                TriggerEvent("ragemp:setDimension", value);
            }
        }
        public int Health
        {
            get => _health;
            set { _health = value; TriggerEvent("ragemp:setHealth", value); }
        }
        public int Armor
        {
            get => _armor;
            set { _armor = value; TriggerEvent("ragemp:setArmour", value); }
        }
        public bool OutgoingSyncDisabled { get; set; }
        public bool IsInVehicle => Vehicle != null;
        public Vehicle? Vehicle { get; set; }
        public int VehicleSeat { get; set; } = -1;
        public WeaponHash CurrentWeapon { get; internal set; } = WeaponHash.Unarmed;
        public string Address { get; internal set; } = string.Empty;
        public bool IsInCover { get; internal set; }

        public void ApplyPlatformIdentity(string socialClubName, ulong? socialClubId = null, string? serial = null)
        {
            SocialClubName = socialClubName ?? string.Empty;
            if (socialClubId.HasValue) SocialClubId = socialClubId.Value;
            if (serial != null) Serial = serial;
        }

        public void ApplyNetworkState(Vector3 position, float heading, int health, int armor, int ping, uint? dimension = null, bool? isInCover = null)
        {
            base.Position = position;
            base.Rotation = new Vector3(0f, 0f, heading);
            _health = health;
            _armor = armor;
            Ping = ping;
            if (dimension.HasValue) base.Dimension = dimension.Value;
            if (isInCover.HasValue) IsInCover = isInCover.Value;
        }

        public void TriggerEvent(string eventName, params object[] arguments) =>
            BridgeRuntime.Current.TriggerClientEvent(this, eventName, arguments);
        public Task<object?> TriggerProcedure(string eventName, params object[] arguments) =>
            BridgeRuntime.Current.TriggerClientProcedure(this, eventName, arguments);
        public void SendChatMessage(string message) => BridgeRuntime.Current.SendChatMessage(this, message);
        public void SendChatMessage(string sender, string message) => SendChatMessage(sender + ": " + message);
        public void Kick(string reason) => BridgeRuntime.Current.Kick(this, reason);
        public void Kick() => Kick(string.Empty);
        public void Ban(string reason) => Kick(reason);
        public void Ban() => Kick("Banned");
        public void SendNotification(string message, bool flashing = false) => TriggerEvent("ragemp:notify", message);
        public void SetIntoVehicle(NetHandle vehicle, int seat)
        {
            var target = RAGE.Entities.Vehicles.Get(vehicle.Value);
            TriggerEvent("ragemp:putIntoVehicle", target?.NetworkId ?? vehicle.Value, seat);
        }
        public void WarpOutOfVehicle() => TriggerEvent("ragemp:removeFromVehicle");
        public void SetSkin(PedHash model) => SetSkin((uint)model);
        public void SetSkin(uint model) { SetModelInternal(model); TriggerEvent("ragemp:setModel", model); }
        public void PlayAnimation(string dictionary, string name, int flags) => TriggerEvent("ragemp:playAnimation", dictionary, name, 8f, flags);
        public void StopAnimation() => TriggerEvent("ragemp:stopAnimation");
        public void EnableVoiceTo(Player target) => TriggerEvent("ragemp:enableVoiceTo", target.Id);
        public void DisableVoiceTo(Player target) => TriggerEvent("ragemp:disableVoiceTo", target.Id);
        public void SetDecoration(Decoration decoration) => TriggerEvent("ragemp:setDecoration", decoration.Collection, decoration.Overlay);
        public void SetDecoration(Decoration[] decorations) { foreach (var decoration in decorations) SetDecoration(decoration); }
        public void RemoveDecoration(Decoration decoration) => TriggerEvent("ragemp:removeDecoration", decoration.Collection, decoration.Overlay);
        public void RemoveAllWeapons() => TriggerEvent("ragemp:removeAllWeapons");
        public void Eval(string code) => TriggerEvent("ragemp:eval", code);
    }

    public class Vehicle : Entity
    {
        public Vehicle(NetHandle handle) : base(handle) { }
        private string _numberPlate = string.Empty;
        private bool _engineStatus;
        private bool _locked;
        private float _health = 1000f;
        private float _bodyHealth = 1000f;
        private float _engineHealth = 1000f;
        private int _primaryColor;
        private int _secondaryColor;
        private Color _customPrimaryColor = new Color(0, 0, 0);
        private Color _customSecondaryColor = new Color(0, 0, 0);
        private int _numberPlateStyle;
        private int _wheelType;
        private int _windowTint;
        private string? _runtimeDisplayName;
        public string NumberPlate { get => _numberPlate; set { _numberPlate = value ?? string.Empty; SyncNetworkState(); } }
        public bool EngineStatus { get => _engineStatus; set { _engineStatus = value; SyncNetworkState(); } }
        public bool Locked { get => _locked; set { _locked = value; SyncNetworkState(); } }
        public float Health
        {
            get => _health;
            set { _health = value; _bodyHealth = value; _engineHealth = value; SyncNetworkState(); }
        }
        public float BodyHealth { get => _bodyHealth; set { _bodyHealth = value; SyncNetworkState(); } }
        public float EngineHealth { get => _engineHealth; set { _engineHealth = value; SyncNetworkState(); } }
        public int PrimaryColor { get => _primaryColor; set { _primaryColor = value; SyncNetworkState(); } }
        public int SecondaryColor { get => _secondaryColor; set { _secondaryColor = value; SyncNetworkState(); } }
        public bool Siren { get; internal set; }
        public List<Entity> Occupants { get; } = new List<Entity>();
        public Color CustomPrimaryColor { get => _customPrimaryColor; set { _customPrimaryColor = value ?? new Color(0, 0, 0); HasCustomColors = true; SyncNetworkState(); } }
        public Color CustomSecondaryColor { get => _customSecondaryColor; set { _customSecondaryColor = value ?? new Color(0, 0, 0); HasCustomColors = true; SyncNetworkState(); } }
        public int NumberPlateStyle { get => _numberPlateStyle; set { _numberPlateStyle = value; SyncNetworkState(); } }
        public int WheelType { get => _wheelType; set { _wheelType = value; SyncNetworkState(); } }
        public int WindowTint { get => _windowTint; set { _windowTint = value; SyncNetworkState(); } }
        internal bool HasCustomColors { get; private set; }
        internal bool NeonEnabled { get; set; }
        internal Color NeonColor { get; set; } = new Color(255, 255, 255);
        internal Dictionary<int, int> Mods { get; } = new Dictionary<int, int>();
        public string DisplayName => _runtimeDisplayName ?? VehicleClassCatalog.GetDisplayName(Model);
        public int Class { get; internal set; }
        public void Repair() { _health = 1000f; _bodyHealth = 1000f; _engineHealth = 1000f; SyncNetworkState(); }
        public void ApplyNetworkHealth(float health, float bodyHealth, float engineHealth)
        {
            _health = health;
            _bodyHealth = bodyHealth;
            _engineHealth = engineHealth;
        }
        public void ApplyNetworkMetadata(int vehicleClass, string? displayName)
        {
            if (vehicleClass >= 0) Class = vehicleClass;
            if (!string.IsNullOrWhiteSpace(displayName)) _runtimeDisplayName = displayName;
        }
        internal void ResetNetworkMetadata() => _runtimeDisplayName = null;
        public void SetMod(int modType, int modIndex) { Mods[modType] = modIndex; SyncNetworkState(); }
    }
}
