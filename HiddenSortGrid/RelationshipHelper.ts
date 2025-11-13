// Utilities to resolve relationship details (via Metadata) for Dataverse in PCF.
// No Web API navigation hacks; uses context.utils.getEntityMetadata which works with alt-keys under the hood.

// ------------------------- Public Types -------------------------

export interface LinkInfo {
    entityName: string;
    from: string;
    to: string;
    relationship: string;
}

export interface RelationshipInfoO2M {
    kind: "one-to-many";
    SchemaName: string;
    ReferencedEntity: string;        // "parent" entity logical name
    ReferencedAttribute: string;     // attribute on parent (typically PK)
    ReferencingEntity: string;       // "child" entity logical name
    ReferencingAttribute: string;    // FK lookup attribute on child
}

export interface RelationshipInfoM2M {
    kind: "many-to-many";
    SchemaName: string;
    Entity1LogicalName: string;
    Entity2LogicalName: string;
    IntersectEntityName: string;
    Entity1IntersectAttribute: string;
    Entity2IntersectAttribute: string;
}

export type RelationshipInfo = RelationshipInfoO2M | RelationshipInfoM2M;

type EntityMetadata = Xrm.Metadata.EntityMetadata &
{
    OneToManyRelationships: Map<string, RelationshipInfoO2M>;
    ManyToOneRelationships: Map<string, RelationshipInfoO2M>;
    ManyToManyRelationships: Map<string, RelationshipInfoM2M>;
};

// ------------------------- Core API -------------------------

/**
 * Resolve a relationship by its SchemaName under a given entity using PCF metadata API.
 *
 * @param context PCF context
 * @param relationshipName Relationship SchemaName (e.g., "account_primary_contact")
 * @param entityName Logical name of an entity expected to participate in that relationship
 *                   (e.g., the form entity or the subgrid main entity).
 * @returns Normalized RelationshipInfo ready to be used for FetchXML link construction.
 *
 * Notes:
 * - This function searches the entity's OneToManyRelationships, ManyToOneRelationships and ManyToManyRelationships.
 * - For 1:N / N:1 it normalizes to "one-to-many".
 * - If nothing is found under the provided entity, you should call this function again with the other side entity.
 */
export async function getRelationshipInfo(
    context: ComponentFramework.Context<any>,
    relationshipName: string,
    entityName: string
): Promise<RelationshipInfoO2M | RelationshipInfoM2M | null> {
    const schema = relationshipName.trim();
    const entity = entityName.trim();

    try {
        // Loads full EntityMetadata (fast & cached by platform). No attribute prefetch list is required.
        const md: EntityMetadata = (await context.utils.getEntityMetadata(entity, [])) as unknown as EntityMetadata;

        // 1) Try OneToMany and ManyToOne
        const o2m = md.OneToManyRelationships.get(relationshipName) ?? md.ManyToOneRelationships.get(relationshipName);
        if (o2m)
            return {
                kind: "one-to-many",
                SchemaName: o2m.SchemaName,
                ReferencedEntity: o2m.ReferencedEntity,
                ReferencedAttribute: o2m.ReferencedAttribute,
                ReferencingEntity: o2m.ReferencingEntity,
                ReferencingAttribute: o2m.ReferencingAttribute
            }

        // 2) Try ManyToMany
        const m2m = md.ManyToManyRelationships.get(relationshipName);
        if (m2m)
            return {
                kind: "many-to-many",
                SchemaName: m2m.SchemaName,
                Entity1LogicalName: m2m.Entity1LogicalName,
                Entity2LogicalName: m2m.Entity2LogicalName,
                IntersectEntityName: m2m.IntersectEntityName,
                Entity1IntersectAttribute: m2m.Entity1IntersectAttribute,
                Entity2IntersectAttribute: m2m.Entity2IntersectAttribute
            };
    }
    catch (e) {
        console.error(e);

        return null;
    }

    return null;
}

export function isM2M(rel: RelationshipInfoO2M | RelationshipInfoM2M | null): boolean {
    return !!rel && rel.kind === "many-to-many";
}