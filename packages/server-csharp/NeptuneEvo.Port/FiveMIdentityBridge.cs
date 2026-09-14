using System;
using System.Threading.Tasks;
using GTANetworkAPI;
using MySqlConnector;
using NeptuneEvo.Handles;
using NeptuneEvo.Players;
using SevenHills.SDK;

namespace NeptuneEvo.FiveM
{
    /// <summary>
    /// Preserves legacy RAGE:MP account ownership on FiveM, where the old
    /// Social Club name/id is not exposed. A successful credential login may
    /// claim an unbound legacy account once. BestMP can briefly expose a stale
    /// launcher identifier after switching Windows/Rockstar profiles, so the
    /// identifier is never allowed to override valid account credentials.
    /// </summary>
    public sealed class FiveMIdentityBridge : Script
    {
        private static readonly nLog Log = new nLog("FiveM.Identity");
        private static bool _tableReady;

        [ServerEvent(Event.ResourceStart)]
        private async Task OnResourceStart()
        {
            using var command = new MySqlCommand(@"
CREATE TABLE IF NOT EXISTS `fivem_identities` (
    `identifier` VARCHAR(191) NOT NULL,
    `account_login` VARCHAR(64) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_seen_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`identifier`),
    UNIQUE KEY `uq_fivem_identities_account` (`account_login`)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            await MySQL.QueryAsync(command);
            using var verifyCommand = new MySqlCommand("SELECT 1 FROM `fivem_identities` LIMIT 0;");
            using var verifyResult = await MySQL.QueryReadAsync(verifyCommand);
            _tableReady = verifyResult != null;
            Log.Write(
                _tableReady ? "FiveM identity binding storage initialized." : "FiveM identity binding storage is unavailable.",
                _tableReady ? nLog.Type.Success : nLog.Type.Error);
        }

        [ServerEvent(Event.PlayerConnected)]
        private async Task OnPlayerConnected(ExtPlayer player)
        {
            // Disabled by default. BestMP has been observed sending another
            // local profile's license during the first connection attempt. An
            // automatic lookup would disclose that profile's account login and
            // make the legitimate credentials fail the legacy Social Club check.
            if (!_tableReady || !AutoResolveEnabled() || player == null || string.IsNullOrWhiteSpace(player.Serial)) return;
            var legacySocialClub = await FindLegacySocialClub(player.Serial);
            if (!string.IsNullOrWhiteSpace(legacySocialClub))
                player.ApplyPlatformIdentity(legacySocialClub);
        }

        [RemoteEvent("signin")]
        private async Task PrepareLegacySignIn(ExtPlayer player, string loginOrEmail, string password)
        {
            if (!IdentityClaimEnabled() || player == null) return;
            var session = player.GetSessionData();
            if (session == null || session.AuntificationData.IsCreateAccount) return;

            var normalizedLogin = (loginOrEmail ?? string.Empty).Trim().ToLowerInvariant();
            if (normalizedLogin.Length == 0 || string.IsNullOrEmpty(password)) return;
            var passwordHash = Accounts.Repository.GetSha256(password);

            using var accountCommand = new MySqlCommand(@"
SELECT `login`, `email`, `password`, `socialclub`
FROM `accounts`
WHERE (LOWER(`login`) = @login OR LOWER(`email`) = @login) AND `password` = @password
LIMIT 1;");
            accountCommand.Parameters.AddWithValue("@login", normalizedLogin);
            accountCommand.Parameters.AddWithValue("@password", passwordHash);
            using var accountResult = await MySQL.QueryReadAsync(accountCommand);
            if (accountResult == null || accountResult.Rows.Count == 0) return;

            var row = accountResult.Rows[0];
            var accountLogin = Convert.ToString(row["login"]);
            var legacySocialClub = Convert.ToString(row["socialclub"]);
            if (string.IsNullOrWhiteSpace(accountLogin) || string.IsNullOrWhiteSpace(legacySocialClub)) return;

            // Credentials are authoritative for the current session. A stale
            // BestMP license must not prevent the owner from signing in.
            player.ApplyPlatformIdentity(legacySocialClub);
            session.SocialClubName = legacySocialClub;
            session.RealSocialClub = legacySocialClub;
            session.AuntificationData.Login = accountLogin;
            session.AuntificationData.Email = Convert.ToString(row["email"]);
            session.AuntificationData.Password = Convert.ToString(row["password"]);
            session.AuntificationData.IsCreateAccount = true;

            if (_tableReady && !string.IsNullOrWhiteSpace(player.Serial))
            {
                try
                {
                    if (await BindVerifiedIdentity(player.Serial, accountLogin))
                        Log.Write($"FiveM identity linked to legacy account '{accountLogin}'.", nLog.Type.Success);
                    else
                        Log.Write($"Could not verify the persisted FiveM identity for '{accountLogin}'.", nLog.Type.Warn);
                }
                catch (Exception error)
                {
                    // Persistent binding is an optimization, not a prerequisite
                    // for a password-authenticated session.
                    Log.Write($"Could not persist FiveM identity for '{accountLogin}': {error.Message}", nLog.Type.Warn);
                }
            }
        }

        private static async Task<string> FindLegacySocialClub(string identifier)
        {
            using var command = new MySqlCommand(@"
SELECT a.`socialclub`
FROM `fivem_identities` f
INNER JOIN `accounts` a ON LOWER(a.`login`) = LOWER(f.`account_login`)
WHERE f.`identifier` = @identifier
LIMIT 1;");
            command.Parameters.AddWithValue("@identifier", identifier);
            using var result = await MySQL.QueryReadAsync(command);
            return result != null && result.Rows.Count > 0
                ? Convert.ToString(result.Rows[0]["socialclub"])
                : null;
        }

        private static async Task<bool> BindVerifiedIdentity(string identifier, string accountLogin)
        {
            // This is called only after the account password has been checked.
            // REPLACE resolves both unique keys atomically, removing stale
            // launcher/profile bindings without allowing an identifier to
            // bypass credential authentication.
            using var bind = new MySqlCommand(@"
REPLACE INTO `fivem_identities` (`identifier`, `account_login`)
VALUES (@identifier, @account);");
            bind.Parameters.AddWithValue("@identifier", identifier);
            bind.Parameters.AddWithValue("@account", accountLogin);
            await MySQL.QueryAsync(bind);

            using var verify = new MySqlCommand(@"
SELECT 1 FROM `fivem_identities`
WHERE `identifier` = @identifier AND LOWER(`account_login`) = LOWER(@account)
LIMIT 1;");
            verify.Parameters.AddWithValue("@identifier", identifier);
            verify.Parameters.AddWithValue("@account", accountLogin);
            using var verified = await MySQL.QueryReadAsync(verify);
            return verified != null && verified.Rows.Count > 0;
        }

        private static bool IdentityClaimEnabled()
        {
            var value = Environment.GetEnvironmentVariable("SEVENHILLS_FIVEM_IDENTITY_CLAIM");
            return !string.Equals(value, "false", StringComparison.OrdinalIgnoreCase) && value != "0";
        }

        private static bool AutoResolveEnabled()
        {
            var value = Environment.GetEnvironmentVariable("SEVENHILLS_FIVEM_IDENTITY_AUTO_RESOLVE");
            return string.Equals(value, "true", StringComparison.OrdinalIgnoreCase) || value == "1";
        }
    }
}
