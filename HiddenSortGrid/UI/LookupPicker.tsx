import * as React from "react";
import {
    TagPicker, TagPickerControl, TagPickerList, TagPickerInput,
    Tag, Spinner,
    TagPickerOption,
    Field,
    TagPickerGroup,
    TagPickerProps
} from "@fluentui/react-components";

export interface LookupValue {
    entityType?: string;
    id: string;
    name?: string;
};

interface LookupPickerProps {
    onOptionSelect: TagPickerProps["onOptionSelect"]
    onInputChange: (value: string) => Promise<void>;
    suggestedOptions: LookupValue[];
    selectedOptions: LookupValue[];
    inputValue: string;
    isLoading: boolean;
    allowMultiple: boolean;
};

export function LookupPicker({
    onOptionSelect,
    onInputChange,
    suggestedOptions,
    selectedOptions,
    inputValue,
    isLoading,
    allowMultiple
}: LookupPickerProps) {
    const [focused, setFocused] = React.useState(false);
    const showOptions = focused && inputValue != null && inputValue.trim() !== "";

    const handleOnInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        void onInputChange(e.currentTarget.value);
    }, [onInputChange]);

    return (
        <Field>
            <TagPicker
                open={showOptions}
                onOptionSelect={onOptionSelect}
                selectedOptions={
                    selectedOptions.map(lookupValue => lookupValue.id)
                }
            >
                <TagPickerControl
                    className="dmx-pcf-filter-oobFocusControl"
                    style={{ maxWidth: "250px" }}
                    expandIcon={<></>}>
                    <TagPickerGroup aria-label="Selected Records">
                        {selectedOptions.map((lookupValue) => (
                            <Tag
                                value={lookupValue.id}
                                key={lookupValue.id}
                            >
                                {lookupValue.name ?? ""}
                            </Tag>
                        ))}
                    </TagPickerGroup>
                    <TagPickerInput
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        value={inputValue}
                        onChange={handleOnInputChange}
                        multiple={allowMultiple}
                        aria-label="Select Records" />
                </TagPickerControl>
                {
                    <TagPickerList style={{ width: "300px", overflow: "visible" }}>
                        {isLoading ?
                            <Spinner
                                size="extra-small"
                                style={{ color: "rgb(15, 108, 189)" }}
                                label={
                                    <span style={{ fontSize: 12, display: "block", marginTop: -5, marginBottom: "3px", lineHeight: 1, color: "rgb(15, 108, 189)" }}>
                                        Loading…
                                    </span>}
                                labelPosition="below" />
                            : suggestedOptions.length > 0 ? (
                                suggestedOptions.map((lookupValue) => (
                                    <TagPickerOption
                                        value={lookupValue.id}
                                        key={lookupValue.id}
                                    >
                                        {lookupValue.name ?? ""}
                                    </TagPickerOption>
                                ))
                            ) :
                                (
                                    <div style={{ textAlign: "center", color: "rgb(92, 92, 92)", fontSize: "12px", lineHeight: "22px" }}>
                                        No records found
                                    </div>
                                )}
                    </TagPickerList>
                }
            </TagPicker>
        </Field >
    );
}
