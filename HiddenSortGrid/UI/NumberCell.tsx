import * as React from "react";
import { Input } from "@fluentui/react-components";
import { NumberKind } from "../TypesHelper";
import { ErrorCircle20Regular } from "@fluentui/react-icons";
import { UserNumberFormatInfo } from "../HiddenSortGridComponent";
import { CellHandle, CellProps, clearElementSelection, extractNumberD365, formatNumberD365, selectElementText } from "../Helper";
import { NumericMetadata } from "../MetadataHelper";

export interface NumberCellProps extends CellProps {
    kind: NumberKind;
    numericInfo: NumericMetadata | null;
    userFormatInfo: UserNumberFormatInfo;
}

export const NumberCell = React.forwardRef<CellHandle, NumberCellProps>(function NumberCell(
    {
        formatting,
        gridCellRef,
        validationToken,
        rawValue,
        formattedValue,
        isEditing,
        className,
        style,

        kind,
        numericInfo,
        userFormatInfo,

        onValidate,
        onCommit
    }: NumberCellProps,
    ref
) {
    const readonlyRef = React.useRef<HTMLElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const [error, setError] = React.useState<string | undefined | null>(undefined);
    const [currentValue, setCurrentValue] = React.useState(formattedValue);
    const originalRef = React.useRef(formattedValue);
    const automaticCommitRef = React.useRef(true);

    const fieldIsRequired = (numericInfo?.requiredLevel ?? 0) === 2;

    React.useImperativeHandle(ref, () => ({
        selectInnerText() {
            if (readonlyRef.current != null)
                selectElementText(readonlyRef.current);
        },
        unselectInnerText() {
            if (readonlyRef.current != null)
                clearElementSelection(readonlyRef.current);
        },
        startEditing(overwrite: boolean) {
            automaticCommitRef.current = true;
            setCurrentValue(overwrite ? "" : rawValue != null ? String(rawValue as number) : formattedValue);
        },
        endEditing() {
            if (automaticCommitRef.current)
                void commit(inputRef.current?.value ?? "");
        },
        validate(): boolean {
            return validate() == null;
        }
    }));

    React.useEffect(() => {
        if (!isEditing)
            return;

        if (inputRef.current == null)
            return;

        inputRef.current?.focus();

        if (inputRef.current.value == null || inputRef.current.value.length === 0)
            return;

        const length = inputRef.current.value.length;
        if (inputRef.current != null) {
            inputRef.current.setSelectionRange?.(length, length);
            inputRef.current.scrollLeft = inputRef.current.scrollWidth;
        }
    }, [isEditing]);

    React.useEffect(() => {
        if (!isEditing)
            return;

        setCurrentValue(formattedValue);
        originalRef.current = formattedValue;
    }, [rawValue, formattedValue]);

    const commit = async (value: string) => {
        const parsed = extractNumberD365(value, null, userFormatInfo, numericInfo) ?? null;
        const nextFormatted =
            error != null
                ? value
                : (formatNumberD365(parsed, null, userFormatInfo, numericInfo) ?? "");

        if (nextFormatted !== originalRef.current)
            await onCommit(parsed, nextFormatted);
    };

    function validate() {
        if (numericInfo == null)
            return null;

        const extracted = extractNumberD365(currentValue, null, userFormatInfo, numericInfo);
        if (extracted === undefined) {
            const minValueFormatted = formatNumberD365(numericInfo?.minValue, null, userFormatInfo, numericInfo);
            const maxValueFormatted = formatNumberD365(numericInfo?.maxValue, null, userFormatInfo, numericInfo);

            return `Enter a number between ${minValueFormatted} and ${maxValueFormatted}`;
        }

        if (fieldIsRequired && (extracted ?? "") === "")
            return "Required fields must be filled in";

        return null;
    }

    React.useEffect(() => {
        setError(prev => {
            const next = isEditing || (validationToken ?? "") !== "" ? validate() : null;

            if (prev === next)  // important to use ===, we need to distinguish undefined (init value) and null (ok)
                return prev;

            onValidate?.(next);

            return next;
        });
    }, [currentValue, userFormatInfo, numericInfo, validationToken, isEditing]);

    const isError = (error ?? null) != null;
    return (
        <div
            style={{
                display: "inline-flex",
                width: "100%",
                alignItems: "center"
            }}
        >
            {!isEditing ? (
                <>
                    {isError && (
                        <span style={{ height: "100%", padding: "4px 0", flex: "0 0 auto", alignItems: "center" }}>
                            <ErrorCircle20Regular
                                color="rgb(209, 52, 56)"
                                style={{ minWidth: 20, width: 20, alignContent: "center" }}
                            />
                        </span>
                    )}
                    <span
                        ref={readonlyRef}
                        style={{
                            userSelect: "text",
                            flex: "1 1 auto",
                            minWidth: 0,
                            justifyContent: "flex-end",
                            textAlign: "right",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "default",
                            ...(style ?? {}),
                        }}
                    >
                        {formattedValue}
                    </span>
                </>
            ) : (
                <Input
                    ref={inputRef}
                    className={className ?? ""}
                    style={{
                        flex: "1 1 auto",
                        minWidth: 0,
                        justifyContent: "flex-end",
                        textAlign: "right",
                        ...(style ?? {}),
                    }}
                    value={currentValue}
                    tabIndex={-1}
                    input={{
                        style: {
                            width: "100%",
                            textAlign: "right",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "text"
                        },
                        tabIndex: -1
                    }}
                    onInput={(e) => {
                        const val = (e.currentTarget as HTMLInputElement).value;
                        setCurrentValue(val);
                    }}
                    onKeyDown={(e) => {
                        if (!isEditing && ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(e.key))
                            e.preventDefault();

                        const el = e.currentTarget as HTMLInputElement;
                        if (isEditing) {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopPropagation();
                                automaticCommitRef.current = false;

                                requestAnimationFrame(() => {   // <= wait for validation updates validationErrors's state
                                    void (async () => {
                                        await commit(el.value);

                                        el.blur();
                                        gridCellRef.current?.focus();
                                    })();
                                });
                            } else if (e.key === "Escape") {
                                e.preventDefault();
                                e.stopPropagation();
                                automaticCommitRef.current = false;

                                setCurrentValue(originalRef.current);

                                requestAnimationFrame(() => {
                                    el.blur();
                                    gridCellRef.current?.focus();
                                });
                            }
                        }
                    }}
                    onKeyUp={(e) => {
                        e.stopPropagation();
                    }}
                    autoComplete="off"
                    spellCheck={false}
                />
            )}
        </div>
    );
});