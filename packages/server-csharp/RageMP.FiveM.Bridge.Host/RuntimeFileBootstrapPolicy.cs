using System;
using System.IO;

namespace RageMP.FiveM.Bridge.Host
{
    internal static class RuntimeFileBootstrapPolicy
    {
        internal static bool ResolveIsolationMode(string? value)
        {
            if (string.IsNullOrEmpty(value) || value == "0") return false;
            if (value == "1") return true;
            throw new InvalidOperationException("PLMP_ISOLATED_STAGING must be 0 or 1.");
        }

        internal static bool IsSettingsPath(string relative) =>
            relative.StartsWith("settings/", StringComparison.OrdinalIgnoreCase) ||
            relative.StartsWith("settings\\", StringComparison.OrdinalIgnoreCase);

        internal static void RequireIsolatedSettings(string sourceRoot, string targetRoot)
        {
            if (!File.Exists(Path.Combine(targetRoot, "settings", "mainDB.json")))
                throw new InvalidOperationException("Isolated staging requires a pre-existing settings/mainDB.json; packaged settings must not be used.");

            // Validate all settings before copying anything else from the bundle.
            foreach (var sourceFile in Directory.GetFiles(sourceRoot, "*", SearchOption.AllDirectories))
            {
                var relative = sourceFile.Substring(sourceRoot.Length).TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                if (!IsSettingsPath(relative)) continue;
                var targetFile = Path.GetFullPath(Path.Combine(targetRoot, relative));
                if (!targetFile.StartsWith(targetRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) ||
                    !File.Exists(targetFile))
                    throw new InvalidOperationException("Isolated staging settings are incomplete: " + relative);
            }
        }
    }
}
