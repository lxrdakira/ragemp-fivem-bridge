using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Reflection;
using Newtonsoft.Json.Linq;

namespace GTANetworkAPI
{
    internal static class VehicleClassCatalog
    {
        private const string ResourceName = "RageMP.FiveM.Bridge.vehicleData.json";
        private static readonly Lazy<IReadOnlyDictionary<uint, int>> Classes =
            new Lazy<IReadOnlyDictionary<uint, int>>(Load, true);

        public static int Get(uint model) => Classes.Value.TryGetValue(model, out var vehicleClass) ? vehicleClass : -1;

        private static IReadOnlyDictionary<uint, int> Load()
        {
            var assembly = typeof(VehicleClassCatalog).GetTypeInfo().Assembly;
            using (var stream = assembly.GetManifestResourceStream(ResourceName))
            {
                if (stream == null) return new Dictionary<uint, int>();
                using (var reader = new StreamReader(stream))
                {
                    var root = JObject.Parse(reader.ReadToEnd());
                    var result = new Dictionary<uint, int>(root.Count);
                    foreach (var property in root.Properties())
                    {
                        if (!uint.TryParse(property.Name, NumberStyles.None, CultureInfo.InvariantCulture, out var hash)) continue;
                        var vehicleClass = property.Value["VehicleClass"]?.Value<int>();
                        if (vehicleClass.HasValue) result[hash] = vehicleClass.Value;
                    }
                    return result;
                }
            }
        }
    }
}
