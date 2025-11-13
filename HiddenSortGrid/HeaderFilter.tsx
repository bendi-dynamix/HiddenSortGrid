import * as React from "react";
import {
  Popover, PopoverTrigger, PopoverSurface, Button, Input, Label, Option,
  Field,
  Dropdown,
  TagPickerProps,
  SelectionEvents,
  OptionOnSelectData
} from "@fluentui/react-components";
import { Dismiss20Regular } from "@fluentui/react-icons";

import { getFilterOptionsByType, ColumnInfo } from "./Helper";
import { getOptionsetValues, getPrimaryInfoFromMetadata, LookupMetadata } from "./MetadataHelper";
import { OperatorMeta } from "./FilterOperatorsMatrix";
import { FilterModel } from "./FilterExpressionHelper";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import { LookupValue, LookupPicker } from "./UI/LookupPicker";
import { IInputs } from "./generated/ManifestTypes";
import { UserDateFormatInfo } from "./HiddenSortGridComponent";
import { toNumberType } from "./TypesHelper";
import { parseDate } from "./HelperDateTime";

export interface HeaderFilterHandle {
  openAt: (anchorEl: HTMLElement) => void;
  close: () => void;
}

export const HeaderFilter = React.forwardRef<HeaderFilterHandle, {
  onApply: (filterModel: FilterModel) => void;
  context: ComponentFramework.Context<IInputs>;
  columnInfo: ColumnInfo;
  dateUserFormatInfo: UserDateFormatInfo;
  gridEntityName: string;
  extractedGridFilters: React.MutableRefObject<string | null>
}>(function HeaderFilter({ onApply, context, columnInfo, dateUserFormatInfo, gridEntityName, extractedGridFilters }, ref) {
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const [op, setOp] = React.useState<OperatorMeta | null>(null);
  const [val, setVal] = React.useState<string[]>([]);

  React.useImperativeHandle(ref, () => ({
    openAt: (el) => {
      if (!columnInfo.filterModel) {
        setOp(optionsList[0]);
        setVal([]);

        setLookupSelectedOptions([]);
        setLookupSuggestedOptions([]);
        setLookupInputText("");
      }
      else {
        setOp(optionsMap.get(columnInfo.filterModel.operator.sdkName) ?? null);
        setVal(columnInfo.filterModel.values);

        const lookupPickerVisible = columnInfo.filterModel.operator.inputType === "dropdown" && simpleType === "lookup";
        if (lookupPickerVisible) {
          setLookupSelectedOptions(
            columnInfo.filterModel.values
              .filter(id => lookupItemsCacheRef?.current.has(id))
              .map(id => lookupItemsCacheRef.current.get(id)!));
          setLookupSuggestedOptions([]);
          setLookupInputText("");
        }
      }

      setAnchorEl(el);
      setOpen(true);
    },
    close: () => setOpen(false)
  }));

  const canClear = (val?.[0] ?? "") !== "";
  const apply = () => {
    onApply?.({ "column": columnInfo, "operator": op!, "values": val });
    setOpen(false);
  };

  const clear = () => {
    setVal([]);

    setLookupSelectedOptions([]);
    setLookupSuggestedOptions([]);
    setLookupInputText("");
  };

  const onOperatorOptionSelect = (event: SelectionEvents, data: OptionOnSelectData) => {
    const newOption = getOption(data.optionValue);
    if (op?.inputType !== newOption?.inputType) {
      setVal([]);

      setLookupSelectedOptions([]);
      setLookupSuggestedOptions([]);
      setLookupInputText("");
    }
    setOp(newOption);
  }

  const simpleType = columnInfo.simpleType;
  const numberType = toNumberType(columnInfo.dataType);
  const optionsList = React.useMemo(() => getFilterOptionsByType(simpleType), [simpleType]);
  const optionsMap = React.useMemo(() => new Map(optionsList.map(o => [o.sdkName, o] as const)), [simpleType]);

  const valuesList = getOptionsetValues(columnInfo.entityName, columnInfo.logicalName);
  const valuesMap = new Map(valuesList?.map(o => [o.value, o] as const));

  function getOption(sdkName: string | undefined): OperatorMeta | null {
    if (!sdkName)
      return null;

    return optionsMap.get(sdkName) ?? null;
  }

  const [error, setError] = React.useState<string | undefined>(undefined);

  function validate() {
    if (op?.inputType === "number") {
      if ((val?.length ?? 0) === 0 || val[0] === "")
        return undefined;

      if (val[0].trim() === "")
        return "Please enter value";

      if (isNaN(Number(val[0].trim())))
        return "Value must be a valid number";

      if (numberType === "wholeNumber")
        return /^-?\d+$/.test(val[0].trim()) ? undefined : "Value must be a valid whole number";

      return undefined;
    }

    return undefined;
  }

  React.useEffect(() => {
    setError(validate());
  }, [op, val]);

  /* LookupPicker */
  const lookupItemsCacheRef = React.useRef<Map<string, LookupValue>>(new Map());
  const [lookupSuggestedOptions, setLookupSuggestedOptions] = React.useState<LookupValue[]>([]);
  const [lookupSelectedOptions, setLookupSelectedOptions] = React.useState<LookupValue[]>([]);
  const [lookupInputText, setLookupInputText] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const onLookupOptionSelect: TagPickerProps["onOptionSelect"] = (e, data) => {
    const value = data.value;

    const selectedOption = lookupSelectedOptions.find(lookupValue => lookupValue.id === value);
    const newSelectedOptions = selectedOption ?
      [...lookupSelectedOptions].filter(lookupValue => lookupValue.id !== value) :
      lookupItemsCacheRef.current?.has(value) ?
        [...lookupSelectedOptions, lookupItemsCacheRef.current.get(value)!] :
        null;

    if (newSelectedOptions) {
      setLookupSelectedOptions(newSelectedOptions);
      setVal(newSelectedOptions.map(lookupValue => lookupValue.id));
    }

    setLookupInputText("");
    setLookupSuggestedOptions([]);
  };

  const getLookupSuggestions = async (q: string): Promise<LookupValue[]> => {
    const s = q.replace(/'/g, "''");
    try {
      const linkEntities = (columnInfo.metadataInfo as LookupMetadata)?.linkEntities ?? [];
      if (linkEntities.length === 0 || !extractedGridFilters.current || !gridEntityName)
        return [];

      let results: LookupValue[] = [];

      for (const linkEntity of linkEntities) {
        const primaryInfo = await getPrimaryInfoFromMetadata(context, linkEntity.entityName);
        if (!primaryInfo)
          continue;

        const fetchXml = [
          '<fetch distinct="true" top="10" no-lock="true">',
          ` <entity name="${linkEntity.entityName}">`,
          `   <attribute name="${primaryInfo.idAttr}" />`,
          `   <attribute name="${primaryInfo.nameAttr}" />`,
          `   <order attribute="${primaryInfo.nameAttr}" />`,
          "   <filter>",
          `     <condition attribute="${primaryInfo.nameAttr}" operator="like" value="%${s}%"/>`,
          "   </filter>",
          `   <link-entity name="${columnInfo.entityName}" from="${linkEntity.to}" to="${linkEntity.from}" link-type="inner">`,
          extractedGridFilters.current,
          "   </link-entity>",
          " </entity>",
          "</fetch>"
        ].join("");

        const result = await context.webAPI.retrieveMultipleRecords(linkEntity.entityName, `?fetchXml=${encodeURIComponent(fetchXml)}`);
        results = results.concat(
          result.entities.map((e) => ({
            id: String(e[primaryInfo.idAttr] ?? ""),
            name: String(e[primaryInfo.nameAttr] ?? ""),
            entity: linkEntity.entityName,
          })));
      }

      const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
      return results
        .sort((a, b) =>
          collator.compare(
            String(a.name ?? ""),
            String(b.name ?? "")
          )
        )
        .slice(0, 10);
    }
    catch (error) {
      console.error(error);
      return [];
    }
  };

  const onLookupInputChange = React.useCallback(async (value: string) => {
    setLookupInputText(value);
    if (value == null || value.trim() === "") {
      setLookupSuggestedOptions([]);
      return;
    }

    try {
      setIsLoading(true);
      const suggestions = await getLookupSuggestions(value);

      const notSelectedSuggestions =
        suggestions?.filter(lookupValueF => lookupValueF != null && !lookupSelectedOptions.some(lookupValueS => lookupValueS.id === lookupValueF.id)) ?? [];

      for (const suggestion of notSelectedSuggestions)
        lookupItemsCacheRef.current.set(suggestion.id, suggestion);
      setLookupSuggestedOptions(notSelectedSuggestions);
    }
    catch (error) {
      console.error(error);
    }
    finally {
      setIsLoading(false);
    }
  }, [lookupSelectedOptions, getLookupSuggestions]);

  return (
    <Popover
      open={open}
      onOpenChange={(_, d) => setOpen(!!d.open)}
      positioning={{ position: "below", align: "start", target: anchorEl ?? undefined }}
      closeOnScroll={true}
    >
      <PopoverTrigger disableButtonEnhancement>
        <span style={{ display: "none" }} />
      </PopoverTrigger>

      <PopoverSurface
        className="dmx-pcf-filter-popover-control"
        onClick={(e: React.MouseEvent) => {
          // don't let the click cascade to Menu
          e.stopPropagation();
        }}
        onKeyDown={(e: React.KeyboardEvent) => {
          // don't let the key cascade to Menu
          e.stopPropagation();
        }}
        onKeyUp={(e: React.KeyboardEvent) => {
          // don't let the key cascade to Menu
          e.stopPropagation();
        }}>
        <div className="popover-header">
          <Label size="large" weight="semibold">Filter by</Label>
          <Button appearance="subtle" icon={<Dismiss20Regular />} onClick={() => setOpen(false)} />
        </div>

        <div className="popover-body">
          <Dropdown
            className="dmx-pcf-filter-oobFocusControl"
            value={op?.displayName}
            onOptionSelect={onOperatorOptionSelect}
            aria-label="Filter operator"
          >
            {[...optionsList].map(o => (
              <Option
                key={String(o.sdkValue)}
                value={o.sdkName}>
                {o.displayName}
              </Option>
            ))}
          </Dropdown>

          <Field
            validationState={error ? "error" : "none"}
            validationMessage={error}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            {
              op?.inputType === "dropdown" && simpleType === "lookup" ?
                <LookupPicker
                  onOptionSelect={onLookupOptionSelect}
                  onInputChange={onLookupInputChange}
                  suggestedOptions={lookupSuggestedOptions}
                  selectedOptions={lookupSelectedOptions}
                  inputValue={lookupInputText}
                  isLoading={isLoading}
                  allowMultiple={true}
                /> :
                op?.inputType === "dropdown" ?
                  <Dropdown
                    className="dmx-pcf-filter-oobFocusControl"
                    multiselect={true}
                    value={val?.map(value => valuesMap.get(Number(value))?.text).join(", ")}
                    selectedOptions={val}
                    onOptionSelect={(_, data) => {
                      setVal(data.selectedOptions);
                    }}
                    aria-label="Filter optionset value"
                  >
                    {[...valuesList ?? []].map(o => (
                      <Option
                        key={String(o.value)}
                        value={String(o.value)}>
                        {o.text}
                      </Option>
                    ))}
                  </Dropdown> :
                  op?.inputType === "date" ?
                    <DatePicker
                      className="dmx-pcf-filter-oobFocusControl"
                      calendar={{ className: "dmx-pcf-filter-calendar-control" }}
                      value={parseDate(val[0], dateUserFormatInfo) ?? null}
                      onSelectDate={date => {
                        setVal([date != null ? context.formatting.formatDateShort(date) : ""]);
                      }}
                      formatDate={date => {
                        return date != null ? context.formatting.formatDateShort(date) : "";
                      }}
                      firstDayOfWeek={dateUserFormatInfo.firstDayOfWeek}
                      aria-label="Filter date value" />
                    :
                    (op?.inputType ?? "none") !== "none" && <Input
                      className="dmx-pcf-filter-oobFocusControl"
                      value={val[0] ?? ""}
                      onChange={(_, d) => setVal([d.value])}
                      aria-label="Filter text value"
                    />
            }
          </Field>

          <div className="popover-buttons-container">
            <Button appearance="primary" className="popover-button" onClick={apply} disabled={((val?.[0]?.trim() ?? "") === "" && op?.inputType !== "none") || !!error}>
              Apply
            </Button>
            <Button appearance="secondary" className="popover-button" onClick={clear} disabled={!canClear}>
              Clear
            </Button>
          </div>
        </div>
      </PopoverSurface>
    </Popover>
  );
});