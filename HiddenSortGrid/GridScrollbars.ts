import * as React from "react";

type ScrollOrigin = "body" | "scrollbar";

export interface GridScrollbarsArgs {
  gridContainerRef: React.RefObject<HTMLDivElement>;

  GRID_BODY_ID: string;
  GRID_HEADER_ID: string;

  sortedRecordIdsLength: number;
  pageSize: number;
  gridKey: string;

  tryLoadNextPage: () => void;
  isFetchingRef: React.MutableRefObject<boolean>;
}

export function gridScrollbars({
  gridContainerRef,
  GRID_BODY_ID,
  GRID_HEADER_ID,
  sortedRecordIdsLength,
  pageSize,
  gridKey,
  tryLoadNextPage,
  isFetchingRef
}: GridScrollbarsArgs) {

  const [gridBodyHeight, setGridBodyHeight] = React.useState<number | null>(null);
  const [scrollTop, setScrollTopState] = React.useState<number>(0);
  const [isHBarVisible, setHBarVisible] = React.useState<boolean>(false);
  const [isVBarVisible, setVBarVisible] = React.useState<boolean>(false);

  const setScrollTop = (value: number) => {
    if (scrollTop != value) {
      setScrollTopState(value);
    }
  }

  const scrollOriginRef = React.useRef<ScrollOrigin | null>(null);

  const onBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollOriginRef.current === "scrollbar")
      return;

    const fly = vbarRef.current;
    if (!fly)
      return;

    scrollOriginRef.current = "body";

    const bodyEl = e.currentTarget;
    if (scrollTop !== bodyEl.scrollTop)
      setScrollTop(bodyEl.scrollTop);

    if (fly.scrollTop !== bodyEl.scrollTop)
      fly.scrollTop = bodyEl.scrollTop;

    window.setTimeout(() => {
      scrollOriginRef.current = null;
    }, 120);

    loadRecordsIfNeeded(bodyEl);
  };

  const onFlyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollOriginRef.current === "body")
      return;

    const container = gridContainerRef.current;
    if (!container)
      return;

    const bodyEl: HTMLElement | null = container.querySelector(`[id="${GRID_BODY_ID}"]`);
    const fly = vbarRef.current;
    if (!bodyEl || !fly)
      return;

    scrollOriginRef.current = "scrollbar";

    if (scrollTop !== fly.scrollTop)
      setScrollTop(fly.scrollTop);

    if (bodyEl.scrollTop !== fly.scrollTop)
      bodyEl.scrollTop = fly.scrollTop;

    window.setTimeout(() => {
      scrollOriginRef.current = null;
    }, 120);

    loadRecordsIfNeeded(bodyEl);
  };

  const loadRecordsIfNeeded = (bodyEl: HTMLElement) => {
    const gap = bodyEl.scrollHeight - bodyEl.scrollTop - bodyEl.clientHeight;
    if (gap < bodyEl.clientHeight && !isFetchingRef.current) {
      tryLoadNextPage();
    }
  }

  const heightWasJustSet = React.useRef<boolean>(false);
  heightWasJustSet.current = false;
  const rowSpan = pageSize;
  const recordsCount = sortedRecordIdsLength;
  const firstPageKey = Math.min(rowSpan, recordsCount);

  React.useEffect(() => {
    if (!heightWasJustSet.current && rowSpan >= recordsCount)
      setGridBodyHeight(null);
  }, [firstPageKey]);

  React.useLayoutEffect(() => {
    if (gridBodyHeight)
      return;

    const container = gridContainerRef.current;
    if (!container) return;

    const bodyEl: HTMLElement | null = container.querySelector(`[id="${GRID_BODY_ID}"]`);
    if (!bodyEl)
      return;

    if (gridBodyHeight !== bodyEl.clientHeight) {
      heightWasJustSet.current = true;
      setGridBodyHeight(bodyEl.clientHeight);
    }
  }, [gridBodyHeight, firstPageKey]);

  const vbarRef = React.useRef<HTMLDivElement | null>(null);
  const vbarInnerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const container = gridContainerRef.current;
    const fly = vbarRef.current;
    const flyInner = vbarInnerRef.current;
    if (!container || !fly || !flyInner)
      return;

    const headerEl: HTMLElement | null = container.querySelector(`[id="${GRID_HEADER_ID}"]`);
    const bodyEl: HTMLElement | null = container.querySelector(`[id="${GRID_BODY_ID}"]`);

    if (!headerEl || !bodyEl)
      return;

    fly.style.top = `${headerEl.clientHeight}px`;

    const updateProxy = () => {
      flyInner.style.height = `${bodyEl.scrollHeight}px`;
    };

    setTimeout(updateProxy, 0);
  }, [sortedRecordIdsLength, pageSize]);

  React.useEffect(() => {
    const container = gridContainerRef.current;
    if (!container)
      return;

    const newHBarVisible = container.scrollWidth > container.clientWidth;
    if (isHBarVisible !== newHBarVisible) {
      setHBarVisible(newHBarVisible);
    }
  }, [gridKey]);

  React.useEffect(() => {
    const newVBarVisible = sortedRecordIdsLength > pageSize;
    if (isVBarVisible !== newVBarVisible) {
      setVBarVisible(newVBarVisible);
    }
  }, [sortedRecordIdsLength, pageSize]);

  return {
    onBodyScroll,
    onFlyScroll,
    vbarRef,
    vbarInnerRef,
    isVBarVisible,
    isHBarVisible,
    gridBodyHeight,
    scrollTop
  };
}
