import * as React from "react";
import { Menu, MenuTrigger, MenuPopover, MenuList, MenuItem } from "@fluentui/react-components";
import { ArrowSortUp16Regular, ArrowSortDown16Regular, ArrowSortUp20Regular, ArrowSortDown20Regular, Filter20Regular, FilterDismiss20Regular, ChevronDown12Regular, Filter16Filled } from "@fluentui/react-icons";
import { ColumnInfo, isRightAligned, SortDirection } from "./Helper";
import { getOptionTextByValue } from "./MetadataHelper";
import { SimpleKind } from "./TypesHelper";

interface Props {
  columnInfo: ColumnInfo;
  isReadOnlyGrid: boolean;
  allowSorting: boolean;
  allowFiltering: boolean;
  onSort: (sortDirection: SortDirection) => void;
  onFilter: (el: HTMLElement) => void;
  onClearFilter?: () => void;
};

export interface HeaderMenuHandle {
  openAt: (anchorEl: HTMLElement) => void;
  close: () => void;
};

export const HeaderMenu = React.forwardRef<HeaderMenuHandle, Props>(
  function HeaderMenu(
    {
      columnInfo, isReadOnlyGrid, allowSorting, allowFiltering, onSort, onFilter, onClearFilter
    },
    ref
  ) {
    const [open, setOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const alignRight = isRightAligned(columnInfo.simpleType);
    React.useImperativeHandle(ref, () => ({
      openAt: (el: HTMLElement) => {
        setAnchorEl(el);
        setOpen(true);
      },
      close: () => setOpen(false)
    }));

    const onOpenFilter = (e: React.MouseEvent<HTMLElement>) => {
      if (anchorEl)
        onFilter?.(anchorEl);
    };

    const simpleType = columnInfo.simpleType;
    const noLabel = getOptionTextByValue(columnInfo, 0);
    const yesLabel = getOptionTextByValue(columnInfo, 1);

    const ascLabel = React.useMemo(() => {
      return simpleType === "boolean"
        ? `${noLabel ?? "No"} to ${yesLabel ?? "Yes"}`
        : SimpleKind.includes(["money", "number"], simpleType) ? "Smaller to larger"
          : simpleType === "datetime" ? "Older to newer"
            : "A to Z";
    }, [noLabel, yesLabel]);

    const descLabel = React.useMemo(() => {
      return simpleType === "boolean"
        ? `${yesLabel ?? "Yes"} to ${noLabel ?? "No"}`
        : SimpleKind.includes(["money", "number"], simpleType) ? "Larger to smaller"
          : simpleType === "datetime" ? "Newer to older"
            : "Z to A";
    }, [noLabel, yesLabel]);

    return (
      <div
        className="pcf-headerline"
        tabIndex={-1}>

        <div className="pcf-titlewrap">
          <span className="pcf-title">
            {columnInfo.displayName}
          </span>

          {!isReadOnlyGrid && (columnInfo?.metadataInfo?.requiredLevel ?? 0) === 2 && (
            <span className="pcf-required-symbol"> *</span>
          )}
        </div>

        {(columnInfo.sortDirection ?? -1) !== -1 && (
          <span className="pcf-sorticon">
            {columnInfo.sortDirection === 0 ? <ArrowSortUp16Regular /> : <ArrowSortDown16Regular />}
          </span>
        )}

        {columnInfo.filterModel && (
          <span className="pcf-filtericon">
            <Filter16Filled />
          </span>
        )}

        {(allowSorting || allowFiltering) && (
          <>
            <span className="pcf-caret"><ChevronDown12Regular /></span>

            <Menu
              open={open}
              onOpenChange={(event, data) => {

                if (event && anchorEl) {
                  const e = event as MouseEvent | PointerEvent | FocusEvent | KeyboardEvent;
                  const targetEl =
                    (e as any).target instanceof Element ? ((e as any).target as Element) : null;

                  const isFromAnchor = targetEl && anchorEl.contains(targetEl);

                  // avoid popup flickering
                  if (isFromAnchor)
                    return;
                }
                setOpen(!!data.open);

                const isEsc =
                  event instanceof KeyboardEvent
                    ? event.key === "Escape"
                    : (event as any)?.key === "Escape"; // fallback

                if (!data.open) {
                  // set focus back to column header
                  if (isEsc && anchorEl) {
                    requestAnimationFrame(() => anchorEl.focus());
                  }
                }

              }}
              positioning={{ position: "below", align: alignRight ? "end" : "start", target: anchorEl ?? undefined }}
              closeOnScroll={true}
              persistOnItemClick={false}
            >
              <MenuTrigger
                disableButtonEnhancement={true}>
                <span style={{ display: "none" }} />
              </MenuTrigger>
              <MenuPopover
                onClick={(e: React.MouseEvent) => {
                  // don't let the click cascade to GridComponent
                  e.stopPropagation();
                }}
                onKeyDown={(e: React.KeyboardEvent) => {
                  // don't let the key cascade to GridComponent
                  e.stopPropagation();
                }}>
                <MenuList>
                  {
                    allowSorting &&
                    <MenuItem icon={<ArrowSortUp20Regular />} disabled={columnInfo.simpleType === "multipicklist"} onClick={() => onSort(0)}>{ascLabel ?? "A to Z"}</MenuItem>
                  }
                  {
                    allowSorting &&
                    <MenuItem icon={<ArrowSortDown20Regular />} disabled={columnInfo.simpleType === "multipicklist"} onClick={() => onSort(1)}>{descLabel ?? "Z to A"}</MenuItem>}
                  {
                    allowFiltering &&
                    <MenuItem icon={<Filter20Regular />} onClick={onOpenFilter}>Filter by</MenuItem>
                  }
                  {
                    allowFiltering &&
                    columnInfo.filterModel &&
                    <MenuItem icon={<FilterDismiss20Regular />} onClick={onClearFilter}>Clear filter</MenuItem>
                  }
                </MenuList>
              </MenuPopover>
            </Menu>
          </>
        )}
      </div>
    );
  }
);