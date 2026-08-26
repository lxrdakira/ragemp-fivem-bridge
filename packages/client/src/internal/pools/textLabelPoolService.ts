import { defineInternals, poolStore, CONSTRUCT } from "@ragemp-fivem-bridge/shared/internal";
import { addNetworked } from "./clientPool";
import { Vector3 } from "@ragemp-fivem-bridge/shared";
import { TextLabelMp } from "../../Entities/TextLabelMp";
import { TextLabelInternals } from "../textLabelInternals";
import { isVisibleHere } from "../../utils/dimension";
import { setupNetworkedReceiver } from "./networkedReceiverService";
import type { TextLabelMpPool } from "../../Pools/TextLabelMpPool";

interface TextLabelPoolRec {
  renderTick: number | null;
}

const TextLabelPoolInternals = defineInternals<TextLabelPoolRec>();

function createFromData(pool: TextLabelMpPool, data: any): TextLabelMp {
  const label = new TextLabelMp(CONSTRUCT, data.id);
  const rec = TextLabelInternals.get(label);
  rec.text = data.text;
  rec.position = new Vector3(data.x, data.y, data.z);
  rec.r = data.r;
  rec.g = data.g;
  rec.b = data.b;
  rec.a = data.a;
  rec.drawDistance = data.drawDistance;
  rec.size = Number.isFinite(data.size) ? data.size : 0.35;
  rec.los = data.los;
  rec.font = data.font;
  rec.dimension = data.dimension ?? 0;
  rec.visible = true;
  addNetworked(pool, label as any);
  return label;
}

export function setupTextLabelPool(pool: TextLabelMpPool): void {
  TextLabelPoolInternals.init(pool, { renderTick: null });

  setupNetworkedReceiver(pool, {
    createEvent: "ragemp:labelCreate",
    syncAllEvent: "ragemp:labelSyncAll",
    updateEvent: "ragemp:labelUpdate",
    destroyEvent: "ragemp:labelDestroy",
    create: (p, data) => createFromData(p, data),
    update: (p, id, data) => {
      const existing = p.atRemoteId(id) as unknown as TextLabelMp | null;
      if (existing) {
        const rec = TextLabelInternals.get(existing);
        rec.text = data.text;
        rec.position = new Vector3(data.x, data.y, data.z);
        rec.r = data.r;
        rec.g = data.g;
        rec.b = data.b;
        rec.a = data.a;
        rec.drawDistance = data.drawDistance;
        rec.size = Number.isFinite(data.size) ? data.size : 0.35;
        rec.los = data.los;
        rec.font = data.font;
        rec.dimension = data.dimension ?? 0;
      }
    },
    destroy: (p, id) => {
      const existing = p.atRemoteId(id) as unknown as TextLabelMp | null;
      if (existing) existing.destroy();
    },
  });

  startRendering(pool);
}

function startRendering(pool: TextLabelMpPool): void {
  const poolRec = TextLabelPoolInternals.get(pool);
  poolRec.renderTick = setTick(() => {
    if (poolStore(pool).entities.size === 0) return;
    const playerPed = PlayerPedId();
    const playerCoords = GetEntityCoords(playerPed, true);
    const playerX = playerCoords[0];
    const playerY = playerCoords[1];
    const playerZ = playerCoords[2];

    pool.forEach(((label: TextLabelMp) => {
      const rec = TextLabelInternals.get(label);
      if (!rec.visible) return;
      if (!isVisibleHere(rec.dimension)) return;

      const pos = rec.position;
      if (!pos) return;

      const dx = playerX - pos.x;
      const dy = playerY - pos.y;
      const dz = playerZ - pos.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const drawDist = rec.drawDistance;

      if (distSq > drawDist * drawDist) return;

      SetDrawOrigin(pos.x, pos.y, pos.z, 0);
      SetTextFont(rec.font);
      SetTextScale(0.0, rec.size);
      SetTextColour(rec.r, rec.g, rec.b, rec.a);
      SetTextOutline();
      SetTextCentre(true);
      BeginTextCommandDisplayText("STRING");
      AddTextComponentSubstringPlayerName(rec.text);
      EndTextCommandDisplayText(0.0, 0.0);
      ClearDrawOrigin();
    }) as any);
  });

  if (typeof on === "function") {
    on("onResourceStop", (name: string) => {
      if (typeof GetCurrentResourceName === "function" && name !== GetCurrentResourceName()) return;
      if (poolRec.renderTick != null) {
        clearTick(poolRec.renderTick);
        poolRec.renderTick = null;
      }
    });
  }
}
