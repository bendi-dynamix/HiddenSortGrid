declare namespace ComponentFramework {
  interface ControlAttributes {
    Type: ControlAttributesType | string;
    Precision?: number;
    PrecisionSource?: number;
    Format?: string;
    Behavior?: FormattingApi.Types.DateTimeFieldBehavior; // None=0, UserLocal=1, DateOnly=2, TimeZoneIndependent=3
    OptionSet?: any;
  }

  enum ControlAttributesType {
    Decimal = "Decimal",
    Float = "Float",
    Integer = "Integer",
    Money = "Money",
    Date = "Date",
    DateTime = "DateTime",
    Time = "Time",
    Language = "Language",
    String = "String",
    Boolean = "Boolean",
    Lookup = "Lookup",
    OptionSet = "OptionSet"
  }
}
