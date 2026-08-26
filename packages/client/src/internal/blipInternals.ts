import { defineInternals } from "@ragemp-fivem-bridge/shared/internal";
import type { BlipMp } from "../Entities/BlipMp";

export interface BlipInternalsRec {
  dimension: number;
  alpha: number;
  drawDistance: number;
  rotation: number;
  radius: number;
  scale: number | undefined;
  name: string | undefined;
  shortRange: boolean | undefined;
}

export const BlipInternals = defineInternals<BlipInternalsRec>();

export function initBlipInternals(blip: BlipMp): BlipInternalsRec {
  return BlipInternals.init(blip, {
    dimension: 0,
    alpha: 255,
    drawDistance: 0,
    rotation: 0,
    radius: 0,
    scale: undefined,
    name: undefined,
    shortRange: undefined,
  });
}
