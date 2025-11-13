export type SimpleKind =
    | 'boolean' | 'datetime' | 'picklist' | 'multipicklist'
    | 'lookup' | 'money' | 'number' | 'text' | 'guid' | 'image' | 'file' | 'unknown';

export const SimpleKind = {
    includes(filter: SimpleKind[], simpleType: SimpleKind): boolean {
        return filter.includes(simpleType);
    }
} as const;

export type LinkKind = "email" | "phone" | "url";
export type NumberKind = "wholeNumber" | "decimalNumber";

export function toLinkType(raw?: string | null): LinkKind | null {
    if (!raw)
        return null;

    const key = String(raw)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');

    switch (key) {
        case "singleline.email": return "email";
        case "singleline.phone": return "phone";
        case "singleline.url": return "url";
        default:
            return null;
    }
}

export function toNumberType(raw?: string | null): NumberKind | null {
    if (!raw)
        return null;

    const key = String(raw)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');

    switch (key) {
        case "decimal":
        case "double":
        case "float":
        case "fp": return "decimalNumber";
        case "integer":
        case "bigint":
        case "whole.none":
        case "whole.duration":
        case "whole.timezone":
        case "whole.language":
        case "whole.locale": return "wholeNumber";
        default:
            return null;
    }
}

const simpleKindMap = new Map<string, SimpleKind>();
export function toSimpleType(raw?: string | null): SimpleKind {
    if (!raw)
        return 'unknown';

    const key = String(raw)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');

    const cached = simpleKindMap.get(key);
    if (cached)
        return cached;

    const value = toSimpleKindRaw(key);
    simpleKindMap.set(key, value);

    return value;
}

function toSimpleKindRaw(k: string): SimpleKind {

    const hardMap: Record<string, SimpleKind> = {
        'dateandtime.dateonly': 'datetime',
        'dateandtime.dateandtime': 'datetime',

        'twooptions': 'boolean',
        'boolean': 'boolean',

        'picklist': 'picklist',
        'optionset': 'picklist',
        'status': 'picklist',
        'state': 'picklist',
        'statusreason': 'picklist',

        'multiselectpicklist': 'multipicklist',
        'multiselectoptionset': 'multipicklist',

        'lookup': 'lookup',
        'lookup.simple': 'lookup',
        'lookup.customer': 'lookup',
        'lookup.owner': 'lookup',
        'lookup.partylist': 'lookup',
        'lookup.regarding': 'lookup',
        'customer': 'lookup',
        'owner': 'lookup',
        'partylist': 'lookup',
        'regarding': 'lookup',
        'navigationproperty': 'lookup',

        'currency': 'money',
        'money': 'money',

        'decimal': 'number',
        'double': 'number',
        'float': 'number',
        'fp': 'number',
        'integer': 'number',
        'bigint': 'number',
        'whole.none': 'number',
        'whole.duration': 'number',
        'whole.timezone': 'number',
        'whole.language': 'number',
        'whole.locale': 'number',

        'singleline.text': 'text',
        'singleline.textarea': 'text',
        'singleline.email': 'text',
        'singleline.phone': 'text',
        'singleline.url': 'text',
        'singleline.tickersymbol': 'text',
        'multiple': 'text',
        'memo': 'text',
        'string': 'text',
        'richtext': 'text',
        'entityname': 'text',
        'managedproperty': 'text',
        'aliasedvalue': 'text',

        'uniqueidentifier': 'guid',
        'uniqueidentifierattribute': 'guid',

        'file': 'file',
        'image': 'image',
        'imageurl': 'image',
        'entityimage': 'image'
    };

    if (hardMap[k]) return hardMap[k];

    if (k.startsWith('dateandtime.')) return 'datetime';
    if (k.startsWith('whole.')) return 'number';
    if (k.startsWith('singleline.')) return 'text';
    if (k.startsWith('lookup.')) return 'lookup';

    if (/(date\s*and\s*time|date-and-time)/.test(k)) return 'datetime';

    if (k.includes('option') && k.includes('multi')) return 'multipicklist';
    if (k.includes('option') || k.includes('picklist') || k.includes('state') || k.includes('status')) return 'picklist';
    if (k.includes('lookup') || k.includes('owner') || k.includes('customer') || k.includes('partylist') || k.includes('regarding')) return 'lookup';
    if (k.includes('money') || k.includes('currency')) return 'money';
    if (k.includes('guid') || k.includes('uniqueidentifier')) return 'guid';
    if (k.includes('image')) return 'image';
    if (k.includes('file') || k.includes('attachment')) return 'file';

    if (k.includes('decimal') || k.includes('double') || k.includes('float') || k.includes('fp') || k.includes('number') || k.includes('int') || k.includes('whole')) return 'number';
    if (k.includes('text') || k.includes('string') || k.includes('memo') || k.includes('singleline') || k.includes('multiple')) return 'text';

    return 'unknown';
}