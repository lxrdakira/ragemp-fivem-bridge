using System;
using System.IO;
using CitizenFX.Core;

namespace RageMP.FiveM.Bridge.Host
{
    internal static class RuntimeFileBootstrap
    {
        private static readonly string[] WritableDirectories = { "json", "logs", "backups", "audio_cache" };

        public static void Prepare(string resourcePath)
        {
            if (string.IsNullOrWhiteSpace(resourcePath)) return;
            var sourceRoot = Path.GetFullPath(Path.Combine(resourcePath, "runtime"));
            var targetRoot = Path.GetFullPath(Directory.GetCurrentDirectory());
            if (!Directory.Exists(sourceRoot))
            {
                Debug.WriteLine("[ragemp-csharp] runtime configuration bundle is missing: " + sourceRoot);
                return;
            }

            var copied = CopyMissing(sourceRoot, targetRoot);
            foreach (var relative in WritableDirectories)
                Directory.CreateDirectory(Path.Combine(targetRoot, relative));

            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("SEVENHILLS_SETTINGS_DIR")))
                Environment.SetEnvironmentVariable("SEVENHILLS_SETTINGS_DIR", Path.Combine(targetRoot, "settings"));
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("SEVENHILLS_FIVEM_IDENTITY_CLAIM")))
                Environment.SetEnvironmentVariable(
                    "SEVENHILLS_FIVEM_IDENTITY_CLAIM",
                    CitizenFX.Core.Native.API.GetConvar("ragemp_fivem_identity_claim", "true"));

            Debug.WriteLine($"[ragemp-csharp] runtime configuration ready at {targetRoot}; copied {copied} missing files");
        }

        private static int CopyMissing(string sourceRoot, string targetRoot)
        {
            var copied = 0;
            foreach (var sourceFile in Directory.GetFiles(sourceRoot, "*", SearchOption.AllDirectories))
            {
                var relative = sourceFile.Substring(sourceRoot.Length).TrimStart(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
                var targetFile = Path.GetFullPath(Path.Combine(targetRoot, relative));
                if (!targetFile.StartsWith(targetRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException("Runtime file escapes target directory: " + relative);
                if (File.Exists(targetFile)) continue;
                var directory = Path.GetDirectoryName(targetFile);
                if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
                File.Copy(sourceFile, targetFile, false);
                copied++;
            }
            return copied;
        }
    }
}
