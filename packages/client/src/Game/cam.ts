import { createUnkProxy, toVec3 } from "./_helpers.js";
import { Vector3 } from "@ragemp-fivem-bridge/shared";

export class GameCamNs {
  unk = createUnkProxy();

  createCam(camName: string, p1: boolean): number { return CreateCam(camName, p1 ?? false); }
  createCamWithParams(camName: string, x: number, y: number, z: number, rotX: number, rotY: number, rotZ: number, fov: number, p8: boolean, p9: number): number {
    return CreateCamWithParams(camName, x, y, z, rotX, rotY, rotZ, fov, p8 ?? false, p9 ?? 0);
  }
  createCamera(camHash: number, p1: boolean): number { return CreateCamera(camHash, p1 ?? false); }
  createCameraWithParams(camHash: number, x: number, y: number, z: number, rotX: number, rotY: number, rotZ: number, fov: number, p8: boolean, p9: number): number {
    return CreateCameraWithParams(camHash, x, y, z, rotX, rotY, rotZ, fov, p8 ?? false, p9 ?? 0);
  }
  destroyAllCams(bScriptHostCam: boolean): void { DestroyAllCams(bScriptHostCam ?? false); }

  getCoord(cam: number): Vector3 { return toVec3(GetCamCoord(cam)); }
  getGameplayCamCoord(): Vector3 { return toVec3(GetGameplayCamCoord()); }
  setCoord(cam: number, x: number, y: number, z: number): void { SetCamCoord(cam, x, y, z); }
  getRot(cam: number, rotationOrder: number): Vector3 { return toVec3(GetCamRot(cam, rotationOrder ?? 2)); }
  setRot(cam: number, pitch: number, roll: number, yaw: number, rotationOrder: number): void { SetCamRot(cam, pitch, roll, yaw, rotationOrder ?? 2); }
  getFov(cam: number): number { return GetCamFov(cam); }
  setFov(cam: number, fov: number): void { SetCamFov(cam, fov); }
  getNearClip(cam: number): number { return GetCamNearClip(cam); }
  setNearClip(cam: number, nearClip: number): void { SetCamNearClip(cam, nearClip); }
  getFarClip(cam: number): number { return GetCamFarClip(cam); }
  setFarClip(cam: number, farClip: number): void { SetCamFarClip(cam, farClip); }
  setNearDof(cam: number, nearDOF: number): void { SetCamNearDof(cam, nearDOF); }
  getFarDof(cam: number): number { return GetCamFarDof(cam); }
  setFarDof(cam: number, farDOF: number): void { SetCamFarDof(cam, farDOF); }
  setDofStrength(cam: number, strength: number): void { SetCamDofStrength(cam, strength); }
  setDofPlanes(cam: number, nearStart: number, nearEnd: number, farStart: number, farEnd: number): void { SetCamDofPlanes(cam, nearStart, nearEnd, farStart, farEnd); }
  setMotionBlurStrength(cam: number, strength: number): void { SetCamMotionBlurStrength(cam, strength); }

  isActive(cam: number): boolean { return IsCamActive(cam); }
  setActive(cam: number, active: boolean): void { SetCamActive(cam, active); }
  isInterpolating(cam: number): boolean { return IsCamInterpolating(cam); }
  setActiveWithInterp(camTo: number, camFrom: number, duration: number, easeLocation: number, easeRotation: number): void {
    SetCamActiveWithInterp(camTo, camFrom, duration, easeLocation ?? 1, easeRotation ?? 1);
  }
  renderScriptCams(render: boolean, ease: boolean, easeTime: number, easeCoordsAnim: boolean, p4: boolean): void {
    RenderScriptCams(render, ease ?? false, easeTime ?? 0, easeCoordsAnim ?? true, p4 ?? false);
  }

  attachToEntity(cam: number, entity: number, xOffset: number, yOffset: number, zOffset: number, isRelative: boolean): void {
    AttachCamToEntity(cam, entity, xOffset, yOffset, zOffset, isRelative ?? true);
  }
  attachToPedBone(cam: number, ped: number, boneIndex: number, xOffset: number, yOffset: number, zOffset: number, heading: boolean): void {
    AttachCamToPedBone(cam, ped, boneIndex, xOffset, yOffset, zOffset, heading ?? true);
  }
  attachToVehicleBone(cam: number, vehicle: number, boneIndex: number, relativeRotation: boolean, rotX: number, rotY: number, rotZ: number, offX: number, offY: number, offZ: number, fixedDirection: boolean): void {
    AttachCamToVehicleBone(cam, vehicle, boneIndex, relativeRotation, rotX, rotY, rotZ, offX, offY, offZ, fixedDirection);
  }
  detach(cam: number): void { DetachCam(cam); }
  pointAtCoord(cam: number, x: number, y: number, z: number): void { PointCamAtCoord(cam, x, y, z); }
  pointAtEntity(cam: number, entity: number, offsetX: number, offsetY: number, offsetZ: number, isRelative: boolean): void {
    PointCamAtEntity(cam, entity, offsetX ?? 0, offsetY ?? 0, offsetZ ?? 0, isRelative ?? false);
  }
  pointAtPedBone(cam: number, ped: number, boneIndex: number, x: number, y: number, z: number, isRelative: boolean): void {
    PointCamAtPedBone(cam, ped, boneIndex, x ?? 0, y ?? 0, z ?? 0, isRelative ?? false);
  }
  stopPointing(cam: number): void { StopCamPointing(cam); }

  shake(cam: number, shakeName: string, intensity: number): void { ShakeCam(cam, shakeName, intensity); }
  isShaking(cam: number): boolean { return IsCamShaking(cam); }

  getGameplayCoord(): Vector3 { return toVec3(GetGameplayCamCoord()); }
  getGameplayRot(rotationOrder: number): Vector3 { return toVec3(GetGameplayCamRot(rotationOrder ?? 2)); }
  getGameplayFov(): number { return GetGameplayCamFov(); }
  setGameplayRelativeHeading(heading: number): void { SetGameplayCamRelativeHeading(heading); }
  setGameplayRelativePitch(pitch: number, scalingFactor: number): void { SetGameplayCamRelativePitch(pitch, scalingFactor ?? 1.0); }
  clampGameplayCamYaw(minimum: number, maximum: number): void { ClampGameplayCamYaw(minimum, maximum); }
  clampGameplayCamPitch(minimum: number, maximum: number): void { ClampGameplayCamPitch(minimum, maximum); }

  doScreenFadeIn(duration: number): void { DoScreenFadeIn(duration); }
  doScreenFadeOut(duration: number): void { DoScreenFadeOut(duration); }
  isScreenFadedIn(): boolean { return IsScreenFadedIn(); }
  isScreenFadedOut(): boolean { return IsScreenFadedOut(); }
  isScreenFadingIn(): boolean { return IsScreenFadingIn(); }
  isScreenFadingOut(): boolean { return IsScreenFadingOut(); }
  setCinematicModeActive(p0: boolean): void { SetCinematicModeActive(p0); }
  setWidescreenBorders(p0: boolean, p1: number): void { SetWidescreenBorders(p0, p1); }

  create(camName: string, p1: boolean): number { return CreateCam(camName, p1 ?? false); }
  destroy(cam: number, bScriptHostCam: boolean): void { DestroyCam(cam, bScriptHostCam ?? false); }
  doesExist(cam: number): boolean { return DoesCamExist(cam); }
  isRendering(cam: number): boolean { return IsCamRendering(cam); }
  getRendering(): number { return GetRenderingCam(); }

  setCamSplinePhase(cam: number, p1: number): void { SetCamSplinePhase(cam, p1); }
  getCamSplineNodePhase(cam: number): number { return GetCamSplineNodePhase(cam); }
  setCamSplineDuration(cam: number, timeDuration: number): void { SetCamSplineDuration(cam, timeDuration); }
  getCamSplineNodeIndex(cam: number): number { return GetCamSplineNodeIndex(cam); }
  overrideCamSplineVelocity(cam: number, p1: number, p2: number, p3: number): void { OverrideCamSplineVelocity(cam, p1, p2, p3); }
  overrideCamSplineMotionBlur(cam: number, p1: number, p2: number, p3: number): void { OverrideCamSplineMotionBlur(cam, p1, p2, p3); }
  isCamSplinePaused(cam: number): boolean { return IsCamSplinePaused(cam); }

  setSplinePhase(cam: number, p1: number): void { SetCamSplinePhase(cam, p1); }
  getSplinePhase(cam: number): number { return GetCamSplinePhase(cam); }
  getSplineNodePhase(cam: number): number { return GetCamSplineNodePhase(cam); }
  setSplineDuration(cam: number, timeDuration: number): void { SetCamSplineDuration(cam, timeDuration); }
  setSplineSmoothingStyle(cam: number, smoothingStyle: number): void { SetCamSplineSmoothingStyle(cam, smoothingStyle); }
  getSplineNodeIndex(cam: number): number { return GetCamSplineNodeIndex(cam); }
  setSplineNodeEase(cam: number, p1: number, p2: number, p3: number): void { SetCamSplineNodeEase(cam, p1, p2, p3); }
  setSplineNodeVelocityScale(cam: number, p1: number, scale: number): void { SetCamSplineNodeVelocityScale(cam, p1, scale); }
  overrideSplineVelocity(cam: number, p1: number, p2: number, p3: number): void { OverrideCamSplineVelocity(cam, p1, p2, p3); }
  overrideSplineMotionBlur(cam: number, p1: number, p2: number, p3: number): void { OverrideCamSplineMotionBlur(cam, p1, p2, p3); }
  setSplineNodeExtraFlags(cam: number, p1: number, flags: number): void { SetCamSplineNodeExtraFlags(cam, p1, flags); }
  isSplinePaused(p0: number): boolean { return IsCamSplinePaused(p0); }
  addSplineNodeUsingCameraFrame(cam: number, cam2: number, length: number, p3: number): void { AddCamSplineNodeUsingCameraFrame(cam, cam2, length, p3); }
  addSplineNodeUsingCamera(cam: number, cam2: number, length: number, p3: number): void { AddCamSplineNodeUsingCamera(cam, cam2, length, p3); }
  addSplineNodeUsingGameplayFrame(cam: number, length: number, p2: number): void { AddCamSplineNodeUsingGameplayFrame(cam, length, p2); }

  setInheritRollVehicle(cam: number, p1: boolean): void { SetCamInheritRollVehicle(cam, p1); }
  setAffectsAiming(cam: number, toggle: boolean): void { SetCamAffectsAiming(cam, toggle); }
  setDebugName(camera: number, name: string): void { SetCamDebugName(camera, name); }
  setUseShallowDofMode(cam: number, toggle: boolean): void { SetCamUseShallowDofMode(cam, toggle); }
  setUseHiDof(): void { SetUseHiDof(); }
  setDofFnumberOfLens(camera: number, p1: number): void { SetCamDofFnumberOfLens(camera, p1); }
  setDofFocalLengthMultiplier(camera: number, multiplier: number): void { SetCamDofFocalLengthMultiplier(camera, multiplier); }
  setDofFocusDistanceBias(camera: number, p1: number): void { SetCamDofFocusDistanceBias(camera, p1); }
  setDofMaxNearInFocusDistance(camera: number, p1: number): void { SetCamDofMaxNearInFocusDistance(camera, p1); }
  setDofMaxNearInFocusDistanceBlendLevel(camera: number, p1: number): void { SetCamDofMaxNearInFocusDistanceBlendLevel(camera, p1); }

  animatedShake(cam: number, p1: string, p2: string, p3: string, amplitude: number): void { AnimatedShakeCam(cam, p1, p2, p3, amplitude); }
  setShakeAmplitude(cam: number, amplitude: number): void { SetCamShakeAmplitude(cam, amplitude); }
  stopShaking(cam: number, p1: boolean): void { StopCamShaking(cam, p1 ?? false); }
  shakeScriptGlobal(p0: string, p1: number): void { ShakeScriptGlobal(p0, p1); }
  animatedShakeScriptGlobal(p0: string, p1: string, p2: string, p3: number): void { AnimatedShakeScriptGlobal(p0, p1, p2, p3); }
  isScriptGlobalShaking(): boolean { return IsScriptGlobalShaking(); }
  stopScriptGlobalShaking(p0: boolean): void { StopScriptGlobalShaking(p0); }

  isPlayingAnim(cam: number, animName: string, animDictionary: string): boolean { return IsCamPlayingAnim(cam, animName, animDictionary); }
  setAnimCurrentPhase(cam: number, phase: number): void { SetCamAnimCurrentPhase(cam, phase); }
  getAnimCurrentPhase(cam: number): number { return GetCamAnimCurrentPhase(cam); }
  playSynchronizedCamAnim(p0: number, p1: number, animName: string, animDictionary: string): boolean { return PlaySynchronizedCamAnim(p0, p1, animName, animDictionary); }

  getGameplayCamRot(rotationOrder: number): Vector3 { return toVec3(GetGameplayCamRot(rotationOrder ?? 2)); }
  getGameplayRelativeHeading(): number { return GetGameplayCamRelativeHeading(); }
  shakeGameplayCam(shakeName: string, intensity: number): void { ShakeGameplayCam(shakeName, intensity); }
  shakeGameplay(shakeName: string, intensity: number): void { ShakeGameplayCam(shakeName, intensity); }
  setGameplayCamShakeAmplitude(amplitude: number): void { SetGameplayCamShakeAmplitude(amplitude); }
  setGameplayShakeAmplitude(amplitude: number): void { SetGameplayCamShakeAmplitude(amplitude); }
  stopGameplayCamShaking(p0: boolean): void { StopGameplayCamShaking(p0); }
  stopGameplayShaking(p0: boolean): void { StopGameplayCamShaking(p0); }
  setFollowPedCamViewMode(viewMode: number): void { SetFollowPedCamViewMode(viewMode); }
  setFollowVehicleCamZoomLevel(zoomLevel: number): void { SetFollowVehicleCamZoomLevel(zoomLevel); }
  setFollowVehicleCamViewMode(viewMode: number): void { SetFollowVehicleCamViewMode(viewMode); }
  clampGameplayYaw(minimum: number, maximum: number): void { ClampGameplayCamYaw(minimum, maximum); }
  clampGameplayPitch(minimum: number, maximum: number): void { ClampGameplayCamPitch(minimum, maximum); }
  animateGameplayZoom(p0: number, distance: number): void { AnimateGameplayCamZoom(p0, distance); }
  animateGameplayCamZoom(p0: number, distance: number): void { AnimateGameplayCamZoom(p0, distance); }
  setGameplayRawYaw(yaw: number): void { SetGameplayCamRawYaw(yaw); }
  setGameplayRawPitch(pitch: number): void { SetGameplayCamRawPitch(pitch); }
  setGameplayCamRawYaw(yaw: number): void { SetGameplayCamRawYaw(yaw); }
  setGameplayCamRawPitch(pitch: number): void { SetGameplayCamRawPitch(pitch); }
  isGameplayRendering(): boolean { return IsGameplayCamRendering(); }
  enableCrosshairThisFrame(): void { EnableCrosshairThisFrame(); }
  isGameplayLookingBehind(): boolean { return IsGameplayCamLookingBehind(); }
  disableCollisionForEntity(entity: number): void { DisableCamCollisionForEntity(entity); }
  disableCollisionForObject(entity: number): void { DisableCamCollisionForObject(entity); }
  setGameplayFollowPedThisUpdate(ped: number): void { SetGameplayCamFollowPedThisUpdate(ped); }

  isSphereVisible(x: number, y: number, z: number, radius: number): boolean { return IsSphereVisible(x, y, z, radius); }
  isFollowPedActive(): boolean { return IsFollowPedCamActive(); }
  isFollowVehicleActive(): boolean { return IsFollowVehicleCamActive(); }
  getFollowPedZoomLevel(): number { return GetFollowPedCamZoomLevel(); }
  getFollowPedViewMode(): number { return GetFollowPedCamViewMode(); }
  setFollowPedViewMode(viewMode: number): void { SetFollowPedCamViewMode(viewMode); }
  getFollowVehicleZoomLevel(): number { return GetFollowVehicleCamZoomLevel(); }
  setFollowVehicleZoomLevel(zoomLevel: number): void { SetFollowVehicleCamZoomLevel(zoomLevel); }
  getFollowVehicleViewMode(): number { return GetFollowVehicleCamViewMode(); }
  setFollowVehicleViewMode(viewMode: number): void { SetFollowVehicleCamViewMode(viewMode); }
  useStuntEraThisFrame(): void { UseStuntCameraThisFrame(); }
  setGameplayHash(camName: string): void { SetGameplayCamHash(camName); }
  setFollowTurretSeat(seatIndex: number): void { SetFollowTurretSeatCam(seatIndex); }

  isAimActive(): boolean { return IsAimCamActive(); }
  isAimThirdPersonActive(): boolean { return IsAimCamThirdPersonActive(); }
  isFirstPersonAimActive(): boolean { return IsFirstPersonAimCamActive(); }
  disableAimThisUpdate(): void { DisableAimCamThisUpdate(); }
  getFirstPersonAimZoomFactor(): number { return GetFirstPersonAimCamZoomFactor(); }
  setFirstPersonAimZoomFactor(zoomFactor: number): void { SetFirstPersonAimCamZoomFactor(zoomFactor); }
  setFirstPersonPitchRange(p0: number, p1: number): void { SetFirstPersonAimCamPitchRange(p0, p1); }
  setFirstPersonAimNearClipThisUpdate(p0: number): void { SetFirstPersonAimCamNearClipThisUpdate(p0); }
  setThirdPersonAimNearClipThisUpdate(p0: number): void { SetThirdPersonAimCamNearClipThisUpdate(p0); }

  getFinalRenderedCoord(): Vector3 { return toVec3(GetFinalRenderedCamCoord()); }
  getFinalRenderedRot(rotationOrder: number): Vector3 { return toVec3(GetFinalRenderedCamRot(rotationOrder ?? 2)); }
  getFinalRenderedFov(): number { return GetFinalRenderedCamFov(); }
  getFinalRenderedNearClip(): number { return GetFinalRenderedCamNearClip(); }
  getFinalRenderedFarClip(): number { return GetFinalRenderedCamFarClip(); }
  getFinalRenderedNearDof(): number { return GetFinalRenderedCamNearDof(); }
  getFinalRenderedFarDof(): number { return GetFinalRenderedCamFarDof(); }
  getFinalRenderedMotionBlurStrength(): number { return GetFinalRenderedCamMotionBlurStrength(); }

  setGameplayCoordHint(x: number, y: number, z: number, duration: number, blendOutDuration: number, blendInDuration: number, unk: number): void {
    SetGameplayCoordHint(x, y, z, duration, blendOutDuration, blendInDuration, unk);
  }
  setGameplayPedHint(ped: number, x1: number, y1: number, z1: number, p4: boolean, duration: number, blendOutDuration: number, blendInDuration: number): void {
    SetGameplayPedHint(ped, x1, y1, z1, p4, duration, blendOutDuration, blendInDuration);
  }
  setGameplayObjectHint(object: number, xOffset: number, yOffset: number, zOffset: number, p4: boolean, time: number, easeInTime: number, easeOutTime: number): void {
    SetGameplayObjectHint(object, xOffset, yOffset, zOffset, p4, time, easeInTime, easeOutTime);
  }
  isGameplayHintActive(): boolean { return IsGameplayHintActive(); }
  stopGameplayHint(p0: boolean): void { StopGameplayHint(p0); }
  setGameplayHintFov(FOV: number): void { SetGameplayHintFov(FOV); }
  setGameplayHintFollowDistanceScalar(value: number): void { SetGameplayHintFollowDistanceScalar(value); }
  setGameplayHintBaseOrbitPitchOffset(value: number): void { SetGameplayHintBaseOrbitPitchOffset(value); }

  setCinematicButtonActive(p0: boolean): void { SetCinematicButtonActive(p0); }
  isCinematicRendering(): boolean { return IsCinematicCamRendering(); }
  shakeCinematic(shakeType: string, amount: number): void { ShakeCinematicCam(shakeType, amount); }
  shakeCinematicCam(shakeType: string, amount: number): void { ShakeCinematicCam(shakeType, amount); }
  setCinematicCamShakeAmplitude(p0: number): void { SetCinematicCamShakeAmplitude(p0); }
  setCinematicShakeAmplitude(p0: number): void { SetCinematicCamShakeAmplitude(p0); }
  stopCinematicCamShaking(p0: boolean): void { StopCinematicCamShaking(p0); }
  stopCinematicShaking(p0: boolean): void { StopCinematicCamShaking(p0); }
  invalidateIdle(): void { InvalidateIdleCam(); }
  createCinematicShot(p0: number, time: number, p2: number, entity: number): void { CreateCinematicShot(p0, time, p2, entity); }
  isCinematicShotActive(p0: number): boolean { return IsCinematicShotActive(p0); }
  stopCinematicShot(p0: number): void { StopCinematicShot(p0); }
  forceCinematicRenderingThisUpdate(toggle: boolean): void { ForceCinematicRenderingThisUpdate(toggle); }
  isCinematicActive(): boolean { return IsCinematicCamActive(); }
  getFocusPedOnScreen(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number): number { return GetFocusPedOnScreen(p0, p1, p2, p3, p4, p5, p6, p7, p8); }

  stopRenderingScriptCamsUsingCatchUp(render: boolean, p1: number, p2: number): void { StopRenderingScriptCamsUsingCatchUp(render, p1, p2); }

  addCamSplineNode(camera: number, x: number, y: number, z: number, xRot: number, yRot: number, zRot: number, length: number, p8: number, p9: number): void { AddCamSplineNode(camera, x, y, z, xRot, yRot, zRot, length, p8, p9); }
  setParams(cam: number, posX: number, posY: number, posZ: number, rotX: number, rotY: number, rotZ: number, fieldOfView: number, p8: number, p9: number, p10: number, p11: number): void { SetCamParams(cam, posX, posY, posZ, rotX, rotY, rotZ, fieldOfView, p8, p9, p10, p11); }
  createWithParams(camName: string, posX: number, posY: number, posZ: number, rotX: number, rotY: number, rotZ: number, fov: number, p8: boolean, p9: number): number {
    return CreateCamWithParams(camName, posX, posY, posZ, rotX, rotY, rotZ, fov, p8 ?? false, p9 ?? 0);
  }
  createEra(camHash: number, p1: boolean): number { return CreateCamera(camHash, p1 ?? false); }
  createEraWithParams(camHash: number, posX: number, posY: number, posZ: number, rotX: number, rotY: number, rotZ: number, fov: number, p8: boolean, p9: number): number {
    return CreateCameraWithParams(camHash, posX, posY, posZ, rotX, rotY, rotZ, fov, p8 ?? false, p9 ?? 0);
  }
  destroyAllS(bScriptHostCam: boolean): void { DestroyAllCams(bScriptHostCam ?? false); }
  attachToPedBone2(cam: number, ped: number, boneIndex: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: boolean): void { AttachCamToPedBone(cam, ped, boneIndex, p3, p4, p5, p9); } // unverified
  addSplineNode(camera: number, x: number, y: number, z: number, xRot: number, yRot: number, zRot: number, length: number, p8: number, p9: number): void { AddCamSplineNode(camera, x, y, z, xRot, yRot, zRot, length, p8, p9); }
  playAnim(cam: number, animName: string, animDictionary: string, x: number, y: number, z: number, xRot: number, yRot: number, zRot: number, p9: boolean, p10: number): boolean {
    return PlayCamAnim(cam, animName, animDictionary, x, y, z, xRot, yRot, zRot, p9 ?? false, p10 ?? 0);
  }
  playSynchronizedAnim(p0: number, p1: number, animName: string, animDictionary: string): boolean { return PlaySynchronizedCamAnim(p0, p1, animName, animDictionary); }
  setFlyHorizontalResponse(cam: number, p1: number, p2: number, p3: number): void { SetFlyCamHorizontalResponse(cam, p1, p2, p3); }
  setFlyVerticalSpeedMultiplier(cam: number, p1: number, p2: number, p3: number): void { SetFlyCamVerticalSpeedMultiplier(cam, p1, p2, p3); }
  setFlyMaxHeight(cam: number, height: number): void { SetFlyCamMaxHeight(cam, height); }
  setFlyCoordAndConstrain(cam: number, x: number, y: number, z: number): void { SetFlyCamCoordAndConstrain(cam, x, y, z); }
  getGameplayRelativePitch(): number { return GetGameplayCamRelativePitch(); }
  setGameplayRelativeRotation(roll: number, pitch: number, yaw: number): void { SetGameplayCamRelativeRotation(roll, pitch, yaw); } // unverified
  isGameplayShaking(): boolean { return IsGameplayCamShaking(); }
  setFollowPedCamCutsceneChat(camName: string, p1: number): boolean { return SetFollowPedCamCutsceneChat(camName, p1); } // unverified
  setInVehicleStateThisUpdate(p0: number, p1: number): void { SetInVehicleCamStateThisUpdate(p0, p1); }
  disableFirstPersonThisFrame(): void { DisableFirstPersonCamThisFrame(); } // unverified
  setFollowPedThisUpdate(camName: string, p1: number): boolean { return SetFollowPedCamThisUpdate(camName, p1); } // unverified
  getIsMultiplayerBrief(toggle: boolean): void { GetIsMultiplayerBrief(toggle); } // unverified
  setGameplayVehicleHint(vehicle: number, offsetX: number, offsetY: number, offsetZ: number, p4: boolean, time: number, easeInTime: number, easeOutTime: number): void {
    SetGameplayVehicleHint(vehicle, offsetX, offsetY, offsetZ, p4, time, easeInTime, easeOutTime);
  }
  setGameplayEntityHint(entity: number, xOffset: number, yOffset: number, zOffset: number, p4: boolean, p5: number, p6: number, p7: number, p8: number): void {
    SetGameplayEntityHint(entity, xOffset, yOffset, zOffset, p4, p5, p6, p7, p8);
  }
  setGameplayHintAnimOffsetx(xOffset: number): void { SetGameplayHintAnimOffsetx(xOffset); }
  setGameplayHintAnimOffsety(yOffset: number): void { SetGameplayHintAnimOffsety(yOffset); }
  setGameplayHintAnimCloseup(toggle: boolean): void { SetGameplayHintAnimCloseup(toggle); } // unverified
  isCinematicShaking(): boolean { return IsCinematicCamShaking(); }
  disableVehicleFirstPersonThisFrame(): void { DisableCinematicVehicleIdleModeThisUpdate(); }
  invalidateVehicleIdle(): void { InvalidateVehicleIdleCam(); }
  isCinematicIdleRendering(): boolean { return IsCinematicIdleCamRendering(); }
  isInVehicleDisabled(): boolean { return IsInVehicleCamDisabled(); } // unverified
  stopCutsceneShaking(): void { StopCutsceneCamShaking(); }
  setEffect(p0: number): void { SetCamEffect(p0); } // unverified
  setCamEffect(p0: number): void { SetCamEffect(p0); } // unverified
  setGameplayVehicleCamera(vehicleName: string): void { SetGameplayCamVehicleCamera(vehicleName); } // unverified
  setGameplayVehicleCameraName(vehicleModel: number): void { SetGameplayCamVehicleCameraName(vehicleModel); } // unverified
  replayFreeGetMaxRange(): number { return ReplayFreeCamGetMaxRange(); } // unverified
  getDofParam(cam: number, paramHash: number): boolean | number | Array<any> { return GetCamDofParam(cam, paramHash); } // unverified
  setDofParam(cam: number, paramHash: number, value: boolean | number | Array<any>): void { SetCamDofParam(cam, paramHash, value); } // unverified
  getFinalRenderedInWhenFriendlyRot(player: number, rotationOrder: number): Vector3 { return toVec3(GetFinalRenderedInWhenFriendlyRot(player, rotationOrder ?? 2)); } // unverified
  getFinalRenderedInWhenFriendlyFov(player: number): number { return GetFinalRenderedInWhenFriendlyFov(player); } // unverified
  renderScriptS(render: boolean, ease: boolean, easeTime: number, p3: boolean, p4: boolean): void { RenderScriptCams(render, ease ?? false, easeTime ?? 0, p3 ?? true, p4 ?? false); }

  getGameplayCamRelativeHeading(): number { return GetGameplayCamRelativeHeading(); }
  setGameplayCamRelativeHeading(heading: number): void { SetGameplayCamRelativeHeading(heading); }
  setGameplayCamRelativePitch(angle: number, scalingFactor: number): void { SetGameplayCamRelativePitch(angle, scalingFactor ?? 1.0); }
}
