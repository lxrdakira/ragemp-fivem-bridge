namespace GTANetworkAPI
{
    public class ColShape : Entity
    {
        public delegate void ColShapeEvent(ColShape shape, Player player);
        public ColShape(NetHandle handle) : base(handle) { }
        public event ColShapeEvent? OnEntityEnterColShape;
        public event ColShapeEvent? OnEntityExitColShape;
        public virtual bool IsPointWithin(Vector3 point) => false;
        public void RaiseEnter(Player player) => OnEntityEnterColShape?.Invoke(this, player);
        public void RaiseExit(Player player) => OnEntityExitColShape?.Invoke(this, player);
    }

    public class Blip : Entity
    {
        public Blip(NetHandle handle) : base(handle) { }
        public int Color { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool ShortRange { get; set; }
        public uint Sprite { get; set; }
        public float Scale { get; set; } = 1f;
        public bool RouteVisible { get; set; }
        public int RouteColor { get; set; }
    }

    public class Marker : Entity
    {
        public Marker(NetHandle handle) : base(handle) { }
        public uint MarkerType { get; set; }
        public float Scale { get; set; } = 1f;
        public Vector3 Direction { get; set; } = new Vector3();
        public Color Color { get; set; } = new Color(255, 255, 255);
    }

    public class TextLabel : Entity
    {
        public TextLabel(NetHandle handle) : base(handle) { }
        public string Text { get; set; } = string.Empty;
        public Color Color { get; set; } = new Color(255, 255, 255);
        public bool Seethrough { get; set; }
        public float Range { get; set; }
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
        public Player? Controller { get; set; }
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
