import React from 'react';

const DEFAULT_PAGE_SIZE = 10;
const LOAD_DELAY_MS = 350;

type InfiniteDataOptions<T> = {
  total: number;
  createItem: (index: number) => T;
  pageSize?: number;
  resetKey?: string | number;
};

/**
 * Small paged-data controller for the offline UI demo.
 *
 * It mirrors a real cursor-based request: only one page is appended at a time,
 * duplicate end-reached events are ignored, stale requests are cancelled when
 * a filter changes, and pull-to-refresh starts again from page one.
 */
export function useInfiniteData<T>({
  total,
  createItem,
  pageSize = DEFAULT_PAGE_SIZE,
  resetKey = 'default',
}: InfiniteDataOptions<T>) {
  const factoryRef = React.useRef(createItem);
  const generationRef = React.useRef(0);
  const loadingRef = React.useRef(false);
  const mountedRef = React.useRef(true);
  const safeTotal = Math.max(0, total);

  factoryRef.current = createItem;

  const makePage = React.useCallback(
    (start: number) => {
      const end = Math.min(start + pageSize, safeTotal);
      return Array.from({ length: Math.max(0, end - start) }, (_, offset) => factoryRef.current(start + offset));
    },
    [pageSize, safeTotal],
  );

  const [items, setItems] = React.useState<T[]>(() => makePage(0));
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
    };
  }, []);

  React.useEffect(() => {
    generationRef.current += 1;
    loadingRef.current = false;
    setIsLoadingMore(false);
    setIsRefreshing(false);
    setItems(makePage(0));
  }, [makePage, resetKey]);

  const wait = React.useCallback(() => new Promise<void>((resolve) => setTimeout(resolve, LOAD_DELAY_MS)), []);

  const loadMore = React.useCallback(async () => {
    if (loadingRef.current || items.length >= safeTotal) return;

    const requestGeneration = generationRef.current;
    loadingRef.current = true;
    setIsLoadingMore(true);
    await wait();

    if (!mountedRef.current || requestGeneration !== generationRef.current) return;

    setItems((current) => {
      if (current.length >= safeTotal) return current;
      return [...current, ...makePage(current.length)];
    });
    loadingRef.current = false;
    setIsLoadingMore(false);
  }, [items.length, makePage, safeTotal, wait]);

  const refresh = React.useCallback(async () => {
    const requestGeneration = generationRef.current + 1;
    generationRef.current = requestGeneration;
    loadingRef.current = true;
    setIsLoadingMore(false);
    setIsRefreshing(true);
    await wait();

    if (!mountedRef.current || requestGeneration !== generationRef.current) return;

    setItems(makePage(0));
    loadingRef.current = false;
    setIsRefreshing(false);
  }, [makePage, wait]);

  return {
    items,
    loadMore,
    refresh,
    isLoadingMore,
    isRefreshing,
    hasMore: items.length < safeTotal,
    loadedCount: items.length,
    total: safeTotal,
  };
}
