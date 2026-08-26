using System;
using System.Collections.Generic;

namespace System
{
    internal readonly struct Index
    {
        public Index(int value, bool fromEnd = false) { Value = value; IsFromEnd = fromEnd; }
        public int Value { get; }
        public bool IsFromEnd { get; }
        public int GetOffset(int length) => IsFromEnd ? length - Value : Value;
        public static implicit operator Index(int value) => new Index(value);
    }

    internal static class StringCompatibilityExtensions
    {
        public static bool Contains(this string value, char character) => value.IndexOf(character) >= 0;
        public static bool Contains(this string value, string search, StringComparison comparison) => value.IndexOf(search, comparison) >= 0;
        public static string[] Split(this string value, string separator) => value.Split(new[] { separator }, StringSplitOptions.None);
        public static string[] Split(this string value, string separator, StringSplitOptions options) => value.Split(new[] { separator }, options);
        public static string[] Split(this string value, char separator, StringSplitOptions options) => value.Split(new[] { separator }, options);
    }
}

namespace System.Linq
{
    internal static class EnumerableCompatibilityExtensions
    {
        public static HashSet<T> ToHashSet<T>(this IEnumerable<T> source) => new HashSet<T>(source);
        public static HashSet<T> ToHashSet<T>(this IEnumerable<T> source, IEqualityComparer<T> comparer) => new HashSet<T>(source, comparer);
    }
}

namespace System.Collections.Generic
{
    internal static class DictionaryCompatibilityExtensions
    {
        public static bool TryAdd<TKey, TValue>(this IDictionary<TKey, TValue> dictionary, TKey key, TValue value)
        {
            if (dictionary.ContainsKey(key)) return false;
            dictionary.Add(key, value);
            return true;
        }

        public static TValue GetValueOrDefault<TKey, TValue>(this IDictionary<TKey, TValue> dictionary, TKey key)
            => dictionary.TryGetValue(key, out var value) ? value : default;

        public static TValue GetValueOrDefault<TKey, TValue>(this IDictionary<TKey, TValue> dictionary, TKey key, TValue defaultValue)
            => dictionary.TryGetValue(key, out var value) ? value : defaultValue;

        public static void Deconstruct<TKey, TValue>(this KeyValuePair<TKey, TValue> pair, out TKey key, out TValue value)
        {
            key = pair.Key;
            value = pair.Value;
        }
    }
}

namespace NeptuneEvo
{
    internal static class Enum
    {
        public static object Parse(Type enumType, string value) => System.Enum.Parse(enumType, value);
        public static object Parse(Type enumType, string value, bool ignoreCase) => System.Enum.Parse(enumType, value, ignoreCase);
        public static T Parse<T>(string value) where T : struct => (T)System.Enum.Parse(typeof(T), value);
        public static T Parse<T>(string value, bool ignoreCase) where T : struct => (T)System.Enum.Parse(typeof(T), value, ignoreCase);
        public static bool TryParse(Type enumType, string value, out object result)
        {
            try { result = System.Enum.Parse(enumType, value); return true; }
            catch { result = null; return false; }
        }
        public static bool TryParse<T>(string value, out T result) where T : struct => System.Enum.TryParse(value, out result);
        public static bool TryParse<T>(string value, bool ignoreCase, out T result) where T : struct => System.Enum.TryParse(value, ignoreCase, out result);
        public static Array GetValues(Type enumType) => System.Enum.GetValues(enumType);
        public static string[] GetNames(Type enumType) => System.Enum.GetNames(enumType);
        public static string GetName(Type enumType, object value) => System.Enum.GetName(enumType, value);
        public static bool IsDefined(Type enumType, object value) => System.Enum.IsDefined(enumType, value);
    }

    internal static class Math
    {
        public const double PI = System.Math.PI;
        public static int Clamp(int value, int min, int max) => value < min ? min : value > max ? max : value;
        public static long Clamp(long value, long min, long max) => value < min ? min : value > max ? max : value;
        public static float Clamp(float value, float min, float max) => value < min ? min : value > max ? max : value;
        public static double Clamp(double value, double min, double max) => value < min ? min : value > max ? max : value;
        public static int Abs(int value) => System.Math.Abs(value);
        public static long Abs(long value) => System.Math.Abs(value);
        public static float Abs(float value) => System.Math.Abs(value);
        public static double Abs(double value) => System.Math.Abs(value);
        public static decimal Abs(decimal value) => System.Math.Abs(value);
        public static double Atan2(double y, double x) => System.Math.Atan2(y, x);
        public static double Ceiling(double value) => System.Math.Ceiling(value);
        public static decimal Ceiling(decimal value) => System.Math.Ceiling(value);
        public static double Cos(double value) => System.Math.Cos(value);
        public static double Floor(double value) => System.Math.Floor(value);
        public static decimal Floor(decimal value) => System.Math.Floor(value);
        public static int Max(int left, int right) => System.Math.Max(left, right);
        public static ushort Max(ushort left, ushort right) => left > right ? left : right;
        public static long Max(long left, long right) => System.Math.Max(left, right);
        public static float Max(float left, float right) => System.Math.Max(left, right);
        public static double Max(double left, double right) => System.Math.Max(left, right);
        public static decimal Max(decimal left, decimal right) => System.Math.Max(left, right);
        public static int Min(int left, int right) => System.Math.Min(left, right);
        public static ushort Min(ushort left, ushort right) => left < right ? left : right;
        public static long Min(long left, long right) => System.Math.Min(left, right);
        public static float Min(float left, float right) => System.Math.Min(left, right);
        public static double Min(double left, double right) => System.Math.Min(left, right);
        public static decimal Min(decimal left, decimal right) => System.Math.Min(left, right);
        public static double Pow(double value, double power) => System.Math.Pow(value, power);
        public static double Round(double value) => System.Math.Round(value);
        public static double Round(double value, int digits) => System.Math.Round(value, digits);
        public static double Round(double value, MidpointRounding mode) => System.Math.Round(value, mode);
        public static double Round(double value, int digits, MidpointRounding mode) => System.Math.Round(value, digits, mode);
        public static decimal Round(decimal value) => System.Math.Round(value);
        public static decimal Round(decimal value, int digits) => System.Math.Round(value, digits);
        public static double Sin(double value) => System.Math.Sin(value);
        public static double Sqrt(double value) => System.Math.Sqrt(value);
        public static double Truncate(double value) => System.Math.Truncate(value);
        public static decimal Truncate(decimal value) => System.Math.Truncate(value);
    }
}

namespace System.Collections.Concurrent
{
    internal static class ConcurrentDictionaryCompatibilityExtensions
    {
        public static TValue GetValueOrDefault<TKey, TValue>(this ConcurrentDictionary<TKey, TValue> dictionary, TKey key)
            => dictionary.TryGetValue(key, out var value) ? value : default;
    }
}

namespace NeptuneEvo.Cases
{
    internal static class RandomNumberGenerator
    {
        public static int GetInt32(int fromInclusive, int toExclusive)
        {
            if (fromInclusive >= toExclusive) throw new ArgumentOutOfRangeException(nameof(fromInclusive));
            var range = (uint)(toExclusive - fromInclusive);
            var limit = uint.MaxValue - (uint.MaxValue % range);
            var bytes = new byte[4];
            uint value;
            using (var generator = System.Security.Cryptography.RandomNumberGenerator.Create())
            {
                do { generator.GetBytes(bytes); value = BitConverter.ToUInt32(bytes, 0); } while (value >= limit);
            }
            return fromInclusive + (int)(value % range);
        }
    }
}
