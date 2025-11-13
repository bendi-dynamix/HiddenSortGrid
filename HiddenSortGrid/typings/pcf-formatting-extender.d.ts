declare namespace ComponentFramework {
    // https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/formatting
    interface Formatting {
        formatCurrency(
            value: number,
            precision: number,
            symbol: string
        ): string;

        formatDateAsFilterStringInUTC(
            value: Date,
            includeTime?: boolean
        ): string;

        formatDateLong(
            value: Date
        ): string;

        formatDateLongAbbreviated(
            value: Date
        ): string;

        formatDateShort(
            value: Date,
            includeTime: boolean
        ): string;

        formatDateYearMonth(
            value: Date
        ): string;

        formatDecimal(
            value: number,
            precision: number
        ): string;

        formatInteger(
            value: number
        ): string;

        formatLanguage(
            value: number
        ): string;

        formatTime(
            value: Date,
            behavior: FormattingApi.Types.DateTimeFieldBehavior
        ): string;

        formatUserDateTimeToUTC(
            value: Date,
            behavior: FormattingApi.Types.DateTimeFieldBehavior
        ): string;

        formatUserInput(
            input: string,
            behavior: ComponentFramework.ControlAttributes
        ): string;

        formatUTCDateTimeToUserDate(
            value: Date,
            behavior: FormattingApi.Types.DateTimeFieldBehavior
        ): Date;

        getWeekOfYear(
            value: Date
        ): number;

        parseDateFromInput(
            input: string,
            controlAttributes: ComponentFramework.ControlAttributes
        ): Date;
    }
}
