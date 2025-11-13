import { SimpleKind } from "./TypesHelper";
import { OperatorMeta, CATALOG_TEXT, CATALOG_TEXTLIKE, CATALOG_OPTIONSET, CATALOG_MULTIOPTIONSET, CATALOG_NUMBER, CATALOG_DATE, CATALOG_LOOKUP } from "./FilterOperatorsMatrix";
import { FilterModel } from "./FilterExpressionHelper";
import { UserNumberFormatInfo } from "./HiddenSortGridComponent";
import { DateMetadata, FieldMetadata, NumericMetadata, TextMetadata } from "./MetadataHelper";
import { IInputs } from "./generated/ManifestTypes";

export type SortDirection = ComponentFramework.PropertyHelper.DataSetApi.Types.SortDirection;
export type ColumnInfo = ComponentFramework.PropertyHelper.DataSetApi.Column &
{
  entityAlias: string | undefined,
  entityName: string,
  logicalName: string,
  metadataInfo: FieldMetadata | TextMetadata | NumericMetadata | DateMetadata | null,
  simpleType: SimpleKind,
  sortDirection?: SortDirection,
  filterModel: FilterModel | null
};

export interface ValidableHandle {
  validate(): boolean;
}

export interface CellHandle extends ValidableHandle {
  selectInnerText?(): void;
  unselectInnerText?(): void;
  startEditing?(overwrite: boolean): void;
  endEditing?(): void;
}

export interface CellProps {
  formatting: ComponentFramework.Formatting;
  gridCellRef: React.RefObject<HTMLDivElement>;
  validationToken: string;
  rawValue: RawValue | null;
  formattedValue: string;
  isEditing: boolean;
  className?: string;
  style?: React.CSSProperties;

  onValidate?: (error: string | null) => void;
  onCommit: (rawValue: RawValue, formattedValue: string) => void | Promise<void>;
}

export type Mode = ComponentFramework.Mode & { isAuthoringMode: boolean }

export function getLookupRef(
  rec: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
  col: string
): { id?: string; entityName?: string; name?: string } | null {
  const v = rec?.getValue(col) as ComponentFramework.EntityReference | null | undefined;
  const id = v?.id?.guid ? v.id.guid.replace(/[{}]/g, "") : undefined;
  const entityName = v?.etn;
  const name = v?.name;
  return id || entityName || name ? { id, entityName, name } : null;
}

function getLookupId(
  ref: unknown
): string | null {
  return (ref as ComponentFramework.EntityReference)?.id?.guid ??
    (ref as ComponentFramework.LookupValue)?.id ??
    null;
}

export function getLookupRefFromPrimary(
  rec: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord
): { id?: string; entityName?: string; name?: string } | null {
  const v = rec?.getNamedReference() as ComponentFramework.EntityReference & { entityName: string } | null | undefined;
  const id = v?.id ? String(v.id as unknown).replace(/[{}]/g, "") : undefined;
  const entityName = v?.entityName;
  const name = v?.name;
  return id || entityName || name ? { id, entityName, name } : null;
}

export function generateRandomId(): string {
  const c = (globalThis as unknown as { crypto?: Crypto }).crypto;
  const rnd = c && typeof c.randomUUID === "function"
    ? c.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return String(rnd);
}

export function isRightAligned(t?: SimpleKind): boolean {
  if (!t)
    return false;

  return SimpleKind.includes(['money', 'number'], t);
}

export function getFilterOptionsByType(simpleType: SimpleKind): OperatorMeta[] {
  // type SimpleKind =
  // | 'boolean' | 'datetime' | 'picklist' | 'multipicklist'
  // | 'lookup' | 'money' | 'number' | 'text' | 'guid' | 'image' | 'file' | 'unknown'

  switch (simpleType) {
    case "text":
      return CATALOG_TEXT;
    case "lookup":
      return CATALOG_LOOKUP;
    case "boolean":
    case "picklist":
      return CATALOG_OPTIONSET;
    case "multipicklist":
      return CATALOG_MULTIOPTIONSET;
    case "datetime":
      return CATALOG_DATE;
    case "money":
    case "number":
      return CATALOG_NUMBER;
    default:
      return CATALOG_TEXTLIKE;
  }
}

export interface Cell {
  rowId: string;
  columnId: string;
}
export function isSameCell(cell1: Cell | null, cell2: Cell | null) {
  return (cell1?.rowId ?? "") === (cell2?.rowId ?? "") && (cell1?.columnId ?? "") === (cell2?.columnId ?? "");
}

export type RawValue = string | number | boolean | Date | number[] | string[] | null;
export interface Row {
  id: string;
  rawValues: Record<string, RawValue>;
  formattedValues: Record<string, string>;
  originalValues: Record<string, RawValue>;
  currencySymbol: string;
  validationInitializedByColumnChange: boolean;
  validators: Map<string, ValidableHandle>;
}

const pad2 = (n: number) => (n < 10 ? "0" + n : "" + n);

function toDateOnlyString(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function changedValues(row: Row, columns: ColumnInfo[]): Record<string, RawValue> {
  const { rawValues, originalValues } = row;

  const out: Record<string, RawValue> = {};
  const allKeys = new Set([...Object.keys(rawValues), ...Object.keys(originalValues)]);

  for (const key of allKeys) {
    const curr = rawValues[key];
    const orig = originalValues[key];

    const columnInfo = columns.find(c => (c.entityAlias ?? "") === "" && c.logicalName === key);
    if ((curr ?? "") !== (orig ?? "")) {
      if (curr != null && columnInfo?.simpleType === "datetime" && ((columnInfo?.metadataInfo as DateMetadata)?.behavior ?? 0) === 2) // for dateonly dates, send only date part
        out[key] = toDateOnlyString(curr as Date);
      else
        out[key] = curr;
    }
  }

  return out;
}

export const replaceAll = (s: string | null | undefined, search: string | null | undefined, repl: string) => {
  if (s == null)
    return null;

  if (search == null || repl == null)
    return s;

  return s.split(search).join(repl);
}

function isLookupOrEntity(obj: unknown): obj is ComponentFramework.LookupValue | ComponentFramework.EntityReference {
  const id = getLookupId(obj);
  return (id ?? "") !== "";
}

export function extractRawValue(raw: unknown, simpleType: SimpleKind): RawValue {
  if (raw == null)
    return null;

  const t = typeof raw;
  if (t === "string") {
    switch (simpleType) {
      case "boolean":
        switch ((raw as string).toLowerCase()) {
          case "0": return false;
          case "1": return true;
          case "false": return false;
          case "true": return true;
          default: break;
        }
        break;
      case "datetime": return new Date(raw as string);
      case "picklist": return Number(raw as string);
      default: return raw as string;
    }
  }

  if (t === "number")
    return raw as number;

  if (t === "boolean")
    return raw as boolean;

  if (raw instanceof Date)
    return raw;

  if (Array.isArray(raw)) {
    if (raw.length === 0)
      return [];

    const first = raw[0];

    if (typeof first === "number")
      return raw as number[];

    if (isLookupOrEntity(first)) {
      return (raw as [])
        .map(v => getLookupId(v))
        .filter(v => v != null && v !== "") as string[];
    }

    return [];
  }

  if (isLookupOrEntity(raw))
    return getLookupId(raw) ?? null;

  return null;
}

export function extractTextD365(raw: string | null | undefined, textInfo: TextMetadata | null): string | null | undefined {
  if (raw == null)
    return null;

  const value = raw?.trim() ?? "";

  if (value === "")
    return null;

  if (value.length > (textInfo?.maxLength ?? 0))
    return undefined;

  return value;
}

export function extractNumberD365(raw: string | null | undefined, currencySymbol: string | null | undefined, userFormatInfo: UserNumberFormatInfo, numericInfo: NumericMetadata | null): number | null | undefined {
  if (raw == null)
    return null;

  const cs = currencySymbol ?? "";
  const gs = cs === "" ? userFormatInfo.numberGroupSeparator : userFormatInfo.currencyGroupSeparator;
  const ds = cs === "" ? userFormatInfo.numberDecimalSeparator : userFormatInfo.currencyDecimalSeparator;

  let value = replaceAll(raw, " ", "");
  value = replaceAll(value, " ", "");
  value = replaceAll(value, cs, "");
  value = replaceAll(value, gs, "");
  value = replaceAll(value, ds, ".");
  value = value?.trim() ?? "";

  if (value === "")
    return null;

  const isNegative = (value.includes("(") && value.includes(")")) || value.includes("-");
  value = replaceAll(value, "(", "");
  value = replaceAll(value, ")", "");
  value = replaceAll(value, "-", "");

  const number = Number(value);
  if (isNaN(number))
    return undefined;

  const roundedNumber = (isNegative ? -1 : 1) * roundTo(number, numericInfo?.precision ?? 0);
  if (roundedNumber < (numericInfo?.minValue ?? 0) || roundedNumber > (numericInfo?.maxValue ?? 0))
    return undefined;

  return roundedNumber;
}

function roundTo(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

export function formatNumberD365(n: number | null | undefined, currencySymbol: string | null | undefined, userFormatInfo: UserNumberFormatInfo, numericInfo: NumericMetadata | null): string | null {
  if (n == null)
    return null;

  if (!Number.isFinite(n))
    return null;

  const cs = currencySymbol ?? "";
  const fd = numericInfo?.precision ?? 0;
  const gs = cs === "" ? userFormatInfo.numberGroupSeparator : userFormatInfo.currencyGroupSeparator;
  const ds = cs === "" ? userFormatInfo.numberDecimalSeparator : userFormatInfo.currencyDecimalSeparator;

  const negative = n < 0;
  const abs = Math.abs(n);
  const str = abs.toFixed(Math.max(0, fd));

  let [intPart, fracPart = ""] = str.split(".");
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, gs);

  const decPart = fd > 0 ? ds + fracPart : "";
  const core = intPart + decPart;

  return negative ? applyNegativePattern(core, currencySymbol, userFormatInfo) : applyPositivePattern(core, currencySymbol, userFormatInfo);
}

function applyPositivePattern(value: string, currencySymbol: string | null | undefined, userFormatInfo: UserNumberFormatInfo): string | null {
  if (value == null || value === "")
    return null;

  if (currencySymbol == null)
    return `${value}`;

  const pp = userFormatInfo.currencyPositivePattern;
  let pattern = "";

  switch (pp) {
    case 0: pattern = "$n"; break;
    case 1: pattern = "n$"; break;
    case 2: pattern = "$ n"; break;
    case 3: pattern = "n $"; break;
    default: pattern = "$n"; break;
  }

  const formattedValue = pattern.replace("n", value).replace("$", currencySymbol);
  return formattedValue;
}

function applyNegativePattern(value: string, currencySymbol: string | null | undefined, userFormatInfo: UserNumberFormatInfo): string | null {
  if (value == null || value === "")
    return null;

  if (currencySymbol == null)
    return `-${value}`;

  const np = userFormatInfo.currencyNegativePattern;
  let pattern = "";

  switch (np) {
    case 0: pattern = "($n)"; break;
    case 1: pattern = "-$n"; break;
    case 2: pattern = "$-n"; break;
    case 3: pattern = "$n-"; break;
    case 4: pattern = "(n$)"; break;
    case 5: pattern = "-n$"; break;
    case 6: pattern = "n-$"; break;
    case 7: pattern = "n$-"; break;
    case 8: pattern = "-n $"; break;
    case 9: pattern = "-$ n"; break;
    case 10: pattern = "n $-"; break;
    case 11: pattern = "$ n-"; break;
    case 12: pattern = "$ -n"; break;
    case 13: pattern = "n- $"; break;
    case 14: pattern = "($ n)"; break;
    case 15: pattern = "(n $)"; break;
    case 16: pattern = "$- n"; break;
    default: pattern = "-$n"; break;
  }

  const formattedValue = pattern.replace("n", value).replace("$", currencySymbol);
  return formattedValue;
}

export function isTypingKey(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey)
    return false;

  if (e.isComposing || e.key === 'Dead' || e.key === 'Process')
    return false;

  if (e.key === 'Backspace' || e.key === 'Delete')
    return true;

  return e.key.length === 1;
}

export function selectElementText(el: HTMLElement | null) {
  if (el == null)
    return;

  if (window.getSelection && document.createRange) {
    const selection = window.getSelection();
    if (selection == null)
      return;

    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export function clearElementSelection(el: HTMLElement | null) {
  if (el == null)
    return;

  if (window.getSelection) {
    const selection = window.getSelection();
    if (selection == null || selection.rangeCount === 0)
      return;

    const keep: Range[] = [];

    for (let i = 0; i < selection.rangeCount; i++) {
      const r = selection.getRangeAt(i);
      const startIn = el === r.startContainer || el.contains(r.startContainer);
      const endIn = el === r.endContainer || el.contains(r.endContainer);

      if (!(startIn && endIn)) {
        keep.push(r);
      }
    }

    selection.removeAllRanges();
    for (const r of keep)
      selection.addRange(r);
  }
}

export const emptyText = "\u200B";
export const emptyValue = 0.01;
export const emptyValueStr = String(emptyValue);
export const emptyOption = { text: emptyText, value: emptyValue };

export function boolToNumber(value: boolean | null) {
  if (value == null)
    return null;

  return value ? 1 : 0;
}

export function numberToBool(value: number | null) {
  if (value == null)
    return null;

  if (value === emptyValue)
    return null;

  return value <= 0 ? false : true;
}

export const toIndexStrings = (s?: string | null): string[] => {
  if (s == null || s.trim() === "")
    return [];

  const re = /(^|[^\d])(\d+)(?:\s*-\s*(\d+))?(?!\d)/g;

  const out: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = re.exec(s))) {
    const start = parseInt(m[2], 10);
    const hasEnd = m[3] !== undefined;
    if (!hasEnd) {
      out.push(String(start));
      continue;
    }

    const end = parseInt(m[3], 10);
    const step = end >= start ? 1 : -1;
    for (let i = start; i !== end + step; i += step) {
      out.push(String(i));
    }
  }
  return out;
};

export function isOpenInMakerMode(context: ComponentFramework.Context<IInputs>) {
  return (context.mode as Mode)?.isAuthoringMode ?? false;
}

export const getBoolFromMainfestProp = (
  p: ComponentFramework.PropertyTypes.TwoOptionsProperty | undefined,
  def: boolean
): boolean => (typeof p?.raw === "boolean" ? p.raw : def);

export const getTextFromMainfestProp = (
  p: ComponentFramework.PropertyTypes.StringProperty | undefined,
  def = ""
): string => (typeof p?.raw === "string" ? p.raw : def);