export const SET_PED_COMPONENT_VARIATION_NATIVE = "0X262B14F48D29DE80";

export function isSetPedComponentVariationNative(hash: unknown): boolean {
  return typeof hash === "string" && hash.toUpperCase() === SET_PED_COMPONENT_VARIATION_NATIVE;
}
