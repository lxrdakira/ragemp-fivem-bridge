#nullable enable
using System;
using System.Text.RegularExpressions;

namespace NeptuneEvo.PortCompatibility
{
    internal static class RedisConnection
    {
        internal static string Endpoint => ResolveEndpoint(Environment.GetEnvironmentVariable("PLMP_REDIS_ENDPOINT"), StagingIsolation.Enabled);
        internal static string Password => ResolvePassword(Environment.GetEnvironmentVariable("PLMP_REDIS_PASSWORD"), StagingIsolation.Enabled);

        internal static string ResolveEndpoint(string? configured, bool isolated)
        {
            if (!isolated) return "127.0.0.1:6379";
            var value = configured ?? "";
            if (value.Length == 0 || value.Length > 260 ||
                !Regex.IsMatch(value, @"^[a-zA-Z0-9][a-zA-Z0-9.-]*:[0-9]{1,5}$") ||
                !int.TryParse(value.Substring(value.LastIndexOf(':') + 1), out var port) || port < 1 || port > 65535)
                throw new InvalidOperationException("PLMP_REDIS_ENDPOINT must be a host:port endpoint.");
            if (value != "127.0.0.1:6380")
                throw new InvalidOperationException("Isolated staging requires its dedicated loopback Redis endpoint.");
            return value;
        }

        internal static string ResolvePassword(string? configured, bool isolated)
        {
            if (!isolated) return "";
            var value = configured ?? "";
            if (value.Length < 32)
                throw new InvalidOperationException("Isolated staging requires a separately provisioned Redis password.");
            return value;
        }
    }
}
