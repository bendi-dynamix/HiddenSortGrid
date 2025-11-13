/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable no-useless-catch */

// === PCF Context Deep Dump → NDJSON (.txt) ==================================



// === Usage in PCF (e.g., in updateView/init) (e.g. in updateView/init) ===============================
//  const txt = dumpContextToNDJSON(context, "context", {
//      maxDepth: 7,
//      includeNonEnumerable: true,
//      includePrototype: true,
//      readGetterValues: true,
//  });
//  downloadText("pcf_context_dump.txt", txt);

// and/or

//  1) search
//  const hits = findStringEverywhere(context, "context", {
//      needle: "account_parent_account",
//      searchInValues: true,
//      searchInKeys: false,
//      caseInsensitive: true,
//      maxDepth: 80,
//      includePrototype: true,
//      includeNonEnumerable: true,
//  });

//  2) log it
//  console.log("Found", hits.length, "hits:", hits);

//  3) (optional) save to a file for full-text search
//  downloadText("hits_account_parent_account.json", toNDJSON(hits));

interface DumpOptions {
    maxDepth?: number;                 // default 6
    maxEntriesPerObject?: number;      // default 2000 (safety)
    includeNonEnumerable?: boolean;    // default true
    includePrototype?: boolean;        // default true
    readGetterValues?: boolean;        // default true (if false, only descriptor is read)
};

interface DumpLine {
    path: string;                      // e.g. "context.navigation._customControlProperties.descriptor"
    owner: "own" | "proto";
    keyType: "string" | "symbol";
    type: string;                      // typeof or class (Object, Array, Map...)
    descriptor?: { enumerable?: boolean; configurable?: boolean; writable?: boolean; hasGetter?: boolean; hasSetter?: boolean };
    valuePreview?: string;             // short description of the value
    error?: string;                    // if reading failed (getter/proxy) (getter/proxy)
    depth: number;
};

export function dumpContextToNDJSON(
    root: any,
    rootName = "context",
    opts: DumpOptions = {}
): string {
    const {
        maxDepth = 60,
        maxEntriesPerObject = 20000,
        includeNonEnumerable = true,
        includePrototype = true,
        readGetterValues = true,
    } = opts;

    const seen = new WeakSet<object>();
    const lines: DumpLine[] = [];

    function classOf(v: any): string {
        if (v === null) return "null";
        if (typeof v !== "object") return typeof v;
        const tag = Object.prototype.toString.call(v); // [object Something]
        return tag.slice(8, -1); // Something
    }

    function previewValue(v: any): string {
        const t = typeof v;
        if (v === null || t === "undefined") return String(v);
        if (t === "string") return v.length > 200 ? JSON.stringify(v.slice(0, 200)) + "…(trim)" : JSON.stringify(v);
        if (t === "number" || t === "boolean" || t === "bigint") return String(v);
        if (t === "symbol") return v.toString();
        if (t === "function") return `[Function ${v.name || "anonymous"}]`;
        const c = classOf(v);
        try {
            if (Array.isArray(v)) return `[Array len=${v.length}]`;
            if (c === "Map") return `[Map size=${(v as Map<any, any>).size}]`;
            if (c === "Set") return `[Set size=${(v as Set<any>).size}]`;
            if ("size" in (v as any) && typeof (v as any).size === "number") return `[${c} size=${(v as any).size}]`;
            const keys = safeOwnKeys(v).length;
            return `[${c} keys=${keys}]`;
        } catch {
            return `[${c}]`;
        }
    }

    function safeOwnKeys(obj: object): (string | symbol)[] {
        try {
            const names = Object.getOwnPropertyNames(obj);
            const syms = Object.getOwnPropertySymbols(obj);
            return [...names, ...syms];
        } catch {
            return [];
        }
    }

    function safeDesc(obj: object, key: string | symbol) {
        try { return Object.getOwnPropertyDescriptor(obj, key) || undefined; }
        catch { return undefined; }
    }

    function safeGet(target: any, key: any, receiver: any) {
        try { return Reflect.get(target, key, receiver); }
        catch (e: any) { throw e; }
    }

    function pushLine(line: DumpLine) {
        lines.push(line);
    }

    function walk(obj: any, path: string, depth: number) {
        if (obj === null || typeof obj !== "object") return;
        if (seen.has(obj)) return;
        seen.add(obj);

        let current: any = obj;
        let level = 0;
        const stopAt = includePrototype ? null : Object.prototype;

        while (current && current !== stopAt && depth <= maxDepth) {
            const keys = safeOwnKeys(current).slice(0, maxEntriesPerObject);
            for (const key of keys) {
                const keyStr = typeof key === "string" ? key : key.toString();
                const childPath = `${path}.${typeof key === "string" ? key : `[${keyStr}]`}`;

                const desc = safeDesc(current, key);
                const line: DumpLine = {
                    path: childPath,
                    owner: level === 0 ? "own" : "proto",
                    keyType: typeof key === "string" ? "string" : "symbol",
                    type: "",
                    descriptor: desc
                        ? {
                            enumerable: !!desc.enumerable,
                            configurable: !!desc.configurable,
                            writable: "writable" in desc ? !!(desc as PropertyDescriptor).writable : undefined,
                            hasGetter: typeof desc.get === "function",
                            hasSetter: typeof desc.set === "function",
                        }
                        : undefined,
                    depth,
                };

                let value: any;
                let hadError = false;
                if (readGetterValues) {
                    try {
                        // Reading through the receiver of the original object (for getters) (for getters)
                        value = safeGet(obj, key, obj);
                    } catch (e: any) {
                        line.error = e?.message ? String(e.message) : String(e);
                        hadError = true;
                    }
                }

                if (!hadError) {
                    line.type = classOf(value);
                    line.valuePreview = previewValue(value);
                } else {
                    // If reading failed, at least estimate type from descriptor
                    line.type = desc && ("value" in desc) ? classOf((desc as any).value) : "unknown";
                }

                pushLine(line);

                // Recursively process object values
                if (!hadError && value && typeof value === "object" && depth < maxDepth) {
                    walk(value, childPath, depth + 1);
                }
            }

            // Next level in the prototype chain
            if (!includePrototype) break;
            try { current = Object.getPrototypeOf(current); }
            catch { break; }
            level++;
        }
    }

    // start
    walk(root, rootName, 0);

    // NDJSON output
    return lines.map(l => JSON.stringify(l)).join("\n");
}

// === Helper to download a file in the browser ==============================
export function downloadText(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}






interface SearchHit {
    path: string;                 // e.g. "context.factory._customControlProperties.descriptor.Parameters.RelationshipName"
    match: "value" | "key";
    valuePreview?: string;        // short preview of the value
    key?: string;                 // if match == "key"
    error?: string;               // if getter threw an error
    depth: number;
};

interface SearchOptions {
    needle: string | RegExp;      // what we are searching for
    searchInValues?: boolean;     // default true
    searchInKeys?: boolean;       // default false
    caseInsensitive?: boolean;    // only for string needles
    maxDepth?: number;            // default 7
    maxEntriesPerObject?: number; // default 2000
    includeNonEnumerable?: boolean; // default true
    includePrototype?: boolean;   // default true
};

export function findStringEverywhere(
    root: any,
    rootName = "context",
    opts: SearchOptions
): SearchHit[] {
    const {
        needle,
        searchInValues = true,
        searchInKeys = false,
        caseInsensitive = true,
        maxDepth = 7,
        maxEntriesPerObject = 2000,
        includeNonEnumerable = true,
        includePrototype = true,
    } = opts;

    const hits: SearchHit[] = [];

    function preview(v: any): string {
        const t = typeof v;
        if (v == null) return String(v);
        if (t === "string") return v.length > 200 ? JSON.stringify(v.slice(0, 200)) + "…(trim)" : JSON.stringify(v);
        if (t === "number" || t === "boolean" || t === "bigint") return String(v);
        if (t === "symbol") return v.toString();
        if (t === "function") return `[Function ${v.name || "anonymous"}]`;
        const tag = Object.prototype.toString.call(v).slice(8, -1); // class
        try {
            if (Array.isArray(v)) return `[Array len=${v.length}]`;
            if (v && typeof v === "object") {
                const keys = safeOwnKeys(v).length;
                return `[${tag} keys=${keys}]`;
            }
        } catch { /* ignore */ }
        return `[${tag}]`;
    }

    function safeOwnKeys(obj: object): (string | symbol)[] {
        try {
            const names = includeNonEnumerable ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
            const syms = includeNonEnumerable ? Object.getOwnPropertySymbols(obj) : [];
            return [...names, ...syms];
        } catch { return []; }
    }

    function tryGet(target: any, key: any, receiver: any): { ok: true; value: any } | { ok: false; error: any } {
        try { return { ok: true, value: Reflect.get(target, key, receiver) }; }
        catch (e) { return { ok: false, error: e }; }
    }

    function push(hit: SearchHit) { hits.push(hit); }

    // Important: no /g flag in RegExp! (otherwise lastIndex will break tests)
    const isRegex = needle instanceof RegExp;
    const needleStr = typeof needle === "string" ? (caseInsensitive ? needle.toLowerCase() : needle) : null;

    function strMatches(s: string): boolean {
        if (isRegex) return (needle as RegExp).test(s); // bez 'g'
        return caseInsensitive ? s.toLowerCase().includes(needleStr!) : s.includes(needleStr!);
    }

    const seen = new WeakSet<object>();
    let currentMaxDepth = 0;

    function walk(obj: any, path: string, depth: number): boolean {
        if (obj === null || typeof obj !== "object") return false;
        if (seen.has(obj)) return false;

        seen.add(obj);
        if (depth > currentMaxDepth) currentMaxDepth = depth;

        let cur: any = obj;
        const stopAt = includePrototype ? null : Object.prototype;

        // Local aggregate for THIS frame; not propagated to siblings
        let anyHitInThisFrameOrBelow = false;

        while (cur && cur !== stopAt && depth <= maxDepth) {
            const keys = safeOwnKeys(cur).slice(0, maxEntriesPerObject);

            for (const key of keys) {
                const keyStr = typeof key === "string" ? key : key.toString();
                const childPath = `${path}.${typeof key === "string" ? key : `[${keyStr}]`}`;

                // match in property name
                if (searchInKeys && typeof key === "string" && strMatches(key)) {
                    anyHitInThisFrameOrBelow = true;
                    push({ path: childPath, match: "key", key, depth });
                }

                // value retrieval
                const res = tryGet(obj, key, obj);
                if (!res.ok) {
                    if (searchInValues && res.error && strMatches(String(res.error))) {
                        anyHitInThisFrameOrBelow = true;
                        push({ path: childPath, match: "value", valuePreview: String(res.error), error: String(res.error), depth });
                    }
                    continue;
                }

                const value = res.value;

                // match in value (string)
                if (searchInValues && typeof value === "string" && strMatches(value)) {
                    anyHitInThisFrameOrBelow = true;
                    push({ path: childPath, match: "value", valuePreview: preview(value), depth });
                }

                // special case: { Name, Value }
                if (searchInValues && value && typeof value === "object" && "Name" in value && "Value" in value) {
                    const n = (value as any).Name;
                    const v = (value as any).Value;
                    if (typeof n === "string" && strMatches(n)) {
                        anyHitInThisFrameOrBelow = true;
                        push({ path: `${childPath}.Name`, match: "value", valuePreview: preview(n), depth });
                    }
                    if (typeof v === "string" && strMatches(v)) {
                        anyHitInThisFrameOrBelow = true;
                        push({ path: `${childPath}.Value`, match: "value", valuePreview: preview(v), depth });
                    }
                }

                // recursion
                if (value && typeof value === "object" && depth < maxDepth) {
                    const childHit = walk(value, childPath, depth + 1);
                    if (childHit) anyHitInThisFrameOrBelow = true; // OR only for this frame
                }
            }

            if (!includePrototype) break;
            try { cur = Object.getPrototypeOf(cur); } catch { break; }
        }

        // *** KEY BEHAVIOR ***
        // - if this branch/subtree had a hit → unmark it in 'seen' so the node can
        //   be visited later through another path (allow cycles for 'interesting' branches)
        // - if there was no hit → keep it in 'seen' to prune cycles
        if (anyHitInThisFrameOrBelow) {
            seen.delete(obj);
        }

        return anyHitInThisFrameOrBelow;
    }


    walk(root, rootName, 0);
    return hits;
}

// export helpers
export function toNDJSON(hits: SearchHit[]): string {
    return hits.map(h => JSON.stringify(h)).join("\n");
}
