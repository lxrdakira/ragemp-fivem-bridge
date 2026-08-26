import { defineInternals } from "@ragemp-fivem-bridge/shared/internal";
import { Vector3 } from "@ragemp-fivem-bridge/shared";
import type { TextLabelMp } from "../Entities/TextLabelMp";

export interface TextLabelInternalsRec {
  position: Vector3 | undefined;
  text: string | undefined;
  r: number;
  g: number;
  b: number;
  a: number;
  drawDistance: number;
  size: number;
  los: boolean;
  font: number;
  visible: boolean;
  dimension: number;
}

export const TextLabelInternals = defineInternals<TextLabelInternalsRec>();

export function initTextLabelInternals(label: TextLabelMp): TextLabelInternalsRec {
  return TextLabelInternals.init(label, {
    position: undefined,
    text: undefined,
    r: 255,
    g: 255,
    b: 255,
    a: 255,
    drawDistance: 50,
    size: 0.35,
    los: false,
    font: 0,
    visible: true,
    dimension: 0,
  });
}
