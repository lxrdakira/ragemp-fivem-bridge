export function clearDeathVisuals(): void {
  StopScreenEffect("DeathFailMPIn");
  StopScreenEffect("DeathFailOut");
  SetCamEffect(0);
  ClearTimecycleModifier();
  ClearExtraTimecycleModifier();
}
