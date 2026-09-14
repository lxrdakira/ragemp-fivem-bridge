import { createUnkProxy, toVec3, _pollUntilLoaded } from "./_helpers.js";
import { Vector3 } from "@ragemp-fivem-bridge/shared";

type EntityOverlayParams = Record<string, any>;

let artificialLightsDisabled = false;

// RAGE resources commonly expose their own `global.DrawSprite` helper. In the
// FiveM runtime that property is also the generated DRAW_SPRITE native, so the
// helper replaces it and calling it from here loops back into
// mp.game.graphics.drawSprite. Keep the original native reference before any
// migrated client package gets a chance to populate `global`.
const nativeDrawSprite = DrawSprite;

export class GameGraphicsNs {
  unk = createUnkProxy();

  screen2dToWorld3d(
    screenX:
      | number
      | { x?: number; y?: number; z?: number; [0]?: number; [1]?: number; [2]?: number }
      | null,
    screenY?: number,
  ): Vector3 | null {
    let sx = screenX;
    let sy = screenY;
    let depth = 1000;
    if (sx != null && typeof sx === "object") {
      sy = sx.y ?? sx[1] ?? 0;
      const requestedDepth = +(sx.z ?? sx[2] ?? 0);
      if (Number.isFinite(requestedDepth) && requestedDepth > 0) depth = requestedDepth;
      sx = sx.x ?? sx[0] ?? 0;
    }

    let normalizedX = +sx || 0;
    let normalizedY = +sy! || 0;
    // RAGE passes pixel coordinates; FiveM expects normalized 0..1 values.
    if (Math.abs(normalizedX) > 1 || Math.abs(normalizedY) > 1) {
      const resolution = GetActiveScreenResolution();
      const width = resolution?.[0] || 1;
      const height = resolution?.[1] || 1;
      normalizedX /= width;
      normalizedY /= height;
    }

    const [origin, normal] = GetWorldCoordFromScreenCoord(normalizedX, normalizedY);
    if (!origin) return null;
    if (!normal) return toVec3(origin);

    return new Vector3(
      origin[0] + normal[0] * depth,
      origin[1] + normal[1] * depth,
      origin[2] + normal[2] * depth,
    );
  }

  drawSpotLight(
    x: number,
    y: number,
    z: number,
    dirX: number,
    dirY: number,
    dirZ: number,
    r: number,
    g: number,
    b: number,
    distance: number,
    brightness: number,
    roundness: number,
    radius: number,
    falloff: number,
  ): void {
    DrawSpotLight(
      x,
      y,
      z,
      dirX,
      dirY,
      dirZ,
      r,
      g,
      b,
      distance,
      brightness,
      roundness,
      radius,
      falloff,
    );
  }
  drawSpotLightWithShadow(
    x: number,
    y: number,
    z: number,
    dirX: number,
    dirY: number,
    dirZ: number,
    r: number,
    g: number,
    b: number,
    distance: number,
    brightness: number,
    roundness: number,
    radius: number,
    falloff: number,
    shadowId: number,
  ): void {
    DrawSpotLightWithShadow(
      x,
      y,
      z,
      dirX,
      dirY,
      dirZ,
      r,
      g,
      b,
      distance,
      brightness,
      roundness,
      radius,
      falloff,
      shadowId,
    );
  }

  startParticleFxLoopedAtCoord(
    fxName: string,
    x: number,
    y: number,
    z: number,
    xRot: number,
    yRot: number,
    zRot: number,
    scale: number,
    p7: boolean,
    p8: boolean,
    p9: boolean,
    p10: boolean,
  ): number {
    return StartParticleFxLoopedAtCoord(
      fxName,
      x,
      y,
      z,
      xRot ?? 0,
      yRot ?? 0,
      zRot ?? 0,
      scale ?? 1.0,
      p7 ?? false,
      p8 ?? false,
      p9 ?? false,
      p10 ?? false,
    );
  }
  startParticleFxLoopedOnEntity(
    effectName: string,
    entity: number,
    xOffset: number,
    yOffset: number,
    zOffset: number,
    xRot: number,
    yRot: number,
    zRot: number,
    scale: number,
    xAxis: boolean,
    yAxis: boolean,
    zAxis: boolean,
  ): number {
    return StartParticleFxLoopedOnEntity(
      effectName,
      entity,
      xOffset,
      yOffset,
      zOffset,
      xRot,
      yRot,
      zRot,
      scale,
      xAxis,
      yAxis,
      zAxis,
    );
  }
  stopParticleFxLooped(ptFxHandle: number, killImmediate: boolean): void {
    StopParticleFxLooped(ptFxHandle, killImmediate ?? false);
  }
  startParticleFxNonLoopedAtCoord(
    fxName: string,
    x: number,
    y: number,
    z: number,
    xRot: number,
    yRot: number,
    zRot: number,
    scale: number,
    p7: boolean,
    p8: boolean,
    p9: boolean,
  ): number {
    return StartParticleFxNonLoopedAtCoord(
      fxName,
      x,
      y,
      z,
      xRot ?? 0,
      yRot ?? 0,
      zRot ?? 0,
      scale ?? 1.0,
      p7 ?? false,
      p8 ?? false,
      p9 ?? false,
    );
  }
  startParticleFxNonLoopedOnEntity(
    effectName: string,
    entity: number,
    offsetX: number,
    offsetY: number,
    offsetZ: number,
    rotX: number,
    rotY: number,
    rotZ: number,
    scale: number,
    axisX: boolean,
    axisY: boolean,
    axisZ: boolean,
  ): boolean {
    return StartParticleFxNonLoopedOnEntity(
      effectName,
      entity,
      offsetX,
      offsetY,
      offsetZ,
      rotX,
      rotY,
      rotZ,
      scale,
      axisX,
      axisY,
      axisZ,
    );
  }
  removeParticleFx(ptFxHandle: number, killImmediate: boolean): void {
    RemoveParticleFx(ptFxHandle, killImmediate ?? false);
  }
  doesParticleFxLoopedExist(ptFxHandle: number): boolean {
    return DoesParticleFxLoopedExist(ptFxHandle);
  }
  setParticleFxLoopedEvolution(
    ptFxHandle: number,
    propertyName: string,
    amount: number,
    noMult: boolean,
  ): void {
    SetParticleFxLoopedEvolution(
      ptFxHandle,
      propertyName,
      amount,
      noMult ?? false,
    );
  }
  setParticleFxNonLoopedColour(r: number, g: number, b: number): void {
    SetParticleFxNonLoopedColour(r, g, b);
  }
  setParticleFxLoopedColour(
    ptFxHandle: number,
    r: number,
    g: number,
    b: number,
    noMult: boolean,
  ): void {
    SetParticleFxLoopedColour(ptFxHandle, r, g, b, noMult ?? false);
  }
  setParticleFxLoopedAlpha(ptFxHandle: number, alpha: number): void {
    SetParticleFxLoopedAlpha(ptFxHandle, alpha);
  }
  setParticleFxLoopedScale(ptFxHandle: number, scale: number): void {
    SetParticleFxLoopedScale(ptFxHandle, scale);
  }

  setArtificialLightsState(toggle: boolean): void {
    SetArtificialLightsState(toggle);
  }
  setArtificialLightsStateAffectsVehicles(toggle: boolean): void {
    SetArtificialLightsStateAffectsVehicles(toggle);
  }

  requestStreamedTextureDict(textureDict: string, p1: boolean): void {
    RequestStreamedTextureDict(textureDict, p1 ?? false);
  }
  hasStreamedTextureDictLoaded(textureDict: string): boolean {
    return HasStreamedTextureDictLoaded(textureDict);
  }
  drawSprite(
    textureDict: string,
    textureName: string,
    screenX: number,
    screenY: number,
    width: number,
    height: number,
    heading: number,
    r: number,
    g: number,
    b: number,
    alpha: number,
    unk: boolean,
  ): void {
    nativeDrawSprite(
      textureDict,
      textureName,
      screenX,
      screenY,
      width,
      height,
      heading ?? 0,
      r,
      g,
      b,
      alpha ?? 255,
    );
  }

  requestScaleformMovie(scaleformName: string): number {
    return RequestScaleformMovie(scaleformName);
  }
  requestScaleformMovieInstance(scaleformName: string): number {
    return RequestScaleformMovieInstance(scaleformName);
  }
  hasScaleformMovieLoaded(scaleformHandle: number): boolean {
    return HasScaleformMovieLoaded(scaleformHandle);
  }

  pushScaleformMovieFunction(
    scaleformHandle: number,
    functionName: string,
  ): boolean {
    return BeginScaleformMovieMethod(scaleformHandle, functionName);
  }
  pushScaleformMovieFunctionParameterInt(value: number): void {
    ScaleformMovieMethodAddParamInt(value);
  }
  pushScaleformMovieFunctionParameterFloat(value: number): void {
    ScaleformMovieMethodAddParamFloat(value);
  }
  pushScaleformMovieFunctionParameterBool(value: boolean): void {
    ScaleformMovieMethodAddParamBool(value);
  }
  pushScaleformMovieFunctionParameterString(value: string): void {
    BeginTextCommandScaleformString("STRING");
    AddTextComponentSubstringPlayerName(value);
    EndTextCommandScaleformString();
  }
  popScaleformMovieFunctionVoid(): void {
    EndScaleformMovieMethod();
  }
  popScaleformMovieFunction(): number {
    return EndScaleformMovieMethodReturnValue();
  }

  drawScaleformMovie(
    scaleformHandle: number,
    x: number,
    y: number,
    width: number,
    height: number,
    r: number,
    g: number,
    b: number,
    a: number,
    p9: number,
  ): void {
    DrawScaleformMovie(
      scaleformHandle,
      x,
      y,
      width,
      height,
      r ?? 255,
      g ?? 255,
      b ?? 255,
      a ?? 255,
      p9 ?? 0,
    );
  }
  drawScaleformMovieFullscreen(
    scaleformHandle: number,
    r: number,
    g: number,
    b: number,
    a: number,
    p5: number,
  ): void {
    DrawScaleformMovieFullscreen(
      scaleformHandle,
      r ?? 255,
      g ?? 255,
      b ?? 255,
      a ?? 255,
      p5 ?? 0,
    );
  }
  setScaleformMovieAsNoLongerNeeded(scaleformHandle: number): void {
    const h = [scaleformHandle];
    (SetScaleformMovieAsNoLongerNeeded as any)(h);
  }

  getScreenAspectRatio(physicalAspect: boolean): number {
    return GetScreenAspectRatio(physicalAspect);
  }
  setDebugLinesAndSpheresDrawingActive(enabled: boolean): void {
    SetDebugLinesAndSpheresDrawingActive(enabled);
  }
  drawDebugLine(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    r: number,
    g: number,
    b: number,
    alpha: number,
  ): void {
    DrawDebugLine(x1, y1, z1, x2, y2, z2, r, g, b, alpha);
  }
  drawDebugSphere(
    x: number,
    y: number,
    z: number,
    radius: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    DrawDebugSphere(x, y, z, radius, red, green, blue, alpha);
  }
  drawDebugBox(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    r: number,
    g: number,
    b: number,
    alpha: number,
  ): void {
    DrawDebugBox(x1, y1, z1, x2, y2, z2, r, g, b, alpha);
  }
  drawDebugCross(
    x: number,
    y: number,
    z: number,
    size: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    DrawDebugCross(x, y, z, size, red, green, blue, alpha);
  }
  drawDebugText(
    text: string,
    x: number,
    y: number,
    z: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    DrawDebugText(text, x, y, z, red, green, blue, alpha);
  }
  drawLine(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    DrawLine(x1, y1, z1, x2, y2, z2, red, green, blue, alpha);
  }
  drawBox(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    DrawBox(x1, y1, z1, x2, y2, z2, red, green, blue, alpha);
  }
  setBackfaceculling(toggle: boolean): void {
    SetBackfaceculling(toggle);
  }
  beginTakeMissionCreatorPhoto(): number {
    return (BeginTakeMissionCreatorPhoto as any)();
  }
  getStatusOfTakeMissionCreatorPhoto(): number {
    return GetStatusOfTakeMissionCreatorPhoto();
  }
  freeMemoryForMissionCreatorPhoto(): void {
    FreeMemoryForMissionCreatorPhoto();
  }
  beginTakeHighQualityPhoto(): boolean {
    return BeginTakeHighQualityPhoto();
  }
  getStatusOfTakeHighQualityPhoto(): number {
    return GetStatusOfTakeHighQualityPhoto();
  }
  freeMemoryForHighQualityPhoto(): void {
    FreeMemoryForHighQualityPhoto();
  }
  saveHighQualityPhoto(unused: number): boolean {
    return SaveHighQualityPhoto(unused);
  }
  getStatusOfSaveHighQualityPhoto(): number {
    return GetStatusOfSaveHighQualityPhoto();
  }
  freeMemoryForLowQualityPhoto(): void {
    FreeMemoryForLowQualityPhoto();
  }
  drawLowQualityPhotoToPhone(p0: boolean, p1: boolean): void {
    DrawLowQualityPhotoToPhone(p0, p1);
  }
  getMaximumNumberOfPhotos(): number {
    return GetMaximumNumberOfPhotos();
  }
  getMaximumNumberOfCloudPhotos(): number {
    return GetMaximumNumberOfCloudPhotos();
  }
  getCurrentNumberOfCloudPhotos(): number {
    return GetCurrentNumberOfCloudPhotos();
  }
  getStatusOfSortedListOperation(p0: number): number {
    return (GetStatusOfSortedListOperation as any)(p0);
  }
  fadeUpPedLight(seconds: number): void {
    FadeUpPedLight(seconds);
  }
  updateLightsOnEntity(entity: number): void {
    UpdateLightsOnEntity(entity);
  }
  setCheckpointCylinderHeight(
    checkpoint: number,
    nearHeight: number,
    farHeight: number,
    radius: number,
  ): void {
    SetCheckpointCylinderHeight(checkpoint, nearHeight, farHeight, radius);
  }
  setCheckpointRgba(
    checkpoint: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    SetCheckpointRgba(checkpoint, red, green, blue, alpha);
  }
  setCheckpointRgba2(
    checkpoint: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    SetCheckpointRgba2(checkpoint, red, green, blue, alpha);
  }
  deleteCheckpoint(checkpoint: number): void {
    DeleteCheckpoint(checkpoint);
  }
  dontRenderInGameUi(val: boolean): void {
    DontRenderInGameUi(val);
  }
  forceRenderInGameUi(toggle: boolean): void {
    ForceRenderInGameUi(toggle);
  }
  setStreamedTextureDictAsNoLongerNeeded(textureDict: string): void {
    SetStreamedTextureDictAsNoLongerNeeded(textureDict);
  }
  drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    r: number,
    g: number,
    b: number,
    a: number,
  ): void {
    DrawRect(x, y, width, height, r, g, b, a);
  }
  setScriptGfxDrawBehindPausemenu(toggle: boolean): void {
    SetScriptGfxDrawBehindPausemenu(toggle);
  }
  setScriptGfxDrawOrder(drawOrder: number): void {
    SetScriptGfxDrawOrder(drawOrder);
  }
  setScriptGfxAlign(horizontalAlign: number, verticalAlign: number): void {
    SetScriptGfxAlign(horizontalAlign, verticalAlign);
  }
  resetScriptGfxAlign(): void {
    ResetScriptGfxAlign();
  }
  setScriptGfxAlignParams(x: number, y: number, w: number, h: number): void {
    SetScriptGfxAlignParams(x, y, w, h);
  }
  getSafeZoneSize(): number {
    return GetSafeZoneSize();
  }
  addEntityIcon(entity: number, icon: string): number {
    return AddEntityIcon(entity, icon);
  }
  setEntityIconVisibility(entity: number, toggle: boolean): void {
    SetEntityIconVisibility(entity, toggle);
  }
  setEntityIconColor(
    entity: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    SetEntityIconColor(entity, red, green, blue, alpha);
  }
  setDrawOrigin(x: number, y: number, z: number, p3: number): void {
    SetDrawOrigin(x, y, z, p3);
  }
  clearDrawOrigin(): void {
    ClearDrawOrigin();
  }
  setBinkMovie(name: string): number {
    return SetBinkMovie(name);
  }
  playBinkMovie(binkMovie: number): void {
    PlayBinkMovie(binkMovie);
  }
  stopBinkMovie(binkMovie: number): void {
    StopBinkMovie(binkMovie);
  }
  releaseBinkMovie(binkMovie: number): void {
    ReleaseBinkMovie(binkMovie);
  }
  drawBinkMovie(
    binkMovie: number,
    p1: number,
    p2: number,
    p3: number,
    p4: number,
    p5: number,
    r: number,
    g: number,
    b: number,
    a: number,
  ): void {
    DrawBinkMovie(binkMovie, p1, p2, p3, p4, p5, r, g, b, a);
  }
  setBinkMovieTime(binkMovie: number, progress: number): void {
    SetBinkMovieTime(binkMovie, progress);
  }
  getBinkMovieTime(binkMovie: number): number {
    return GetBinkMovieTime(binkMovie);
  }
  setBinkMovieVolume(binkMovie: number, value: number): void {
    SetBinkMovieVolume(binkMovie, value);
  }
  attachTvAudioToEntity(entity: number): void {
    AttachTvAudioToEntity(entity);
  }
  setTvAudioFrontend(toggle: boolean): void {
    SetTvAudioFrontend(toggle);
  }
  setBinkShouldSkip(binkMovie: number, bShouldSkip: boolean): void {
    SetBinkShouldSkip(binkMovie, bShouldSkip);
  }
  loadMovieMeshSet(movieMeshSetName: string): number {
    return LoadMovieMeshSet(movieMeshSetName);
  }
  releaseMovieMeshSet(movieMeshSet: number): void {
    ReleaseMovieMeshSet(movieMeshSet);
  }
  queryMovieMeshSetState(meshsetid: number): number {
    return QueryMovieMeshSetState(meshsetid);
  }
  getScreenResolution(): { x: number; y: number } {
    const r = GetScreenResolution();
    return { x: r[0], y: r[1] };
  }
  getAspectRatio(b: boolean): number {
    return GetAspectRatio(b);
  }
  getIsWidescreen(): boolean {
    return GetIsWidescreen();
  }
  getIsHidef(): boolean {
    return GetIsHidef();
  }
  setNightvision(toggle: boolean): void {
    SetNightvision(toggle);
  }
  getRequestingnightvision(): boolean {
    return GetRequestingnightvision();
  }
  getUsingnightvision(): boolean {
    return GetUsingnightvision();
  }
  setNoiseoveride(toggle: boolean): void {
    SetNoiseoveride(toggle);
  }
  setNoisinessoveride(value: number): void {
    SetNoisinessoveride(value);
  }
  getScreenCoordFromWorldCoord(
    worldX: number,
    worldY: number,
    worldZ: number,
  ): { result: boolean; screenX: number; screenY: number } {
    const r = GetScreenCoordFromWorldCoord(worldX, worldY, worldZ);
    return { result: !!r[0], screenX: r[1], screenY: r[2] };
  }
  getTextureResolution(textureDict: string, textureName: string): Vector3 {
    return toVec3(GetTextureResolution(textureDict, textureName));
  }
  setFlash(
    minExposure: number,
    maxExposure: number,
    rampUpDuration: number,
    rampDownDuration: number,
    holdDuration: number,
  ): void {
    SetFlash(
      minExposure,
      maxExposure,
      rampUpDuration,
      rampDownDuration,
      holdDuration,
    );
  }
  disableOcclusionThisFrame(): void {
    DisableOcclusionThisFrame();
  }
  createTrackedPoint(): number {
    return CreateTrackedPoint();
  }
  setTrackedPointInfo(
    point: number,
    x: number,
    y: number,
    z: number,
    radius: number,
  ): void {
    SetTrackedPointInfo(point, x, y, z, radius);
  }
  isTrackedPointVisible(point: number): boolean {
    return IsTrackedPointVisible(point);
  }
  destroyTrackedPoint(point: number): void {
    DestroyTrackedPoint(point);
  }
  cascadeShadowsInitSession(): void {
    CascadeShadowsInitSession();
  }
  cascadeShadowsSetCascadeBounds(
    cascade: number,
    enabled: boolean,
    x: number,
    y: number,
    z: number,
    scale: number,
    interpolateToDisabled: boolean,
    interpolateTime: number,
  ): void {
    CascadeShadowsSetCascadeBounds(
      cascade,
      enabled,
      x,
      y,
      z,
      scale,
      interpolateToDisabled,
      interpolateTime,
    );
  }
  cascadeShadowsSetCascadeBoundsScale(scale: number): void {
    CascadeShadowsSetCascadeBoundsScale(scale);
  }
  cascadeShadowsSetEntityTrackerScale(scale: number): void {
    CascadeShadowsSetEntityTrackerScale(scale);
  }
  cascadeShadowsEnableEntityTracker(toggle: boolean): void {
    CascadeShadowsEnableEntityTracker(toggle);
  }
  cascadeShadowsSetShadowSampleType(type: string): void {
    CascadeShadowsSetShadowSampleType(type);
  }
  cascadeShadowsClearShadowSampleType(): void {
    CascadeShadowsClearShadowSampleType();
  }
  cascadeShadowsSetAircraftMode(enable: boolean): void {
    CascadeShadowsSetAircraftMode(enable);
  }
  cascadeShadowsSetDynamicDepthMode(enable: boolean): void {
    CascadeShadowsSetDynamicDepthMode(enable);
  }
  cascadeShadowsSetDynamicDepthValue(distance: number): void {
    CascadeShadowsSetDynamicDepthValue(distance);
  }
  golfTrailSetEnabled(toggle: boolean): void {
    GolfTrailSetEnabled(toggle);
  }
  golfTrailSetPath(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    scale: number,
    idx: number,
    ascending: boolean,
  ): void {
    GolfTrailSetPath(x1, y1, z1, x2, y2, z2, scale, idx, ascending);
  }
  golfTrailSetRadius(p0: number, p1: number, p2: number): void {
    GolfTrailSetRadius(p0, p1, p2);
  }
  golfTrailSetTessellation(p0: number, p1: number): void {
    GolfTrailSetTessellation(p0, p1);
  }
  golfTrailSetShaderParams(
    p0: number,
    p1: number,
    p2: number,
    p3: number,
    p4: number,
  ): void {
    GolfTrailSetShaderParams(p0, p1, p2, p3, p4);
  }
  golfTrailSetFacing(p0: boolean): void {
    GolfTrailSetFacing(p0);
  }
  golfTrailGetMaxHeight(): number {
    return GolfTrailGetMaxHeight();
  }
  golfTrailGetVisualControlPoint(p0: number): Vector3 {
    return toVec3(GolfTrailGetVisualControlPoint(p0));
  }
  setSeethrough(toggle: boolean): void {
    SetSeethrough(toggle);
  }
  getUsingseethrough(): boolean {
    return GetUsingseethrough();
  }
  seethroughReset(): void {
    SeethroughReset();
  }
  seethroughGetMaxThickness(): number {
    return SeethroughGetMaxThickness();
  }
  seethroughSetMaxThickness(thickness: number): void {
    SeethroughSetMaxThickness(thickness);
  }
  seethroughSetHeatscale(index: number, heatScale: number): void {
    SeethroughSetHeatscale(index, heatScale);
  }
  seethroughSetColorNear(red: number, green: number, blue: number): void {
    SeethroughSetColorNear(red, green, blue);
  }
  triggerScreenblurFadeIn(transitionTime: number): boolean {
    return TriggerScreenblurFadeIn(transitionTime);
  }
  triggerScreenblurFadeOut(transitionTime: number): boolean {
    return TriggerScreenblurFadeOut(transitionTime);
  }
  disableScreenblurFade(): void {
    DisableScreenblurFade();
  }
  getScreenblurFadeCurrentTime(): number {
    return GetScreenblurFadeCurrentTime();
  }
  isScreenblurFadeRunning(): boolean {
    return IsScreenblurFadeRunning();
  }
  togglePausedRenderphases(toggle: boolean): void {
    TogglePausedRenderphases(toggle);
  }
  getTogglePausedRenderphasesStatus(): boolean {
    return GetTogglePausedRenderphasesStatus();
  }
  resetPausedRenderphases(): void {
    ResetPausedRenderphases();
  }
  setParticleFxNonLoopedAlpha(alpha: number): void {
    SetParticleFxNonLoopedAlpha(alpha);
  }
  removeParticleFxFromEntity(entity: number): void {
    RemoveParticleFxFromEntity(entity);
  }
  removeParticleFxInRange(
    X: number,
    Y: number,
    Z: number,
    radius: number,
  ): void {
    RemoveParticleFxInRange(X, Y, Z, radius);
  }
  setParticleFxLoopedOffsets(
    ptfxHandle: number,
    x: number,
    y: number,
    z: number,
    rotX: number,
    rotY: number,
    rotZ: number,
  ): void {
    SetParticleFxLoopedOffsets(ptfxHandle, x, y, z, rotX, rotY, rotZ);
  }
  setParticleFxLoopedFarClipDist(ptfxHandle: number, range: number): void {
    SetParticleFxLoopedFarClipDist(ptfxHandle, range);
  }
  setParticleFxCamInsideVehicle(p0: boolean): void {
    SetParticleFxCamInsideVehicle(p0);
  }
  setParticleFxCamInsideNonplayerVehicle(vehicle: number, p1: boolean): void {
    SetParticleFxCamInsideNonplayerVehicle(vehicle, p1);
  }
  setParticleFxShootoutBoat(p0: number): void {
    SetParticleFxShootoutBoat(p0);
  }
  enableClownBloodVfx(toggle: boolean): void {
    EnableClownBloodVfx(toggle);
  }
  enableAlienBloodVfx(toggle: boolean): void {
    EnableAlienBloodVfx(toggle);
  }
  setParticleFxBulletImpactScale(scale: number): void {
    SetParticleFxBulletImpactScale(scale);
  }
  useParticleFxAsset(name: string): void {
    UseParticleFxAsset(name);
  }
  setParticleFxOverride(oldAsset: string, newAsset: string): void {
    SetParticleFxOverride(oldAsset, newAsset);
  }
  resetParticleFxOverride(name: string): void {
    ResetParticleFxOverride(name);
  }
  washDecalsInRange(
    p0: number,
    p1: number,
    p2: number,
    p3: number,
    p4: number,
  ): void {
    WashDecalsInRange(p0, p1, p2, p3, p4);
  }
  washDecalsFromVehicle(vehicle: number, p1: number): void {
    WashDecalsFromVehicle(vehicle, p1);
  }
  fadeDecalsInRange(
    p0: number,
    p1: number,
    p2: number,
    p3: number,
    p4: number,
  ): void {
    FadeDecalsInRange(p0, p1, p2, p3, p4);
  }
  removeDecalsInRange(x: number, y: number, z: number, range: number): void {
    RemoveDecalsInRange(x, y, z, range);
  }
  removeDecalsFromObject(obj: number): void {
    RemoveDecalsFromObject(obj);
  }
  removeDecalsFromObjectFacing(
    obj: number,
    x: number,
    y: number,
    z: number,
  ): void {
    RemoveDecalsFromObjectFacing(obj, x, y, z);
  }
  removeDecalsFromVehicle(vehicle: number): void {
    RemoveDecalsFromVehicle(vehicle);
  }
  addPetrolDecal(
    x: number,
    y: number,
    z: number,
    groundLvl: number,
    width: number,
    transparency: number,
  ): number {
    return AddPetrolDecal(x, y, z, groundLvl, width, transparency);
  }
  startPetrolTrailDecals(p0: number): void {
    StartPetrolTrailDecals(p0);
  }
  addPetrolTrailDecalInfo(x: number, y: number, z: number, p3: number): void {
    AddPetrolTrailDecalInfo(x, y, z, p3);
  }
  endPetrolTrailDecals(): void {
    EndPetrolTrailDecals();
  }
  removeDecal(decal: number): void {
    RemoveDecal(decal);
  }
  isDecalAlive(decal: number): boolean {
    return IsDecalAlive(decal);
  }
  getDecalWashLevel(decal: number): number {
    return GetDecalWashLevel(decal);
  }
  setDisableDecalRenderingThisFrame(): void {
    SetDisableDecalRenderingThisFrame();
  }
  getIsPetrolDecalInRange(
    xCoord: number,
    yCoord: number,
    zCoord: number,
    radius: number,
  ): boolean {
    return GetIsPetrolDecalInRange(xCoord, yCoord, zCoord, radius);
  }
  patchDecalDiffuseMap(
    decalType: number,
    textureDict: string,
    textureName: string,
  ): void {
    PatchDecalDiffuseMap(decalType, textureDict, textureName);
  }
  unpatchDecalDiffuseMap(decalType: number): void {
    UnpatchDecalDiffuseMap(decalType);
  }
  moveVehicleDecals(p0: number, p1: number): void {
    MoveVehicleDecals(p0, p1);
  }
  removeVehicleCrewEmblem(vehicle: number, p1: number): void {
    RemoveVehicleCrewEmblem(vehicle, p1);
  }
  getVehicleCrewEmblemRequestState(vehicle: number, p1: number): number {
    return GetVehicleCrewEmblemRequestState(vehicle, p1);
  }
  doesVehicleHaveCrewEmblem(vehicle: number, p1: number): boolean {
    return DoesVehicleHaveCrewEmblem(vehicle, p1);
  }
  overrideInteriorSmokeName(name: string): void {
    OverrideInteriorSmokeName(name);
  }
  overrideInteriorSmokeLevel(level: number): void {
    OverrideInteriorSmokeLevel(level);
  }
  overrideInteriorSmokeEnd(): void {
    OverrideInteriorSmokeEnd();
  }
  disableVehicleDistantlights(toggle: boolean): void {
    DisableVehicleDistantlights(toggle);
  }
  presetInteriorAmbientCache(timecycleModifierName: string): void {
    PresetInteriorAmbientCache(timecycleModifierName);
  }
  setTimecycleModifier(modifierName: string): void {
    SetTimecycleModifier(modifierName);
  }
  setTimecycleModifierStrength(strength: number): void {
    SetTimecycleModifierStrength(strength);
  }
  setTransitionTimecycleModifier(
    modifierName: string,
    transition: number,
  ): void {
    SetTransitionTimecycleModifier(modifierName, transition);
  }
  clearTimecycleModifier(): void {
    ClearTimecycleModifier();
  }
  getTimecycleModifierIndex(): number {
    return GetTimecycleModifierIndex();
  }
  getTimecycleTransitionModifierIndex(): number {
    return GetTimecycleTransitionModifierIndex();
  }
  pushTimecycleModifier(): void {
    PushTimecycleModifier();
  }
  popTimecycleModifier(): void {
    PopTimecycleModifier();
  }
  setCurrentPlayerTcmodifier(modifierName: string): void {
    SetCurrentPlayerTcmodifier(modifierName);
  }
  setPlayerTcmodifierTransition(value: number): void {
    SetPlayerTcmodifierTransition(value);
  }
  setNextPlayerTcmodifier(modifierName: string): void {
    SetNextPlayerTcmodifier(modifierName);
  }
  addTcmodifierOverride(modifierName1: string, modifierName2: string): void {
    AddTcmodifierOverride(modifierName1, modifierName2);
  }
  hasScaleformMovieFilenameLoaded(scaleformName: string): boolean {
    return HasScaleformMovieFilenameLoaded(scaleformName);
  }
  hasScaleformContainerMovieLoadedIntoParent(scaleformHandle: number): boolean {
    return HasScaleformContainerMovieLoadedIntoParent(scaleformHandle);
  }
  setScaleformMovieToUseSystemTime(scaleform: number, toggle: boolean): void {
    SetScaleformMovieToUseSystemTime(scaleform, toggle);
  }
  drawScaleformMovieFullscreenMasked(
    scaleform1: number,
    scaleform2: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    DrawScaleformMovieFullscreenMasked(
      scaleform1,
      scaleform2,
      red,
      green,
      blue,
      alpha,
    );
  }
  callScaleformMovieMethod(scaleform: number, method: string): void {
    CallScaleformMovieMethod(scaleform, method);
  }
  beginScaleformScriptHudMovieMethod(
    hudComponent: number,
    methodName: string,
  ): boolean {
    return BeginScaleformScriptHudMovieMethod(hudComponent, methodName);
  }
  beginScaleformMovieMethod(scaleform: number, methodName: string): boolean {
    return BeginScaleformMovieMethod(scaleform, methodName);
  }
  beginScaleformMovieMethodOnFrontend(methodName: string): boolean {
    return BeginScaleformMovieMethodOnFrontend(methodName);
  }
  beginScaleformMovieMethodOnFrontendHeader(methodName: string): boolean {
    return BeginScaleformMovieMethodOnFrontendHeader(methodName);
  }
  endScaleformMovieMethod(): void {
    EndScaleformMovieMethod();
  }
  endScaleformMovieMethodReturnValue(): number {
    return EndScaleformMovieMethodReturnValue();
  }
  isScaleformMovieMethodReturnValueReady(methodReturn: number): boolean {
    return IsScaleformMovieMethodReturnValueReady(methodReturn);
  }
  getScaleformMovieMethodReturnValueInt(methodReturn: number): number {
    return GetScaleformMovieMethodReturnValueInt(methodReturn);
  }
  getScaleformMovieMethodReturnValueBool(methodReturn: number): boolean {
    return GetScaleformMovieMethodReturnValueBool(methodReturn);
  }
  getScaleformMovieMethodReturnValueString(methodReturn: number): string {
    return GetScaleformMovieMethodReturnValueString(methodReturn);
  }
  scaleformMovieMethodAddParamInt(value: number): void {
    ScaleformMovieMethodAddParamInt(value);
  }
  scaleformMovieMethodAddParamFloat(value: number): void {
    ScaleformMovieMethodAddParamFloat(value);
  }
  scaleformMovieMethodAddParamBool(value: boolean): void {
    ScaleformMovieMethodAddParamBool(value);
  }
  beginTextCommandScaleformString(componentType: string): void {
    BeginTextCommandScaleformString(componentType);
  }
  endTextCommandScaleformString(): void {
    EndTextCommandScaleformString();
  }
  scaleformMovieMethodAddParamTextureNameString(string: string): void {
    ScaleformMovieMethodAddParamTextureNameString(string);
  }
  scaleformMovieMethodAddParamPlayerNameString(string: string): void {
    ScaleformMovieMethodAddParamPlayerNameString(string);
  }
  scaleformMovieMethodAddParamLatestBriefString(value: number): void {
    ScaleformMovieMethodAddParamLatestBriefString(value);
  }
  requestScaleformScriptHudMovie(hudComponent: number): void {
    RequestScaleformScriptHudMovie(hudComponent);
  }
  hasScaleformScriptHudMovieLoaded(hudComponent: number): boolean {
    return HasScaleformScriptHudMovieLoaded(hudComponent);
  }
  removeScaleformScriptHudMovie(hudComponent: number): void {
    RemoveScaleformScriptHudMovie(hudComponent);
  }
  setTvChannel(channel: number): void {
    SetTvChannel(channel);
  }
  getTvChannel(): number {
    return GetTvChannel();
  }
  setTvVolume(volume: number): void {
    SetTvVolume(volume);
  }
  getTvVolume(): number {
    return GetTvVolume();
  }
  setTvChannelPlaylist(
    tvChannel: number,
    playlistName: string,
    restart: boolean,
  ): void {
    SetTvChannelPlaylist(tvChannel, playlistName, restart);
  }
  setTvChannelPlaylistAtHour(
    tvChannel: number,
    playlistName: string,
    hour: number,
  ): void {
    SetTvChannelPlaylistAtHour(tvChannel, playlistName, hour);
  }
  clearTvChannelPlaylist(tvChannel: number): void {
    ClearTvChannelPlaylist(tvChannel);
  }
  enableMovieKeyframeWait(toggle: boolean): void {
    EnableMovieKeyframeWait(toggle);
  }
  enableMovieSubtitles(toggle: boolean): void {
    EnableMovieSubtitles(toggle);
  }
  terraingridActivate(toggle: boolean): void {
    TerraingridActivate(toggle);
  }
  animpostfxPlay(effectName: string, duration: number, looped: boolean): void {
    AnimpostfxPlay(effectName, duration, looped);
  }
  animpostfxStop(effectName: string): void {
    AnimpostfxStop(effectName);
  }
  animpostfxIsRunning(effectName: string): boolean {
    return AnimpostfxIsRunning(effectName);
  }
  animpostfxStopAll(): void {
    AnimpostfxStopAll();
  }
  togglePlayerDamageOverlay(enable: boolean): void {
    TogglePlayerDamageOverlay(enable);
  }
  doesLatestBriefStringExist(type: number): boolean {
    return DoesLatestBriefStringExist(type);
  }
  setParticleFxBloodScale(scale: number): void {
    (SetParticleFxBloodScale as any)(scale);
  }

  setScreenDrawPosition(horizontalAlign: number, verticalAlign: number): void {
    SetScreenDrawPosition(horizontalAlign, verticalAlign);
  } // unverified
  getScreenActiveResolution(): { x: number; y: number } {
    const r: any = GetActiveScreenResolution();
    return { x: r?.[0] ?? r?.[1], y: r?.[1] ?? r?.[2] };
  } // unverified
  getActiveScreenResolution(): { x: number; y: number } {
    const r = GetActiveScreenResolution();
    return { x: r[0], y: r[1] };
  } // unverified
  getScriptGfxPosition(
    x: number,
    y: number,
  ): { calculatedX: number; calculatedY: number } {
    const r = GetScriptGfxPosition(x, y);
    return { calculatedX: r?.[0], calculatedY: r?.[1] };
  } // unverified

  setBlackout(state: boolean): void {
    SetBlackout(state);
  } // unverified
  setFarShadowsSuppressed(toggle: boolean): void {
    SetFarShadowsSuppressed(toggle);
  } // unverified
  transitionToBlurred(transitionTime: number): boolean {
    return TransitionToBlurred(transitionTime);
  } // unverified
  transitionFromBlurred(transitionTime: number): boolean {
    return TransitionFromBlurred(transitionTime);
  } // unverified
  setFrozenRenderingDisabled(toggle: boolean): void {
    SetFrozenRenderingDisabled(toggle);
  } // unverified
  setHidofEnvBlurParams(
    p0: boolean,
    p1: boolean,
    nearplaneOut: number,
    nearplaneIn: number,
    farplaneOut: number,
    farplaneIn: number,
  ): void {
    SetHidofEnvBlurParams(
      p0,
      p1,
      nearplaneOut,
      nearplaneIn,
      farplaneOut,
      farplaneIn,
    );
  } // unverified

  drawLightWithRangeAndShadow(
    x: number,
    y: number,
    z: number,
    r: number,
    g: number,
    b: number,
    range: number,
    intensity: number,
    shadow: number,
  ): void {
    DrawLightWithRangeAndShadow(x, y, z, r, g, b, range, intensity, shadow);
  } // unverified
  drawLightWithRange(
    posX: number,
    posY: number,
    posZ: number,
    colorR: number,
    colorG: number,
    colorB: number,
    range: number,
    intensity: number,
  ): void {
    DrawLightWithRange(
      posX,
      posY,
      posZ,
      colorR,
      colorG,
      colorB,
      range,
      intensity,
    );
  }
  setLightsState(_lightId: number, disable: boolean): void {
    artificialLightsDisabled = !!disable;
    SetArtificialLightsState(artificialLightsDisabled);
  }
  resetLightsState(): void {
    artificialLightsDisabled = false;
    SetArtificialLightsState(false);
  }
  getLightsState(_lightId: number): boolean {
    return !artificialLightsDisabled;
  }

  drawDebugLineWithTwoColours(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number,
    alpha1: number,
    alpha2: number,
  ): void {
    DrawDebugLineWithTwoColours(
      x1,
      y1,
      z1,
      x2,
      y2,
      z2,
      r1,
      g1,
      b1,
      r2,
      g2,
      b2,
      alpha1,
      alpha2,
    );
  }
  drawDebugText2D(
    text: string,
    x: number,
    y: number,
    z: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    DrawDebugText_2d(text, x, y, z, red, green, blue, alpha);
  }
  drawPoly(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    x3: number,
    y3: number,
    z3: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    DrawPoly(x1, y1, z1, x2, y2, z2, x3, y3, z3, red, green, blue, alpha);
  }
  drawSpritePoly(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    x3: number,
    y3: number,
    z3: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
    textureDict: string,
    textureName: string,
    u1: number,
    v1: number,
    w1: number,
    u2: number,
    v2: number,
    w2: number,
    u3: number,
    v3: number,
    w3: number,
  ): void {
    DrawSpritePoly(
      x1,
      y1,
      z1,
      x2,
      y2,
      z2,
      x3,
      y3,
      z3,
      red,
      green,
      blue,
      alpha,
      textureDict,
      textureName,
      u1,
      v1,
      w1,
      u2,
      v2,
      w2,
      u3,
      v3,
      w3,
    );
  } // unverified
  drawSpritePoly2(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    x3: number,
    y3: number,
    z3: number,
    red1: number,
    green1: number,
    blue1: number,
    alpha1: number,
    red2: number,
    green2: number,
    blue2: number,
    alpha2: number,
    red3: number,
    green3: number,
    blue3: number,
    alpha3: number,
    textureDict: string,
    textureName: string,
    u1: number,
    v1: number,
    w1: number,
    u2: number,
    v2: number,
    w2: number,
    u3: number,
    v3: number,
    w3: number,
  ): void {
    DrawSpritePoly_2(
      x1,
      y1,
      z1,
      x2,
      y2,
      z2,
      x3,
      y3,
      z3,
      red1,
      green1,
      blue1,
      alpha1,
      red2,
      green2,
      blue2,
      alpha2,
      red3,
      green3,
      blue3,
      alpha3,
      textureDict,
      textureName,
      u1,
      v1,
      w1,
      u2,
      v2,
      w2,
      u3,
      v3,
      w3,
    );
  } // unverified
  drawSphere(
    x: number,
    y: number,
    z: number,
    radius: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    DrawSphere(x, y, z, radius, red, green, blue, alpha);
  } // unverified

  drawMarker(
    type: number,
    posX: number,
    posY: number,
    posZ: number,
    dirX: number,
    dirY: number,
    dirZ: number,
    rotX: number,
    rotY: number,
    rotZ: number,
    scaleX: number,
    scaleY: number,
    scaleZ: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
    bobUpAndDown: boolean,
    faceCamera: boolean,
    p19: number,
    rotate: boolean,
    textureDict: string | null,
    textureName: string | null,
    drawOnEnts: boolean,
  ): void {
    DrawMarker(
      type,
      posX,
      posY,
      posZ,
      dirX,
      dirY,
      dirZ,
      rotX,
      rotY,
      rotZ,
      scaleX,
      scaleY,
      scaleZ,
      red,
      green,
      blue,
      alpha,
      bobUpAndDown ?? false,
      faceCamera ?? false,
      p19 ?? 2,
      rotate ?? false,
      textureDict ?? null,
      textureName ?? null,
      drawOnEnts ?? false,
    );
  }
  drawMarker2(
    type: number,
    posX: number,
    posY: number,
    posZ: number,
    dirX: number,
    dirY: number,
    dirZ: number,
    rotX: number,
    rotY: number,
    rotZ: number,
    scaleX: number,
    scaleY: number,
    scaleZ: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
    bobUpAndDown: boolean,
    faceCamera: boolean,
    p19: number,
    rotate: boolean,
    textureDict: string | null,
    textureName: string | null,
    drawOnEnts: boolean,
    p24: boolean,
    _p25: boolean,
  ): void {
    DrawMarker_2(
      type,
      posX,
      posY,
      posZ,
      dirX,
      dirY,
      dirZ,
      rotX,
      rotY,
      rotZ,
      scaleX,
      scaleY,
      scaleZ,
      red,
      green,
      blue,
      alpha,
      bobUpAndDown,
      faceCamera,
      p19,
      rotate,
      textureDict,
      textureName,
      drawOnEnts,
      p24,
    );
  }

  createCheckpoint(
    type: number,
    posX1: number,
    posY1: number,
    posZ1: number,
    posX2: number,
    posY2: number,
    posZ2: number,
    diameter: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
    reserved: number,
  ): number {
    return CreateCheckpoint(
      type,
      posX1,
      posY1,
      posZ1,
      posX2,
      posY2,
      posZ2,
      diameter,
      red,
      green,
      blue,
      alpha,
      reserved,
    );
  }
  setCheckpointScale(checkpoint: number, p0: number): void {
    SetCheckpointScale(checkpoint, p0);
  } // unverified
  setCheckpointIconScale(checkpoint: number, scale: number): void {
    SetCheckpointIconScale(checkpoint, scale);
  } // unverified

  drawInteractiveSprite(
    textureDict: string,
    textureName: string,
    screenX: number,
    screenY: number,
    width: number,
    height: number,
    heading: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    DrawInteractiveSprite(
      textureDict,
      textureName,
      screenX,
      screenY,
      width,
      height,
      heading ?? 0,
      red,
      green,
      blue,
      alpha ?? 255,
    );
  } // unverified
  drawSpriteUv(
    textureDict: string,
    textureName: string,
    x: number,
    y: number,
    width: number,
    height: number,
    u1: number,
    v1: number,
    u2: number,
    v2: number,
    heading: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    DrawSpriteUv(
      textureDict,
      textureName,
      x,
      y,
      width,
      height,
      u1,
      v1,
      u2,
      v2,
      heading ?? 0,
      red,
      green,
      blue,
      alpha ?? 255,
    );
  } // unverified

  loadMissionCreatorPhoto(p1: number, p2: number, p3: number): number {
    return (LoadMissionCreatorPhoto as any)(p1, p2, p3);
  }
  getStatusOfLoadMissionCreatorPhoto(p0: string): {
    p0: number;
    result: number;
  } {
    const r: any = GetStatusOfLoadMissionCreatorPhoto(p0);
    return { p0: r?.[1] ?? r?.[0], result: r?.[0] };
  }
  returnTwo(p0: number): number {
    return ReturnTwo(p0);
  } // unverified

  setBinkMovieUnk2(binkMovie: number, p1: boolean): void {
    SetBinkMovieUnk_2(binkMovie, p1);
  } // unverified

  overridePedBadgeTexture(ped: number, txd: string, txn: string): boolean {
    return OverridePedBadgeTexture(ped, txd, txn);
  } // unverified
  setNumberPlateTexture(
    txDict: string,
    txName: string,
    txDictNormal: string,
    txNameNorma: string,
  ): void {
    SetNumberPlateTexture(txDict, txName, txDictNormal, txNameNorma);
  } // unverified
  set2dLayer(layer: number): void {
    Set_2dLayer(layer);
  } // unverified
  registerTextFontId(fontname: string): number {
    return RegisterFontId(fontname);
  } // unverified

  grassLodShrinkScriptAreas(
    x: number,
    y: number,
    z: number,
    radius: number,
    p4: number,
    p5: number,
    p6: number,
  ): void {
    GrassLodShrinkScriptAreas(x, y, z, radius, p4, p5, p6);
  } // unverified
  grassLodResetScriptAreas(): void {
    GrassLodResetScriptAreas();
  } // unverified

  golfTrailSetColour(
    p0: number,
    p1: number,
    p2: number,
    p3: number,
    p4: number,
    p5: number,
    p6: number,
    p7: number,
    p8: number,
    p9: number,
    p10: number,
    p11: number,
  ): void {
    GolfTrailSetColour(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11);
  }
  golfTrailSetFixedControlPoint(
    type: number,
    xPos: number,
    yPos: number,
    zPos: number,
    p4: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    GolfTrailSetFixedControlPoint(
      type,
      xPos,
      yPos,
      zPos,
      p4,
      red,
      green,
      blue,
      alpha,
    );
  }

  seethroughSetFadeStartDistance(distance: number): void {
    SeethroughSetFadeStartDistance(distance);
  }
  seethroughSetFadeEndDistance(distance: number): void {
    SeethroughSetFadeEndDistance(distance);
  }
  seethroughSetNoiseAmountMin(amount: number): void {
    SeethroughSetNoiseAmountMin(amount);
  } // unverified
  seethroughSetNoiseAmountMax(amount: number): void {
    SeethroughSetNoiseAmountMax(amount);
  } // unverified
  seethroughSetHiLightIntensity(intensity: number): void {
    SeethroughSetHiLightIntensity(intensity);
  } // unverified
  seethroughSetHiLightNoise(noise: number): void {
    SeethroughSetHiLightNoise(noise);
  } // unverified

  setParticleFxLoopedRange(ptfxHandle: number, range: number): void {
    SetParticleFxLoopedRange(ptfxHandle, range);
  } // unverified
  setPtfxAssetNextCall(name: string): void {
    SetPtfxAssetNextCall(name);
  } // unverified
  setPtfxAssetOldToNew(oldAsset: string, newAsset: string): void {
    SetParticleFxAssetOldToNew(oldAsset, newAsset);
  } // unverified
  startParticleFxNonLoopedAtCoord2(
    effectName: string,
    xPos: number,
    yPos: number,
    zPos: number,
    xRot: number,
    yRot: number,
    zRot: number,
    scale: number,
    xAxis: boolean,
    yAxis: boolean,
    zAxis: boolean,
  ): boolean {
    return StartParticleFxNonLoopedAtCoord_2(
      effectName,
      xPos,
      yPos,
      zPos,
      xRot ?? 0,
      yRot ?? 0,
      zRot ?? 0,
      scale ?? 1.0,
      xAxis ?? false,
      yAxis ?? false,
      zAxis ?? false,
    );
  } // unverified
  startParticleFxNonLoopedOnPedBone2(
    effectName: string,
    ped: number,
    offsetX: number,
    offsetY: number,
    offsetZ: number,
    rotX: number,
    rotY: number,
    rotZ: number,
    boneIndex: number,
    scale: number,
    axisX: boolean,
    axisY: boolean,
    axisZ: boolean,
  ): boolean {
    return StartParticleFxNonLoopedOnPedBone_2(
      effectName,
      ped,
      offsetX ?? 0,
      offsetY ?? 0,
      offsetZ ?? 0,
      rotX ?? 0,
      rotY ?? 0,
      rotZ ?? 0,
      boneIndex,
      scale ?? 1.0,
      axisX ?? false,
      axisY ?? false,
      axisZ ?? false,
    );
  } // unverified
  startParticleFxNonLoopedOnEntity2(
    effectName: string,
    entity: number,
    offsetX: number,
    offsetY: number,
    offsetZ: number,
    rotX: number,
    rotY: number,
    rotZ: number,
    scale: number,
    axisX: boolean,
    axisY: boolean,
    axisZ: boolean,
  ): boolean {
    return StartParticleFxNonLoopedOnEntity_2(
      effectName,
      entity,
      offsetX ?? 0,
      offsetY ?? 0,
      offsetZ ?? 0,
      rotX ?? 0,
      rotY ?? 0,
      rotZ ?? 0,
      scale ?? 1.0,
      axisX ?? false,
      axisY ?? false,
      axisZ ?? false,
    );
  } // unverified
  startParticleFxLoopedOnEntityBone(
    effectName: string,
    entity: number,
    xOffset: number,
    yOffset: number,
    zOffset: number,
    xRot: number,
    yRot: number,
    zRot: number,
    boneIndex: number,
    scale: number,
    xAxis: boolean,
    yAxis: boolean,
    zAxis: boolean,
  ): number {
    return StartParticleFxLoopedOnEntityBone(
      effectName,
      entity,
      xOffset ?? 0,
      yOffset ?? 0,
      zOffset ?? 0,
      xRot ?? 0,
      yRot ?? 0,
      zRot ?? 0,
      boneIndex,
      scale ?? 1.0,
      xAxis ?? false,
      yAxis ?? false,
      zAxis ?? false,
    );
  } // unverified
  startParticleFxLoopedOnEntity2(
    effectName: string,
    entity: number,
    xOffset: number,
    yOffset: number,
    zOffset: number,
    xRot: number,
    yRot: number,
    zRot: number,
    scale: number,
    xAxis: boolean,
    yAxis: boolean,
    zAxis: boolean,
  ): number {
    return StartParticleFxLoopedOnEntity_2(
      effectName,
      entity,
      xOffset ?? 0,
      yOffset ?? 0,
      zOffset ?? 0,
      xRot ?? 0,
      yRot ?? 0,
      zRot ?? 0,
      scale ?? 1.0,
      xAxis ?? false,
      yAxis ?? false,
      zAxis ?? false,
    );
  } // unverified
  startParticleFxLoopedOnEntityBone2(
    effectName: string,
    entity: number,
    xOffset: number,
    yOffset: number,
    zOffset: number,
    xRot: number,
    yRot: number,
    zRot: number,
    boneIndex: number,
    scale: number,
    xAxis: boolean,
    yAxis: boolean,
    zAxis: boolean,
  ): number {
    return StartParticleFxLoopedOnEntityBone_2(
      effectName,
      entity,
      xOffset ?? 0,
      yOffset ?? 0,
      zOffset ?? 0,
      xRot ?? 0,
      yRot ?? 0,
      zRot ?? 0,
      boneIndex,
      scale ?? 1.0,
      xAxis ?? false,
      yAxis ?? false,
      zAxis ?? false,
    );
  } // unverified
  startNetworkedParticleFxNonLoopedAtCoord(
    effectName: string,
    xPos: number,
    yPos: number,
    zPos: number,
    xRot: number,
    yRot: number,
    zRot: number,
    scale: number,
    xAxis: boolean,
    yAxis: boolean,
    zAxis: boolean,
  ): boolean {
    return StartNetworkedParticleFxNonLoopedAtCoord(
      effectName,
      xPos,
      yPos,
      zPos,
      xRot ?? 0,
      yRot ?? 0,
      zRot ?? 0,
      scale ?? 1.0,
      xAxis ?? false,
      yAxis ?? false,
      zAxis ?? false,
    );
  }
  startParticleFxNonLoopedOnPedBone(
    effectName: string,
    ped: number,
    offsetX: number,
    offsetY: number,
    offsetZ: number,
    rotX: number,
    rotY: number,
    rotZ: number,
    boneIndex: number,
    scale: number,
    axisX: boolean,
    axisY: boolean,
    axisZ: boolean,
  ): boolean {
    return StartParticleFxNonLoopedOnPedBone(
      effectName,
      ped,
      offsetX ?? 0,
      offsetY ?? 0,
      offsetZ ?? 0,
      rotX ?? 0,
      rotY ?? 0,
      rotZ ?? 0,
      boneIndex,
      scale ?? 1.0,
      axisX ?? false,
      axisY ?? false,
      axisZ ?? false,
    );
  }
  startNetworkedParticleFxNonLoopedOnPedBone(
    effectName: string,
    ped: number,
    offsetX: number,
    offsetY: number,
    offsetZ: number,
    rotX: number,
    rotY: number,
    rotZ: number,
    boneIndex: number,
    scale: number,
    axisX: boolean,
    axisY: boolean,
    axisZ: boolean,
  ): boolean {
    return StartNetworkedParticleFxNonLoopedOnPedBone(
      effectName,
      ped,
      offsetX ?? 0,
      offsetY ?? 0,
      offsetZ ?? 0,
      rotX ?? 0,
      rotY ?? 0,
      rotZ ?? 0,
      boneIndex,
      scale ?? 1.0,
      axisX ?? false,
      axisY ?? false,
      axisZ ?? false,
    );
  }
  startNetworkedParticleFxNonLoopedOnEntity(
    effectName: string,
    entity: number,
    offsetX: number,
    offsetY: number,
    offsetZ: number,
    rotX: number,
    rotY: number,
    rotZ: number,
    scale: number,
    axisX: boolean,
    axisY: boolean,
    axisZ: boolean,
  ): boolean {
    return StartNetworkedParticleFxNonLoopedOnEntity(
      effectName,
      entity,
      offsetX ?? 0,
      offsetY ?? 0,
      offsetZ ?? 0,
      rotX ?? 0,
      rotY ?? 0,
      rotZ ?? 0,
      scale ?? 1.0,
      axisX ?? false,
      axisY ?? false,
      axisZ ?? false,
    );
  }
  startNetworkedParticleFxNonLoopedOnEntityBone(
    effectName: string,
    entity: number,
    offsetX: number,
    offsetY: number,
    offsetZ: number,
    rotX: number,
    rotY: number,
    rotZ: number,
    boneIndex: number,
    scale: number,
    axisX: boolean,
    axisY: boolean,
    axisZ: boolean,
  ): boolean {
    return StartNetworkedParticleFxNonLoopedOnEntityBone(
      effectName,
      entity,
      offsetX ?? 0,
      offsetY ?? 0,
      offsetZ ?? 0,
      rotX ?? 0,
      rotY ?? 0,
      rotZ ?? 0,
      boneIndex,
      scale ?? 1.0,
      axisX ?? false,
      axisY ?? false,
      axisZ ?? false,
    );
  } // unverified
  startParticleFxLoopedOnPedBone(
    effectName: string,
    ped: number,
    xOffset: number,
    yOffset: number,
    zOffset: number,
    xRot: number,
    yRot: number,
    zRot: number,
    boneIndex: number,
    scale: number,
    xAxis: boolean,
    yAxis: boolean,
    zAxis: boolean,
  ): number {
    return StartParticleFxLoopedOnPedBone(
      effectName,
      ped,
      xOffset ?? 0,
      yOffset ?? 0,
      zOffset ?? 0,
      xRot ?? 0,
      yRot ?? 0,
      zRot ?? 0,
      boneIndex,
      scale ?? 1.0,
      xAxis ?? false,
      yAxis ?? false,
      zAxis ?? false,
    );
  }
  startNetworkedParticleFxLoopedOnEntity(
    effectName: string,
    entity: number,
    xOffset: number,
    yOffset: number,
    zOffset: number,
    xRot: number,
    yRot: number,
    zRot: number,
    scale: number,
    xAxis: boolean,
    yAxis: boolean,
    zAxis: boolean,
  ): number {
    return StartNetworkedParticleFxLoopedOnEntity(
      effectName,
      entity,
      xOffset ?? 0,
      yOffset ?? 0,
      zOffset ?? 0,
      xRot ?? 0,
      yRot ?? 0,
      zRot ?? 0,
      scale ?? 1.0,
      xAxis ?? false,
      yAxis ?? false,
      zAxis ?? false,
    );
  }
  startNetworkedParticleFxLoopedOnEntityBone(
    effectName: string,
    entity: number,
    xOffset: number,
    yOffset: number,
    zOffset: number,
    xRot: number,
    yRot: number,
    zRot: number,
    boneIndex: number,
    scale: number,
    xAxis: boolean,
    yAxis: boolean,
    zAxis: boolean,
  ): number {
    return StartNetworkedParticleFxLoopedOnEntityBone(
      effectName,
      entity,
      xOffset ?? 0,
      yOffset ?? 0,
      zOffset ?? 0,
      xRot ?? 0,
      yRot ?? 0,
      zRot ?? 0,
      boneIndex,
      scale ?? 1.0,
      xAxis ?? false,
      yAxis ?? false,
      zAxis ?? false,
    );
  }

  addDecal(
    decalType: number,
    posX: number,
    posY: number,
    posZ: number,
    p4: number,
    p5: number,
    p6: number,
    p7: number,
    p8: number,
    p9: number,
    width: number,
    height: number,
    rCoef: number,
    gCoef: number,
    bCoef: number,
    opacity: number,
    timeout: number,
    p17: boolean,
    p18: boolean,
    p19: boolean,
  ): number {
    return AddDecal(
      decalType,
      posX,
      posY,
      posZ,
      p4,
      p5,
      p6,
      p7,
      p8,
      p9,
      width,
      height,
      rCoef,
      gCoef,
      bCoef,
      opacity,
      timeout,
      p17 ?? false,
      p18 ?? false,
      p19 ?? false,
    );
  }
  addVehicleCrewEmblem(
    vehicle: number,
    ped: number,
    boneIndex: number,
    x1: number,
    x2: number,
    x3: number,
    y1: number,
    y2: number,
    y3: number,
    z1: number,
    z2: number,
    z3: number,
    scale: number,
    p13: number,
    alpha: number,
  ): boolean {
    return AddVehicleCrewEmblem(
      vehicle,
      ped,
      boneIndex,
      x1,
      x2,
      x3,
      y1,
      y2,
      y3,
      z1,
      z2,
      z3,
      scale,
      p13,
      alpha,
    );
  }

  registerNoirScreenEffectThisFrame(): void {
    RegisterNoirScreenEffectThisFrame();
  } // unverified
  setForcePedFootstepsTracks(toggle: boolean): void {
    SetForcePedFootstepsTracks(toggle);
  } // unverified
  setForceVehicleTrails(toggle: boolean): void {
    SetForceVehicleTrails(toggle);
  } // unverified
  disableScriptAmbientEffects(p0: number): void {
    DisableScriptAmbientEffects(p0);
  } // unverified

  removeTcmodifierOverride(p0: string): void {
    RemoveTcmodifierOverride(p0);
  } // unverified
  setExtraTimecycleModifier(modifierName: string): void {
    SetExtraTimecycleModifier(modifierName);
  } // unverified
  clearExtraTimecycleModifier(): void {
    ClearExtraTimecycleModifier();
  } // unverified
  getExtraTimecycleModifierIndex(): number {
    return GetExtraTimecycleModifierIndex();
  } // unverified
  setExtraTimecycleModifierStrength(strength: number): void {
    SetExtraTimecycleModifierStrength(strength);
  } // unverified
  resetExtraTimecycleModifierStrength(): void {
    ResetExtraTimecycleModifierStrength();
  } // unverified

  requestScaleformMovie2(scaleformName: string): number {
    return RequestScaleformMovie_2(scaleformName);
  } // unverified
  requestScaleformMovie3(scaleformName: string): number {
    return RequestScaleformMovie3(scaleformName);
  } // unverified
  requestScaleformMovieInteractive(scaleformName: string): number {
    return RequestScaleformMovieInteractive(scaleformName);
  } // unverified
  hasNamedScaleformMovieLoaded(scaleformName: string): boolean {
    return HasNamedScaleformMovieLoaded(scaleformName);
  } // unverified
  setScaleformFitRendertarget(scaleformHandle: number, toggle: boolean): void {
    SetScaleformFitRendertarget(scaleformHandle, toggle);
  } // unverified
  drawScaleformMovie3D(
    scaleform: number,
    posX: number,
    posY: number,
    posZ: number,
    rotX: number,
    rotY: number,
    rotZ: number,
    p7: number,
    p8: number,
    p9: number,
    scaleX: number,
    scaleY: number,
    scaleZ: number,
    p13: number,
  ): void {
    DrawScaleformMovie_3d(
      scaleform,
      posX,
      posY,
      posZ,
      rotX,
      rotY,
      rotZ,
      p7,
      p8,
      p9,
      scaleX,
      scaleY,
      scaleZ,
      p13,
    );
  }
  drawScaleformMovie3d(...args: Parameters<GameGraphicsNs["drawScaleformMovie3D"]>): void {
    this.drawScaleformMovie3D(...args);
  }
  drawScaleformMovie3DNonAdditive(
    scaleform: number,
    posX: number,
    posY: number,
    posZ: number,
    rotX: number,
    rotY: number,
    rotZ: number,
    p7: number,
    p8: number,
    p9: number,
    scaleX: number,
    scaleY: number,
    scaleZ: number,
    p13: number,
  ): void {
    DrawScaleformMovie_3dNonAdditive(
      scaleform,
      posX,
      posY,
      posZ,
      rotX,
      rotY,
      rotZ,
      p7,
      p8,
      p9,
      scaleX,
      scaleY,
      scaleZ,
      p13,
    );
  } // unverified
  drawScaleformMovie3dNonAdditive(...args: Parameters<GameGraphicsNs["drawScaleformMovie3DNonAdditive"]>): void {
    this.drawScaleformMovie3DNonAdditive(...args);
  }
  drawScaleformMovie3DSolid(
    scaleform: number,
    posX: number,
    posY: number,
    posZ: number,
    rotX: number,
    rotY: number,
    rotZ: number,
    p7: number,
    p8: number,
    p9: number,
    scaleX: number,
    scaleY: number,
    scaleZ: number,
    p13: number,
  ): void {
    DrawScaleformMovie_3dSolid(
      scaleform,
      posX,
      posY,
      posZ,
      rotX,
      rotY,
      rotZ,
      p7,
      p8,
      p9,
      scaleX,
      scaleY,
      scaleZ,
      p13,
    );
  }
  callScaleformMovieMethodWithNumber(
    scaleform: number,
    methodName: string,
    param1: number,
    param2: number,
    param3: number,
    param4: number,
    param5: number,
  ): void {
    CallScaleformMovieMethodWithNumber(
      scaleform,
      methodName,
      param1,
      param2,
      param3,
      param4,
      param5,
    );
  }
  callScaleformMovieMethodWithString(
    scaleform: number,
    methodName: string,
    param1: string,
    param2: string,
    param3: string,
    param4: string,
    param5: string,
  ): void {
    CallScaleformMovieMethodWithString(
      scaleform,
      methodName,
      param1,
      param2,
      param3,
      param4,
      param5,
    );
  }
  callScaleformMovieMethodWithNumberAndString(
    scaleform: number,
    methodName: string,
    floatParam1: number,
    floatParam2: number,
    floatParam3: number,
    floatParam4: number,
    floatParam5: number,
    stringParam1: string,
    stringParam2: string,
    stringParam3: string,
    stringParam4: string,
    stringParam5: string,
  ): void {
    CallScaleformMovieMethodWithNumberAndString(
      scaleform,
      methodName,
      floatParam1,
      floatParam2,
      floatParam3,
      floatParam4,
      floatParam5,
      stringParam1,
      stringParam2,
      stringParam3,
      stringParam4,
      stringParam5,
    );
  }
  callScaleformMovieFunctionFloatParams(
    scaleform: number,
    methodName: string,
    param1: number,
    param2: number,
    param3: number,
    param4: number,
    param5: number,
  ): void {
    CallScaleformMovieFunctionFloatParams(
      scaleform,
      methodName,
      param1,
      param2,
      param3,
      param4,
      param5,
    );
  } // unverified
  callScaleformMovieFunctionStringParams(
    scaleform: number,
    methodName: string,
    param1: string,
    param2: string,
    param3: string,
    param4: string,
    param5: string,
  ): void {
    CallScaleformMovieFunctionStringParams(
      scaleform,
      methodName,
      param1,
      param2,
      param3,
      param4,
      param5,
    );
  } // unverified
  callScaleformMovieFunctionMixedParams(
    scaleform: number,
    methodName: string,
    floatParam1: number,
    floatParam2: number,
    floatParam3: number,
    floatParam4: number,
    floatParam5: number,
    stringParam1: string,
    stringParam2: string,
    stringParam3: string,
    stringParam4: string,
    stringParam5: string,
  ): void {
    CallScaleformMovieFunctionMixedParams(
      scaleform,
      methodName,
      floatParam1,
      floatParam2,
      floatParam3,
      floatParam4,
      floatParam5,
      stringParam1,
      stringParam2,
      stringParam3,
      stringParam4,
      stringParam5,
    );
  } // unverified
  beginScaleformHudMovieMethod(
    hudComponent: number,
    methodName: string,
  ): boolean {
    return BeginScaleformMovieMethod(hudComponent, methodName);
  }
  pushScaleformMovieFunctionFromHudComponent(
    hudComponent: number,
    methodName: string,
  ): boolean {
    return PushScaleformMovieFunctionFromHudComponent(hudComponent, methodName);
  } // unverified
  pushScaleformMovieFunctionN(methodName: string): boolean {
    return BeginScaleformMovieMethodN(methodName);
  } // unverified
  beginTextComponent(componentType: string): void {
    BeginTextCommandScaleformString(componentType);
  } // unverified
  endTextComponent(): void {
    EndTextCommandScaleformString();
  } // unverified
  endTextCommandScaleformString2(): void {
    EndTextCommandScaleformString_2();
  } // unverified
  scaleformMovieMethodAddParamTextureNameString2(string: string): void {
    ScaleformMovieMethodAddParamTextureNameString_2(string);
  } // unverified
  sittingTv(methodReturn: number): string {
    return SittingTv(methodReturn);
  } // unverified
  requestHudScaleform(hudComponent: number): void {
    RequestHudScaleform(hudComponent);
  } // unverified
  hasHudScaleformLoaded(hudComponent: number): boolean {
    return HasHudScaleformLoaded(hudComponent);
  } // unverified

  loadTvChannel(videoCliphash: number): boolean {
    return LoadTvChannel(videoCliphash);
  } // unverified
  drawTvChannel(
    xPos: number,
    yPos: number,
    xScale: number,
    yScale: number,
    rotation: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    DrawTvChannel(
      xPos,
      yPos,
      xScale,
      yScale,
      rotation,
      red,
      green,
      blue,
      alpha,
    );
  }
  isPlaylistUnk(tvChannel: number, p1: number): boolean {
    return IsPlaylistUnk(tvChannel, p1);
  } // unverified
  isTvPlaylistItemPlaying(videoCliphash: number): boolean {
    return IsTvPlaylistItemPlaying(videoCliphash);
  } // unverified

  ui3DsceneIsAvailable(): boolean {
    return Ui3dsceneIsAvailable();
  }
  ui3DscenePushPreset(presetName: string): boolean {
    return Ui3dscenePushPreset(presetName);
  }

  terraingridSetParams(
    x: number,
    y: number,
    z: number,
    p3: number,
    rotation: number,
    p5: number,
    width: number,
    height: number,
    p8: number,
    scale: number,
    glowIntensity: number,
    normalHeight: number,
    heightDiff: number,
  ): void {
    TerraingridSetParams(
      x,
      y,
      z,
      p3,
      rotation,
      p5,
      width,
      height,
      p8,
      scale,
      glowIntensity,
      normalHeight,
      heightDiff,
    );
  }
  terraingridSetColours(
    lowR: number,
    lowG: number,
    lowB: number,
    lowAlpha: number,
    r: number,
    g: number,
    b: number,
    alpha: number,
    highR: number,
    highG: number,
    highB: number,
    highAlpha: number,
  ): void {
    TerraingridSetColours(
      lowR,
      lowG,
      lowB,
      lowAlpha,
      r,
      g,
      b,
      alpha,
      highR,
      highG,
      highB,
      highAlpha,
    );
  }

  animpostfxGetUnk(effectName: string): number {
    return AnimpostfxGetUnk(effectName);
  } // unverified
  animpostfxStopAndDoUnk(effectName: string): void {
    AnimpostfxStopAndDoUnk(effectName);
  } // unverified

  startScreenEffect(
    effectName: string,
    duration: number,
    looped: boolean,
  ): void {
    AnimpostfxPlay(effectName, duration ?? 0, looped ?? false);
  }
  stopScreenEffect(effectName: string): void {
    AnimpostfxStop(effectName);
  }
  getScreenEffectIsActive(effectName: string): boolean {
    return AnimpostfxIsRunning(effectName);
  }
  stopAllScreenEffects(): void {
    AnimpostfxStopAll();
  }

  createWorldTextureSwap(
    oldTextureDict: string,
    oldTextureName: string,
    newTextureDict: string,
    newTextureName: string,
  ): void {
    AddReplaceTexture(
      oldTextureDict,
      oldTextureName,
      newTextureDict,
      newTextureName,
    );
  } // unverified
  removeWorldTextureSwap(oldTextureDict: string, oldTextureName: string): void {
    RemoveReplaceTexture(oldTextureDict, oldTextureName);
  } // unverified
  resetWorldTextureSwaps(): void {} // unverified

  setEntityOverlayPassEnabled(enable: boolean): void {
    SetEntityOverlayPassEnabled(enable);
  } // unverified
  createEntityOverlayBatch(overlayParams: EntityOverlayParams): any {
    const handle = CreateEntityOverlayBatch?.(overlayParams);
    return {
      handle,
      update: (params: EntityOverlayParams) =>
        UpdateEntityOverlayBatch?.(handle, params),
      destroy: () => DestroyEntityOverlayBatch?.(handle),
      addEntity: (entity: number) => AddEntityToOverlayBatch?.(handle, entity),
      removeEntity: (entity: number) =>
        RemoveEntityFromOverlayBatch?.(handle, entity),
    };
  } // unverified

  world3dToScreen2d(
    coords3d: {
      x?: number;
      y?: number;
      z?: number;
      [0]?: number;
      [1]?: number;
      [2]?: number;
    } | null,
  ): { x: number; y: number } | null {
    const x = coords3d?.x ?? coords3d?.[0] ?? 0;
    const y = coords3d?.y ?? coords3d?.[1] ?? 0;
    const z = coords3d?.z ?? coords3d?.[2] ?? 0;
    const r = GetScreenCoordFromWorldCoord(x, y, z);
    if (!r?.[0]) return null;
    return { x: r[1], y: r[2] };
  }

  drawText(
    text: string,
    pos: { x?: number; y?: number; z?: number; [0]?: number; [1]?: number; [2]?: number } | null,
    data?: {
      font?: number;
      scale?: number[];
      color?: number[];
      outline?: boolean;
      centre?: boolean;
    },
  ): void {
    const opts = data ?? {};
    let x = pos?.x ?? pos?.[0] ?? 0;
    let y = pos?.y ?? pos?.[1] ?? 0;
    const z = pos?.z ?? pos?.[2];

    // RAGE accepts both screen [x, y] and world [x, y, z] coordinates here.
    // FiveM's text native only accepts normalized screen coordinates.
    if (z !== undefined && Number.isFinite(+z)) {
      const projected = GetScreenCoordFromWorldCoord(+x, +y, +z);
      if (!projected?.[0]) return;
      x = projected[1];
      y = projected[2];
    }
    SetTextFont(opts.font ?? 0);
    const scale = opts.scale ?? [0.0, 0.35];
    SetTextScale(scale[0] ?? 0.0, scale[1] ?? 0.35);
    if (opts.color)
      SetTextColour(
        opts.color[0] ?? 255,
        opts.color[1] ?? 255,
        opts.color[2] ?? 255,
        opts.color[3] ?? 255,
      );
    if (opts.outline) SetTextOutline();
    if (opts.centre) SetTextCentre(true);
    BeginTextCommandDisplayText("STRING");
    AddTextComponentSubstringPlayerName(text);
    EndTextCommandDisplayText(x, y);
  }

  notify(message: string): void {
    BeginTextCommandThefeedPost("STRING");
    AddTextComponentSubstringPlayerName(message);
    EndTextCommandThefeedPostTicker(false, true);
  }

  requestStreamedTextureDictAsync(
    textureDict: string,
    timeout?: number,
  ): Promise<boolean> {
    return _pollUntilLoaded(
      (d) => RequestStreamedTextureDict(d, false),
      (d) => HasStreamedTextureDictLoaded(d),
      textureDict,
      timeout ?? 5000,
    );
  }
  waitForScriptHudScaleformMovieLoadAsync(
    movieId: number,
    timeout?: number,
  ): Promise<boolean> {
    return _pollUntilLoaded(
      (id) => RequestScaleformScriptHudMovie(id),
      (id) => HasScaleformScriptHudMovieLoaded(id),
      movieId,
      timeout ?? 5000,
    );
  }
  waitForScaleformMovieLoadAsync(
    movieId: number,
    timeout?: number,
  ): Promise<boolean> {
    return _pollUntilLoaded(
      () => {},
      (id) => HasScaleformMovieLoaded(id),
      movieId,
      timeout ?? 5000,
    );
  }
}
