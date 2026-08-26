using System;
using System.Globalization;
using Newtonsoft.Json;

namespace GTANetworkAPI
{
    public struct HeadBlend
    {
        public byte ShapeFirst;
        public byte ShapeSecond;
        public byte ShapeThird;
        public byte SkinFirst;
        public byte SkinSecond;
        public byte SkinThird;
        public float ShapeMix;
        public float SkinMix;
        public float ThirdMix;
    }

    public struct HeadOverlay
    {
        public byte Index;
        public float Opacity;
        public byte Color;
        public byte SecondaryColor;
    }

    public struct Decoration
    {
        public uint Collection;
        public uint Overlay;
    }

    public struct Quaternion
    {
        public Quaternion(float x, float y, float z, float w) { X = x; Y = y; Z = z; W = w; }
        public Quaternion(double x, double y, double z, double w) : this((float)x, (float)y, (float)z, (float)w) { }
        public float X { get; set; }
        public float Y { get; set; }
        public float Z { get; set; }
        public float W { get; set; }
        [JsonIgnore]
        public Quaternion Normalized
        {
            get
            {
                var length = (float)Math.Sqrt(X * X + Y * Y + Z * Z + W * W);
                return length <= float.Epsilon ? this : new Quaternion(X / length, Y / length, Z / length, W / length);
            }
        }
    }

    public sealed class ComponentVariation
    {
        public ComponentVariation() : this(0, 0, 0) { }
        public ComponentVariation(int drawable) : this(drawable, 0, 0) { }
        public ComponentVariation(int drawable, int texture) : this(drawable, texture, 0) { }
        public ComponentVariation(int drawable, int texture, int palette)
        {
            Drawable = drawable;
            Texture = texture;
            Palette = palette;
        }

        public int Drawable;
        public int Texture;
        public int Palette;

        public int ToInt32() => (Drawable & 0xffff) | ((Texture & 0xff) << 16) | ((Palette & 0xff) << 24);
    }

    public sealed class NetHandle : IEquatable<NetHandle>
    {
        public NetHandle(ushort value, EntityType type)
        {
            Value = value;
            Type = type;
        }

        public bool IsNull => Value == 0;
        public ushort Value { get; set; }
        public EntityType Type { get; set; }

        public bool Equals(NetHandle? other) => other != null && Value == other.Value && Type == other.Type;
        public override bool Equals(object? obj) => Equals(obj as NetHandle);
        public override int GetHashCode() => ((int)Type * 397) ^ Value;
        public static implicit operator ushort(NetHandle handle) => handle.Value;
    }

    public sealed class Color
    {
        public Color() : this(0, 0, 0, 255) { }
        public Color(int red, int green, int blue) : this(red, green, blue, 255) { }
        public Color(int red, int green, int blue, int alpha)
        {
            Red = red; Green = green; Blue = blue; Alpha = alpha;
        }
        public Color(int argb)
        {
            Alpha = (argb >> 24) & 0xff;
            Red = (argb >> 16) & 0xff;
            Green = (argb >> 8) & 0xff;
            Blue = argb & 0xff;
        }
        public int Red;
        public int Green;
        public int Blue;
        public int Alpha;
    }

    public sealed class Vector3 : IEquatable<Vector3>
    {
        public Vector3() { }
        public Vector3(float x, float y, float z) { X = x; Y = y; Z = z; }
        public Vector3(double x, double y, double z) : this((float)x, (float)y, (float)z) { }

        public float X { get; set; }
        public float Y { get; set; }
        public float Z { get; set; }
        [JsonIgnore]
        public Vector3 Normalized { get { var copy = Copy(); copy.Normalize(); return copy; } }

        public static Vector3 operator +(Vector3 left, Vector3 right) => left.Add(right);
        public static Vector3 operator -(Vector3 left, Vector3 right) => left.Subtract(right);
        public static Vector3 operator *(Vector3 value, float scalar) => value.Multiply(scalar);
        public static Vector3 operator /(Vector3 value, float scalar) => value.Divide(scalar);
        public static bool operator ==(Vector3? left, Vector3? right) => Equals(left, right);
        public static bool operator !=(Vector3? left, Vector3? right) => !Equals(left, right);

        public static Vector3 Lerp(Vector3 start, Vector3 end, float amount) => start + (end - start) * amount;
        public static float Distance(Vector3 first, Vector3 second) => first.DistanceTo(second);
        public static float DistanceSquared(Vector3 first, Vector3 second) => first.DistanceToSquared(second);
        public float LengthSquared() => X * X + Y * Y + Z * Z;
        public float Length() => (float)Math.Sqrt(LengthSquared());
        public void Normalize()
        {
            var length = Length();
            if (length <= float.Epsilon) return;
            X /= length; Y /= length; Z /= length;
        }
        public Vector3 Add(Vector3 value) => new Vector3(X + value.X, Y + value.Y, Z + value.Z);
        public Vector3 Subtract(Vector3 value) => new Vector3(X - value.X, Y - value.Y, Z - value.Z);
        public Vector3 Multiply(float scalar) => new Vector3(X * scalar, Y * scalar, Z * scalar);
        public Vector3 Divide(float scalar) => new Vector3(X / scalar, Y / scalar, Z / scalar);
        public Vector3 Copy() => new Vector3(X, Y, Z);
        public float DistanceToSquared(Vector3 value)
        {
            var dx = X - value.X; var dy = Y - value.Y; var dz = Z - value.Z;
            return dx * dx + dy * dy + dz * dz;
        }
        public float DistanceTo(Vector3 value) => (float)Math.Sqrt(DistanceToSquared(value));
        public float DistanceToSquared2D(Vector3 value)
        {
            var dx = X - value.X; var dy = Y - value.Y;
            return dx * dx + dy * dy;
        }
        public float DistanceTo2D(Vector3 value) => (float)Math.Sqrt(DistanceToSquared2D(value));
        public Vector3 Around(float radius)
        {
            var angle = (float)(new Random().NextDouble() * Math.PI * 2);
            var distance = (float)new Random().NextDouble() * radius;
            return new Vector3(X + (float)Math.Cos(angle) * distance, Y + (float)Math.Sin(angle) * distance, Z);
        }
        public bool Equals(Vector3? other) => other != null && X.Equals(other.X) && Y.Equals(other.Y) && Z.Equals(other.Z);
        public override bool Equals(object? obj) => Equals(obj as Vector3);
        public override int GetHashCode() => ((X.GetHashCode() * 397) ^ Y.GetHashCode()) * 397 ^ Z.GetHashCode();
        public override string ToString() => string.Format(CultureInfo.InvariantCulture, "X: {0} Y: {1} Z: {2}", X, Y, Z);
    }
}
