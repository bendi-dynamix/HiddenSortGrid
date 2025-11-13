import * as React from "react";
import { EditProhibited16Regular } from "@fluentui/react-icons";
import { LinkKind } from "../TypesHelper";

export interface NonEditLinkCellProps {
    formattedValue: string;
    style?: React.CSSProperties;
    readonlyGrid: boolean;

    kind: LinkKind | null; // "email" | "phone" | "url"
    onLookupClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function NonEditLinkCell(
    {
        formattedValue,
        style,
        readonlyGrid,

        kind,
        onLookupClick
    }: NonEditLinkCellProps
) {
    const buildHref = (val: string): string => {
        const v = val ?? "";
        if (kind === "email")
            return `mailto:${v}`;
        if (kind === "phone")
            return `tel:${v}`;

        return v;
    };

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
                    textAlign: "left",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: "inherit",
                    cursor: "default",
                    ...(style ?? {}),
                }}
            >
                {
                    kind != null ?
                        <a
                            className="pcf-link"
                            style={{
                                userSelect: "text",
                                maxWidth: "100%",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                            }}
                            tabIndex={-1}
                            href={buildHref(formattedValue)}
                            title={formattedValue}
                            aria-label={`Open ${formattedValue}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {formattedValue}
                        </a>
                        :
                        <a
                            className="pcf-link"
                            style={{
                                userSelect: "text",
                                maxWidth: "100%",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                            }}
                            tabIndex={-1}
                            href="#"
                            title={formattedValue}
                            aria-label={`Open ${formattedValue}`}
                            onClick={(e) => {
                                e.preventDefault();
                                if (onLookupClick != null)
                                    onLookupClick(e);
                            }}
                        >
                            {formattedValue}
                        </a>
                }
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