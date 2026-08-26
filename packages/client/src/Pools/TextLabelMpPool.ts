import { Vector3, Pool } from "@ragemp-fivem-bridge/shared";
import { CONSTRUCT } from "@ragemp-fivem-bridge/shared/internal";
import { addLocal } from "../internal/pools/clientPool";
import { TextLabelMp } from "../Entities/TextLabelMp";
import { TextLabelInternals } from "../internal/textLabelInternals";
import { setupTextLabelPool } from "../internal/pools/textLabelPoolService";

export class TextLabelMpPool extends Pool<TextLabelMp> {
  constructor() {
    super();
    setupTextLabelPool(this);
  }

  new(text: string, position: Vector3 | { x: number; y: number; z: number }, options: any = {}): TextLabelMp {
    const label = new TextLabelMp(CONSTRUCT, 0);
    const rec = TextLabelInternals.get(label);

    rec.text = text;
    rec.position = position instanceof Vector3 ? position : new Vector3(position.x, position.y, position.z);

    if (options.color !== undefined) {
      const color = options.color;
      const array = Array.isArray(color);
      rec.r = (array ? color[0] : color.r) ?? 255;
      rec.g = (array ? color[1] : color.g) ?? 255;
      rec.b = (array ? color[2] : color.b) ?? 255;
      rec.a = (array ? color[3] : color.a) ?? 255;
    }
    if (options.drawDistance !== undefined) rec.drawDistance = options.drawDistance;
    if (options.font !== undefined) rec.font = options.font;
    if (options.los !== undefined) rec.los = options.los;
    if (options.dimension !== undefined) rec.dimension = options.dimension;

    addLocal(this, label as any);

    return label;
  }
}
