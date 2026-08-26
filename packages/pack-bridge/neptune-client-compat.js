// Project-specific aliases for active Neptune CEF routes that were renamed on
// the RAGE client. This file is loaded after the original client bundle, so it
// delegates to the deployed handlers instead of modifying upstream sources.
(() => {
  const parseJson = (value, fallback) => {
    if (typeof value !== "string") return value ?? fallback;
    try { return JSON.parse(value); } catch (_) { return fallback; }
  };

  const localProc = async (name, fallback) =>
    parseJson(await mp.events.callProc(name), fallback);

  mp.events.add({
    poluchitTipyVkladov: () => mp.events.call("Bank-MainGetDepositTypes"),
    poluchitVkladyIgroka: () => mp.events.call("Bank-MainGetPlayerDeposits"),
    otkrytVklad: (typeId, amount, durationDays) =>
      mp.events.call("Bank-MainOpenDeposit", typeId, amount, durationDays),
    popolnitVklad: (depositId, amount) =>
      mp.events.call("Bank-MainReplenishDeposit", depositId, amount),
    zakrytVklad: (depositId, isEarly) =>
      mp.events.call("Bank-MainCloseDeposit", depositId, isEarly),

    "FactionState-GetDepartments": () =>
      localProc("rpc.frac.main.getDepartments", []),
    "FactionState-GetLogsList": () =>
      localProc("rpc.frac.main.getLogs", []),
    "FactionState-GetSettings": async () => {
      const [settings, stats, ranks, departments] = await Promise.all([
        localProc("rpc.frac.main.getSettings", {}),
        localProc("rpc.frac.main.getStats", {}),
        localProc("rpc.frac.main.getRanks", []),
        localProc("rpc.frac.main.getDepartments", []),
      ]);
      return {
        ...settings,
        money: stats?.money ?? settings?.money ?? 0,
        materials: stats?.mats ?? stats?.materials ?? settings?.materials ?? 0,
        storageOpen: settings?.isStock ?? settings?.storageOpen ?? false,
        ranks: Array.isArray(ranks) ? ranks : [],
        departments: Array.isArray(departments) ? departments : [],
      };
    },
    "FactionState-GetKpkData": async () => {
      const [leader, settings, stats] = await Promise.all([
        localProc("rpc.frac.main.getLeader", {}),
        localProc("rpc.frac.main.getSettings", {}),
        localProc("rpc.frac.main.getStats", {}),
      ]);
      return { leader, settings, stats };
    },
    "FactionState-RemoveRank": (payload) => {
      const id = Number(payload?.id ?? payload);
      if (!Number.isInteger(id) || id <= 0) return { success: false, message: "Invalid rank" };
      mp.events.call("client.frac.main.removeRank", id);
      return { success: true };
    },
    "FactionState-RemoveDepartment": (payload) => {
      const id = Number(payload?.id ?? payload);
      if (!Number.isInteger(id) || id <= 0) return { success: false, message: "Invalid department" };
      mp.events.call("client.frac.main.removeDepartment", id);
      return { success: true };
    },

    "cef.debugLog": (message) => console.debug("[Neptune CEF]", message),
    "client.debug.log": (message) => console.debug("[Neptune tablet]", message),
    "client.kpk.debug": (message) => console.debug("[Neptune KPK]", message),
    client_debug: (message) => console.debug("[Neptune client]", message),
  });
})();
