import { Vector3 } from "@ragemp-fivem-bridge/shared";
import { toVec3 } from "./_helpers.js";
import { GameGxt } from "./gxt.js";
import { GameEntityNs } from "./entity.js";
import { GamePedNs } from "./ped.js";
import { GamePlayerNs } from "./player.js";
import { GameVehicleNs } from "./vehicle.js";
import { GameTaskNs } from "./task.js";
import { GameStreamingNs } from "./streaming.js";
import { GamePadNs } from "./pad.js";
import { GameCamNs } from "./cam.js";
import { GameAudioNs } from "./audio.js";
import { GameHudNs } from "./hud.js";
import { GameMiscNs } from "./misc.js";
import { GameWeaponNs } from "./weapon.js";
import { GameClockNs } from "./clock.js";
import { GameFireNs } from "./fire.js";
import { GameObjectNs } from "./object.js";
import { GameShapetestNs } from "./shapetest.js";
import { GameInteriorNs } from "./interior.js";
import { GameZoneNs } from "./zone.js";
import { GamePathfindNs } from "./pathfind.js";
import { GamePhysicsNs } from "./physics.js";
import { GameWaterNs } from "./water.js";
import { GameGraphicsNs } from "./graphics.js";
import { GameStatsNs } from "./stats.js";
import { GameNetworkNs } from "./network.js";
import { GameScriptNs } from "./script.js";
import { GameMobileNs } from "./mobile.js";
import { GameAppNs } from "./app.js";
import { GameSystemNs } from "./system.js";
import { GameBrainNs } from "./brain.js";
import { GameCutsceneNs } from "./cutscene.js";
import { GameDecoratorNs } from "./decorator.js";
import { GameDlcNs } from "./dlc.js";
import { GameFilesNs } from "./files.js";
import { GameLoadingscreenNs } from "./loadingscreen.js";
import { GameLocalizationNs } from "./localization.js";
import { GameItemsetNs } from "./itemset.js";
import { GameRecordingNs } from "./recording.js";
import { GameReplayNs } from "./replay.js";
import { GameDatafileNs } from "./datafile.js";
import { GameEventNs } from "./event.js";
import { setCompatibleComponentVariation } from "../utils/clothingCompatibility.js";
import { isSetPedComponentVariationNative } from "../utils/nativeInvokeRouter.js";

export class GameMp {
  entity: GameEntityNs;
  ped: GamePedNs;
  player: GamePlayerNs;
  vehicle: GameVehicleNs;
  task: GameTaskNs;
  streaming: GameStreamingNs;
  pad: GamePadNs;
  cam: GameCamNs;
  audio: GameAudioNs;
  hud: GameHudNs;
  misc: GameMiscNs;
  weapon: GameWeaponNs;
  clock: GameClockNs;
  fire: GameFireNs;
  object: GameObjectNs;
  shapetest: GameShapetestNs;
  interior: GameInteriorNs;
  zone: GameZoneNs;
  pathfind: GamePathfindNs;
  physics: GamePhysicsNs;
  water: GameWaterNs;
  graphics: GameGraphicsNs;
  stats: GameStatsNs;
  network: GameNetworkNs;
  script: GameScriptNs;
  mobile: GameMobileNs;
  app: GameAppNs;
  system: GameSystemNs;
  brain: GameBrainNs;
  cutscene: GameCutsceneNs;
  decorator: GameDecoratorNs;
  dlc: GameDlcNs;
  files: GameFilesNs;
  loadingscreen: GameLoadingscreenNs;
  localization: GameLocalizationNs;
  itemset: GameItemsetNs;
  recording: GameRecordingNs;
  recorder: GameRecordingNs;
  replay: GameReplayNs;
  datafile: GameDatafileNs;
  event: GameEventNs;
  gxt: GameGxt;
  gameplay: GameMiscNs;
  ai: GameTaskNs;
  time: GameClockNs;
  rope: GamePhysicsNs;
  controls: GamePadNs;
  ui: GameHudNs;

  constructor() {
    this.entity = new GameEntityNs();
    this.ped = new GamePedNs();
    this.player = new GamePlayerNs();
    this.vehicle = new GameVehicleNs();
    this.task = new GameTaskNs();
    this.streaming = new GameStreamingNs();
    this.pad = new GamePadNs();
    this.cam = new GameCamNs();
    this.audio = new GameAudioNs();
    this.hud = new GameHudNs();
    this.misc = new GameMiscNs();
    this.weapon = new GameWeaponNs();
    this.clock = new GameClockNs();
    this.fire = new GameFireNs();
    this.object = new GameObjectNs();
    this.shapetest = new GameShapetestNs();
    this.interior = new GameInteriorNs();
    this.zone = new GameZoneNs();
    this.pathfind = new GamePathfindNs();
    this.physics = new GamePhysicsNs();
    this.water = new GameWaterNs();
    this.graphics = new GameGraphicsNs();
    this.stats = new GameStatsNs();
    this.network = new GameNetworkNs();
    this.script = new GameScriptNs();
    this.mobile = new GameMobileNs();
    this.app = new GameAppNs();
    this.system = new GameSystemNs();
    this.brain = new GameBrainNs();
    this.cutscene = new GameCutsceneNs();
    this.decorator = new GameDecoratorNs();
    this.dlc = new GameDlcNs();
    this.files = new GameFilesNs();
    this.loadingscreen = new GameLoadingscreenNs();
    this.localization = new GameLocalizationNs();
    this.itemset = new GameItemsetNs();
    this.recording = new GameRecordingNs();
    this.recorder = this.recording;
    this.replay = new GameReplayNs();
    this.datafile = new GameDatafileNs();
    this.event = new GameEventNs();

    this.gxt = new GameGxt();

    this.gameplay = this.misc;
    this.ai = this.task;
    this.time = this.clock;
    this.rope = this.physics;
    this.controls = this.pad;
    this.ui = this.hud;
  }

  invoke(hash: string, ...args: any[]): any {
    if (isSetPedComponentVariationNative(hash)) {
      setCompatibleComponentVariation(
        Number(args[0]) || 0,
        Number(args[1]) || 0,
        Number(args[2]) || 0,
        Number(args[3]) || 0,
        Number(args[4]) || 0,
      );
      return undefined;
    }
    return Citizen.invokeNative(hash, ...args);
  }
  invokeFloat(hash: string, ...args: any[]): number { return Citizen.invokeNative(hash, Citizen.resultAsFloat(), ...args); }
  invokeString(hash: string, ...args: any[]): string { return Citizen.invokeNative(hash, Citizen.resultAsString(), ...args); }
  invokeVector3(hash: string, ...args: any[]): Vector3 {
    const r: any = Citizen.invokeNative(hash, Citizen.resultAsVector(), ...args);
    return r ? toVec3(r) : new Vector3(0, 0, 0);
  }

  joaat(text: string): number;
  joaat(textArray: string[]): number[];
  joaat(text: string | string[]): number | number[] {
    if (Array.isArray(text)) return text.map((t) => GetHashKey(t));
    return GetHashKey(text);
  }

  wait(ms: number): void { Wait(ms); }
  waitAsync(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)); }
  waitForAsync(callback: Function, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const start = GetGameTimer();
      const check = () => {
        if (callback()) { resolve(true); return; }
        if (GetGameTimer() - start >= timeout) { resolve(false); return; }
        setTimeout(check, 0);
      };
      check();
    });
  }
}
