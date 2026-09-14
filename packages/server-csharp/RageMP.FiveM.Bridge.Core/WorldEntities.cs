namespace GTANetworkAPI
{
    public class ColShape : Entity
    {
        private const float RageGroundZCompensation = 1.12f;
        public delegate void ColShapeEvent(ColShape shape, Player player);
        public ColShape(NetHandle handle) : base(handle) { }
        public event ColShapeEvent? OnEntityEnterColShape;
        public event ColShapeEvent? OnEntityExitColShape;
        public string ShapeType { get; internal set; } = "sphere";
        public float Radius { get; internal set; }
        public float Height { get; internal set; }
        public float Width { get; internal set; }
        public float Depth { get; internal set; }
        public virtual bool IsPointWithin(Vector3 point)
        {
            if (IsPointWithinRaw(point)) return true;
            // The migrated dataset contains both raw RAGE player-origin Z and
            // already ground-corrected Z. Match the client bridge by accepting
            // either vertical convention without widening X/Y interaction.
            return IsPointWithinRaw(new Vector3(point.X, point.Y, point.Z - RageGroundZCompensation))
                || IsPointWithinRaw(new Vector3(point.X, point.Y, point.Z + RageGroundZCompensation));
        }

        private bool IsPointWithinRaw(Vector3 point)
        {
            var dx = point.X - Position.X;
            var dy = point.Y - Position.Y;
            var dz = point.Z - Position.Z;
            if (ShapeType == "circle") return dx * dx + dy * dy <= Radius * Radius;
            if (ShapeType == "tube") return dx * dx + dy * dy <= Radius * Radius && dz >= 0 && dz <= Height;
            if (ShapeType == "rectangle") return dx >= 0 && dx <= Width && dy >= 0 && dy <= Height;
            if (ShapeType == "cuboid") return dx >= 0 && dx <= Width && dy >= 0 && dy <= Depth && dz >= 0 && dz <= Height;
            return dx * dx + dy * dy + dz * dz <= Radius * Radius;
        }
        public void RaiseEnter(Player player) => OnEntityEnterColShape?.Invoke(this, player);
        public void RaiseExit(Player player) => OnEntityExitColShape?.Invoke(this, player);
    }

    public class Blip : Entity
    {
        public Blip(NetHandle handle) : base(handle) { }
        private int _color; private string _name = string.Empty; private bool _shortRange; private uint _sprite; private float _scale = 1f; private float _drawDistance; private short _blipRotation;
        public int Color { get => _color; set { _color = value; SyncNetworkState(); } }
        public string Name { get => _name; set { _name = value ?? string.Empty; SyncNetworkState(); } }
        public bool ShortRange { get => _shortRange; set { _shortRange = value; SyncNetworkState(); } }
        public uint Sprite { get => _sprite; set { _sprite = value; SyncNetworkState(); } }
        public float Scale { get => _scale; set { _scale = value; SyncNetworkState(); } }
        public float DrawDistance { get => _drawDistance; internal set { _drawDistance = value; SyncNetworkState(); } }
        public short BlipRotation { get => _blipRotation; internal set { _blipRotation = value; SyncNetworkState(); } }
        public bool RouteVisible { get; set; }
        public int RouteColor { get; set; }
    }

    public class Marker : Entity
    {
        public Marker(NetHandle handle) : base(handle) { }
        private uint _markerType; private float _scale = 1f; private Vector3 _direction = new Vector3(); private Color _color = new Color(255, 255, 255);
        public uint MarkerType { get => _markerType; set { _markerType = value; SyncNetworkState(); } }
        public float Scale { get => _scale; set { _scale = value; SyncNetworkState(); } }
        public Vector3 Direction { get => _direction; set { _direction = value ?? new Vector3(); SyncNetworkState(); } }
        public Color Color { get => _color; set { _color = value ?? new Color(); SyncNetworkState(); } }
    }

    public class TextLabel : Entity
    {
        public TextLabel(NetHandle handle) : base(handle) { }
        private string _text = string.Empty; private Color _color = new Color(255, 255, 255); private bool _seethrough; private float _range; private float _size = 0.35f;
        public string Text { get => _text; set { _text = value ?? string.Empty; SyncNetworkState(); } }
        public Color Color { get => _color; set { _color = value ?? new Color(); SyncNetworkState(); } }
        public bool Seethrough { get => _seethrough; set { _seethrough = value; SyncNetworkState(); } }
        public float Range { get => _range; set { _range = value; SyncNetworkState(); } }
        public float Size { get => _size; set { _size = value; SyncNetworkState(); } }
        public int Font { get; internal set; }
    }

    public class Checkpoint : Entity
    {
        public Checkpoint(NetHandle handle) : base(handle) { }
        public float Scale { get; set; } = 1f;
        public Vector3 Direction { get; set; } = new Vector3();
        public Color Color { get; set; } = new Color(255, 255, 255);
    }

    public class DummyEntity : Entity
    {
        public DummyEntity(NetHandle handle) : base(handle) { }
        public int DummyType { get; set; }
    }

    public class Object : Entity
    {
        public Object(NetHandle handle) : base(handle) { }
    }

    public class Ped : Entity
    {
        public Ped(NetHandle handle) : base(handle) { }
        private Player? _controller;
        public bool Dynamic { get; internal set; }
        public bool Invincible { get; internal set; }
        public bool Frozen { get; internal set; }
        public bool ControlLocked { get; internal set; }
        public Player? Controller
        {
            get => _controller;
            set
            {
                _controller = value;
                ReapplyController();
            }
        }

        internal void ReapplyController()
        {
            if (_controller != null && NetworkId != 0)
                _controller.TriggerEvent("ragemp:requestEntityControl", NetworkId);
        }
    }

    public class Pickup : Entity
    {
        public Pickup(NetHandle handle) : base(handle) { }
        public int Amount { get; internal set; }
        public uint CustomModel { get; internal set; }
        public bool PickedUp { get; internal set; }
        public void Respawn() => PickedUp = false;
    }
}

// Several legacy files import this namespace for the concrete NAPI service
// implementations. Public compatibility types live in GTANetworkAPI, while the
// bridge host supplies their FiveM-backed behavior.
namespace GTANetworkMethods
{
    internal static class BridgeCompatibilityNamespace { }
}
