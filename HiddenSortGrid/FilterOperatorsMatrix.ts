export type ValueUsage = "none" | "single";
export type ParamType = "string" | "number" | "date" | "datetime" | "boolean" | "value";
export type InputType = "none" | "text" | "number" | "date" | "dropdown";
export type Pattern = "raw" | "%{v}%" | "{v}%" | "%{v}";

export interface OperatorMeta {
  displayName: string;
  sdkName: string;
  sdkValue: number;
  paramType?: ParamType;
  inputType?: InputType;
  pattern?: Pattern;
};

export const CATALOG_TEXT: OperatorMeta[] = [
  { displayName: "Equals",               sdkName: "Equal",            sdkValue: 0,  paramType: "string", inputType: "text",   pattern: "raw" },
  { displayName: "Does not equal",       sdkName: "NotEqual",         sdkValue: 1,  paramType: "string", inputType: "text",   pattern: "raw" },
  { displayName: "Contains",             sdkName: "Like",             sdkValue: 6,  paramType: "string", inputType: "text",   pattern: "%{v}%" },
  { displayName: "Does not contain",     sdkName: "NotLike",          sdkValue: 7,  paramType: "string", inputType: "text",   pattern: "%{v}%" },
  { displayName: "Begins with",          sdkName: "BeginsWith",       sdkValue: 54, paramType: "string", inputType: "text",   pattern: "{v}%" },
  { displayName: "Does not begin with",  sdkName: "DoesNotBeginWith", sdkValue: 55, paramType: "string", inputType: "text",   pattern: "{v}%" },
  { displayName: "Ends with",            sdkName: "EndsWith",         sdkValue: 56, paramType: "string", inputType: "text",   pattern: "%{v}" },
  { displayName: "Does not end with",    sdkName: "DoesNotEndWith",   sdkValue: 57, paramType: "string", inputType: "text",   pattern: "%{v}" },
  { displayName: "Contains data",        sdkName: "NotNull",          sdkValue: 13, inputType: "none" },
  { displayName: "Does not contain data",sdkName: "Null",             sdkValue: 12, inputType: "none" },
];

export const CATALOG_TEXTLIKE: OperatorMeta[] = [
  { displayName: "Equals",               sdkName: "Equal",            sdkValue: 0,  paramType: "string",  inputType: "text" },
  { displayName: "Does not equal",       sdkName: "NotEqual",         sdkValue: 1,  paramType: "string",  inputType: "text" },
  { displayName: "Contains data",        sdkName: "NotNull",          sdkValue: 13, inputType: "none" },
  { displayName: "Does not contain data",sdkName: "Null",             sdkValue: 12, inputType: "none" },
  { displayName: "Contains",             sdkName: "Like",             sdkValue: 6,  paramType: "string",  inputType: "text",  pattern: "%{v}%" },
  { displayName: "Does not contain",     sdkName: "NotLike",          sdkValue: 7,  paramType: "string",  inputType: "text",  pattern: "%{v}%" },
  { displayName: "Begins with",          sdkName: "BeginsWith",       sdkValue: 54, paramType: "string",  inputType: "text",  pattern: "{v}%" },
  { displayName: "Does not begin with",  sdkName: "DoesNotBeginWith", sdkValue: 55, paramType: "string",  inputType: "text",  pattern: "{v}%" },
  { displayName: "Ends with",            sdkName: "EndsWith",         sdkValue: 56, paramType: "string",  inputType: "text",  pattern: "%{v}" },
  { displayName: "Does not end with",    sdkName: "DoesNotEndWith",   sdkValue: 57, paramType: "string",  inputType: "text",  pattern: "%{v}" },
];

export const CATALOG_LOOKUP: OperatorMeta[] = [
  { displayName: "Equals",               sdkName: "Equal",            sdkValue: 0,  paramType: "string",  inputType: "dropdown" },
  { displayName: "Does not equal",       sdkName: "NotEqual",         sdkValue: 1,  paramType: "string",  inputType: "dropdown" },
  { displayName: "Contains data",        sdkName: "NotNull",          sdkValue: 13, inputType: "none" },
  { displayName: "Does not contain data",sdkName: "Null",             sdkValue: 12, inputType: "none" },
  { displayName: "Contains",             sdkName: "Like",             sdkValue: 6,  paramType: "string",  inputType: "text",  pattern: "%{v}%" },
  { displayName: "Does not contain",     sdkName: "NotLike",          sdkValue: 7,  paramType: "string",  inputType: "text",  pattern: "%{v}%" },
  { displayName: "Begins with",          sdkName: "BeginsWith",       sdkValue: 54, paramType: "string",  inputType: "text",  pattern: "{v}%" },
  { displayName: "Does not begin with",  sdkName: "DoesNotBeginWith", sdkValue: 55, paramType: "string",  inputType: "text",  pattern: "{v}%" },
  { displayName: "Ends with",            sdkName: "EndsWith",         sdkValue: 56, paramType: "string",  inputType: "text",  pattern: "%{v}" },
  { displayName: "Does not end with",    sdkName: "DoesNotEndWith",   sdkValue: 57, paramType: "string",  inputType: "text",  pattern: "%{v}" },
];

export const CATALOG_OPTIONSET: OperatorMeta[] = [
  { displayName: "Equals",               sdkName: "Equal",            sdkValue: 0,  paramType: "value",   inputType: "dropdown" },
  { displayName: "Does not equal",       sdkName: "NotEqual",         sdkValue: 1,  paramType: "value",   inputType: "dropdown" },
  { displayName: "Contains data",        sdkName: "NotNull",          sdkValue: 13, inputType: "none" },
  { displayName: "Does not contain data",sdkName: "Null",             sdkValue: 12, inputType: "none" },
  { displayName: "Contains",             sdkName: "Like",             sdkValue: 6,  paramType: "string",  inputType: "text",   pattern: "%{v}%" },
  { displayName: "Does not contain",     sdkName: "NotLike",          sdkValue: 7,  paramType: "string",  inputType: "text",   pattern: "%{v}%" },
  { displayName: "Begins with",          sdkName: "BeginsWith",       sdkValue: 54, paramType: "string",  inputType: "text",   pattern: "{v}%" },
  { displayName: "Does not begin with",  sdkName: "DoesNotBeginWith", sdkValue: 55, paramType: "string",  inputType: "text",   pattern: "{v}%" },
  { displayName: "Ends with",            sdkName: "EndsWith",         sdkValue: 56, paramType: "string",  inputType: "text",   pattern: "%{v}" },
  { displayName: "Does not end with",    sdkName: "DoesNotEndWith",   sdkValue: 57, paramType: "string",  inputType: "text",   pattern: "%{v}" },
];

export const CATALOG_MULTIOPTIONSET: OperatorMeta[] = [
  { displayName: "Equals",                  sdkName: "Equal",                 sdkValue: 0,  paramType: "value",   inputType: "dropdown" },
  { displayName: "Does not equal",          sdkName: "NotEqual",              sdkValue: 1,  paramType: "value",   inputType: "dropdown" },
  { displayName: "Contains values",         sdkName: "ContainValues",         sdkValue: 87, paramType: "value",   inputType: "dropdown" },
  { displayName: "Does not contain values", sdkName: "DoesNotContainValues",  sdkValue: 88, paramType: "value",   inputType: "dropdown" },
  { displayName: "Contains data",           sdkName: "NotNull",               sdkValue: 13, inputType: "none" },
  { displayName: "Does not contain data",   sdkName: "Null",                  sdkValue: 12, inputType: "none" },
];

export const CATALOG_NUMBER: OperatorMeta[] = [
  { displayName: "Equals",                    sdkName: "Equal",        sdkValue: 0,   paramType: "number", inputType: "number" },
  { displayName: "Does not equal",            sdkName: "NotEqual",     sdkValue: 1,   paramType: "number", inputType: "number" },
  { displayName: "Contains data",             sdkName: "NotNull",      sdkValue: 13,  inputType: "none" },
  { displayName: "Does not contain data",     sdkName: "Null",         sdkValue: 12,  inputType: "none" },
  { displayName: "Greater than",              sdkName: "GreaterThan",  sdkValue: 2,   paramType: "number", inputType: "number" },
  { displayName: "Greater than or equal to",  sdkName: "GreaterEqual", sdkValue: 4,   paramType: "number", inputType: "number" },
  { displayName: "Less than",                 sdkName: "LessThan",     sdkValue: 3,   paramType: "number", inputType: "number" },
  { displayName: "Less than or equal to",     sdkName: "LessEqual",    sdkValue: 5,   paramType: "number", inputType: "number" },
];

export const CATALOG_DATE: OperatorMeta[] = [
  { displayName: "On",                              sdkName: "On",                              sdkValue: 25, paramType: "date",   inputType: "date" },
  { displayName: "On or after",                     sdkName: "OnOrAfter",                       sdkValue: 27, paramType: "date",   inputType: "date" },
  { displayName: "On or before",                    sdkName: "OnOrBefore",                      sdkValue: 26, paramType: "date",   inputType: "date" },

  { displayName: "Today",                           sdkName: "Today",                           sdkValue: 15, inputType: "none" },
  { displayName: "Yesterday",                       sdkName: "Yesterday",                       sdkValue: 14, inputType: "none" },
  { displayName: "Tomorrow",                        sdkName: "Tomorrow",                        sdkValue: 16, inputType: "none" },

  { displayName: "This week",                       sdkName: "ThisWeek",                        sdkValue: 20, inputType: "none" },
  { displayName: "This month",                      sdkName: "ThisMonth",                       sdkValue: 23, inputType: "none" },
  { displayName: "This year",                       sdkName: "ThisYear",                        sdkValue: 29, inputType: "none" },
  { displayName: "This fiscal period",              sdkName: "ThisFiscalPeriod",                sdkValue: 59, inputType: "none" },
  { displayName: "This fiscal year",                sdkName: "ThisFiscalYear",                  sdkValue: 58, inputType: "none" },

  { displayName: "Next week",                       sdkName: "NextWeek",                        sdkValue: 21, inputType: "none" },
  { displayName: "Next 7 days",                     sdkName: "Next7Days",                       sdkValue: 18, inputType: "none" },
  { displayName: "Next month",                      sdkName: "NextMonth",                       sdkValue: 24, inputType: "none" },
  { displayName: "Next year",                       sdkName: "NextYear",                        sdkValue: 30, inputType: "none" },
  { displayName: "Next fiscal period",              sdkName: "NextFiscalPeriod",                sdkValue: 61, inputType: "none" },
  { displayName: "Next fiscal year",                sdkName: "NextFiscalYear",                  sdkValue: 60, inputType: "none" },

  { displayName: "Next X hours",                    sdkName: "NextXHours",                      sdkValue: 32, paramType: "number", inputType: "number" },
  { displayName: "Next X days",                     sdkName: "NextXDays",                       sdkValue: 34, paramType: "number", inputType: "number" },
  { displayName: "Next X weeks",                    sdkName: "NextXWeeks",                      sdkValue: 36, paramType: "number", inputType: "number" },
  { displayName: "Next X months",                   sdkName: "NextXMonths",                     sdkValue: 38, paramType: "number", inputType: "number" },
  { displayName: "Next X years",                    sdkName: "NextXYears",                      sdkValue: 40, paramType: "number", inputType: "number" },
  { displayName: "Next X fiscal periods",           sdkName: "NextXFiscalPeriods",              sdkValue: 67, paramType: "number", inputType: "number" },
  { displayName: "Next X fiscal years",             sdkName: "NextXFiscalYears",                sdkValue: 66, paramType: "number", inputType: "number" },

  { displayName: "Last week",                       sdkName: "LastWeek",                        sdkValue: 19, inputType: "none" },
  { displayName: "Last 7 days",                     sdkName: "Last7Days",                       sdkValue: 17, inputType: "none" },
  { displayName: "Last month",                      sdkName: "LastMonth",                       sdkValue: 22, inputType: "none" },
  { displayName: "Last year",                       sdkName: "LastYear",                        sdkValue: 28, inputType: "none" },
  { displayName: "Last fiscal period",              sdkName: "LastFiscalPeriod",                sdkValue: 63, inputType: "none" },
  { displayName: "Last fiscal year",                sdkName: "LastFiscalYear",                  sdkValue: 62, inputType: "none" },

  { displayName: "Last X hours",                    sdkName: "LastXHours",                      sdkValue: 31, paramType: "number", inputType: "number" },
  { displayName: "Last X days",                     sdkName: "LastXDays",                       sdkValue: 33, paramType: "number", inputType: "number" },
  { displayName: "Last X weeks",                    sdkName: "LastXWeeks",                      sdkValue: 35, paramType: "number", inputType: "number" },
  { displayName: "Last X months",                   sdkName: "LastXMonths",                     sdkValue: 37, paramType: "number", inputType: "number" },
  { displayName: "Last X years",                    sdkName: "LastXYears",                      sdkValue: 39, paramType: "number", inputType: "number" },
  { displayName: "Last X fiscal periods",           sdkName: "LastXFiscalPeriods",              sdkValue: 65, paramType: "number", inputType: "number" },
  { displayName: "Last X fiscal years",             sdkName: "LastXFiscalYears",                sdkValue: 64, paramType: "number", inputType: "number" },

  { displayName: "Older than X minutes",            sdkName: "OlderThanXMinutes",               sdkValue: 86, paramType: "number", inputType: "number" },
  { displayName: "Older than X hours",              sdkName: "OlderThanXHours",                 sdkValue: 85, paramType: "number", inputType: "number" },
  { displayName: "Older than X days",               sdkName: "OlderThanXDays",                  sdkValue: 84, paramType: "number", inputType: "number" },
  { displayName: "Older than X weeks",              sdkName: "OlderThanXWeeks",                 sdkValue: 83, paramType: "number", inputType: "number" },
  { displayName: "Older than X months",             sdkName: "OlderThanXMonths",                sdkValue: 53, paramType: "number", inputType: "number" },
  { displayName: "Older than X years",              sdkName: "OlderThanXYears",                 sdkValue: 82, paramType: "number", inputType: "number" },

  { displayName: "In fiscal year",                  sdkName: "InFiscalYear",                    sdkValue: 68, paramType: "number", inputType: "number" },
  { displayName: "In fiscal period",                sdkName: "InFiscalPeriod",                  sdkValue: 69, paramType: "number", inputType: "number" },
  { displayName: "In fiscal period and year",       sdkName: "InFiscalPeriodAndYear",           sdkValue: 70, paramType: "number", inputType: "number" },
  { displayName: "In or after fiscal period and year", sdkName: "InOrAfterFiscalPeriodAndYear", sdkValue: 72, paramType: "number", inputType: "number" },
  { displayName: "In or before fiscal period and year", sdkName: "InOrBeforeFiscalPeriodAndYear", sdkValue: 71, paramType: "number", inputType: "number" },

  { displayName: "Contains data (any time)",        sdkName: "NotNull",                         sdkValue: 13, inputType: "none" },
  { displayName: "Does not contain data",           sdkName: "Null",                            sdkValue: 12, inputType: "none" },
];