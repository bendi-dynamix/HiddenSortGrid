import { extractGridFilters, loadViewFetchXml } from "./FilterExpressionHelper";
import { IInputs } from "./generated/ManifestTypes";
import { generateRandomId } from "./Helper";
import { getFormInfo, getRelationshipName } from "./MainRelationshipHelper";
import { getPrimaryInfoFromMetadata, getSubgridRelationship } from "./MetadataHelper";
import { isM2M, RelationshipInfoM2M, RelationshipInfoO2M } from "./RelationshipHelper";

export async function buildGridExtraction(
  context: ComponentFramework.Context<IInputs>,
  dataset: ComponentFramework.PropertyTypes.DataSet
): Promise<string | null> {

  const viewId = dataset.getViewId();
  const subgridEntityName = dataset.getTargetEntityType();
  const gridViewFetchXml = await loadViewFetchXml(context, viewId);
  const extractedGridFilters = extractGridFilters(gridViewFetchXml, subgridEntityName);

  const subgridRelationName: string | null = getRelationshipName(context) ?? null;
  const formLookup = getFormInfo(context);

  if (!subgridRelationName || !formLookup)
    return extractedGridFilters;

  const formEntityName = formLookup.entityType!;
  const formId = formLookup.id;

  try {
    const relationship = await getSubgridRelationship(context, subgridRelationName, formEntityName, subgridEntityName);
    if (!relationship)
      return extractedGridFilters;

    const formEntityPrimaryAttr = (await getPrimaryInfoFromMetadata(context, formEntityName))?.idAttr ?? null;
    if (!formEntityPrimaryAttr)
      return extractedGridFilters;

    const formEntityFilter = [
      "<filter>",
      `<condition attribute="${formEntityPrimaryAttr}" operator="eq" value="${formId}" />`,
      "</filter>"
    ].join("");

    const randomId = generateRandomId().substring(0, 8);
    if (isM2M(relationship)) {
      const relationshipM2M = relationship as RelationshipInfoM2M;
      const formIsFirst = formEntityName === relationshipM2M.Entity1LogicalName;

      const subgridEntityPrimaryAttr = formEntityName === subgridEntityName ?
        formEntityPrimaryAttr :
        (await getPrimaryInfoFromMetadata(context, subgridEntityName))?.idAttr ?? null;

      if (!subgridEntityPrimaryAttr)
        return extractedGridFilters;

      const alias1 = `x1_${randomId}`;
      const linkName1 = relationshipM2M.IntersectEntityName;
      const fromAttr1 = formIsFirst ? relationshipM2M.Entity2IntersectAttribute : relationshipM2M.Entity1IntersectAttribute;
      const toAttr1 = subgridEntityPrimaryAttr;

      const alias2 = `x2_${randomId}`;
      const linkName2 = formIsFirst ? relationshipM2M.Entity1LogicalName : relationshipM2M.Entity2LogicalName;
      const fromAttr2 = formEntityPrimaryAttr;
      const toAttr2 = formIsFirst ? relationshipM2M.Entity1IntersectAttribute : relationshipM2M.Entity2IntersectAttribute;

      return [
        `<link-entity name="${linkName1}" from="${fromAttr1}" to="${toAttr1}" alias="${alias1}" link-type="inner">`,
        extractedGridFilters,
        `<link-entity name="${linkName2}" from="${fromAttr2}" to="${toAttr2}" alias="${alias2}" link-type="inner">`,
        formEntityFilter,
        `</link-entity>`,
        `</link-entity>`
      ].join("");
    }
    else {
      const relationshipO2M = relationship as RelationshipInfoO2M;

      const alias = `a_${randomId}`;
      const linkName = relationshipO2M.ReferencedEntity;
      const fromAttr = relationshipO2M.ReferencedAttribute;
      const toAttr = relationshipO2M.ReferencingAttribute;

      return [
        extractedGridFilters,
        `<link-entity name="${linkName}" from="${fromAttr}" to="${toAttr}" alias="${alias}" link-type="inner">`,
        formEntityFilter,
        `</link-entity>`
      ].join("");
    }
  }
  catch (e) {
    console.error(e);
    return null;
  }
}