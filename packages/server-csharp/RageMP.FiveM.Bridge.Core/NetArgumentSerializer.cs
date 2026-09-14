using System;
using System.Collections;
using System.Collections.Generic;
using GTANetworkAPI;

namespace RageMP.FiveM.Bridge
{
    public static class NetArgumentSerializer
    {
        public static object[] Sanitize(object[] arguments)
        {
            if (arguments == null || arguments.Length == 0) return arguments ?? Array.Empty<object>();
            var result = new object[arguments.Length];
            var seen = new HashSet<object>(ReferenceComparer.Instance);
            for (var index = 0; index < arguments.Length; index++)
                result[index] = SanitizeValue(arguments[index], seen)!;
            return result;
        }

        private static object? SanitizeValue(object? value, HashSet<object> seen)
        {
            if (value == null || value is string || value.GetType().IsValueType) return value;
            // CitizenFX's fallback object serializer reflects every public
            // property. GTANetworkAPI.Vector3 has a computed Normalized property
            // returning another Vector3, which causes unbounded recursion and an
            // unmanaged Mono stack overflow. RAGE sends vectors as plain XYZ
            // objects, so materialize that wire contract explicitly.
            if (value is Vector3 vector)
            {
                return new Dictionary<string, object>
                {
                    ["X"] = vector.X,
                    ["Y"] = vector.Y,
                    ["Z"] = vector.Z
                };
            }
            if (value is Color color)
            {
                return new Dictionary<string, object>
                {
                    ["Red"] = color.Red,
                    ["Green"] = color.Green,
                    ["Blue"] = color.Blue,
                    ["Alpha"] = color.Alpha
                };
            }
            if (value is NetHandle handle) return SanitizeValue(RAGE.Entities.Resolve(handle), seen);
            if (value is Entity entity) return EntityReference(entity);
            if (!seen.Add(value)) return null;

            try
            {
                if (value is IDictionary dictionary)
                {
                    var output = new Dictionary<string, object?>();
                    foreach (DictionaryEntry entry in dictionary)
                        output[Convert.ToString(entry.Key) ?? string.Empty] = SanitizeValue(entry.Value, seen);
                    return output;
                }

                if (value is IEnumerable enumerable)
                {
                    var output = new List<object?>();
                    foreach (var entry in enumerable) output.Add(SanitizeValue(entry, seen));
                    return output;
                }

                return value;
            }
            finally
            {
                seen.Remove(value);
            }
        }

        private static Dictionary<string, object> EntityReference(Entity entity)
        {
            var type = entity.Type == EntityType.TextLabel
                ? "textlabel"
                : entity.Type == EntityType.DummyEntity
                    ? "dummy"
                    : entity.Type.ToString().ToLowerInvariant();
            var reference = new Dictionary<string, object>
            {
                ["__mpRef"] = type,
                ["id"] = entity.Id
            };
            if (entity is Player) reference["netId"] = entity.Id;
            else if (entity.NetworkId != 0) reference["netId"] = entity.NetworkId;
            return reference;
        }

        private sealed class ReferenceComparer : IEqualityComparer<object>
        {
            public static readonly ReferenceComparer Instance = new ReferenceComparer();
            public new bool Equals(object? x, object? y) => ReferenceEquals(x, y);
            public int GetHashCode(object obj) => System.Runtime.CompilerServices.RuntimeHelpers.GetHashCode(obj);
        }
    }
}
