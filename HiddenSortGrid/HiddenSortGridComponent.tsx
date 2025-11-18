// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./generated/ManifestTypes.d.ts" />

import * as React from "react";
import {
  Checkbox,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Dropdown,
  Option,
  OptionGroup,
  Spinner,
  TableCellLayout,
  TableColumnSizingOptions,
  createTableColumn,
} from "@fluentui/react-components";

import { getLookupRef, generateRandomId, isRightAligned, ColumnInfo, SortDirection, getLookupRefFromPrimary, Row, changedValues, RawValue, extractRawValue, Cell, isSameCell, CellHandle, isTypingKey, boolToNumber, ValidableHandle, toIndexStrings, isOpenInMakerMode, getBoolFromMainfestProp, RowStatusInfo, SaveStatus } from "./Helper";
import { DateMetadata, FieldMetadata, getFieldInfo, getOptionsetValues, loadEntityAttributesMetadata, NumericMetadata, TextMetadata } from "./MetadataHelper";
import { SimpleKind, toLinkType, toNumberType, toSimpleType } from "./TypesHelper";
import { ColumnResizeController, GO_TO_RECORD_COL_ID, SELECTION_COL_ID, STATUS_COL_ID } from "./ColumnResizeController";
import { gridScrollbars } from "./GridScrollbars";
import { HeaderMenu, HeaderMenuHandle } from "./HeaderMenu";
import { HeaderFilter, HeaderFilterHandle } from "./HeaderFilter";
import { IInputs } from "./generated/ManifestTypes";
import { CheckmarkCircle16Regular, CheckmarkCircle20Regular, DismissCircle20Regular, ErrorCircle16Regular, ErrorCircle20Regular, Open16Regular, Table48Filled, TableSparkle24Filled } from "@fluentui/react-icons";
import { createFilterExpression } from "./FilterExpressionHelper";
import { buildGridExtraction } from "./FetchXmlBuilder";
import { getFormInfo } from "./MainRelationshipHelper";
import { SelectingAllPopup } from "./SelectingAllPopup";
import { TextCell } from "./UI/TextCell";
import { LinkCell } from "./UI/LinkCell";
import { NumberCell } from "./UI/NumberCell";
import { MoneyCell } from "./UI/MoneyCell";
import { PicklistCell } from "./UI/PicklistCell";
import { BoolCell } from "./UI/BoolCell";
import { DateCell } from "./UI/DateCell";
import { formatDateD365 } from "./HelperDateTime";
import { NonEditCell } from "./UI/NonEditCell";
import { NonEditLinkCell } from "./UI/NonEditLinkCell";

export const CURRENCY_SYMBOL_ALIAS = "cur";
export const CURRENCY_SYMBOL_FIELD = "currencysymbol";

export interface UserNumberFormatInfo {
  currencyDecimalSeparator: string,
  currencyGroupSeparator: string,
  numberDecimalSeparator: string,
  numberGroupSeparator: string,
  currencyPositivePattern: number,
  currencyNegativePattern: number
}

export interface UserDateFormatInfo {
  firstDayOfWeek: number,
  shortDatePattern: string,
  shortTimePattern: string,
  amDesignator: string,
  pmDesignator: string
}

export interface MakerSettings {
  hideSortingColumn: boolean;
  editableGrid: boolean;
  enableFiltering: boolean;
  enableSorting: boolean;
  allowRowSelection: boolean;
  lockedColumns: string[];
  showOpenRecordColumn: boolean;
}

const OpenRegular = Open16Regular;

export interface HiddenSortGridComponentProps {
  context: ComponentFramework.Context<IInputs>;
  dataset: ComponentFramework.PropertyTypes.DataSet;
  allocatedWidth: number;
  gridReloaded: boolean;
}

interface ErrorDetails {
  id: string;
  columnInfo: ColumnInfo;
  error: string;
}

export type LinkEntity = ComponentFramework.PropertyHelper.DataSetApi.LinkEntityExposedExpression;
export type SelectionMode = "single" | "multiselect";


const STATUS_COL_PX = 20;
const CHECKBOX_COL_PX = 44;
const GOTO_COL_PX = 42;

const GRID_RIGHT_PADDING = 32;

const COLUMN_MIN_WIDTH = 42;

const SCROLLBAR_SIZE = 18;
const BODY_MIN_HEIGHT = 147;

const GRID_HEADER_ID = generateRandomId();
const GRID_BODY_ID = generateRandomId();
const HEADER_ROW_ID = "__hsgHeaderRow__";

export const HiddenSortGridComponent: React.FC<HiddenSortGridComponentProps> = ({
  context,
  dataset,
  allocatedWidth,
  gridReloaded
}) => {
  /// eslint-disable-next-line no-debugger
  //debugger;
  const isEditableGrid = true;

  const formatting: ComponentFramework.Formatting = context.formatting;
  const userNumberFormatInfo: UserNumberFormatInfo = React.useMemo(() => {
    return {
      currencyDecimalSeparator: context.userSettings.numberFormattingInfo.currencyDecimalSeparator,
      currencyGroupSeparator: context.userSettings.numberFormattingInfo.currencyGroupSeparator,
      numberDecimalSeparator: context.userSettings.numberFormattingInfo.numberDecimalSeparator,
      numberGroupSeparator: context.userSettings.numberFormattingInfo.numberGroupSeparator,
      currencyPositivePattern: context.userSettings.numberFormattingInfo.currencyPositivePattern,
      currencyNegativePattern: context.userSettings.numberFormattingInfo.currencyNegativePattern
    }
  }, [context.userSettings.numberFormattingInfo]);

  const userDateFormatInfo: UserDateFormatInfo = React.useMemo(() => {
    return {
      firstDayOfWeek: context.userSettings.dateFormattingInfo.firstDayOfWeek,
      shortDatePattern: context.userSettings.dateFormattingInfo.shortDatePattern,
      shortTimePattern: context.userSettings.dateFormattingInfo.shortTimePattern,
      amDesignator: context.userSettings.dateFormattingInfo.amDesignator,
      pmDesignator: context.userSettings.dateFormattingInfo.pmDesignator
    }
  }, [context.userSettings.dateFormattingInfo]);

  const formContextInfo = React.useMemo(() => getFormInfo(context), [context]);
  const gridEntityName = dataset.getTargetEntityType();                               // subgrid entity name
  const [metaLoaded, setMetaLoaded] = React.useState<boolean | undefined>();
  const extractedGridFilters = React.useRef<string | null>(null);

  const isMakerMode = isOpenInMakerMode(context);
  const isMainGrid = !isMakerMode && (formContextInfo?.id ?? "") === "";

  const p = context.parameters;
  const makerSettings: MakerSettings = {
    hideSortingColumn: isMakerMode ? false : p?.hideSortingColumn?.raw ?? true,
    editableGrid: isMakerMode ? false : p?.editableGrid?.raw ?? false,
    enableFiltering: isMakerMode ? true : p?.enableFiltering?.raw ?? true,
    enableSorting: isMakerMode ? true : p?.enableSorting?.raw ?? true,
    allowRowSelection: isMakerMode ? true : p?.allowRowSelection?.raw ?? true,
    lockedColumns: isMakerMode ? [] : toIndexStrings(p?.lockedColumns?.raw ?? ""),
    showOpenRecordColumn: isMakerMode ? false : p?.showOpenRecordColumn?.raw ?? false
  };

  const [pageSizeLimit, setPageSizeLimit] = React.useState<number>(dataset.paging.pageSize ?? 0);
  React.useEffect(() => {
    if (!pageSizeLimit) {
      setPageSizeLimit(dataset.paging.pageSize ?? 0);
    }
  }, [dataset.paging.pageSize]);

  const sortBy = (column: ColumnInfo) => {
    dataset.sorting.length = 0;

    dataset.sorting.push({
      name: column.name,
      sortDirection: column.sortDirection ?? -1
    });

    clearRowsSelection();
    dataset.paging.reset();
    dataset.refresh();
  };

  const filterGrid = () => {
    const filterModels = visibleInfoColumns.filter(c => !!c.filterModel)?.map(c => c.filterModel!);
    if (!filterModels || filterModels.length === 0)
      dataset.filtering.clearFilter();
    else {
      dataset.filtering.clearFilter();
      dataset.filtering.setFilter(createFilterExpression(filterModels));
    }

    clearRowsSelection();
    dataset.paging.reset();
    dataset.refresh();
  };

  const sortingSetInEditorRef = React.useRef<ComponentFramework.PropertyHelper.DataSetApi.SortStatus[] | null>(null); // keep original sorting fields set in editor, user can change it afterwards, but we're hiding only the original fields
  sortingSetInEditorRef.current ??= [...dataset.sorting];

  // Visible columns
  const visibleColumnsByDefault = (dataset?.columns ?? [])
    .filter(col =>
      !col.isHidden &&                                                                      // some fields are always present in the view, even with isHidden flag (e.g. primary field)
      (col.alias ?? "") !== `${CURRENCY_SYMBOL_ALIAS}.${CURRENCY_SYMBOL_FIELD}`             // we attach link entity for currency info, do not show it to the user
    ) ?? [];

  const lockedColumnsByMaker = (makerSettings?.lockedColumns ?? []).length > 0 ?
    visibleColumnsByDefault.filter((_, index) => makerSettings.lockedColumns.includes(String(index)))?.map(vc => vc.name) ?? [] :
    [];

  // Visible columns
  const visibleColumns = (visibleColumnsByDefault ?? [])
    .filter(col =>                                                                           // if HideSortColumn is on, hide all sorting fields
      !makerSettings.hideSortingColumn ||
      !(sortingSetInEditorRef.current?.some(sortState => (col?.name ?? "") === (sortState?.name ?? "")) ?? false)
    ) ?? [];

  const visibleColumnsNamesKey = "visibleColumnsNamesKey|" + [...visibleColumns].map(c => c.name).sort().join(",");
  const visibleInfoColumns = React.useMemo<ColumnInfo[]>(() => {
    const columnInfo: ColumnInfo[] = [];
    for (const column of visibleColumns) {

      let entityAliasName: string | undefined;
      const aliasedName = column.name.split(".");

      let entityName = "";
      if (aliasedName.length === 1)
        entityName = gridEntityName;
      else {
        if (!aliasedName[0]) {
          columnInfo.push({ ...column } as ColumnInfo);
          continue;
        }

        const entityAlias = aliasedName[0];
        const relatedEntity = dataset.linking.getLinkedEntities()?.find(linkEntity => linkEntity.alias === entityAlias);
        if (!relatedEntity) {
          columnInfo.push({ ...column } as ColumnInfo);
          continue;
        }

        entityAliasName = entityAlias;
        entityName = relatedEntity.name;
      }

      if (!entityName) {
        columnInfo.push({ ...column } as ColumnInfo);
        continue;
      }

      const columnName = aliasedName.length === 1 ? aliasedName[0] : aliasedName[1];
      const simpleType = toSimpleType(column.dataType);

      columnInfo.push({ ...column, entityName: entityName, logicalName: columnName, entityAlias: entityAliasName, simpleType: simpleType } as ColumnInfo);
    }

    return columnInfo;
  }, [visibleColumnsNamesKey]);

  const columnInfoKey = "columnInfoKey|" + [...visibleInfoColumns].sort((a, b) => a.name.localeCompare(b.name)).map(c => `${c.entityName}-${c.logicalName}`).join(",") + `|${dataset.getViewId()}`;
  const loadMeta = React.useCallback(async () => {
    const entityAttributesMap = new Map<string, ColumnInfo[]>();
    for (const column of visibleInfoColumns) {
      const entityName = column.entityName;
      const columnName = column.logicalName;

      if (!entityAttributesMap.get(entityName))
        entityAttributesMap.set(entityName, []);

      const entityAttributesArray = entityAttributesMap.get(entityName);
      if (!entityAttributesArray?.some(col => col.name === columnName))
        entityAttributesArray?.push(column);
    }

    for (const [entityName, columns] of entityAttributesMap) {
      if (columns && columns.length > 0)
        await loadEntityAttributesMetadata(context, entityName, columns);
    }

    extractedGridFilters.current = await buildGridExtraction(context, dataset);

    for (const attribute of visibleInfoColumns)
      attribute.metadataInfo = getFieldInfo(attribute.entityName, attribute.logicalName);

    setMetaLoaded(true);
  }, [columnInfoKey]);

  React.useEffect(() => {
    setMetaLoaded(false);
    void loadMeta();
  }, [loadMeta]);

  const [rowStatuses, setRowStatuses] = React.useState<Record<string, RowStatusInfo>>({});
  const setRowStatus = React.useCallback((
    rowId: string,
    status: SaveStatus,
    transient = false
  ) => {
    setRowStatuses(prev => ({ ...prev, [rowId]: { status } }));

    if (transient) {
      window.setTimeout(() => {
        setRowStatuses(prev => {
          if (prev[rowId]?.status !== status)
            return prev;

          const { [rowId]: _, ...rest } = prev;
          return rest;
        });
      }, 5000);
    }
  }, []);

  const saveRow = async (item: Row, vc: ColumnInfo, columns: ColumnInfo[]): Promise<boolean> => {
    const _changedValues = changedValues(item, columns);
    const entityToUpdate = Object.fromEntries(
      Object.entries(_changedValues).map(([key, value]) => {
        return [key, value];
      })
    );
    try {
      const id = String(item.id).replace(/[{}]/g, "");
      await context.webAPI.updateRecord(vc.entityName, id, entityToUpdate);

      for (const [key, newValue] of Object.entries(_changedValues)) {
        item.originalValues[key] = newValue;
      }

      return true;
    } catch (e) {
      console.error("Update failed", e);
      return false;
    }
  };

  const [validationErrors, setValidationErrors] =
    React.useState<Map<string, Map<string, ErrorDetails>>>(new Map());

  const updateValidationErrors = (rowId: string, columnInfo: ColumnInfo, error: string | null): boolean => {
    let errorsOnRow = false;

    setValidationErrors(prev => {
      const columnId = columnInfo.name;

      const rowErrors = prev.get(rowId);
      const next = new Map(prev);

      errorsOnRow = (rowErrors?.size ?? 0) > 0;

      if (error != null) {
        const newRowErrors = new Map(rowErrors ?? []);
        newRowErrors.set(columnId, {
          id: rowId,
          columnInfo,
          error
        });

        errorsOnRow = (newRowErrors?.size ?? 0) > 0;

        next.set(rowId, newRowErrors);
        return next;
      } else {
        if (!rowErrors)
          return prev;

        const newRowErrors = new Map(rowErrors);
        newRowErrors.delete(columnId);

        errorsOnRow = (newRowErrors?.size ?? 0) > 0;

        if (newRowErrors.size === 0)
          next.delete(rowId);
        else
          next.set(rowId, newRowErrors);

        return next;
      }
    });

    return errorsOnRow;
  }

  const onValidate = React.useCallback((rowId: string, columnInfo: ColumnInfo, error: string | null) => {
    updateValidationErrors(rowId, columnInfo, error);
  }, []);

  const onCommit = React.useCallback((
    item: Row,
    columnInfo: ColumnInfo,
    rawValue: RawValue,
    formattedValue: string
  ) => {
    const columnId = columnInfo.name;

    item.validationInitiatedByColumnChange = true;
    const oldValue = item.rawValues?.[columnId] ?? "";
    const newValue = rawValue;

    item.rawValues[columnId] = newValue;
    item.formattedValues[columnId] = formattedValue;

    let errorsOnRow = false;
    for (const validable of [...(item.validators?.values() ?? [])]) {
      const isValid = validable.validateCell();
      if (!isValid)
        errorsOnRow = true;
    }

    if (errorsOnRow)
      return;

    if (oldValue !== newValue) {
      setRowStatus(item.id, "saving");

      void (async () => {
        const ok = await saveRow(item, columnInfo, visibleInfoColumns);
        if (ok)
          setRowStatus(item.id, "success", true);
        else
          setRowStatus(item.id, "error", true);
      })();
    }
  }, [saveRow, visibleInfoColumns, setRowStatus]);

  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = React.useState<Cell | null>(null);

  function onEditingFinished(
    rowId: string,
    columnId: string,
    gridCellRef: React.RefObject<HTMLDivElement>
  ) {
    if (isSameCell({ rowId, columnId }, editingCell)) {
      setEditingCell(null);
      gridCellRef.current?.focus();
    }
  }

  const columns = (() => {
    const cols = /*React.useMemo*/(() => visibleInfoColumns.map(vc => {
      const isRight = isRightAligned(vc.simpleType);
      const isLookup = vc.simpleType === "lookup";
      const linkType = vc.simpleType === "text" ? toLinkType(vc.dataType) : null;
      const numberType = vc.simpleType === "number" ? toNumberType(vc.dataType) : null;

      const isReadOnlyByOrigin = !vc.metadataInfo?.isValidForUpdate || ((vc.entityAlias ?? "") !== "");
      const isReadOnlyByHsgImplementation = isLookup || vc.simpleType === "multipicklist";
      const isReadOnlyByMaker = lockedColumnsByMaker.includes(vc.name);
      const isReadOnlyField = isReadOnlyByOrigin || isReadOnlyByHsgImplementation || isReadOnlyByMaker;

      const isReadOnlyGrid = !makerSettings?.editableGrid;

      return createTableColumn<Row>({
        columnId: vc.name,

        renderHeaderCell: () => {
          const menuRef = React.useRef<HeaderMenuHandle>(null);
          const filterRef = React.useRef<HeaderFilterHandle>(null);

          const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
            const anchor = (e.currentTarget as HTMLElement).closest<HTMLElement>('[role="columnheader"]');
            menuRef.current?.openAt(anchor ?? (e.currentTarget as HTMLElement));
          };

          const handleKey = (e: React.KeyboardEvent<HTMLElement>) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpen(e as unknown as React.MouseEvent<HTMLElement>);
            }
          };

          return (
            <DataGridHeaderCell
              className={"pcf-grid-header" +
                (isRight ? " pcf-grid-header-right" : "")
              }
            >
              <TableCellLayout
                truncate
                style={{
                  justifyContent: isRight ? "flex-end" : "flex-start",
                  textAlign: isRight ? "right" : "left",
                  cursor: "pointer",
                  height: "100%"
                }}
                onClick={handleOpen}
                onKeyDown={handleKey}
                role="button"
                tabIndex={-1}
              >
                <HeaderMenu
                  ref={menuRef}
                  columnInfo={vc}
                  isReadOnlyGrid={isReadOnlyGrid}
                  allowFiltering={makerSettings.enableFiltering}
                  allowSorting={makerSettings.enableSorting}
                  onSort={(direction: SortDirection) => {
                    for (const ci of visibleInfoColumns)
                      ci.sortDirection = undefined;

                    vc.sortDirection = direction;
                    sortBy(vc);
                  }}
                  onFilter={(el: HTMLElement) => {
                    filterRef.current?.openAt(el);
                  }}
                  onClearFilter={() => {
                    vc.filterModel = null;
                    filterGrid();
                  }}
                />

                <HeaderFilter
                  ref={filterRef}
                  onApply={(filterModel) => {
                    vc.filterModel = filterModel;
                    filterGrid();
                  }}
                  context={context}
                  columnInfo={vc}
                  dateUserFormatInfo={userDateFormatInfo}
                  gridEntityName={gridEntityName}
                  extractedGridFilters={extractedGridFilters}
                />
              </TableCellLayout>
            </DataGridHeaderCell>
          );
        },

        compare: (a, b) =>
          (a.formattedValues[vc.name] ?? "").localeCompare(b.formattedValues[vc.name] ?? "", undefined, { numeric: true }),

        renderCell: item => {
          const gridCellRef = React.useRef<HTMLDivElement>(null);
          let cellHandle: CellHandle | null = null;
          const rawValue = item.rawValues[vc.name] ?? null;
          const formattedValue = item.formattedValues[vc.name] ?? "";
          const isEditing = isSameCell({ rowId: item.id, columnId: vc.name }, editingCell);

          const valuesList = SimpleKind.includes(["boolean", "picklist"], vc.simpleType) ? React.useMemo(() => getOptionsetValues(vc.entityName, vc.logicalName) ?? [], [vc.name]) : [];
          const content = (isReadOnlyGrid || isReadOnlyField) && (linkType != null || isLookup || (vc.isPrimary ?? false)) ?
            (
              <NonEditLinkCell
                formattedValue={formattedValue}
                kind={linkType}
                readonlyGrid={isReadOnlyGrid}
                onLookupClick={(e) => {
                  const lookup = isLookup ? getLookupRef(dataset.records[item.id], vc.name) : getLookupRefFromPrimary(dataset.records[item.id]);
                  if (lookup?.entityName && lookup?.id) {
                    void context.navigation.openForm({
                      entityName: lookup.entityName,
                      entityId: lookup.id,
                      openInNewWindow: false,
                    });
                  }
                }}
              />
            ) : isReadOnlyGrid || isReadOnlyField ? (
              <NonEditCell
                formattedValue={formattedValue}
                isRightAlign={isRight}
                readonlyGrid={isReadOnlyGrid}
              />
            ) : vc.simpleType === "money" ? (
              <MoneyCell
                rawValue={rawValue as number}
                formattedValue={formattedValue}
                isEditing={isEditing}

                currencySymbol={item.currencySymbol}
                numericInfo={vc.metadataInfo as NumericMetadata}
                userFormatInfo={userNumberFormatInfo}

                rowValidationInitiated={item.validationInitiatedByColumnChange}
                onValidate={(error) => onValidate(item.id, vc, error)}
                onCommit={(rawValue, formattedValue) => onCommit(item, vc, rawValue, formattedValue)}
                onEditingFinished={() => onEditingFinished(item.id, vc.name, gridCellRef)}

                ref={(inst) => {
                  cellHandle = inst;
                  if (cellHandle != null) {
                    item.validators.set(vc.name, cellHandle as ValidableHandle);
                    if (gridReloaded)
                      cellHandle.resetCellValidation();
                  }
                }}
              />
            ) : numberType != null ? (
              <NumberCell
                rawValue={rawValue as number}
                formattedValue={formattedValue}
                isEditing={isEditing}

                kind={numberType}
                numericInfo={vc.metadataInfo as NumericMetadata}
                userFormatInfo={userNumberFormatInfo}

                rowValidationInitiated={item.validationInitiatedByColumnChange}
                onValidate={(error) => onValidate(item.id, vc, error)}
                onCommit={(rawValue, formattedValue) => onCommit(item, vc, rawValue, formattedValue)}
                onEditingFinished={() => onEditingFinished(item.id, vc.name, gridCellRef)}

                ref={(inst) => {
                  cellHandle = inst;
                  if (cellHandle != null) {
                    item.validators.set(vc.name, cellHandle as ValidableHandle);
                    if (gridReloaded)
                      cellHandle.resetCellValidation();
                  }
                }}
              />
            ) : linkType != null || vc.isPrimary === true ? (
              <LinkCell
                rawValue={rawValue as string}
                formattedValue={formattedValue}
                isEditing={isEditing}

                kind={linkType}
                textInfo={vc.metadataInfo as TextMetadata}
                userFormatInfo={userNumberFormatInfo}

                rowValidationInitiated={item.validationInitiatedByColumnChange}
                onValidate={(error) => onValidate(item.id, vc, error)}
                onCommit={(rawValue, formattedValue) => onCommit(item, vc, rawValue, formattedValue)}
                onEditingFinished={() => onEditingFinished(item.id, vc.name, gridCellRef)}

                onLookupClick={(e) => {
                  const lookup = isLookup ? getLookupRef(dataset.records[item.id], vc.name) : getLookupRefFromPrimary(dataset.records[item.id]);
                  if (lookup?.entityName && lookup?.id) {
                    void context.navigation.openForm({
                      entityName: lookup.entityName,
                      entityId: lookup.id,
                      openInNewWindow: false,
                    });
                  }
                }}

                ref={(inst) => {
                  cellHandle = inst;
                  if (cellHandle != null) {
                    item.validators.set(vc.name, cellHandle as ValidableHandle);
                    if (gridReloaded)
                      cellHandle.resetCellValidation();
                  }
                }}
              />
            ) : vc.simpleType === "text" ? (
              <TextCell
                rawValue={rawValue as string}
                formattedValue={formattedValue}
                isEditing={isEditing}

                textInfo={vc.metadataInfo as TextMetadata}
                userFormatInfo={userNumberFormatInfo}

                rowValidationInitiated={item.validationInitiatedByColumnChange}
                onValidate={(error) => onValidate(item.id, vc, error)}
                onCommit={(rawValue, formattedValue) => onCommit(item, vc, rawValue, formattedValue)}
                onEditingFinished={() => onEditingFinished(item.id, vc.name, gridCellRef)}

                ref={(inst) => {
                  cellHandle = inst;
                  if (cellHandle != null) {
                    item.validators.set(vc.name, cellHandle as ValidableHandle);
                    if (gridReloaded)
                      cellHandle.resetCellValidation();
                  }
                }}
              />
            ) : vc.simpleType === "boolean" ? (
              <BoolCell
                rawValue={boolToNumber(rawValue as boolean)}
                formattedValue={formattedValue}
                isEditing={isEditing}

                fieldInfo={vc.metadataInfo as FieldMetadata}
                valuesList={valuesList}

                rowValidationInitiated={item.validationInitiatedByColumnChange}
                onValidate={(error) => onValidate(item.id, vc, error)}
                onCommit={(rawValue, formattedValue) => onCommit(item, vc, rawValue, formattedValue)}
                onEditingFinished={() => onEditingFinished(item.id, vc.name, gridCellRef)}
                onOpenButtonClicked={() => startEditing(new KeyboardEvent("Enter"))}

                ref={(inst) => {
                  cellHandle = inst;
                  if (cellHandle != null) {
                    item.validators.set(vc.name, cellHandle as ValidableHandle);
                    if (gridReloaded)
                      cellHandle.resetCellValidation();
                  }
                }}
              />
            ) : vc.simpleType === "picklist" ? (
              <PicklistCell
                rawValue={rawValue as number}
                formattedValue={formattedValue}
                isEditing={isEditing}

                fieldInfo={vc.metadataInfo as FieldMetadata}
                valuesList={valuesList}

                rowValidationInitiated={item.validationInitiatedByColumnChange}
                onValidate={(error) => onValidate(item.id, vc, error)}
                onCommit={(rawValue, formattedValue) => onCommit(item, vc, rawValue, formattedValue)}
                onEditingFinished={() => onEditingFinished(item.id, vc.name, gridCellRef)}
                onOpenButtonClicked={() => startEditing(new KeyboardEvent("Enter"))}

                ref={(inst) => {
                  cellHandle = inst;
                  if (cellHandle != null) {
                    item.validators.set(vc.name, cellHandle as ValidableHandle);
                    if (gridReloaded)
                      cellHandle.resetCellValidation();
                  }
                }}
              />
            ) : vc.simpleType === "datetime" ? (
              <DateCell
                formatting={context.formatting}
                rawValue={rawValue as Date}
                formattedValue={formatDateD365(rawValue as Date, formatting, vc.metadataInfo as DateMetadata, userDateFormatInfo) ?? ""}
                isEditing={isEditing}

                metadataInfo={vc.metadataInfo as DateMetadata}
                userFormatInfo={userDateFormatInfo}

                rowValidationInitiated={item.validationInitiatedByColumnChange}
                onValidate={(error) => onValidate(item.id, vc, error)}
                onCommit={(rawValue, formattedValue) => onCommit(item, vc, rawValue, formattedValue)}
                onEditingFinished={() => onEditingFinished(item.id, vc.name, gridCellRef)}
                onOpenButtonClicked={() => startEditing(new KeyboardEvent("Enter"))}

                ref={(inst) => {
                  cellHandle = inst;
                  if (cellHandle != null) {
                    item.validators.set(vc.name, cellHandle as ValidableHandle);
                    if (gridReloaded)
                      cellHandle.resetCellValidation();
                  }
                }}
              />
            ) : (
              <NonEditCell
                formattedValue={formattedValue}
                isRightAlign={isRight}
                readonlyGrid={false}
              />
            );

          function startEditing(e: MouseEvent | KeyboardEvent) {
            e.stopPropagation();
            setEditingCell({ rowId: String(item.id), columnId: String(vc.name) });
            const overwrite = (e as KeyboardEvent).key != null ? isTypingKey(e as KeyboardEvent) : false;
            if (cellHandle?.startEditing != null)
              cellHandle.startEditing(overwrite);
          }


          const arrowMove = React.useRef(false);
          return <DataGridCell
            ref={gridCellRef}
            key={formattedValue}
            data-row-id={item.id}
            data-col-key={vc.name}
            onDoubleClick={(e) => {
              if (isReadOnlyGrid) {
                const lookup = getLookupRefFromPrimary(dataset.records[item.id]);
                if (lookup?.entityName && lookup?.id) {
                  void context.navigation.openForm({
                    entityName: lookup.entityName,
                    entityId: lookup.id,
                    openInNewWindow: false,
                  });
                }
              }
              else if (!isEditing && cellHandle != null)
                startEditing(e.nativeEvent);
            }}
            onClick={(e) => {
              if (!isEditing && cellHandle?.selectInnerText != null)
                cellHandle.selectInnerText();
            }}
            onFocus={(e) => {
              if (arrowMove.current)
                return;

              if (cellHandle?.selectInnerText != null)
                cellHandle.selectInnerText();
            }}
            onKeyDown={(e) => {
              if (editingCell == null) {
                if (e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  addOrRemoveRowFromSelection(item.id);
                }
                else if (e.key === "Enter" || e.key === "F2" || isTypingKey(e.nativeEvent))
                  startEditing(e.nativeEvent);
                else if (["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(e.key)) {
                  if (arrowMove.current) {
                    arrowMove.current = false;
                    return;
                  }

                  arrowMove.current = true;
                  e.currentTarget.focus();
                  e.currentTarget.dispatchEvent?.(new KeyboardEvent('keydown', { key: e.key }));
                }
              }
            }}
            onBlur={(e) => {
              const next = (e.relatedTarget as Element | null);
              if (next != null && e.currentTarget.contains(next))
                return;

              const isCellCalendarControl = next?.closest(".dmx-pcf-datecell-calendar") != null;
              if (isCellCalendarControl)
                return;

              if (isEditing) {
                setEditingCell(null);

                if (cellHandle?.endEditing != null)
                  cellHandle.endEditing();
              }

              if (cellHandle?.unselectInnerText != null)
                cellHandle.unselectInnerText();
            }}>
            <TableCellLayout
              truncate
              className={`pcf-editable-cell${!isReadOnlyGrid && !isReadOnlyField && isSameCell({ rowId: item.id, columnId: vc.name }, editingCell) ? " pcf-inline-editing-cell" : ""}`}
              style={isRight ? { justifyContent: "flex-end", textAlign: "right" } : undefined}
            >
              <span className="pcf-copy" data-copy={formattedValue} style={{ height: "100%", width: "100%" }}>
                {content}
              </span>
            </TableCellLayout>
          </DataGridCell>;
        },
      });
    }))();//, [metaLoaded, columnInfoKey, editingCell, dataset?.sortedRecordIds, validationErrors]);

    const statusCol = createTableColumn<Row>({
      columnId: STATUS_COL_ID,
      renderHeaderCell: () =>
        <DataGridHeaderCell
          className="pcf-grid-status-header pcf-col-no-resize"
          data-row-id={HEADER_ROW_ID}
          data-col-key={STATUS_COL_ID}
          tabIndex={-1}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onKeyDown={(e: React.KeyboardEvent) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onDoubleClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <div className="pcf-grid-status-bg" />
          <TableCellLayout
            truncate
            style={{
              justifyContent: "center",
              textAlign: "center",
              height: "100%"
            }}>
            <div className="pcf-grid-status-content" />
          </TableCellLayout>
        </DataGridHeaderCell>,
      compare: () => 0,
      renderCell: item => {
        const rowId = item.id;
        const hasValidationError = validationErrors.has(rowId);
        const status = rowStatuses[rowId]?.status ?? "idle";

        let icon: React.ReactNode = null;

        if (hasValidationError) {
          icon = (
            <ErrorCircle16Regular
              color="rgb(209, 52, 56)"
            />
          );
        } else {
          switch (status) {
            case "saving":
              icon = <Spinner size="extra-tiny" />;
              break;
            case "success":
              icon = (
                <CheckmarkCircle16Regular
                  color="#107C10"
                />
              );
              break;
            case "error":
              icon = (
                <ErrorCircle16Regular
                  color="rgb(209, 52, 56)"
                />
              );
              break;
            case "idle":
            default:
              icon = null;
          }
        }

        return (
          <DataGridCell
            className="pcf-grid-status-cell"
            data-row-id={rowId}
            data-col-key={STATUS_COL_ID}
            tabIndex={-1}
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onKeyDown={e => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onDoubleClick={e => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <div className="pcf-grid-status-bg" />
            <TableCellLayout
              style={{
                justifyContent: "center",
                textAlign: "center",
                height: "100%"
              }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  lineHeight: 0,
                }}
              >
                <div className="pcf-grid-status-content">
                  {icon}
                </div>
              </div>
            </TableCellLayout>
          </DataGridCell>
        );
      }
    });

    const selectionCol = makerSettings.allowRowSelection ?
      React.useMemo(() => {
        const totalRows = dataset.sortedRecordIds.length;
        const selectedCount = selectedItems?.size ?? 0;

        const headerChecked: boolean | "mixed" =
          selectedCount === 0
            ? false
            : selectedCount === totalRows
              ? true
              : "mixed";

        return createTableColumn<Row>({
          columnId: SELECTION_COL_ID,
          renderHeaderCell: () => (
            <DataGridHeaderCell
              className="pcf-grid-selection-header pcf-col-no-resize"
              data-row-id={HEADER_ROW_ID}
              data-col-key={SELECTION_COL_ID}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();

                const someRowsAreSelected = (selectedItems.size ?? 0) > 0;
                if (someRowsAreSelected)
                  clearRowsSelection();
                else
                  setIsSelectingAllRows(true);
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();

                  const someRowsAreSelected = (selectedItems.size ?? 0) > 0;
                  if (someRowsAreSelected)
                    clearRowsSelection();
                  else
                    setIsSelectingAllRows(true);
                }
              }}
              onDoubleClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <TableCellLayout
                truncate
                style={{
                  justifyContent: "center",
                  textAlign: "center",
                  height: "100%"
                }}>
                <Checkbox
                  type="checkbox"
                  aria-label="Select all rows"
                  aria-selected={headerChecked === true}
                  checked={headerChecked}
                  tabIndex={-1}
                />
              </TableCellLayout>
            </DataGridHeaderCell>
          ),
          compare: () => 0,
          renderCell: item => {
            const isSelected = selectedItems.has(item.id);

            return (
              <DataGridCell
                className="pcf-grid-selection-cell"
                data-row-id={item.id}
                data-col-key={SELECTION_COL_ID}
                onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();

                  addOrRemoveRowFromSelection(item.id);
                }}
                onKeyDown={e => {
                  if (e.key === " " || e.key === "Enter") {
                    e.stopPropagation();
                    e.preventDefault();

                    addOrRemoveRowFromSelection(item.id);
                  }
                }}
                onDoubleClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <TableCellLayout
                  truncate
                  style={{
                    justifyContent: "center",
                    textAlign: "center",
                    height: "100%"
                  }}>
                  <Checkbox
                    type="checkbox"
                    aria-label="Select row"
                    aria-selected={isSelected}
                    checked={isSelected}
                    tabIndex={-1}
                  />
                </TableCellLayout>
              </DataGridCell>
            );
          },
        });
      }, [metaLoaded, dataset?.sortedRecordIds, selectedItems]) : null;

    const openRecordCol = makerSettings.showOpenRecordColumn ?
      React.useMemo(() => {
        return createTableColumn<Row>({
          columnId: GO_TO_RECORD_COL_ID,
          renderHeaderCell: () => (
            <DataGridHeaderCell
              className="pcf-grid-open-header pcf-col-no-resize"
            >
              <TableCellLayout
                truncate
                style={{
                  justifyContent: "center",
                  textAlign: "center",
                  height: "100%"
                }}>
                <OpenRegular />
              </TableCellLayout>
            </DataGridHeaderCell>
          ),
          compare: () => 0,
          renderCell: item => {
            const id = item.id?.replace(/[{}]/g, "");
            const entityName = gridEntityName;

            const canOpen = Boolean(id && entityName);

            return (
              <DataGridCell
                className="pcf-grid-open-cell"
                onKeyDown={e => {
                  if (e.key === " ") {
                    e.stopPropagation();
                    e.preventDefault();

                    addOrRemoveRowFromSelection(item.id);
                  }

                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();

                    void context.navigation.openForm({
                      entityName: entityName,
                      entityId: id,
                      openInNewWindow: false,
                    });
                  }
                }}>
                <TableCellLayout
                  truncate
                  style={{
                    justifyContent: "center",
                    textAlign: "center",
                    height: "100%"
                  }}>
                  <button
                    type="button"
                    className="pcf-open-btn"
                    tabIndex={-1}
                    aria-label="Open record"
                    disabled={!canOpen}
                    onClick={e => {
                      e.preventDefault();

                      if (!canOpen)
                        return;

                      void context.navigation.openForm({
                        entityName: entityName,
                        entityId: id,
                        openInNewWindow: false,
                      });
                    }}
                  >
                    <OpenRegular />
                  </button>
                </TableCellLayout>
              </DataGridCell >
            );
          },
        });
      }, [metaLoaded, dataset?.sortedRecordIds]) : null;


    return [
      statusCol,
      ...(selectionCol ? [selectionCol] : []),
      ...cols,
      ...(openRecordCol ? [openRecordCol] : [])
    ];
  })();

  // Records -> grid items
  const items: Row[] = React.useMemo(() => {
    const ids = dataset.sortedRecordIds ?? [];
    const recs = dataset.records;

    const currencySymbolFieldName = `${CURRENCY_SYMBOL_ALIAS}.${CURRENCY_SYMBOL_FIELD}`;
    return ids.map(id => {
      const rec = recs[id];
      const formattedValues: Record<string, string> = {};
      const rawValues: Record<string, RawValue> = {};
      const originalValues: Record<string, RawValue> = {};

      for (const c of visibleInfoColumns) {
        const raw = extractRawValue(rec?.getValue?.(c.name), c.simpleType);
        const formatted = rec?.getFormattedValue?.(c.name);

        formattedValues[c.name] = formatted ?? "";
        rawValues[c.name] = raw;
        originalValues[c.name] = rawValues[c.name];
      }

      const currencySymbol = rec?.getFormattedValue?.(currencySymbolFieldName) ?? rec?.getValue?.(currencySymbolFieldName) ?? "";
      return { id, formattedValues, rawValues, originalValues, currencySymbol, validationInitiatedByColumnChange: false, validators: new Map() };
    });
  }, [dataset?.sortedRecordIds, visibleColumnsNamesKey]);

  const viewId = dataset.getViewId();
  React.useEffect(() => {
    setUserChangedColumnsSize(false);
  }, [viewId]);

  const gridContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [userChangedColumnsSize, setUserChangedColumnsSize] = React.useState(false);
  const [savedSizingOptions, saveSizingOptions] = React.useState<TableColumnSizingOptions>({});

  // Build sizing options
  const sizingOptions = React.useMemo(() => {
    if (userChangedColumnsSize && savedSizingOptions)
      return savedSizingOptions;

    return ColumnResizeController.computeProportionalSizing({
      columns: visibleColumns,
      allocatedWidth: allocatedWidth,
      gridRightPaddingPx: GRID_RIGHT_PADDING,
      statusColumnSize: STATUS_COL_PX,
      selectionColumnSize: makerSettings.allowRowSelection ? CHECKBOX_COL_PX : 0,
      gotoRecordColumnSize: makerSettings.showOpenRecordColumn ? GOTO_COL_PX : 0,
      scrollbarSize: SCROLLBAR_SIZE,
      minWidthPx: COLUMN_MIN_WIDTH
    });
  }, [
    userChangedColumnsSize,
    savedSizingOptions,
    visibleColumns,
    allocatedWidth
  ]);

  const savedKeyRef = React.useRef<string>(ColumnResizeController.buildSizeKey(savedSizingOptions));
  const gridKey = React.useMemo(() => ColumnResizeController.buildSizeKey(sizingOptions), [sizingOptions]);

  React.useEffect(() => {
    if (userChangedColumnsSize) return;

    if (savedKeyRef.current !== gridKey) {
      saveSizingOptions(sizingOptions);
      savedKeyRef.current = gridKey;
    }
  }, [gridKey, userChangedColumnsSize]);

  const isFetchingRef = React.useRef(false);
  const tryLoadNextPage = React.useCallback(() => {
    const paging = dataset?.paging;
    if (!paging)
      return;

    if (isFetchingRef.current)
      return;

    if (!paging.hasNextPage)
      return;

    isFetchingRef.current = true;
    try {
      paging.loadNextPage(); // PCF DataSet will cause updateView afterwards
    } finally {
      // small delay prevents immediate re-trigger before view updates
      window.setTimeout(() => {
        isFetchingRef.current = false;
      }, 120);
    }
  }, [dataset]);

  React.useEffect(() => {
    if (dataset.paging.hasNextPage && dataset.sortedRecordIds.length < dataset.paging.pageSize * 5)
      tryLoadNextPage();
  }, [dataset.sortedRecordIds, dataset.paging.hasNextPage, dataset.paging.pageSize, tryLoadNextPage]);

  const {
    onBodyScroll,
    onFlyScroll,
    vbarRef,
    vbarInnerRef,
    isHBarVisible,
    isVBarVisible,
    gridBodyHeight,
    scrollTop
  } = gridScrollbars({
    gridContainerRef,
    GRID_BODY_ID,
    GRID_HEADER_ID,
    sortedRecordIdsLength: dataset?.sortedRecordIds?.length ?? 0,
    pageSize: pageSizeLimit ?? 0,
    gridKey,
    tryLoadNextPage,
    isFetchingRef
  });

  const [isSelectingAllRows, setIsSelectingAllRows] = React.useState(false);
  React.useEffect(() => {
    if (!isSelectingAllRows)
      return;

    if (dataset.paging.hasNextPage) {
      if (dataset.paging.pageSize !== 5000)
        dataset.paging.setPageSize(5000);
      tryLoadNextPage();
      return;
    }

    if (dataset.paging.pageSize !== pageSizeLimit)
      dataset.paging.setPageSize(pageSizeLimit);

    setRowsSelection(dataset.sortedRecordIds);
    setIsSelectingAllRows(false);

    const cell = gridContainerRef.current?.
      querySelector(`[data-row-id="${HEADER_ROW_ID}"][data-col-key="${SELECTION_COL_ID}"]`) as HTMLElement | null;;
    if (cell != null) {
      cell.scrollIntoView({ behavior: "smooth", block: "center" });
      requestAnimationFrame(() => cell.focus());
    }
  }, [isSelectingAllRows, dataset.paging, pageSizeLimit, tryLoadNextPage, dataset.sortedRecordIds]);

  React.useEffect(() => {
    dataset.setSelectedRecordIds(Array.from(selectedItems ?? []));
  }, [selectedItems]);

  const addOrRemoveRowFromSelection = (rowId: string) => {
    if (!makerSettings.allowRowSelection)
      return;

    setSelectedItems(prev => {
      const next = Array.from(prev);
      const idx = next.indexOf(rowId);
      if (idx > -1)
        next.splice(idx, 1);
      else
        next.push(rowId);

      return new Set(next);
    });
  };

  const setOnlyRowToSelection = (rowId: string) => {
    if (!makerSettings.allowRowSelection)
      return;

    setSelectedItems(new Set([rowId]));
  };

  const setRowsSelection = (rows: string[]) => {
    if (!makerSettings.allowRowSelection)
      return;

    setSelectedItems(new Set(rows ?? []));
  }

  const clearRowsSelection = () => {
    if (!makerSettings.allowRowSelection)
      return;

    setSelectedItems(new Set());
  }

  const rowCount = dataset?.paging?.totalResultCount ?? 0;
  const selectedCount = selectedItems?.size ?? 0;

  const totalErrors =
    Array.from(validationErrors.values())
      .reduce((sum, inner) => sum + inner.size, 0);

  React.useLayoutEffect(() => {
    const container = gridContainerRef.current;
    if (!container)
      return;

    const bodyEl: HTMLElement | null = container.querySelector(`[id="${GRID_BODY_ID}"]`);
    const fly = vbarRef.current;
    if (!bodyEl || !fly)
      return;

    bodyEl.scrollTop = fly.scrollTop;
  }, [gridKey]);

  return (
    <>
      {
        isSelectingAllRows && <SelectingAllPopup
          onCancel={() => {
            setIsSelectingAllRows(false);
          }}
        />
      }
      <div
        className="dmx-pcf"
        style={{
          height: "100%",
          width: (allocatedWidth ?? 0) > 0 ? `${allocatedWidth}px` : "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {
          (totalErrors ?? 0) > 0 &&
          (totalErrors === 1 ?
            <div className="errorBanner">
              {
                Array.from(validationErrors).map(([rowId, rowErrors]) => {
                  return (
                    Array.from(rowErrors).map(([columnId, errorDetails]) => {
                      return (
                        <div
                          key={`${rowId}|${columnId}`}
                          style={{
                            display: "inline-flex",
                            width: "100%",
                            height: "32px",
                            minHeight: "32px",
                            alignItems: "center"
                          }}>
                          <DismissCircle20Regular
                            color="rgb(168, 0, 0)"
                            style={{
                              padding: "4px 0 4px 10px",
                              minWidth: "20px",
                              width: "20px"
                            }}
                          />
                          <span>
                            <b>{errorDetails.columnInfo.displayName}:</b> {errorDetails.error}. <span
                              role="button"
                              style={{ textDecoration: "underline", cursor: "pointer", padding: 0 }}
                              onClick={() => {
                                const cell = document.querySelector<HTMLElement>(
                                  `[data-row-id="${rowId}"][data-col-key="${columnId}"]`
                                );
                                if (cell) {
                                  cell.scrollIntoView({ behavior: "smooth", block: "center" });
                                  requestAnimationFrame(() => cell.focus());
                                }
                              }}>Fix.</span>
                          </span>
                        </div>
                      )
                    })
                  )
                })
              }
            </div>
            :
            <Dropdown
              className="errorBanner"
              button={
                <div style={{
                  display: "inline-flex",
                  width: "100%",
                  alignItems: "center"
                }}>
                  <DismissCircle20Regular
                    color="rgb(168, 0, 0)"
                    style={{
                      padding: "4px 0 4px 10px",
                      minWidth: "20px",
                      width: "20px"
                    }}
                  />
                  <span>
                    {`Number of errors on this page: ${totalErrors}. Select to view.`}
                  </span>
                </div>
              }
            >
              <OptionGroup
                className="dmx-pcf-errorBanner-options"
              >
                {
                  Array.from(validationErrors).map(([rowId, rowErrors]) => {
                    return (
                      Array.from(rowErrors).map(([columnId, errorDetails]) => {
                        return (
                          <Option
                            key={`${rowId}|${columnId}`}
                            value={`${rowId}|${columnId}`}
                            text={`${rowId}|${columnId}`}
                            checkIcon={null}
                          >
                            <div
                              key={`${rowId}|${columnId}`}
                              role="button"
                              style={{
                                display: "inline-flex",
                                width: "100%",
                                height: "32px",
                                minHeight: "32px",
                                alignItems: "center"
                              }}
                              onClick={() => {
                                const cell = document.querySelector<HTMLElement>(
                                  `[data-row-id="${rowId}"][data-col-key="${columnId}"]`
                                );
                                if (cell) {
                                  cell.scrollIntoView({ behavior: "smooth", block: "center" });
                                  requestAnimationFrame(() => cell.focus());
                                }
                              }}>
                              <ErrorCircle20Regular
                                color="rgb(168, 0, 0)"
                                style={{
                                  padding: "4px 0",
                                  minWidth: "20px",
                                  width: "20px"
                                }}
                              />
                              <span>
                                <b>{errorDetails.columnInfo.displayName}:</b> {errorDetails.error}. <span style={{ textDecoration: "underline", padding: 0 }}>Fix.</span>
                              </span>
                            </div>
                          </Option>
                        )
                      })
                    )
                  })
                }
              </OptionGroup>
            </Dropdown>
          )
        }
        <div
          className="pcf-grid-wrapper"
          style={{
            position: "relative",
            height: "100%",
            width: `calc(100% - ${GRID_RIGHT_PADDING}px)`,
            paddingLeft: "0",
            paddingRight: `${GRID_RIGHT_PADDING}px`,
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            className="pcf-grid-content-container"
            ref={gridContainerRef}
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflowX: "auto",
              boxShadow: "inset 0 -1px 0 #edebe9"
            }}
          >
            <DataGrid
              className="pcf-grid"
              key={gridKey}
              style={{
                width: "fit-content",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                height: "100%"
              }}
              items={items}
              columns={columns}
              getRowId={(r: Row) => r.id}
              sortable={false}
              selectionMode={undefined}
              selectedItems={selectedItems}
              resizableColumns={true}
              columnSizingOptions={sizingOptions}
              resizableColumnsOptions={{ autoFitColumns: false }}
              onColumnResize={(e, data) => {
                if (data?.columnId == null)
                  return;

                if ([STATUS_COL_ID, SELECTION_COL_ID, GO_TO_RECORD_COL_ID].includes(String(data.columnId)))
                  return;

                if (data.width < COLUMN_MIN_WIDTH)
                  data.width = COLUMN_MIN_WIDTH;

                const id = String(data.columnId);
                const changedColumnOption = savedSizingOptions[id];
                const sizingOptions: TableColumnSizingOptions = {
                  ...savedSizingOptions,
                  [id]: { ...changedColumnOption, defaultWidth: data.width },
                };
                saveSizingOptions(sizingOptions);
                if (!userChangedColumnsSize)
                  setUserChangedColumnsSize(true);
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
                  e.preventDefault();

                  const target = e.target as HTMLElement;
                  const cell: HTMLElement | null = target.closest('[role="gridcell"]');
                  const mark = cell?.querySelector('.pcf-copy') as HTMLElement | null;
                  const text = mark?.getAttribute('data-copy') ?? mark?.textContent ?? '';
                  if (text)
                    void navigator.clipboard.writeText(text);
                }
              }}
            >
              <DataGridHeader
                id={GRID_HEADER_ID}
                style={{
                  flex: "0 0 auto",
                  overflow: "hidden"
                }}>
                <DataGridRow>
                  {({ renderHeaderCell, columnId }) => renderHeaderCell()}
                </DataGridRow>
              </DataGridHeader>

              {(items?.length ?? 0) > 0 ?
                <DataGridBody
                  key={savedKeyRef.current}
                  id={GRID_BODY_ID}
                  style={{
                    minHeight: `${!isMainGrid && (gridBodyHeight ?? 0) > 0 ? BODY_MIN_HEIGHT + (isHBarVisible ? 0 : SCROLLBAR_SIZE) : 0}px`,
                    height: !isMainGrid && (gridBodyHeight ?? 0) > 0 ? `${gridBodyHeight! + (isHBarVisible ? 0 : SCROLLBAR_SIZE)}px` : "100%",
                    flex: "1 1 auto",
                    overflowY: "auto",
                    scrollbarWidth: "none"
                  }}
                  onScroll={onBodyScroll}
                >
                  {({ item, rowId }) => {
                    const isSelected = selectedItems.has(String(rowId));
                    return <DataGridRow
                      aria-selected={isSelected}
                      key={rowId as React.Key}
                      onClick={(e: React.PointerEvent<HTMLDivElement>) => {
                        setOnlyRowToSelection(String(rowId));
                      }}
                      onDoubleClick={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.preventDefault();

                        if (isEditableGrid)
                          return;

                        const entityName = gridEntityName;
                        const id = String(rowId).replace(/[{}]/g, "");
                        if (entityName && id) {
                          void context.navigation.openForm({
                            entityName,
                            entityId: id,
                            openInNewWindow: false,
                          });
                        }
                      }}
                    >
                      {({ renderCell }) => renderCell(item)}
                    </DataGridRow>
                  }}
                </DataGridBody>
                :
                <div
                  style={{
                    height: isMainGrid ? "100%" : `${BODY_MIN_HEIGHT + (isHBarVisible ? 0 : SCROLLBAR_SIZE)}px`,
                    width: (gridContainerRef.current?.clientWidth ?? 0) > 0 ? `${gridContainerRef.current!.clientWidth}px` : "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center"
                  }}
                >
                  <div
                    style={{
                      flex: "0 0 auto",
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "50%",
                      background: "#BFBFBF",
                      width: isMainGrid ? "200px" : "100px",
                      height: isMainGrid ? "200px" : "100px",
                    }}
                  >
                    {isMainGrid ? (
                      <TableSparkle24Filled
                        preserveAspectRatio="none"
                        style={{ color: "white", width: "85%", height: "70%", display: "block" }} />
                    ) : (
                      <Table48Filled
                        preserveAspectRatio="none"
                        style={{ color: "white", width: "85%", height: "70%", display: "block" }} />
                    )}
                  </div>

                  <div
                    style={{
                      flex: "0 0 auto",
                      color: "rgb(36, 36, 36)",
                      paddingTop: 4,
                    }}
                  >
                    We didn&apos;t find anything to show here
                  </div>
                </div>
              }
            </DataGrid>

            <div
              id={"flyoutSliderOuter"}
              ref={vbarRef}
              onScroll={onFlyScroll}
              style={{
                visibility: isVBarVisible ? "visible" : "hidden",
                scrollbarGutter: "stable both-edges",
                position: "absolute",
                right: `${GRID_RIGHT_PADDING}px`,
                top: 0,       // will be set in useEffect
                bottom: `${(isHBarVisible ? SCROLLBAR_SIZE : 0) + 1}px`,
                width: `${SCROLLBAR_SIZE}px`,
                overflowY: "auto",
                overflowX: "hidden",
                pointerEvents: "auto",
                background: "rgb(255, 255, 255)",
                zIndex: "100"
              }}>
              <div
                id={"flyoutSliderInner"}
                ref={vbarInnerRef}
                style={{
                  width: `${SCROLLBAR_SIZE}px`
                }} />
            </div>

          </div>
        </div>
        <div
          className="pcf-grid-footer"
          role="status"
          aria-live="polite"
        >
          <span>Rows: {rowCount}</span>
          {
            selectedCount > 0 &&
            <span>Selected: {selectedCount}</span>
          }
        </div>
      </div>
    </>
  );
};
