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
        private static readonly Lazy<IReadOnlyDictionary<uint, VehicleCatalogEntry>> Entries =
            new Lazy<IReadOnlyDictionary<uint, VehicleCatalogEntry>>(Load, true);

        public static int Get(uint model) => Entries.Value.TryGetValue(model, out var entry) ? entry.Class : -1;
        public static string GetDisplayName(uint model) =>
            Entries.Value.TryGetValue(model, out var entry) && !string.IsNullOrWhiteSpace(entry.DisplayName)
                ? entry.DisplayName
                : model.ToString(CultureInfo.InvariantCulture);

        private static IReadOnlyDictionary<uint, VehicleCatalogEntry> Load()
        {
            var assembly = typeof(VehicleClassCatalog).GetTypeInfo().Assembly;
            using (var stream = assembly.GetManifestResourceStream(ResourceName))
            {
                if (stream == null) return new Dictionary<uint, VehicleCatalogEntry>();
                using (var reader = new StreamReader(stream))
                {
                    var root = JObject.Parse(reader.ReadToEnd());
                    var result = new Dictionary<uint, VehicleCatalogEntry>(root.Count);
                    foreach (var property in root.Properties())
                    {
                        if (!uint.TryParse(property.Name, NumberStyles.None, CultureInfo.InvariantCulture, out var hash)) continue;
                        var vehicleClass = property.Value["VehicleClass"]?.Value<int>();
                        if (vehicleClass.HasValue)
                            result[hash] = new VehicleCatalogEntry(vehicleClass.Value, property.Value["DisplayName"]?.Value<string>() ?? string.Empty);
                    }
                    return result;
                }
            }
        }

        private sealed class VehicleCatalogEntry
        {
            public VehicleCatalogEntry(int vehicleClass, string displayName)
            {
                Class = vehicleClass;
                DisplayName = displayName;
            }

            public int Class { get; }
            public string DisplayName { get; }
        }
    }
}
