using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Reflection;
using GTANetworkAPI;
using API = CitizenFX.Core.Native.API;

namespace RageMP.FiveM.Bridge.Host
{
    internal sealed class PlayerFactory
    {
        private readonly ConcurrentDictionary<ushort, Player> _players = new ConcurrentDictionary<ushort, Player>();
        private Type? _playerType;

        public Player GetOrCreate(CitizenFX.Core.Player source)
        {
            if (!ushort.TryParse(source.Handle, out var id))
                throw new InvalidOperationException("Invalid FiveM player source: " + source.Handle);
            return _players.GetOrAdd(id, value => Create(value, source));
        }

        public bool Remove(CitizenFX.Core.Player source, out Player? player)
        {
            player = null;
            if (!ushort.TryParse(source.Handle, out var id)) return false;
            var removed = _players.TryRemove(id, out player);
            RAGE.Entities.Players.Remove(id);
            if (player != null) player.IsInstanceAlive = false;
            return removed;
        }

        public Player? Get(ushort id) => _players.TryGetValue(id, out var player) ? player : null;
        public Player[] All => _players.Values.ToArray();

        private Player Create(ushort id, CitizenFX.Core.Player source)
        {
            var handle = new NetHandle(id, EntityType.Player);
            var type = _playerType ?? (_playerType = FindMostDerivedPlayerType());
            var player = (Player?)Activator.CreateInstance(type, handle) ?? new Player(handle);
            player.Name = source.Name;
            player.Serial = source.Identifiers["license"] ?? string.Empty;
            player.SocialClubName = source.Name;
            player.SocialClubId = HashIdentifier(player.Serial);
            player.Address = API.GetPlayerEndpoint(source.Handle) ?? string.Empty;
            var dimension = unchecked((uint)API.GetPlayerRoutingBucket(source.Handle));
            try
            {
                var position = source.Character.Position;
                player.ApplyNetworkState(new Vector3(position.X, position.Y, position.Z), 0f, 100, 0, source.Ping, dimension);
            }
            catch { player.ApplyNetworkState(new Vector3(), 0f, 100, 0, source.Ping, dimension); }
            RAGE.Entities.Players.Register(player);
            return player;
        }

        private static ulong HashIdentifier(string value)
        {
            unchecked
            {
                ulong hash = 14695981039346656037UL;
                foreach (var character in value ?? string.Empty) { hash ^= character; hash *= 1099511628211UL; }
                return hash;
            }
        }

        private static Type FindMostDerivedPlayerType()
        {
            return AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(SafeTypes)
                .Where(type => !type.IsAbstract && typeof(Player).IsAssignableFrom(type))
                .Where(type => type.GetConstructor(new[] { typeof(NetHandle) }) != null)
                .OrderByDescending(InheritanceDepth)
                .FirstOrDefault() ?? typeof(Player);
        }

        private static Type[] SafeTypes(Assembly assembly)
        {
            try { return assembly.GetTypes(); }
            catch (ReflectionTypeLoadException error) { return error.Types.Where(type => type != null).Cast<Type>().ToArray(); }
        }

        private static int InheritanceDepth(Type type)
        {
            var depth = 0;
            for (var current = type; current != null; current = current.BaseType) depth++;
            return depth;
        }
    }
}
