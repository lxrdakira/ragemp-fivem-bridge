import { Entity } from "@ragemp-fivem-bridge/shared";
import { Vector3 } from "@ragemp-fivem-bridge/shared";
import { removeFromPool } from "@ragemp-fivem-bridge/shared/internal";
import { freeClientId } from "../internal/pools/clientPool";
import { TextLabelInternals, initTextLabelInternals } from "../internal/textLabelInternals";

export class TextLabelMp extends Entity {
  constructor(token: symbol, id: number) {
    super(token, id, "textlabel");
    initTextLabelInternals(this);
  }

  override get position(): Vector3 | undefined {
    return TextLabelInternals.get(this).position;
  }

  override set position(value: Vector3 | undefined) {
    TextLabelInternals.get(this).position = value;
  }

  get text(): string | undefined {
    return TextLabelInternals.get(this).text;
  }

  set text(value: string | undefined) {
    TextLabelInternals.get(this).text = value;
  }

  get color(): { r: number; g: number; b: number; a: number } {
    const rec = TextLabelInternals.get(this);
    return { r: rec.r, g: rec.g, b: rec.b, a: rec.a };
  }

  set color(value: { r?: number; g?: number; b?: number; a?: number }) {
    const rec = TextLabelInternals.get(this);
    rec.r = value.r ?? rec.r;
    rec.g = value.g ?? rec.g;
    rec.b = value.b ?? rec.b;
    rec.a = value.a ?? rec.a;
  }

  get drawDistance(): number {
    return TextLabelInternals.get(this).drawDistance;
  }

  set drawDistance(value: number) {
    TextLabelInternals.get(this).drawDistance = value;
  }

  get size(): number {
    return TextLabelInternals.get(this).size;
  }

  set size(value: number) {
    TextLabelInternals.get(this).size = value;
  }

  get los(): boolean {
    return TextLabelInternals.get(this).los;
  }

  set los(value: boolean) {
    TextLabelInternals.get(this).los = value;
  }

  get font(): number {
    return TextLabelInternals.get(this).font;
  }

  set font(value: number) {
    TextLabelInternals.get(this).font = value;
  }

  get visible(): boolean {
    return TextLabelInternals.get(this).visible;
  }

  set visible(value: boolean) {
    TextLabelInternals.get(this).visible = value;
  }

  override get dimension(): number {
    return TextLabelInternals.get(this).dimension;
  }

  override set dimension(value: number) {
    TextLabelInternals.get(this).dimension = value;
  }

  override destroy(): void {
    if (globalThis.mp.labels) {
      removeFromPool(globalThis.mp.labels, this.id);
      freeClientId(globalThis.mp.labels, this.id);
    }
  }
}
