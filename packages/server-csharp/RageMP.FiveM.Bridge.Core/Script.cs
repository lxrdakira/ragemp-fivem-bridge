namespace GTANetworkAPI
{
    public abstract class Script
    {
        public static LegacyApi API { get; } = new LegacyApi();
    }

    public sealed class LegacyApi
    {
        public LegacySharedApi Shared { get; } = new LegacySharedApi();
    }

    public sealed class LegacySharedApi
    {
        public System.Collections.Generic.IReadOnlyCollection<Player> GetAllPlayers() => RAGE.Entities.Players.All;
    }
}
