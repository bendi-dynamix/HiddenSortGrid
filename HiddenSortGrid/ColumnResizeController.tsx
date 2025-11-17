import type { TableColumnSizingOptions } from '@fluentui/react-components';
type Column = ComponentFramework.PropertyHelper.DataSetApi.Column;

export interface ColumnResizeControllerProps {
  columns: Column[];
  allocatedWidth: number;
  gridRightPaddingPx: number;
  statusColumnSize: number;
  selectionColumnSize: number;
  gotoRecordColumnSize: number;
  scrollbarSize: number;
  minWidthPx: number;
}

export const STATUS_COL_ID = "__hsgStatusCol__";
export const SELECTION_COL_ID = "__hsgSelectionCol__";
export const GO_TO_RECORD_COL_ID = "__hsgGoToRecordCol__";

export class ColumnResizeController {
  public static computeProportionalSizing(props: ColumnResizeControllerProps): TableColumnSizingOptions {
    const allocatedW = props.allocatedWidth ?? 0;
    const totalW = Math.max(0, allocatedW - props.statusColumnSize - props.selectionColumnSize - props.gotoRecordColumnSize - props.scrollbarSize - props.gridRightPaddingPx);

    let columnsSizes = props.columns.map((c, i) => {
      return {
        name: c.name,
        size: 0,
        weight: c.visualSizeFactor ?? 1
      }
    });

    const weightsSumNormalized = columnsSizes.map(c => c.weight).reduce((a, b) => a + Math.max(b, props.minWidthPx));
    if (weightsSumNormalized >= totalW) {
      for (const c of columnsSizes)
        c.size = Math.max(c.weight, props.minWidthPx);
    }
    else {
      const weightsSum = columnsSizes.map(c => c.weight).reduce((a, b) => a + b) || 1;
      for (const c of columnsSizes)
        c.size = c.weight / weightsSum * totalW;

      let smallerThanMiniminumColumns = columnsSizes.filter(c => c.size < props.minWidthPx);
      if (smallerThanMiniminumColumns.length > 0) {
        let resizedColumns: {
          name: string,
          size: number,
          weight: number
        }[] = [];

        while (smallerThanMiniminumColumns.length > 0) {
          for (const c of smallerThanMiniminumColumns)
            c.size = props.minWidthPx;

          resizedColumns = resizedColumns.concat(smallerThanMiniminumColumns);

          const spaceLeft = totalW - (resizedColumns.length * props.minWidthPx);
          const otherColumns = columnsSizes.filter(columnsSizeF => !resizedColumns.some(columnsSizeS => columnsSizeS.name === columnsSizeF.name));
          const otherColumnsWeights = otherColumns.map(c => c.weight).reduce((a, b) => a + b) || 1;

          for (const c of otherColumns)
            c.size = c.weight / otherColumnsWeights * spaceLeft;

          smallerThanMiniminumColumns = columnsSizes.filter(c => c.size < props.minWidthPx);
        }
      }
    }

    const sizing: TableColumnSizingOptions = {};
    if (totalW <= 0)
      return sizing;

    if (props.statusColumnSize > 0) {
      sizing[STATUS_COL_ID] =
      {
        minWidth: props.statusColumnSize,
        defaultWidth: props.statusColumnSize
      }
    }

    if (props.selectionColumnSize > 0) {
      sizing[SELECTION_COL_ID] =
      {
        minWidth: props.selectionColumnSize,
        defaultWidth: props.selectionColumnSize
      }
    }

    columnsSizes.forEach(c => {
      sizing[c.name] = {
        minWidth: props.minWidthPx,
        defaultWidth: c.size
      };
    });

    if (props.gotoRecordColumnSize > 0) {
      sizing[GO_TO_RECORD_COL_ID] =
      {
        minWidth: props.gotoRecordColumnSize,
        defaultWidth: props.gotoRecordColumnSize
      }
    }

    return sizing;
  }

  public static buildSizeKey(sizing: TableColumnSizingOptions): string {
    return Object.entries(sizing)
      .filter(([, v]) => typeof v === 'object' && v !== null)
      .map(([name, opts]) => `${name}|dw:${opts.defaultWidth ?? 0}|mw:${opts.minWidth ?? 0}`)
      .join(';');
  }
}
