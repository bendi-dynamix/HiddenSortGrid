// There is currently no documented way to read the “Related entities only” relationship from a SubGrid.
// If this stops working in the future, update it to use the documented method (if available),
// or use .\devHelper\ContextInspector.ts to locate the main relationship.

import { IInputs } from "./generated/ManifestTypes";
import { LookupValue } from "./UI/LookupPicker";

export interface FormInfo extends LookupValue {
    isMakerMode?: boolean;
};

interface DescriptorParamsObject {
    RelationshipName?: string;
    TargetEntities?: string[];
};

interface DescriptorParamsArrayItem { Name?: string; Value?: unknown };
type DescriptorParamsArray = DescriptorParamsArrayItem[];

interface Descriptor { Parameters?: DescriptorParamsObject | DescriptorParamsArray };

interface CustomControlProperties {
    descriptor?: Descriptor;
    configuration?: { Parameters?: { Items?: { RelationshipName?: string } } };
    dynamicData?: {
        parameters?: {
            Items?: {
                cachedQueryState?: {
                    contextFiltersAndIds?: string[];
                    publicKey?: string;
                    key?: string;
                };
            };
        };
    };
};

// --- helpers (type guards) ---
function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}
function hasProp<T extends string>(
    o: unknown,
    prop: T
): o is Record<T, unknown> {
    return isObject(o) && prop in o;
}
function isString(v: unknown): v is string {
    return typeof v === "string";
}
function isStringArray(v: unknown): v is string[] {
    return Array.isArray(v) && v.every(isString);
}
function isDescriptorParamsArray(v: unknown): v is DescriptorParamsArray {
    return Array.isArray(v) && v.every(it => isObject(it));
}
function isCustomControlProps(v: unknown): v is CustomControlProperties {
    if (!isObject(v)) return false;
    // Not strictly required — we'll verify nested object existence case by case later.
    return true;
}

// ——— whitelisted roots in preference order ———
const ROOTS = [
    "factory",
    "navigation",
    "client",
    "mode",
] as const;
type RootKey = typeof ROOTS[number];

// ——— core: pick RelationshipName from preferred locations ———
export function getRelationshipName(
    ctx: ComponentFramework.Context<unknown>
): string | undefined {
    // For each root, try to read _customControlProperties
    for (const r of ROOTS) {
        if (!hasProp(ctx, r)) continue;
        const root = ctx[r];
        if (!isObject(root) || !hasProp(root, "_customControlProperties")) continue;

        const ccp = root._customControlProperties;
        if (!isCustomControlProps(ccp)) continue;

        // 1) descriptor.Parameters (object or array)
        const desc = ccp.descriptor;
        if (desc && isObject(desc) && hasProp(desc, "Parameters")) {
            const p = desc.Parameters;

            // a) object with RelationshipName
            if (isObject(p) && hasProp(p, "RelationshipName")) {
                const rn = (p.RelationshipName);
                if (isString(rn) && rn) return rn;
            }

            // b) array of { Name, Value }
            if (isDescriptorParamsArray(p)) {
                const item = p.find(it => isObject(it) && hasProp(it, "Name") && (it.Name === "RelationshipName"));
                const val = item && isObject(item) ? item.Value : undefined;
                if (isString(val) && val) return val;
            }
        }

        // 2) configuration.Parameters.Items.RelationshipName
        const cfg = ccp.configuration;
        if (cfg && isObject(cfg) && hasProp(cfg, "Parameters")) {
            const par = cfg.Parameters;
            if (isObject(par) && hasProp(par, "Items")) {
                const items = par.Items;
                if (isObject(items) && hasProp(items, "RelationshipName")) {
                    const rn = items.RelationshipName;
                    if (isString(rn) && rn) return rn;
                }
            }
        }
    }
    return undefined;
}

// --- guard: checks if context.mode.contextInfo exists and is valid ---
interface WithModeContextInfo {
    mode: {
        contextInfo: {
            entityId?: string;
            entityTypeName?: string;
            entityRecordName?: string;
        };
        isAuthoringMode: boolean;
    }
}

export function hasContextInfo(
    ctx: ComponentFramework.Context<IInputs>
): ctx is ComponentFramework.Context<IInputs> & WithModeContextInfo {
    if (!hasProp(ctx, "mode") || !isObject(ctx.mode)) return false;
    if (!hasProp(ctx.mode, "contextInfo") || !isObject(ctx.mode.contextInfo)) return false;

    const ci = ctx.mode.contextInfo;

    const hasAll =
        hasProp(ci, "entityId") &&
        hasProp(ci, "entityTypeName") &&
        isString(ci.entityId) && !!ci.entityId &&
        isString(ci.entityTypeName) && !!ci.entityTypeName;

    return hasAll;
}

export function hasAuthoringMode(
    ctx: ComponentFramework.Context<IInputs>
): ctx is ComponentFramework.Context<IInputs> & WithModeContextInfo {
    if (!hasProp(ctx, "mode") || !isObject(ctx.mode)) return false;
    if (!hasProp(ctx.mode, "isAuthoringMode")) return false;

    return true;
}

export function getFormInfo(
    ctx: ComponentFramework.Context<IInputs>
): LookupValue | null {

    if (hasContextInfo(ctx)) {
        const entityTypeName = ctx.mode.contextInfo.entityTypeName;
        const entityId = ctx.mode.contextInfo.entityId;
        const entityRecordName = ctx.mode.contextInfo.entityRecordName;
        if (entityTypeName && entityId) {
            return {
                entityType: entityTypeName,
                id: entityId.replace(/[{}]/g, ""),
                name: entityRecordName ?? undefined
            };
        }
    }

    return null;
}