import { Vector3, Entity } from "@ragemp-fivem-bridge/shared";
import { PlayerMpPool } from "./Pools/PlayerMpPool";
import { ObjectMpPool } from "./Pools/ObjectMpPool";
import { BlipMpPool } from "./Pools/BlipMpPool";
import { ColshapeMpPool } from "./Pools/ColshapeMpPool";
import { CheckpointMpPool } from "./Pools/CheckpointMpPool";
import { VehicleMpPool } from "./Pools/VehicleMpPool";
import { PedMpPool } from "./Pools/PedMpPool";
import { CameraMpPool } from "./Pools/CameraMpPool";
import { BrowserMpPool } from "./Pools/BrowserMpPool";
import { PickupMpPool } from "./Pools/PickupMpPool";
import { DummyMpPool } from "./Pools/DummyMpPool";
import { MarkerMpPool } from "./Pools/MarkerMpPool";
import { TextLabelMpPool } from "./Pools/TextLabelMpPool";
import { EventManager } from "./Events/EventManager";
import { KeyManager } from "./Keys/KeyManager";
import { GuiMp } from "./Gui";
import { ConsoleMp } from "./Console";
import { StorageMp } from "./Storage";
import { DiscordMp } from "./Discord";
import { NametagsMp } from "./Nametags";
import { RaycastingMp } from "./Raycasting";
import { VoiceChatMp } from "./VoiceChat";
import { UserMp } from "./User";
import { SystemMp } from "./System";
import { GameMp } from "./Game";
import { PluginManager } from "./Plugins/PluginManager";
import { PlayerMp } from "./Entities/PlayerMp";
import { VehicleMp } from "./Entities/VehicleMp";
import { ObjectMp } from "./Entities/ObjectMp";
import { BlipMp } from "./Entities/BlipMp";
import { ColshapeMp } from "./Entities/ColshapeMp";
import { CheckpointMp } from "./Entities/CheckpointMp";
import { MarkerMp } from "./Entities/MarkerMp";
import { TextLabelMp } from "./Entities/TextLabelMp";
import { PedMp } from "./Entities/PedMp";
import { DummyMp } from "./Entities/DummyMp";
import { CameraMp } from "./Entities/CameraMp";
import { BrowserMp } from "./Entities/BrowserMp";
import * as Enums from "./Enums";

export class Mp {
  Vector3: typeof Vector3 = Vector3;
  enums: typeof Enums = Enums;
  version = { core: "fivem-bridge", net: "fivem" };

  Entity: typeof Entity = Entity;
  Player: typeof PlayerMp = PlayerMp;
  Vehicle: typeof VehicleMp = VehicleMp;
  Object: typeof ObjectMp = ObjectMp;
  Blip: typeof BlipMp = BlipMp;
  Colshape: typeof ColshapeMp = ColshapeMp;
  Checkpoint: typeof CheckpointMp = CheckpointMp;
  Marker: typeof MarkerMp = MarkerMp;
  TextLabel: typeof TextLabelMp = TextLabelMp;
  Ped: typeof PedMp = PedMp;
  Dummy: typeof DummyMp = DummyMp;
  Camera: typeof CameraMp = CameraMp;
  Browser: typeof BrowserMp = BrowserMp;

  players: PlayerMpPool = new PlayerMpPool();
  objects: ObjectMpPool = new ObjectMpPool();
  blips: BlipMpPool = new BlipMpPool();
  colshapes: ColshapeMpPool = new ColshapeMpPool();
  checkpoints: CheckpointMpPool = new CheckpointMpPool();
  vehicles: VehicleMpPool = new VehicleMpPool();
  peds: PedMpPool = new PedMpPool();
  cameras: CameraMpPool = new CameraMpPool();
  browsers: BrowserMpPool = new BrowserMpPool();
  pickups: PickupMpPool = new PickupMpPool();
  dummies: DummyMpPool = new DummyMpPool();
  markers: MarkerMpPool = new MarkerMpPool();
  labels: TextLabelMpPool = new TextLabelMpPool();
  events: EventManager = new EventManager();
  // RAGE:MP exposes the unwrapped event registrar through `mp._events`.
  // Neptune captures this function before replacing `gm.events.add` with its
  // own error-reporting wrapper, so it must remain callable without a `this`
  // receiver.
  _events = {
    add: this.events.add.bind(this.events),
  };
  keys: KeyManager = new KeyManager();
  gui: GuiMp = new GuiMp();
  console: ConsoleMp = new ConsoleMp();
  storage: StorageMp = new StorageMp();
  discord: DiscordMp = new DiscordMp();
  nametags: NametagsMp = new NametagsMp();
  raycasting: RaycastingMp = new RaycastingMp();
  voiceChat: VoiceChatMp = new VoiceChatMp();
  user: UserMp = new UserMp();
  system: SystemMp = new SystemMp();
  game: GameMp = new GameMp();
  plugins: PluginManager = new PluginManager();
}
