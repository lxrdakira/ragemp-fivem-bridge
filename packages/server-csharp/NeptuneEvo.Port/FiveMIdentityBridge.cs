using System;
using System.Data;
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
    /// claim an unbound legacy account once; future connections resolve its
    /// Social Club value from the stable FiveM license binding.
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
            if (!_tableReady || player == null || string.IsNullOrWhiteSpace(player.Serial)) return;
            var legacySocialClub = await FindLegacySocialClub(player.Serial);
            if (!string.IsNullOrWhiteSpace(legacySocialClub))
                player.ApplyPlatformIdentity(legacySocialClub);
        }

        [RemoteEvent("signin")]
        private async Task PrepareLegacySignIn(ExtPlayer player, string loginOrEmail, string password)
        {
            if (!_tableReady || !IdentityClaimEnabled() || player == null || string.IsNullOrWhiteSpace(player.Serial)) return;
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
            if (!await ClaimIdentity(player.Serial, accountLogin)) return;

            player.ApplyPlatformIdentity(legacySocialClub);
            session.SocialClubName = legacySocialClub;
            session.RealSocialClub = legacySocialClub;
            session.AuntificationData.Login = accountLogin;
            session.AuntificationData.Email = Convert.ToString(row["email"]);
            session.AuntificationData.Password = Convert.ToString(row["password"]);
            session.AuntificationData.IsCreateAccount = true;
            Log.Write($"FiveM identity linked to legacy account '{accountLogin}'.", nLog.Type.Success);
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

        private static async Task<bool> ClaimIdentity(string identifier, string accountLogin)
        {
            using var lookup = new MySqlCommand(@"
SELECT `identifier`, `account_login`
FROM `fivem_identities`
WHERE `identifier` = @identifier OR LOWER(`account_login`) = LOWER(@account)
LIMIT 2;");
            lookup.Parameters.AddWithValue("@identifier", identifier);
            lookup.Parameters.AddWithValue("@account", accountLogin);
            using var existing = await MySQL.QueryReadAsync(lookup);
            if (existing == null) return false;
            foreach (DataRow row in existing.Rows)
            {
                if (!string.Equals(Convert.ToString(row["identifier"]), identifier, StringComparison.Ordinal) ||
                    !string.Equals(Convert.ToString(row["account_login"]), accountLogin, StringComparison.OrdinalIgnoreCase))
                    return false;
            }
            if (existing.Rows.Count > 0) return true;

            using var insert = new MySqlCommand(@"
INSERT INTO `fivem_identities` (`identifier`, `account_login`)
VALUES (@identifier, @account);");
            insert.Parameters.AddWithValue("@identifier", identifier);
            insert.Parameters.AddWithValue("@account", accountLogin);
            await MySQL.QueryAsync(insert);

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
    }
}
