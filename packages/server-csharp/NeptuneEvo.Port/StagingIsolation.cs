#nullable enable
using System;

namespace NeptuneEvo.PortCompatibility
{
    internal static class StagingIsolation
    {
        internal static bool Enabled => Resolve(Environment.GetEnvironmentVariable("PLMP_ISOLATED_STAGING"));

        internal static bool Resolve(string? value)
        {
            if (value == "1") return true;
            if (string.IsNullOrEmpty(value) || value == "0") return false;
            throw new InvalidOperationException("PLMP_ISOLATED_STAGING must be 0 or 1.");
        }
    }
}
