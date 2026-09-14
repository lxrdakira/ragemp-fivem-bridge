export const vehicleAppliers: Record<string, (h: number, v: any) => void> = {
  engine: (h: number, v: boolean) => SetVehicleEngineOn(h, v, false, false),
  livery: (h: number, v: number) => SetVehicleLivery(h, v),
  numberPlateType: (h: number, v: number) => SetVehicleNumberPlateTextIndex(h, v),
  windowTint: (h: number, v: number) => SetVehicleWindowTint(h, v),
  wheelType: (h: number, v: number) => SetVehicleWheelType(h, v),
  alpha: (h: number, v: number) => SetEntityAlpha(h, v, false),
  engineHealth: (h: number, v: number) => SetVehicleEngineHealth(h, v),
  bodyHealth: (h: number, v: number) => SetVehicleBodyHealth(h, v),
  locked: (h: number, v: boolean) => {
    const before = GetVehicleDoorLockStatus(h);
    SetVehicleDoorsLocked(h, v ? 2 : 1);
    try {
      (globalThis as any).vehicleEntryTraceLog?.("bridge.nativeLockApplied", (globalThis as any).mp?.vehicles?.atHandle?.(h), {
        bridgeVehicle: h,
        requestedLock: !!v,
        nativeBefore: before,
        nativeAfter: GetVehicleDoorLockStatus(h),
      });
    } catch (_) {}
  },
  numberPlate: (h: number, v: string) => SetVehicleNumberPlateText(h, v),
  dashboardColor: (h: number, v: number) => SetVehicleDashboardColour(h, v),
  taxiLights: (h: number, v: boolean) => SetTaxiLights(h, v),
  trimColor: (h: number, v: number) => SetVehicleInteriorColour(h, v),
  neonEnabled: (h: number, v: boolean) => {
    for (let i = 0; i < 4; i++) SetVehicleNeonLightEnabled(h, i, v);
  },
  customTires: (h: number, v: boolean) => {
    SetVehicleModKit(h, 0);
    ToggleVehicleMod(h, 18, v);
  },
  pearlescentColor: (h: number, v: number) => {
    const [, wheelCol] = GetVehicleExtraColours(h);
    SetVehicleExtraColours(h, v, wheelCol);
  },
  wheelColor: (h: number, v: number) => {
    const [pearlCol] = GetVehicleExtraColours(h);
    SetVehicleExtraColours(h, pearlCol, v);
  },
  neonColor: (h: number, value: [number, number, number]) => {
    const [r, g, b] = value;
    SetVehicleNeonLightsColour(h, r, g, b);
  },
  colorRGB: (h: number, value: [[number, number, number], [number, number, number]]) => {
    const [[r1, g1, b1], [r2, g2, b2]] = value;
    SetVehicleCustomPrimaryColour(h, r1, g1, b1);
    SetVehicleCustomSecondaryColour(h, r2, g2, b2);
  },
};

export function applyVehicleProp(handle: number, key: string, value: unknown): void {
  const fn = vehicleAppliers[key];
  if (fn) fn(handle, value);
}

export function applyVehicleColorOption(handle: number, color: unknown): void {
  if (!Array.isArray(color)) return;
  const [primary, secondary] = color;
  if (Array.isArray(primary) && Array.isArray(secondary)) {
    SetVehicleCustomPrimaryColour(handle, primary[0], primary[1], primary[2]);
    SetVehicleCustomSecondaryColour(handle, secondary[0], secondary[1], secondary[2]);
  } else if (typeof primary === "number" && typeof secondary === "number") {
    SetVehicleColours(handle, primary, secondary);
  }
}

export function applyVehicleMod(handle: number, modType: number, modIndex: number): void {
  SetVehicleModKit(handle, 0);
  SetVehicleMod(handle, modType, modIndex, false);
}

export function applyVehicleExtra(handle: number, extraId: number, state: boolean): void {
  SetVehicleExtra(handle, extraId, !state);
}

export function applyVehicleRepair(handle: number): void {
  SetVehicleFixed(handle);
  SetVehicleEngineHealth(handle, 1000.0);
  SetVehicleBodyHealth(handle, 1000.0);
}

export function applyVehicleSnapshot(handle: number, snap: Record<string, any> | null | undefined): void {
  if (!handle || !snap) return;

  for (const key of Object.keys(vehicleAppliers)) {
    if (snap[key] !== undefined && snap[key] !== null) {
      vehicleAppliers[key](handle, snap[key]);
    }
  }

  if (snap.mods) {
    for (const [modType, modIndex] of Object.entries(snap.mods)) {
      applyVehicleMod(handle, Number(modType), modIndex as number);
    }
  }

  if (snap.extras) {
    for (const [extraId, state] of Object.entries(snap.extras)) {
      applyVehicleExtra(handle, Number(extraId), state as boolean);
    }
  }

  if (snap.color) {
    SetVehicleColours(handle, snap.color.primary, snap.color.secondary);
  }
}
