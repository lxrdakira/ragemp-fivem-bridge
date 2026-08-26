// Development-only entry point for testing the original NeptuneEvo client and
// Svelte CEF before the complete C# server port is ready.
RegisterCommand("neptuneui", () => {
  mp.events.call("client.init", 0, "NeptuneEvo FiveM UI", 1, 1, false, "local");
}, false);

console.log("[neptune-ui] /neptuneui opens the original authorization/HUD CEF");
