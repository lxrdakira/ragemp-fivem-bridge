import { createUnkProxy } from "./_helpers.js";

export class GameClockNs {
  unk = createUnkProxy();

  setClockTime(hour: number, minute: number, second: number): void { NetworkOverrideClockTime(hour, minute, second); }
  pauseClock(toggle: boolean): void { PauseClock(toggle); }
  advanceClockTimeTo(hour: number, minute: number, second: number): void { AdvanceClockTimeTo(hour, minute, second); }
  addToClockTime(hours: number, minutes: number, seconds: number): void { AddToClockTime(hours, minutes, seconds); }
  setClockDate(day: number, month: number, year: number): void { SetClockDate(day, month, year); }
  getLocalTimeGmt(): { year: number; month: number; day: number; hour: number; minute: number; second: number } { const r = GetUtcTime(); return { year: r[0], month: r[1], day: r[2], hour: r[3], minute: r[4], second: r[5] }; }
  setTime(hour: number, minute: number, second: number): void { this.setClockTime(hour, minute, second); }
  pause(toggle: boolean): void { PauseClock(toggle); }
  advanceTimeTo(hour: number, minute: number, second: number): void { AdvanceClockTimeTo(hour, minute, second); }
  addToTime(hours: number, minutes: number, seconds: number): void { AddToClockTime(hours, minutes, seconds); }
  getHours(): number { return GetClockHours(); }
  getMinutes(): number { return GetClockMinutes(); }
  getSeconds(): number { return GetClockSeconds(); }
  setDate(day: number, month: number, year: number): void { SetClockDate(day, month, year); }
  getDayOfWeek(): number { return GetClockDayOfWeek(); }
  getDayOfMonth(): number { return GetClockDayOfMonth(); }
  getMonth(): number { return GetClockMonth(); }
  getYear(): number { return GetClockYear(); }
  getMillisecondsPerGameMinute(): number { return GetMillisecondsPerGameMinute(); }
  getPosixTime(): { year: number; month: number; day: number; hour: number; minute: number; second: number } { const r = GetPosixTime(); return { year: r[0], month: r[1], day: r[2], hour: r[3], minute: r[4], second: r[5] }; }
  getUtcTime(): { year: number; month: number; day: number; hour: number; minute: number; second: number } { const r = GetUtcTime(); return { year: r[0], month: r[1], day: r[2], hour: r[3], minute: r[4], second: r[5] }; }
  getLocalTime(): { year: number; month: number; day: number; hour: number; minute: number; second: number } { const r = GetLocalTime(); return { year: r[0], month: r[1], day: r[2], hour: r[3], minute: r[4], second: r[5] }; }
}
