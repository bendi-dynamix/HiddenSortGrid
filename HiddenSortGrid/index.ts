// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./generated/ManifestTypes.d.ts" />
/// <reference types="xrm" />

import * as React from "react";
import type { IInputs, IOutputs } from "./generated/ManifestTypes";
import { FluentProvider, IdPrefixProvider, webLightTheme } from "@fluentui/react-components";
import { CURRENCY_SYMBOL_ALIAS, CURRENCY_SYMBOL_FIELD, HiddenSortGridComponent, HiddenSortGridComponentProps, SelectionMode } from "./HiddenSortGridComponent";
import { generateRandomId } from "./Helper";

class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return React.createElement(
        "div",
        { style: { padding: 8 } },
        `⚠️ ${this.state.error.message}`
      );
    }
    return this.props.children as React.ReactElement;
  }
}

let linkEtityAdded = false;
function TryAddLinkToCurrency(context: ComponentFramework.Context<IInputs>) {
  try {
    const ds = context.parameters.Items;
    const moneyCols = ds.columns.filter(c =>
      (c.dataType?.toLowerCase?.() === "money") ||
      c.dataType?.toLowerCase?.().includes("money") ||
      (c.dataType?.toLowerCase?.() === "currency") ||
      c.dataType?.toLowerCase?.().includes("currency") ||
      ((c as unknown as { type: string }).type?.toLowerCase?.() === "money") ||
      (c as unknown as { type: string }).type?.toLowerCase?.().includes("money")
    );

    const hasMoney = moneyCols.length > 0;

    const alias = CURRENCY_SYMBOL_ALIAS;
    if (hasMoney) {
      const already = ds.linking.getLinkedEntities().some(le => le.alias === alias);
      if (!already) {
        ds.linking.addLinkedEntity({
          name: "transactioncurrency",
          from: "transactioncurrencyid",
          to: "transactioncurrencyid",
          alias,
          linkType: "inner",
        });

        if (ds.addColumn)
          ds.addColumn(CURRENCY_SYMBOL_FIELD, alias);

        ds.refresh();
      }
    }

    linkEtityAdded = true;
  }
  catch (error) {
    console.error(error);
  }
}

export class HiddenSortGrid implements ComponentFramework.ReactControl<IInputs, IOutputs> {
  private _context!: ComponentFramework.Context<IInputs>;
  private _notify!: () => void;
  private _idPrefix!: string;

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void
  ): void {
    this._context = context;
    this._notify = notifyOutputChanged;
    context.mode.trackContainerResize(true);

    this._idPrefix = `HiddenSortGrid-${generateRandomId()}`;

    TryAddLinkToCurrency(context);
  }

  private lastState: React.ReactElement | undefined;
  private reloadToken = generateRandomId();
  public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
    this._context = context;

    if (!linkEtityAdded)
      TryAddLinkToCurrency(context);

    const ds = context.parameters.Items;
    const allocatedWidth = context.mode.allocatedWidth ?? 0;

    if (ds?.loading && this.lastState) {
      this.reloadToken = generateRandomId();
      return this.lastState;
    }

    const props: HiddenSortGridComponentProps = {
      context,
      dataset: ds,
      allocatedWidth,
      reloadToken: this.reloadToken
    };

    this.lastState = React.createElement(
      IdPrefixProvider,
      { value: this._idPrefix },
      React.createElement(
        FluentProvider,
        { theme: webLightTheme },
        React.createElement(
          ErrorBoundary,
          null,
          React.createElement(HiddenSortGridComponent, props)
        )
      )
    );

    return this.lastState;
  }

  public getOutputs(): IOutputs {
    return {};
  }

  public destroy(): void {
    // Clean up events or timers if needed; no DOM unmount required.
  }
}
