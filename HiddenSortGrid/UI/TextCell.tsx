import * as React from "react";
import { Input } from "@fluentui/react-components";
import { ErrorCircle20Regular } from "@fluentui/react-icons";
import { UserNumberFormatInfo } from "../HiddenSortGridComponent";
import { CellHandle, CellProps, clearElementSelection, extractTextD365, formatNumberD365, selectElementText } from "../Helper";
import { TextMetadata } from "../MetadataHelper";

export interface TextCellProps extends CellProps {
    textInfo: TextMetadata | null;
    userFormatInfo: UserNumberFormatInfo;
}

export const TextCell = React.forwardRef<CellHandle, TextCellProps>(function TextCell(
    {
        rawValue,
        formattedValue,
        isEditing,
        className,
        style,

        textInfo,
        userFormatInfo,

        rowValidationInitiated,
        onValidate,
        onCommit,
        onEditingFinished
    }: TextCellProps,
    ref
) {
    const readonlyRef = React.useRef<HTMLElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const [error, setErrorState] = React.useState<string | undefined | null>(undefined);
    const [currentValue, setCurrentValue] = React.useState(formattedValue);
    const originalRef = React.useRef(formattedValue);
    const automaticCommitRef = React.useRef(true);

    const fieldIsRequired = (textInfo?.requiredLevel ?? 0) === 2;

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
        const parsed = extractTextD365(value, textInfo) ?? null;
        const nextFormatted =
            error != null
                ? value
                : (parsed ?? "");

        if (nextFormatted !== originalRef.current)
            await onCommit(parsed, nextFormatted);
    };

    function validate() {
        if (textInfo == null)
            return null;

        const extracted = extractTextD365(currentValue, textInfo);
        if (extracted === undefined) {
            const maxLengthFormatted = formatNumberD365(textInfo.maxLength, null, userFormatInfo, null);
            return `You have exceeded the maximum number of ${maxLengthFormatted} characters in this field`;
        }

        if (fieldIsRequired && (extracted?.trim() ?? "") === "")
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
        await commit(value);
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
                            ...(style ?? {}),
                        }}
                    >
                        {formattedValue}
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
                <Input
                    ref={inputRef}
                    className={className ?? ""}
                    style={{
                        flex: "1 1 auto",
                        minWidth: 0,
                        justifyContent: "flex-start",
                        textAlign: "left",
                        ...(style ?? {}),
                    }}
                    value={currentValue}
                    tabIndex={-1}
                    input={{
                        style: {
                            width: "100%",
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
                />
            )}
        </div>
    );
});