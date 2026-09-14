// Development-only entry point for testing the original NeptuneEvo client and
// Svelte CEF before the complete C# server port is ready.
// This is the final client script in fxmanifest.lua, so releasing the FiveM
// loading screen here cannot race the original Neptune bundle initialization.
const releaseGameLoadingView = () => {
  if (typeof ShutdownLoadingScreen === "function") ShutdownLoadingScreen();
  if (typeof ShutdownLoadingScreenNui === "function") ShutdownLoadingScreenNui();
  if (typeof DoScreenFadeIn === "function") DoScreenFadeIn(0);
};

// A direct launcher connection can finish GTA's landing transition a few
// frames after the resource runtime starts. Releasing the loading/fade layer
// for a short bounded period prevents that late transition from covering the
// already rendered authorization browser with the bottom-right GTA spinner.
releaseGameLoadingView();
let releaseAttempts = 0;
const releaseTimer = setInterval(() => {
  releaseGameLoadingView();
  releaseAttempts += 1;
  if (releaseAttempts >= 40) clearInterval(releaseTimer);
}, 250);

RegisterCommand("neptuneui", () => {
  mp.events.call("client.init", 0, "NeptuneEvo FiveM UI", 1, 1, false, "local");
}, false);

console.log("[neptune-ui] client scripts ready; loading screen released");
