using System;
using System.Collections.Generic;
using System.Linq;
using GTANetworkAPI;
using NeptuneEvo.Handles;
using NeptuneEvo.Players;
using Newtonsoft.Json;
using SevenHills.SDK;

namespace NeptuneEvo.FiveM
{
    /// <summary>
    /// Handles RAGE:MP runtime-owned remote events which are emitted by the
    /// Neptune client but are not ordinary resource events on the RAGE server.
    /// FiveM has no corresponding built-in event handlers, so the bridge has
    /// to expand them into the original Neptune operations explicitly.
    /// </summary>
    public sealed class FiveMCompatibilityEvents : Script
    {
        private static readonly nLog Log = new nLog("FiveM.CompatibilityEvents");

        [RemoteEvent("add_voice_listeners")]
        private static void AddVoiceListeners(ExtPlayer player, string remoteIdsJson)
        {
            ApplyVoiceListenerBatch(player, remoteIdsJson, true);
        }

        [RemoteEvent("remove_voice_listeners")]
        private static void RemoveVoiceListeners(ExtPlayer player, string remoteIdsJson)
        {
            ApplyVoiceListenerBatch(player, remoteIdsJson, false);
        }

        [RemoteEvent("server.vehicle.rentend")]
        private static void EndVehicleRent(ExtPlayer player, ExtVehicle vehicle)
        {
            var session = player?.GetSessionData();
            if (session?.RentData?.Vehicle == null || vehicle == null) return;
            if (session.RentData.Vehicle != vehicle) return;

            NeptuneEvo.Core.Rentcar.OnReturnVehicle(player, true);
        }

        [RemoteEvent("FactionFamily-UnsetHouse")]
        private static void UnsetOrganizationHouse(ExtPlayer player)
        {
            NeptuneEvo.Houses.HouseManager.ReturnFromOrganizationEvent(player);
        }

        [RemoteEvent("server.phone.updStatus")]
        private static void MarkPhoneConversationRead(ExtPlayer player, int number)
        {
            NeptuneEvo.Players.Phone.Messages.Repository.GetChatStatus(player, number, false);
        }

        [RemoteEvent("server.LeaveFractionOrg")]
        private static void LeaveFractionOrOrganization(ExtPlayer player, int selection)
        {
            if (selection == 0)
                NeptuneEvo.Fractions.Table.Player.Repository.Leave(player);
            else if (selection == 1)
                NeptuneEvo.Organizations.Table.Player.Repository.Leave(player);
        }

        [RemoteEvent("server.notify")]
        private static void SendSelfNotification(ExtPlayer player, string type, string message)
        {
            if (player == null || string.IsNullOrWhiteSpace(message)) return;

            Notify.Send(
                player,
                ParseNotifyType(type),
                NotifyPosition.BottomCenter,
                message,
                3000);
        }

        private static NotifyType ParseNotifyType(string type)
        {
            switch ((type ?? string.Empty).Trim().ToLowerInvariant())
            {
                case "error": return NotifyType.Error;
                case "success": return NotifyType.Success;
                case "warning": return NotifyType.Warning;
                case "alert": return NotifyType.Alert;
                default: return NotifyType.Info;
            }
        }

        private static void ApplyVoiceListenerBatch(ExtPlayer player, string remoteIdsJson, bool enabled)
        {
            if (player == null || string.IsNullOrWhiteSpace(remoteIdsJson)) return;

            try
            {
                var remoteIds = JsonConvert.DeserializeObject<List<int>>(remoteIdsJson);
                if (remoteIds == null || remoteIds.Count == 0) return;

                var targets = NAPI.Pools.GetAllPlayers()
                    .OfType<ExtPlayer>()
                    .Where(target => remoteIds.Contains(target.Id))
                    .ToList();

                foreach (var target in targets)
                {
                    if (enabled)
                        NeptuneEvo.Voice.Voice.add_voice_listener(player, target);
                    else
                        NeptuneEvo.Voice.Voice.remove_voice_listener(player, target);
                }
            }
            catch (Exception exception)
            {
                Log.Write($"Voice listener batch failed: {exception}", nLog.Type.Error);
            }
        }
    }
}
