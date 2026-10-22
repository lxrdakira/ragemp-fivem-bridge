const guard = "NeptuneEvo.PortCompatibility.StagingIsolation.Enabled";

// Exact, file-scoped adapters fail if a side-effecting entry point changes.
export const entryGuards = {
  "Accounts/Email/SmtpService.cs": [["public static bool Send(string toEmail, string subject, string body, bool isHtml = false)", "return false;"]],
  "Photo/PhotoStorage.cs": [
    ["private static AmazonS3Client CreateClient()", "return null;"],
    ["public static async Task<string> UploadBase64Async(int playerId, string base64, string prefix)", "return null;"],
  ],
  "Utils/Analytics/HelperThread.cs": [
    ["public static void AddEvent(string action, string label, string ga, int? value = null)", "return;"],
    ["public static void AddSend(string router, List<KeyValuePair<string, string>> postData)", "return;"],
    ["public static void AddUrl(string url)", "return;"],
    ["public static void Start()", "return;"],
    ["private static async void Worker()", "return;"],
  ],
  "MoneySystem/Donations.cs": [
    ["public static void Start()", "return;"],
    ["public static void Stop()", "return;"],
    ["public static void Tick(object state)", "return;"],
  ],
  "VehicleData/Mp3HttpServer.cs": [["public static void Start(int port = 8765)", "return;"]],
  "VehicleData/YouTubeAudioCache.cs": [["public static async Task<string> GetOrDownloadMp3Async(string videoId)", "return null;"]],
};

function replaceOnce(source, pattern, replacement, label) {
  let count = 0;
  const result = source.replace(pattern, (...args) => { count++; return replacement(...args); });
  if (count !== 1) throw new Error(`Unexpected staging adapter source shape: ${label}`);
  return result;
}

export function adaptStagingSource(source, relative) {
  for (const [signature, action] of entryGuards[relative] ?? []) {
    const escaped = signature.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    source = replaceOnce(source, new RegExp(`(${escaped}\\s*\\{)`, "g"),
      match => `${match}\n            if (${guard}) ${action}`, `${relative}: ${signature}`);
  }
  if (relative === "Utils/Analytics/HelperThread.cs") {
    source = replaceOnce(source,
      /public static async Task TrackEvent\(HttpClient httpClient, string url\) => await httpClient\s*\.GetAsync\(Main\.ServerSettings\.SiteUrl \+ url\)\.ConfigureAwait\(false\);/g,
      () => `public static async Task TrackEvent(HttpClient httpClient, string url) { if (${guard}) return; await httpClient.GetAsync(Main.ServerSettings.SiteUrl + url).ConfigureAwait(false); }`, relative);
  }
  return source;
}
