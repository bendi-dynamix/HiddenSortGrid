import { IInputs } from "./generated/ManifestTypes";
import { ColumnInfo } from "./Helper";
import { getRelationshipInfo, LinkInfo, RelationshipInfo, RelationshipInfoO2M } from "./RelationshipHelper";
import { SimpleKind } from "./TypesHelper";

type OptionSetValue = Xrm.OptionSetValue;
type OptionMetadata = Xrm.Metadata.OptionMetadata & OptionSetValue;
type AttributeMetadata = Xrm.Metadata.AttributeMetadata &
{
    Precision: number,
    Targets: string[],
    attributeDescriptor:
    {
        MinValue: number,
        MaxValue: number,
        MaxLength: number,
        Behavior: number,
        Format: string,

        IsValidForUpdate: boolean,
        RequiredLevel: number
    }
};

type Attributes = Xrm.Collection.StringIndexableItemCollection<AttributeMetadata>;

export type Behavior = ComponentFramework.FormattingApi.Types.DateTimeFieldBehavior;
type Format = 'DateOnly' | 'DateAndTime';

export interface FieldMetadata { isValidForUpdate: boolean, requiredLevel: number };
export interface LookupMetadata extends FieldMetadata { linkEntities: LinkInfo[] };
export interface TextMetadata extends FieldMetadata { maxLength: number };
export interface NumericMetadata extends FieldMetadata { precision: number, minValue: number, maxValue: number };
export interface DateMetadata extends FieldMetadata { behavior: Behavior; formatName: Format }

export interface PrimaryInfo { idAttr: string; nameAttr: string };

const fieldsMetadata = new Map<string, Map<string, FieldMetadata>>();
const optionsetsMetadataCache = new Map<string, Map<string, OptionSetValue[] | null>>();
const relationshipsCache = new Map<string, RelationshipInfo | null>();
const primaryInfoCache = new Map<string, PrimaryInfo | null>();

export async function loadEntityAttributesMetadata(
    context: ComponentFramework.Context<IInputs>,
    entity: string,
    attrs: ColumnInfo[]
): Promise<boolean> {
    const fieldsProcessedAlready = await processFieldsMetadata(context, entity, attrs);
    const optionsetsProcessedAlready = await processOptionsets(context, entity, attrs);

    return fieldsProcessedAlready && optionsetsProcessedAlready;
}

async function processFieldsMetadata(
    context: ComponentFramework.Context<IInputs>,
    entity: string,
    attributes: ColumnInfo[]
): Promise<boolean> {
    const e = entity.toLowerCase();
    if (!fieldsMetadata.get(e))
        fieldsMetadata.set(e, new Map<string, FieldMetadata | LookupMetadata | TextMetadata | NumericMetadata | DateMetadata>());

    const entityAttributesMetadada = fieldsMetadata.get(e);
    const notLoadedMeta = attributes.filter(column => !entityAttributesMetadada?.get(column.logicalName.toLowerCase()));
    if (notLoadedMeta.length == 0)
        return true;

    const entityMetadata = await context.utils.getEntityMetadata(entity, notLoadedMeta.map(column => column.logicalName));
    for (const column of notLoadedMeta) {
        const logicalName = column.logicalName;
        const attrMetadata = (entityMetadata.Attributes as Attributes).get(logicalName);
        const specificMetadata =
            column.simpleType === "lookup" ?
                (() => {
                    const targets: string[] = attrMetadata.Targets ?? [];
                    const candidates =
                        ((entityMetadata.ManyToOneRelationships as unknown as { get: () => RelationshipInfoO2M[] })?.get() ?? [])
                            .filter((r: RelationshipInfoO2M) =>
                                r.ReferencingAttribute === logicalName &&
                                (targets.length === 0 || targets.includes(r.ReferencedEntity))
                            );

                    const links: LinkInfo[] = candidates.map(r => ({
                        entityName: r.ReferencedEntity,
                        from: r.ReferencedAttribute,
                        to: r.ReferencingAttribute,
                        relationship: r.SchemaName
                    }));

                    return {
                        linkEntities: links
                    }
                })() :
                column.simpleType === "text" ?
                    {
                        maxLength: attrMetadata.attributeDescriptor.MaxLength
                    } :
                    column.simpleType === "datetime" ?
                        {
                            behavior: attrMetadata.attributeDescriptor.Behavior,
                            formatName: attrMetadata.attributeDescriptor.Format === "date" ? "DateOnly" : "DateAndTime"
                        } :
                        SimpleKind.includes(['money', 'number'], column.simpleType) ? {
                            precision: attrMetadata.Precision,
                            minValue: attrMetadata.attributeDescriptor.MinValue,
                            maxValue: attrMetadata.attributeDescriptor.MaxValue
                        } : {};

        const fieldMetadata = {
            ...specificMetadata,
            isValidForUpdate: attrMetadata.attributeDescriptor.IsValidForUpdate,
            requiredLevel: attrMetadata.attributeDescriptor.RequiredLevel
        };
        entityAttributesMetadada?.set(logicalName.toLowerCase(), fieldMetadata);
    }

    return false;
}

export function isValidForUpdate(entityName: string, logicalName: string) {
    return fieldsMetadata?.get(entityName)?.get(logicalName)?.isValidForUpdate ?? false;
}

export function getRequiredLevel(entityName: string, logicalName: string) {
    return fieldsMetadata?.get(entityName)?.get(logicalName)?.requiredLevel ?? 0;
}

async function processOptionsets(
    context: ComponentFramework.Context<IInputs>,
    entity: string,
    attrs: ColumnInfo[]
): Promise<boolean> {
    const optionsetAttributes = attrs.filter(attr => SimpleKind.includes(['boolean', 'picklist', 'multipicklist'], attr.simpleType));
    if (optionsetAttributes.length == 0)
        return true;

    const e = entity.toLowerCase();
    if (!optionsetsMetadataCache.get(e))
        optionsetsMetadataCache.set(e, new Map<string, OptionSetValue[] | null>());

    const entityAttributesMetadada = optionsetsMetadataCache.get(e);
    const notLoadedMeta = optionsetAttributes.filter(column => !entityAttributesMetadada?.get(column.logicalName.toLowerCase()));
    if (notLoadedMeta.length == 0)
        return true;

    const entityMetadata = await context.utils.getEntityMetadata(entity, notLoadedMeta.map(column => column.logicalName));
    for (const column of notLoadedMeta) {
        const logicalName = column.logicalName;
        const attrMetadata = (entityMetadata.Attributes as Attributes).get(logicalName);
        const options = attributeMetaToOptions(attrMetadata);

        entityAttributesMetadada?.set(logicalName.toLowerCase(), options);
    }

    return false;
}

function attributeMetaToOptions(attributeMeta: AttributeMetadata): OptionSetValue[] | null {
    if (!attributeMeta)
        return null;

    if (!attributeMeta.OptionSet)
        return null;

    if (!attributeMeta.OptionSet)
        return null;

    const array = (Array.isArray(attributeMeta.OptionSet) ? attributeMeta.OptionSet : Object.values(attributeMeta.OptionSet)) as OptionMetadata[];
    if (!array)
        return null;

    const options = array.map(o => {
        return {
            text: o.Label?.UserLocalizedLabel?.Label ?? o.text,
            value: o.Value ?? o.value
        } as OptionSetValue;
    });
    return options;
}

export function getOptionsetValues(entity: string, attributeName: string): OptionSetValue[] | null {
    const entityAttributes = optionsetsMetadataCache.get(entity.toLowerCase());
    if (!entityAttributes)
        return null;

    const attributeOptions = entityAttributes.get(attributeName.toLowerCase());
    if (!attributeOptions)
        return null;

    return attributeOptions;
}

export function getOptionByValue(entity: string, attributeName: string, value: number): OptionSetValue | null {
    const options = getOptionsetValues(entity, attributeName);
    if (!options)
        return null;

    const option = options.find(o => o.value === value);
    if (!option)
        return null;

    return option;
}

export function getOptionTextByValue(columnInfo: ColumnInfo, value: number): string | null {
    const option = getOptionByValue(columnInfo.entityName, columnInfo.logicalName, value);
    if (!option)
        return null;

    return option.text;
}

export function getFieldInfo(entity: string, attributeName: string): FieldMetadata | TextMetadata | NumericMetadata | DateMetadata | null {
    const entityAttributes = fieldsMetadata.get(entity.toLowerCase());
    if (!entityAttributes)
        return null;

    const attributeTextInfo = entityAttributes.get(attributeName.toLowerCase());
    if (!attributeTextInfo)
        return null;

    return attributeTextInfo;
}

export async function getSubgridRelationship(
    context: ComponentFramework.Context<IInputs>,
    relationshipName: string,
    formEntity: string,
    subgridEntity: string
): Promise<RelationshipInfo | null> {
    if (!relationshipName)
        return null;

    const relationshipInfoCached = relationshipsCache.get(relationshipName.toLowerCase());
    if (relationshipInfoCached)
        return relationshipInfoCached;

    let relationshipInfo = await getRelationshipInfo(context, relationshipName, formEntity);
    if (relationshipInfo != null) {
        relationshipsCache.set(relationshipName.toLowerCase(), relationshipInfo);
        return relationshipInfo;
    }

    if (formEntity === subgridEntity) {
        relationshipsCache.set(relationshipName.toLowerCase(), null);
        return null;
    }

    relationshipInfo = await getRelationshipInfo(context, relationshipName, subgridEntity);
    relationshipsCache.set(relationshipName.toLowerCase(), relationshipInfo);
    return relationshipInfo;
}

export async function getPrimaryInfoFromMetadata(
    context: ComponentFramework.Context<any>,
    entityName: string
): Promise<PrimaryInfo | null> {
    if (!entityName)
        return null;

    let primaryInfo = primaryInfoCache.get(entityName.toLowerCase()) ?? null;
    if (primaryInfo)
        return primaryInfo;

    const entityMetadata = await context.utils.getEntityMetadata(entityName, []);

    primaryInfo = !entityMetadata?.PrimaryIdAttribute || !entityMetadata?.PrimaryNameAttribute ?
        null :
        primaryInfo = {
            idAttr: entityMetadata.PrimaryIdAttribute,
            nameAttr: entityMetadata.PrimaryNameAttribute
        };

    primaryInfoCache.set(entityName.toLowerCase(), primaryInfo);
    return primaryInfo;
}