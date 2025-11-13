import { UserDateFormatInfo } from "./HiddenSortGridComponent";
import { DateMetadata } from "./MetadataHelper";

export function toWebApiDate(
  uiDate: Date | null,
  formatting: ComponentFramework.Formatting,
  metadataInfo: DateMetadata | null
): Date | null {
  if (!uiDate)
    return null;

  const serverIso = formatting.formatUserDateTimeToUTC(uiDate, metadataInfo?.behavior ?? 0);
  const serverDate = new Date(serverIso);

  return serverDate;
}

export function fromWebApiDate(
  serverDate: Date | null,
  formatting: ComponentFramework.Formatting,
  metadataInfo: DateMetadata | null
): Date | null {
  if (!serverDate)
    return null;

  const uiDate = formatting.formatUTCDateTimeToUserDate(serverDate, metadataInfo?.behavior ?? 0);
  return uiDate;
}

export function utcToPickerDate(
  utc: Date | null,
  formatting: ComponentFramework.Formatting,
  metadataInfo: DateMetadata | null
): Date | null {
  if (!utc) return null;

  const userLocal = formatting.formatUTCDateTimeToUserDate(utc, metadataInfo?.behavior ?? 0);
  return new Date(
    userLocal.getFullYear(),
    userLocal.getMonth(),
    userLocal.getDate(),
    userLocal.getHours(),
    userLocal.getMinutes(),
    userLocal.getSeconds(),
    0
  );
}

export function pickerDateToUtc(
  picked: Date | null,
  formatting: ComponentFramework.Formatting,
  metadataInfo: DateMetadata | null
): Date | null {
  if (!picked)
    return null;

  const dateOnly = (metadataInfo?.behavior ?? 0) === 2 || (metadataInfo?.formatName ?? "DateAndTime") === "DateOnly";

  const y = picked.getFullYear();
  const M = picked.getMonth();
  const d = picked.getDate();
  const H = dateOnly ? 0 : picked.getHours();
  const m = dateOnly ? 0 : picked.getMinutes();
  const s = dateOnly ? 0 : picked.getSeconds();
  const ms = dateOnly ? 0 : picked.getMilliseconds();

  const utc = Date.UTC(y, M, d, H, m, s, ms);
  const userLocal = formatting.formatUserDateTimeToUTC(new Date(utc), metadataInfo?.behavior ?? 0);

  return new Date(userLocal);
}

export function formatDateD365(
  value: Date | null,
  formatting: ComponentFramework.Formatting,
  metadataInfo: DateMetadata | null,
  userFormatInfo: UserDateFormatInfo
): string | null {
  if (value == null || metadataInfo == null || userFormatInfo == null)
    return null;

  if ((metadataInfo?.behavior ?? 0) === 2 || (metadataInfo?.formatName ?? "DateAndTime") === "DateOnly") {
    const convertedDate = formatting.formatUTCDateTimeToUserDate(value, metadataInfo?.behavior ?? 0);
    const dateOnlyFormatDate = formatting.formatDateShort(convertedDate);
    return dateOnlyFormatDate;
  }

  const formatted = formatting.formatTime(value, metadataInfo?.behavior ?? 0);
  return formatted;
}

const SEP_RX = /[.\-/\s]+/;
const TIME_SEP_RX = /[:.\s]+/;

function lastDayOfMonth(y: number, m1based: number) {
  return new Date(y, m1based, 0).getDate();
}

function clampInt(n: unknown) {
  const z = Number(n);
  return Number.isFinite(z) ? Math.trunc(z) : NaN;
}

function getDateOrder(pattern: string): ('y' | 'M' | 'd')[] {
  const idx = [
    { t: 'y' as const, i: pattern.search(/y+/i) },
    { t: 'M' as const, i: pattern.search(/M+/) },
    { t: 'd' as const, i: pattern.search(/d+/i) },
  ].filter(x => x.i >= 0).sort((a, b) => a.i - b.i);
  return idx.map(x => x.t);
}

function parseLooseDateParts(input: string, order: ('y' | 'M' | 'd')[]) {
  const parts = input.trim().split(SEP_RX).filter(Boolean);
  if (parts.length < 3) return null;

  let y = NaN, M = NaN, d = NaN;

  if (/^\d{4}$/.test(parts[0])) {
    y = clampInt(parts[0]);
    M = clampInt(parts[1]);
    d = clampInt(parts[2]);
  } else {
    const map: Record<'y' | 'M' | 'd', number> = { y: NaN as any, M: NaN as any, d: NaN as any };
    [map[order[0]], map[order[1]], map[order[2]]] = parts.slice(0, 3).map(clampInt);
    y = map.y; M = map.M; d = map.d;

    if (y >= 0 && y < 100) {
      const pivot = 50;
      const century = (y <= pivot) ? 2000 : 1900;
      y = century + y;
    }
  }

  if (!Number.isFinite(y) || !Number.isFinite(M) || !Number.isFinite(d)) return null;
  if (M < 1 || M > 12)
    return null;
  const ld = lastDayOfMonth(y, M);
  if (d < 1 || d > ld)
    return null;

  return { y, M, d };
}

function parseLooseTimeParts(
  input: string,
  userFormatInfo: UserDateFormatInfo) {
  if (!input)
    return { H: 0, m: 0, s: 0, hasTime: false };

  const am = userFormatInfo.amDesignator?.toLowerCase() ?? 'am';
  const pm = userFormatInfo.pmDesignator?.toLowerCase() ?? 'pm';

  const lower = input.trim().toLowerCase();

  const hasAM = am && lower.includes(am.toLowerCase());
  let hasPM = pm && lower.includes(pm.toLowerCase());

  const stripped = lower
    .replace(new RegExp(am.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '')
    .replace(new RegExp(pm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '')
    .trim();

  const nums = stripped.split(TIME_SEP_RX).filter(Boolean).map(clampInt);
  if (nums.length === 0)
    return { H: 0, m: 0, s: 0, hasTime: false };

  let H = nums[0] ?? 0;
  const m = nums[1] ?? 0;
  const s = nums[2] ?? 0;

  if (hasAM || hasPM || userFormatInfo.shortTimePattern.toLowerCase().includes('h')) {
    if (!hasAM && !hasPM && H >= 12)
      hasPM = true;
    H = H % 12;
    if (hasPM) H += 12;
  }
  if (H < 0 || H > 23 || m < 0 || m > 59 || s < 0 || s > 59) {
    return null;
  }
  return { H, m, s, hasTime: true };
}

function splitDateTime(input: string) {
  const tIdx = input.indexOf('T');

  if (tIdx > 0)
    return [input.slice(0, tIdx), input.slice(tIdx + 1)];

  const m = /^(.*?)[,\s]+(\d{1,2}[:.]\d{2}.*)$/.exec(input);
  if (m)
    return [m[1], m[2]];

  return [input, ''];
}

export function parseDate(
  input: string | null | undefined,
  userFormatInfo: UserDateFormatInfo): Date | null {
  if (!input)
    return null;

  const raw = input.trim();
  if (!raw)
    return null;

  if (/^\d{4}-\d{2}-\d{2}(?:[tT]\d{2}:\d{2}(?::\d{2})?(?:\.\d{1,6})?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(raw)) {
    const d = new Date(raw);
    if (isNaN(+d))
      return null;

    return d;
  }

  const [datePartRaw, timePartRaw] = splitDateTime(raw);

  const order = getDateOrder(userFormatInfo.shortDatePattern || 'M/d/yyyy'); // fallback
  const dp = parseLooseDateParts(datePartRaw, order);
  if (!dp)
    return null;

  const tp = parseLooseTimeParts(timePartRaw, userFormatInfo);
  if (tp === null)
    return null;

  const { y, M, d } = dp;
  const { H, m, s } = tp;

  return new Date(y, M - 1, d, H, m, s, 0);
}