import { OperatorMeta, Pattern } from "./FilterOperatorsMatrix";
import { IInputs } from "./generated/ManifestTypes";
import { ColumnInfo } from "./Helper";
import { SimpleKind } from "./TypesHelper";

type FilterExpression = ComponentFramework.PropertyHelper.DataSetApi.FilterExpression;
type ConditionExpression = ComponentFramework.PropertyHelper.DataSetApi.ConditionExpression;
type ConditionOperator = ComponentFramework.PropertyHelper.DataSetApi.Types.ConditionOperator;

export interface FilterModel {
  column: ColumnInfo;
  operator: OperatorMeta;
  values: string[];
}

export function createFilterExpression(filterModels: FilterModel[]): FilterExpression {
  const conditions = filterModels.map(fm => createConditionExpression(fm));
  const filterExpression: FilterExpression = {
    filterOperator: 0,
    conditions: conditions,
  };

  return filterExpression;
}

export function createConditionExpression(filterModel: FilterModel): ConditionExpression {
  const columnInfo = filterModel.column;
  const attributeName = convertName(columnInfo, filterModel.operator);
  const operator = convertOperator(columnInfo, filterModel.operator, filterModel.values.length);
  const values = convertValues(columnInfo, filterModel.values, filterModel.operator.pattern);

  const condition: ConditionExpression = {
    entityAliasName: columnInfo.entityAlias ?? undefined,
    attributeName: attributeName,
    conditionOperator: operator,
    value: values.length === 1 ? values[0] : values
  }

  return condition;
}

function convertName(columnInfo: ColumnInfo, operatorMeta: OperatorMeta): string {
  const simpleType = columnInfo.simpleType;
  if (!SimpleKind.includes(["boolean", "lookup", "multipicklist", "picklist"], simpleType))
    return columnInfo.logicalName;

  switch (operatorMeta.sdkName) {
    case "Equal":
    case "NotEqual":
    case "NotNull":
    case "Null": return columnInfo.logicalName;
  }

  return `${columnInfo.logicalName}name`;
}

function convertOperator(columnInfo: ColumnInfo, operatorMeta: OperatorMeta, valuesCount: number): ConditionOperator {
  const simpleType = columnInfo.simpleType;
  if (SimpleKind.includes(["boolean", "lookup", "multipicklist", "picklist"], simpleType)) {
    if (valuesCount > 1) {
      switch (operatorMeta.sdkName) {
        case "Equal": return 8 as unknown as ConditionOperator;     // replace with In
        case "NotEqual": return 9 as unknown as ConditionOperator;  // replace with NotIn
      }
    }
  }

  return operatorMeta.sdkValue as unknown as ConditionOperator;
}

function convertValues(columnInfo: ColumnInfo, values: string[], pattern?: Pattern): string[] {
  if (!values || values.length === 0)
    return values;

  if (!pattern || pattern === "raw")
    return values;

  switch (pattern) {
    case "{v}%": return values.map(value => `${escapeForLike(value)}%`);
    case "%{v}%": return values.map(value => `%${escapeForLike(value)}%`);
    case "%{v}": return values.map(value => `%${escapeForLike(value)}`);
    default: return values;
  }
}

function escapeForLike(input: string): string {
  return input.replace(/[%_[]/g, (match) => {
    switch (match) {
      case '%': return '[%]';
      case '_': return '[_]';
      case '[': return '[[]';
      default: return match;
    }
  });
}

export async function loadViewFetchXml(context: ComponentFramework.Context<IInputs>, viewId: string): Promise<string> {
  const id = viewId.replace(/[{}]/g, "").toLowerCase();

  async function tryRetrieve(entitySet: "savedquery" | "userquery") {
    try {
      const rec = await context.webAPI.retrieveRecord(entitySet, id, "?$select=fetchxml");
      return rec?.fetchxml as string | undefined;
    }
    catch (err: unknown) {
      if (isHttpLikeError(err) && (err.status === 404 || err.message?.includes("404"))) {
        return undefined;
      }
      throw err;
    }
  }

  const fromSaved = await tryRetrieve("savedquery");
  if (fromSaved)
    return fromSaved;

  const fromUser = await tryRetrieve("userquery");
  if (fromUser)
    return fromUser;

  throw new Error(`View s ID ${viewId} (savedquery/userquery) sa nenašiel alebo nemá fetchxml.`);
}

export function extractGridFilters(fetchXml: string, mainEntity: string): string {
  if (!fetchXml)
    return "";

  const parser = new DOMParser();
  const xml = parser.parseFromString(fetchXml, "text/xml");

  const entities = Array.from(xml.getElementsByTagName("entity"));
  const root = entities.find(e => (e.getAttribute("name") ?? "").toLowerCase() === mainEntity.toLowerCase());
  if (!root) {
    const only = entities.length === 1 ? entities[0] : null;
    if (!only)
      return "";
  }

  const host = root ?? entities[0];

  const directChildren = Array.from(host.childNodes).filter(n => n.nodeType === Node.ELEMENT_NODE) as Element[];
  const wanted = directChildren.filter(el => {
    const tag = el.tagName.toLowerCase();
    return tag === "filter" || tag === "link-entity";
  });

  if (!wanted.length)
    return "";

  const ser = new XMLSerializer();
  const parts = wanted.map(node => ser.serializeToString(node));

  return parts.join("");
}

function isHttpLikeError(x: unknown): x is { status?: number; message?: string } {
  return typeof x === "object" && x !== null && ("status" in x || "message" in x);
}