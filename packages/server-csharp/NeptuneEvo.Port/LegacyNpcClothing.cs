using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace NeptuneEvo.PortCompatibility
{
    internal static class LegacyNpcClothing
    {
        private const uint MaleFreemode = 1885233650;

        // Only raw legacy NPC presets pass through here, not the migrated DB
        // catalog or player outfits. Key 0 in pedClothes means a hat prop.
        internal static string Translate(uint model, string json)
        {
            if (model != MaleFreemode || string.IsNullOrWhiteSpace(json)) return json;
            var clothes = JObject.Parse(json);
            Shift(clothes, "11", 599, 153, 14);
            Shift(clothes, "7", 201, 172, 2);
            Shift(clothes, "8", 218, 8, 4);
            Shift(clothes, "4", 225, 83, 5);
            Shift(clothes, "1", 252, 29, -3);
            Shift(clothes, "0", 255, 48, -8);
            return clothes.ToString(Formatting.None);
        }

        private static void Shift(JObject clothes, string key, int start, int count, int offset)
        {
            var parts = clothes[key] as JArray;
            if (parts == null || parts.Count < 2 || parts[0].Type != JTokenType.Integer) return;
            var drawable = parts[0].Value<int>();
            if (drawable >= start && drawable < start + count) parts[0] = drawable + offset;
        }
    }
}
