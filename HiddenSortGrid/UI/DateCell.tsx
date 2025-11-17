import * as React from "react";
import { UserDateFormatInfo } from "../HiddenSortGridComponent";
import { CellHandle, CellProps, clearElementSelection, selectElementText } from "../Helper";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import { DateMetadata } from "../MetadataHelper";
import { formatDateD365, parseDate, pickerDateToUtc } from "../HelperDateTime";
import { CalendarLtr20Regular, ErrorCircle20Regular } from "@fluentui/react-icons";

export interface DateCellProps extends CellProps {
    formatting: ComponentFramework.Formatting;
    metadataInfo: DateMetadata | null;
    userFormatInfo: UserDateFormatInfo;
    onOpenButtonClicked: () => void;
}

export const DateCell = React.forwardRef<CellHandle, DateCellProps>(function DateCell(
    {
        formatting,
        rawValue,
        formattedValue,
        isEditing,
        className,
        style,

        metadataInfo,
        userFormatInfo,

        rowValidationInitiated,
        onValidate,
        onCommit,
        onEditingFinished,
        onOpenButtonClicked
    }: DateCellProps,
    ref
) {
    const readonlyRef = React.useRef<HTMLElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const [error, setErrorState] = React.useState<string | undefined | null>(undefined);
    const [open, setOpen] = React.useState(false);
    const originalRef = React.useRef(rawValue as Date | null);
    const automaticCommitRef = React.useRef(true);

    const [currentValue, setStateCurrentValue] = React.useState(rawValue as Date | null);
    const currentValueRef = React.useRef(rawValue as Date | null);
    const setCurrentValue = (value: Date | null) => {
        currentValueRef.current = value;
        setStateCurrentValue(value);
    };

    const fieldIsRequired = (metadataInfo?.requiredLevel ?? 0) === 2;

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
            setCurrentValue(overwrite ? null : rawValue as Date | null);
            setOpen(false);
        },
        endEditing() {
            if (automaticCommitRef.current)
                void commit(currentValueRef.current);
        },
        validateCell(): boolean {
            const validationResult = validate();
            setError(validationResult);

            return validationResult == null;
        },
        resetCellValidation(): void {
            setError(null);
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

        inputRef.current.select();
    }, [isEditing, currentValue]);

    React.useEffect(() => {
        if (!isEditing)
            return;

        setCurrentValue(rawValue as Date | null);
        originalRef.current = rawValue as Date | null;
    }, [rawValue, formattedValue]);

    const commit = async (value: Date | null) => {
        const parsed = value;
        const nextFormatted =
            parsed != null
                ? formatDateD365(parsed, formatting, metadataInfo, userFormatInfo) ?? ""
                : "";

        if ((parsed ?? "") !== (originalRef.current ?? ""))
            await onCommit(parsed, nextFormatted);
    };

    function validate() {
        if (metadataInfo == null)
            return null;

        if (fieldIsRequired && currentValue == null)
            return "Required fields must be filled in";

        return null;
    }

    function setError(error: string | null) {
        setErrorState(prev => {
            const next = error;

            if (prev === next)  // important to use ===, we need to distinguish undefined (init value) and null (ok)
                return prev;

            onValidate?.(next);

            return next;
        });
    }

    React.useEffect(() => {
        if (isEditing)
            return;

        if (!rowValidationInitiated) {
            setError(null);
            return;
        }

        const validationResult = validate();
        setError(validationResult);
    }, [isEditing]);

    async function onEnterPressed(value: string) {
        const pickerDate = parseDate(value, userFormatInfo);
        const utcForSave = pickerDateToUtc(pickerDate ?? null, formatting, metadataInfo);

        await commit(utcForSave);
        onEditingFinished();
    }

    function onEscPressed() {
        setCurrentValue(originalRef.current);
        requestAnimationFrame(() => {
            onEditingFinished();
        });
    }

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
                    <span
                        ref={readonlyRef}
                        style={{
                            userSelect: "text",
                            flex: "1 1 auto",
                            minWidth: 0,
                            justifyContent: "flex-start",
                            textAlign: "left",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "default",
                            paddingLeft: "10px",
                            ...(style ?? {}),
                        }}
                    >
                        {formattedValue}
                    </span>
                    <span
                        className="pcf-inline-cell-icon"
                        style={{
                            flex: "0 0 auto",
                            padding: "5px 0",
                            height: 20
                        }}
                        role="button"
                        onClick={(_) => {
                            onOpenButtonClicked();
                            requestAnimationFrame(() => {
                                setOpen(true);
                            });
                        }}>
                        <CalendarLtr20Regular style={{ color: "var(--pcf-font-color)" }} />
                    </span>
                    {isError && (
                        <span style={{ height: "100%", padding: "4px 0", flex: "0 0 auto", alignItems: "center" }}>
                            <ErrorCircle20Regular
                                color="rgb(209, 52, 56)"
                                style={{ minWidth: 20, width: 20, alignContent: "center" }}
                            />
                        </span>
                    )}
                </>
            ) : (
                <DatePicker
                    ref={inputRef}
                    className={className ?? ""}
                    open={open}
                    onOpenChange={(o) => setOpen(o)}
                    firstDayOfWeek={userFormatInfo.firstDayOfWeek}
                    calendar={{ className: "dmx-pcf-datecell-calendar" }}
                    style={{
                        flex: "1 1 auto",
                        minWidth: 0,
                        justifyContent: "flex-start",
                        textAlign: "left",
                        ...(style ?? {}),
                    }}
                    value={currentValue}
                    formatDate={(date) => {
                        const formatted = formatDateD365(date ?? null, formatting, metadataInfo, userFormatInfo) ?? "";
                        return formatted;
                    }}
                    tabIndex={-1}
                    allowTextInput={true}
                    onInput={(e) => {
                        e.preventDefault();
                    }}
                    input={{
                        style: {
                            width: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "text"
                        },
                        tabIndex: -1,
                        onKeyDown: (e) => {
                            if (e.key === "Enter") {
                                setOpen(false);
                            }
                        },
                        onClick: (_) => {
                            setOpen(false);
                        }
                    }}
                    onSelectDate={date => {
                        const utcForSave = pickerDateToUtc(date ?? null, formatting, metadataInfo);
                        setCurrentValue(utcForSave);
                    }}
                    onKeyDownCapture={(e) => {
                        if (!isEditing && ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(e.key))
                            e.preventDefault();

                        const el = e.currentTarget as HTMLInputElement;
                        if (isEditing) {
                            if (e.key === "Enter") {
                                setOpen(false);

                                e.preventDefault();
                                e.stopPropagation();
                                automaticCommitRef.current = false;

                                void onEnterPressed(el.value);
                            } else if (e.key === "Escape") {
                                e.preventDefault();
                                e.stopPropagation();
                                automaticCommitRef.current = false;

                                onEscPressed();
                            }
                        }
                    }}
                    onKeyUp={(e) => {
                        e.stopPropagation();
                    }}
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Date value"
                />
            )}
        </div >
    );
});