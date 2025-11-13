import * as React from "react";
import { EditProhibited16Regular } from "@fluentui/react-icons";

export interface NonEditCellProps {
    formattedValue: string;
    style?: React.CSSProperties;
    isRightAlign: boolean;
    readonlyGrid: boolean;
}

export function NonEditCell(
    {
        formattedValue,
        style,
        isRightAlign,
        readonlyGrid
    }: NonEditCellProps
) {
    return (
        <div
            style={{
                display: "inline-flex",
                width: "100%",
                alignItems: "center"
            }}
        >
            <span
                style={{
                    userSelect: readonlyGrid ? "none" : "text",
                    flex: "1 1 auto",
                    minWidth: 0,
                    justifyContent: "flex-start",
                    textAlign: isRightAlign ? "right" : "left",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: "default",
                    ...(style ?? {}),
                }}
            >
                {formattedValue}
            </span>
            {!readonlyGrid &&
                <span
                    className="pcf-inline-cell-icon"
                    style={{
                        flex: "0 0 auto",
                        padding: "5px 0 5px 5px",
                        height: 16
                    }}
                >
                    <EditProhibited16Regular style={{ color: "var(--pcf-font-color)" }} />
                </span>
            }
        </div>
    );
};