import * as React from "react";
import { Combobox, Option, OptionGroup } from "@fluentui/react-components";
import { ChevronDown20Regular, ErrorCircle20Regular } from "@fluentui/react-icons";
import { CellHandle, CellProps, clearElementSelection, emptyOption, emptyText, emptyValue, emptyValueStr, selectElementText } from "../Helper";
import { FieldMetadata } from "../MetadataHelper";

export interface PicklistCellProps extends CellProps {
    valuesList: Xrm.OptionSetValue[];
    fieldInfo: FieldMetadata | null;
    onOpenButtonClicked: () => void;
}

export const PicklistCell = React.forwardRef<CellHandle, PicklistCellProps>(function PicklistCellCell(
    {
        formatting,
        gridCellRef,
        validationToken,
        rawValue,
        formattedValue,
        isEditing,
        className,
        style,

        valuesList,
        fieldInfo,

        onValidate,
        onCommit,
        onOpenButtonClicked
    }: PicklistCellProps,
    ref
) {
    const readonlyRef = React.useRef<HTMLElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const [error, setError] = React.useState<string | undefined | null>(undefined);
    const [open, setOpen] = React.useState(false);
    const [currentValue, setCurrentValue] = React.useState(rawValue != null ? String(rawValue as number) : emptyValueStr);
    const originalRef = React.useRef(rawValue as number | null);
    const automaticCommitRef = React.useRef(true);

    const fieldIsRequired = (fieldInfo?.requiredLevel ?? 0) === 2;

    const optionsList = React.useMemo(() => fieldIsRequired ? [...valuesList] : [emptyOption, ...valuesList], [valuesList]);
    const optionsMap = React.useMemo(() => new Map(optionsList?.map(o => [o.value, o] as const)), [valuesList]);

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
            setCurrentValue(overwrite ? emptyValueStr : rawValue != null ? String(rawValue as number) : emptyValueStr);
            setOpen(false);
        },
        endEditing() {
            if (automaticCommitRef.current)
                void commit(currentValue);
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

        inputRef.current.select();
    }, [isEditing, currentValue]);

    React.useEffect(() => {
        if (!isEditing)
            return;

        setCurrentValue(rawValue != null ? String(rawValue as number) : emptyValueStr);
        originalRef.current = rawValue as number | null;
    }, [rawValue, formattedValue]);

    const commit = async (value: string) => {
        const parsed = value !== emptyValueStr ? Number(value) : null;
        const nextFormatted =
            parsed != null
                ? optionsMap.get(parsed)?.text ?? ""
                : "";

        if ((parsed ?? emptyValue) !== (originalRef.current ?? emptyValue))
            await onCommit(parsed, nextFormatted);
    };

    function validate() {
        if (fieldInfo == null)
            return null;

        if (fieldIsRequired && (currentValue?.trim() ?? emptyValueStr) === emptyValueStr)
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
    }, [currentValue, validationToken, isEditing]);

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
                        <ChevronDown20Regular style={{ color: "var(--pcf-font-color)" }} />
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
                <Combobox
                    ref={inputRef}
                    className={className ?? ""}
                    multiselect={false}
                    open={open}
                    onOpenChange={(_, d) => setOpen(!!d.open)}
                    expandIcon={
                        <span style={{ padding: "5px 0" }}>
                            <ChevronDown20Regular />
                        </span>
                    }
                    style={{
                        flex: "1 1 auto",
                        minWidth: 0,
                        justifyContent: "flex-start",
                        textAlign: "left",
                        ...(style ?? {}),
                    }}
                    value={optionsMap.get(Number(currentValue))?.text ?? emptyText}
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
                    selectedOptions={[currentValue]}
                    onOptionSelect={(_, data) => {
                        setCurrentValue(data.selectedOptions?.[0] ?? emptyValueStr);
                    }}
                    onKeyDown={(e) => {
                        if (!isEditing && ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(e.key))
                            e.preventDefault();

                        const el = e.currentTarget as HTMLInputElement;
                        if (isEditing) {
                            if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                            }

                            if (["ArrowUp", "ArrowDown"].includes(e.key)) {
                                const listLength = optionsList?.length;
                                if (listLength > 0) {
                                    const currentIndex = optionsList.findIndex(opt => opt.value === Number(currentValue));
                                    const nextIndex = (listLength + (e.key === "ArrowUp" ? (currentIndex ?? 0) - 1 : (currentIndex ?? -1) + 1)) % listLength; // carouselish index
                                    const nextValue = optionsList[nextIndex].value;
                                    setCurrentValue(String(nextValue));
                                }
                                else
                                    setCurrentValue(emptyValueStr);

                                if (!open)
                                    setOpen(false);

                                e.preventDefault();
                                e.stopPropagation();
                                return;
                            }

                            if (e.key === "Enter") {
                                setOpen(false);

                                e.preventDefault();
                                e.stopPropagation();
                                automaticCommitRef.current = false;

                                requestAnimationFrame(() => {   // <= wait for validation updates validationErrors's state
                                    void (async () => {
                                        await commit(currentValue);

                                        el.blur();
                                        gridCellRef.current?.focus();
                                    })();
                                });
                            } else if (e.key === "Escape") {
                                e.preventDefault();
                                e.stopPropagation();
                                automaticCommitRef.current = false;

                                setCurrentValue((originalRef.current ?? emptyValueStr) !== emptyValueStr ? String(originalRef.current) : emptyValueStr);

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
                    aria-label="Optionset value"
                >
                    <OptionGroup
                        className="dmx-pcf-picklist-options">
                        {[...optionsList].map(o => (
                            <Option
                                key={String(o.value)}
                                value={String(o.value)}
                                onKeyDown={(e) => e.stopPropagation()}>
                                {o.text ?? null}
                            </Option>
                        ))}
                    </OptionGroup>
                </Combobox>
            )}
        </div >
    );
});