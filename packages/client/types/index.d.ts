import type { Vector3, Vector3Like, EntityMp, EntityMpPool, HashOrString } from "@ragemp-fivem-bridge/shared/types";

declare global {
  const mp: ClientMp;
}

export interface ClientMp {
  Vector3: typeof Vector3;
  enums: ClientEnums;

  Entity: { prototype: EntityMp };
  Player: { prototype: PlayerMp };
  Vehicle: { prototype: VehicleMp };
  Object: { prototype: ObjectMp };
  Blip: { prototype: BlipMp };
  Colshape: { prototype: ColshapeMp };
  Checkpoint: { prototype: CheckpointMp };
  Marker: { prototype: MarkerMp };
  TextLabel: { prototype: TextLabelMp };
  Ped: { prototype: PedMp };
  Dummy: { prototype: DummyMp };
  Camera: { prototype: CameraMp };
  Browser: { prototype: BrowserMp };

  players: PlayerMpPool;
  vehicles: VehicleMpPool;
  objects: ObjectMpPool;
  peds: PedMpPool;
  pickups: PickupMpPool;
  dummies: DummyMpPool;
  blips: BlipMpPool;
  checkpoints: CheckpointMpPool;
  markers: MarkerMpPool;
  colshapes: ColshapeMpPool;
  labels: TextLabelMpPool;
  cameras: CameraMpPool;
  browsers: BrowserMpPool;

  events: EventManagerMp;
  keys: KeyManagerMp;
  gui: GuiMp;
  console: ConsoleMp;
  storage: StorageMp;
  discord: DiscordMp;
  nametags: NametagsMp;
  raycasting: RaycastingMp;
  voiceChat: VoiceChatMp;
  user: UserMp;
  system: SystemMp;
  game: GameMp;
  spawnmanager: {
    setAutoSpawn(state: boolean): void;
    readonly autoSpawn: boolean;
    setSpawnPoint(info: { x?: number; y?: number; z?: number; heading?: number; model?: HashOrString }): void;
    readonly spawnPoint: { x: number; y: number; z: number; heading: number; model: HashOrString };
    spawn(info?: object): Promise<void> | void;
    forceRespawn(): Promise<void> | void;
    readonly isSpawning: boolean;
    readonly hasSpawned: boolean;
  };
}

export interface PlayerMp extends EntityMp {
  readonly type: "player";
  readonly ped: number;
  readonly vehicle: VehicleMp | null;
  readonly action: string;
  readonly aimTarget: number;
  readonly ip: string;
  readonly ping: number;
  readonly isVoiceActive: boolean;
  readonly isTypingInTextChat: boolean;
  readonly rgscId: string;
  readonly serial: string;
  readonly socialClub: string;

  name: string;
  health: number;
  armour: number;
  heading: number;
  weapon: number;
  isPositionFrozen: boolean;
  eyeColour: number;
  hairColour: number;
  hairHighlightColour: number;
  p2pEnabled: boolean;
  readonly p2pConnected: boolean;
  voiceAutoVolume: number;
  voiceVolume: number;
  voice3d: boolean;

  call(eventName: string, ...args: any[]): void;
  getVehicleIsTryingToEnter(): number;
  setModel(model: HashOrString): void;
  setControl(state: boolean): void;
  setEveryoneIgnore(state: boolean): void;
  clearWantedLevel(): void;
  getWantedLevel(): number;
  setWantedLevel(level: number): void;

  voiceFX: {
    setFX(channel: number, type: number, ...params: any[]): void;
    removeFX(channel: number): void;
    resetFX(channel: number): void;
    getFXType(channel: number): number;
  };
}

export interface PlayerMpPool extends EntityMpPool<PlayerMp> {
  readonly local: PlayerMp;
  atRemoteId(remoteId: number): PlayerMp | null;
  readonly streamed: PlayerMp[];
  maxStreamed: number;
  forEachInStreamRange(fn: (entity: PlayerMp) => void): void;
}

export interface VehicleMp extends EntityMp {
  readonly type: "vehicle";
  readonly handle: number;
  readonly velocity: Vector3;
  readonly speed: number;
  readonly gear: number;
  readonly rpm: number;
  readonly steeringAngle: number;
  readonly dead: boolean;
  readonly controller: PlayerMp | null;

  rotation: Vector3;
  heading: number;
  engineHealth: number;
  bodyHealth: number;
  engine: boolean;
  locked: boolean;
  numberPlate: string;
  livery: number;
  windowTint: number;
  wheelType: number;
  neonEnabled: boolean;

  getColor(): [number, number];
  setColor(primary: number, secondary: number): void;
  getColorRGB(): { primary: [number, number, number]; secondary: [number, number, number] };
  setColorRGB(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): void;
  getNeonColor(): [number, number, number];
  setNeonColor(r: number, g: number, b: number): void;
  getLightsState(lightsOn?: number, highbeamsOn?: number): { lightsOn: boolean; highbeamsOn: boolean };
  getMod(type: number): number;
  setMod(type: number, index: number): void;
  getExtra(extraId: number): boolean;
  /** Client API: false/0 enables the extra, true/1 disables it. */
  setExtra(extraId: number, disabled: boolean | number): void;
  repair(): void;

  getHandling(field: string): number | Vector3;
  setHandling(field: string, value: number | string | Vector3Like | number[]): void;
  resetHandling(): void;

  setWheelSize(size: number): boolean;
  setWheelWidth(width: number): boolean;
  setWheelCamber(disabled: boolean): void;
  setWheelTrackWidth(wheelIndex: number, value: number): void;
  setWheelRadius(wheelIndex: number, value: number): void;
}

export interface VehicleMpPool extends EntityMpPool<VehicleMp> {
  atRemoteId(remoteId: number): VehicleMp | null;
  atHandle(handle: number): VehicleMp | null;
  readonly streamed: VehicleMp[];
  maxStreamed: number;
}

export interface ObjectMp extends EntityMp {
  readonly type: "object";
  rotation: Vector3;
  hidden: boolean;
  isWeak: boolean;
  notifyStreaming: boolean;
  streamingRange: number;
  hasBeenBroken(): boolean;
  isVisible(): boolean;
  markForDeletion(): void;
  placeOnGroundProperly(): void;
  setPhysicsParams(...args: any[]): void;
  setTargettable(state: boolean): void;
  slide(toX: number, toY: number, toZ: number, speedX: number, speedY: number, speedZ: number, collision: boolean): boolean;
}

export interface ObjectMpPool extends EntityMpPool<ObjectMp> {
  new(model: HashOrString, position: Vector3Like, options?: any): ObjectMp;
  atHandle(handle: number): ObjectMp | null;
  atRemoteId(remoteId: number): ObjectMp | null;
  newWeak(handle: number): ObjectMp;
  newWeaponObject(weaponHash: HashOrString, position: Vector3Like, options?: any): ObjectMp;
  getAllByHash(hash: HashOrString): ObjectMp[];
}

export interface PedMp extends EntityMp {
  readonly type: "ped";
  readonly handle: number;
  heading: number;
  health: number;
  armour: number;
  rotation: Vector3;
  controller: PlayerMp | null;
  frozen: boolean;
  invincible: boolean;
  getVehicleIsTryingToEnter(): number;
}

export interface PedMpPool extends EntityMpPool<PedMp> {
  atHandle(handle: number): PedMp | null;
  atRemoteId(remoteId: number): PedMp | null;
}

export interface PickupMp {
  readonly id: number;
  readonly pickupHash: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly value: number;
  readonly alpha: number;
  readonly dimension: number;
}

export interface PickupMpPool {
  readonly length: number;
  readonly size: number;
  at(id: number): PickupMp | null;
  exists(id: number | PickupMp): boolean;
  forEach(fn: (entity: PickupMp) => void): void;
  toArray(): PickupMp[];
}

export interface DummyMp extends EntityMp {
  readonly type: "dummy";
  readonly dummyType: number;
  readonly data: Record<string, any>;
}

export interface DummyMpPool extends EntityMpPool<DummyMp> {
  atRemoteId(remoteId: number): DummyMp | null;
  forEachByType(type: number, fn: (entity: DummyMp) => void): void;
}

export interface BlipMp extends EntityMp {
  readonly type: "blip";
  readonly handle: number;
  sprite: number;
  color: number;
  scale: number;
  name: string;
  shortRange: boolean;
}

export interface BlipMpPool extends EntityMpPool<BlipMp> {
  new(sprite: number, position: Vector3Like, options?: any): BlipMp;
  atRemoteId(remoteId: number): BlipMp | null;
}

export interface CheckpointMp extends EntityMp {
  readonly type: "checkpoint";
  visible: boolean;
  color: [number, number, number, number];
}

export interface CheckpointMpPool extends EntityMpPool<CheckpointMp> {
  new(type: number, position: Vector3Like, radius: number, options?: any): CheckpointMp;
  new(type: number, position: Vector3Like, nextPosition: Vector3Like | null, radius: number, options?: any): CheckpointMp;
  atRemoteId(remoteId: number): CheckpointMp | null;
}

export interface MarkerMp extends EntityMp {
  readonly type: "marker";
  direction: Vector3;
  rotation: Vector3;
  scale: number;
  visible: boolean;
  color: [number, number, number, number];
}

export interface MarkerMpPool extends EntityMpPool<MarkerMp> {
  new(type: number, position: Vector3Like, scale: number, options?: any): MarkerMp;
  atRemoteId(remoteId: number): MarkerMp | null;
}

export interface ColshapeMp extends EntityMp {
  readonly type: "colshape";
  readonly shapeType: number;
  isPointWithin(point: Vector3Like): boolean;
}

export interface ColshapeMpPool extends EntityMpPool<ColshapeMp> {
  newSphere(x: number, y: number, z: number, range: number): ColshapeMp;
  newTube(x: number, y: number, z: number, height: number, range: number): ColshapeMp;
  newCircle(x: number, y: number, range: number): ColshapeMp;
  newRectangle(x: number, y: number, width: number, height: number): ColshapeMp;
  newCuboid(x: number, y: number, z: number, width: number, depth: number, height: number): ColshapeMp;
  atRemoteId(remoteId: number): ColshapeMp | null;
}

export interface TextLabelMp extends EntityMp {
  readonly type: "label";
  text: string;
  color: [number, number, number, number];
  drawDistance: number;
  los: boolean;
  font: number;
  visible: boolean;
}

export interface TextLabelMpPool extends EntityMpPool<TextLabelMp> {
  new(text: string, position: Vector3Like, options?: any): TextLabelMp;
  atRemoteId(remoteId: number): TextLabelMp | null;
}

export interface CameraMp {
  readonly handle: number;
  position: Vector3;
  rotation: Vector3;
  fov: number;
  active: boolean;
  pointAtCoord(x: number, y: number, z: number): void;
  pointAtEntity(entity: number, offsetX?: number, offsetY?: number, offsetZ?: number): void;
  pointAtPedBone(pedHandle: number, boneIndex: number, offsetX?: number, offsetY?: number, offsetZ?: number, relativeRotation?: boolean): void;
  stopPointing(): void;
  shake(type: string, amplitude: number): void;
  stopShaking(): void;
  isShaking(): boolean;
  attachTo(entity: number, offsetX: number, offsetY: number, offsetZ: number, relative: boolean): void;
  attachToPedBone(pedHandle: number, boneIndex: number, x: number, y: number, z: number, relative: boolean): void;
  detach(): void;
  setNearClip(distance: number): void;
  setFarClip(distance: number): void;
  setNearDof(distance: number): void;
  setFarDof(distance: number): void;
  setDofStrength(strength: number): void;
  setMotionBlurStrength(strength: number): void;
  setActiveWithInterp(camFrom: CameraMp, duration: number, easeLocation: number, easeRotation: number): void;
  isInterpolating(): boolean;
  destroy(): void;
}

export interface CameraMpPool {
  new(name: string, position?: Vector3Like, rotation?: Vector3Like, fov?: number): CameraMp;
  readonly gameplay: CameraMp;
}

export interface BrowserMp extends EntityMp {
  readonly type: "browser";
  readonly url: string;
  active: boolean;
  execute(code: string): void;
  executeCached(code: string): void;
  markAsChat(flag: boolean): void;
  reload(ignoreCache: boolean): void;
  call(eventName: string, ...args: any[]): void;
  callProc<T = any>(procName: string, ...args: any[]): Promise<T>;
}

export interface BrowserMpPool extends EntityMpPool<BrowserMp> {
  new(url: string): BrowserMp;
  newHeadless(url: string, width: number, height: number): BrowserMp;
  atRemoteId(remoteId: number): BrowserMp | null;
}

export interface EventManagerMp {
  add(eventName: string, handler: (...args: any[]) => void): void;
  add(events: Record<string, (...args: any[]) => void>): void;
  call(eventName: string, ...args: any[]): void;
  callRemote(eventName: string, ...args: any[]): void;
  callRemoteUnreliable(eventName: string, ...args: any[]): void;
  callRemoteProc<T = any>(procName: string, ...args: any[]): Promise<T>;
  callBrowser(browser: BrowserMp, eventName: string, ...args: any[]): void;
  remove(eventName: string, handler?: (...args: any[]) => void): void;
  addDataHandler(key: string, handler: (entity: EntityMp, value: any, oldValue: any) => void): void;
  addProc<T = any>(procName: string, handler: (...args: any[]) => T | Promise<T>): void;
  cancelPendingProc(procName: string): void;
  hasPendingProc(procName: string): boolean;
  addRule(name: string, handler: (...args: any[]) => boolean): void;
  removeRule(name: string): void;
}

export interface KeyManagerMp {
  bind(keyCode: number, isDown: boolean, handler: () => void): void;
  unbind(keyCode: number, isDown: boolean, handler?: () => void): void;
  isUp(keyCode: number): boolean;
  isDown(keyCode: number): boolean;
}

export interface GuiMp {
  chat: {
    activate(state: boolean): void;
    push(text: string): void;
    show(state: boolean): void;
    clear(): void;
    colors: boolean;
    safeMode: boolean;
  };
  cursor: {
    visible: boolean;
    show(freezeControls: boolean, state: boolean): void;
    readonly position: [number, number];
  };
  execute(code: string): void;
  takeScreenshot(callback: (data: string | null) => void, type?: number, quality?: number): void;
}

export interface ConsoleMp {
  verbosity: number;
  logInfo(message: string): void;
  logWarning(message: string): void;
  logError(message: string): void;
  logFatal(message: string): void;
  clear(): void;
}

export interface StorageMp {
  data: Record<string, any>;
  sessionData: Record<string, any>;
  flush(): void;
}

export interface DiscordMp {
  update(status: string, state: string): void;
  requestOAuth2(appId: string): Promise<string>;
}

export interface NametagsMp {
  enabled: boolean;
  set(style: any): void;
}

export interface RaycastingMp {
  testPointToPoint(start: Vector3Like, end: Vector3Like, ignored?: number, flags?: number): { entity: number; position: Vector3; surfaceNormal: Vector3; didHit: boolean } | null;
  testCapsule(start: Vector3Like, end: Vector3Like, radius: number, ignored?: number, flags?: number): { entity: number; position: Vector3; surfaceNormal: Vector3; didHit: boolean } | null;
}

export interface VoiceChatMp {
  readonly connected: boolean;
  enabled: boolean;
  proximity: number;
  listenTo(player: PlayerMp | number): void;
  stopListenTo(player: PlayerMp | number): void;
  stopListenToAll(): void;
  isTalking(player?: PlayerMp | number): boolean;
  setChannel(channel: number): void;
  setAudioInputDistance(distance: number): void;
  setAudioOutputDistance(distance: number): void;
}

export interface UserMp {
  readonly name: string;
  readonly socialClub: string;
  readonly rgscId: string;
  readonly serial: string;
}

export interface SystemMp {
  readonly version: number;
  readonly resourceName: string;
  notify(message: string): void;
}

export interface GameMp {
  invoke(hash: string, ...args: any[]): any;
  invokeFloat(hash: string, ...args: any[]): number;
  invokeString(hash: string, ...args: any[]): string;
  invokeVector3(hash: string, ...args: any[]): Vector3;
  joaat(text: string): number;
  wait(ms: number): void;
  waitAsync(ms: number): Promise<void>;
  waitForAsync(condition: () => boolean, timeout?: number): Promise<boolean>;
  allocateString(str: string): number;

  entity: Record<string, any>;
  ped: Record<string, any>;
  player: Record<string, any>;
  vehicle: Record<string, any>;
  task: Record<string, any>;
  ai: Record<string, any>;
  streaming: Record<string, any>;
  pad: Record<string, any>;
  controls: Record<string, any>;
  cam: Record<string, any>;
  audio: Record<string, any>;
  hud: Record<string, any>;
  ui: Record<string, any>;
  misc: Record<string, any>;
  gameplay: Record<string, any>;
  weapon: Record<string, any>;
  clock: Record<string, any>;
  time: Record<string, any>;
  fire: Record<string, any>;
  object: Record<string, any>;
  shapetest: Record<string, any>;
  interior: Record<string, any>;
  zone: Record<string, any>;
  pathfind: Record<string, any>;
  physics: Record<string, any>;
  rope: Record<string, any>;
  water: Record<string, any>;
  graphics: Record<string, any>;
  stats: Record<string, any>;
  network: Record<string, any>;
  script: Record<string, any>;
  mobile: Record<string, any>;
  app: Record<string, any>;
  system: Record<string, any>;
  brain: Record<string, any>;
  cutscene: Record<string, any>;
  decorator: Record<string, any>;
  dlc: Record<string, any>;
  files: Record<string, any>;
  loadingscreen: Record<string, any>;
  localization: Record<string, any>;
  itemset: Record<string, any>;
  recording: Record<string, any>;
  replay: Record<string, any>;
  datafile: Record<string, any>;
  event: Record<string, any>;
  gxt: {
    set(label: HashOrString, value: string): void;
    get(label: HashOrString): string;
    getDefault(label: HashOrString): string;
    reset(): void;
  };
}

export interface ClientEnums {
  EntityType: Record<string, number>;
  ScreenshotType: Record<string, number>;
  Weather: Record<string, number>;
  Controls: Record<string, number>;
  Marker: Record<string, number>;
  ClothesComponent: Record<string, number>;
  ColshapeType: Record<string, number>;
  HeadOverlay: Record<string, number>;
  PlayerProp: Record<string, number>;
  VehicleNumberPlateType: Record<string, number>;
  VehicleSeat: Record<string, number>;
  Voice: Record<string, Record<string, number>>;
  Hud: Record<string, Record<string, number>>;
  Explosions: Record<string, number>;
  Camera: Record<string, Record<string, number>>;
  Props: Record<string, number>;
  PropDamage: Record<string, number>;
  Console: Record<string, Record<string, number>>;
  InputGroup: Record<string, number>;
  Alarms: Record<string, string>;
  Weapons: Record<string, number>;
  Vehicle: Record<string, Record<string, number | string>>;
  Notification: Record<string, Record<string, number>>;
  Peds: Record<string, number>;
  Pickups: Record<string, number>;
  Scripts: Record<string, string>;
  CauseOfDeath: Record<string, number>;
}
