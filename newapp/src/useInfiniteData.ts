import React from 'react';
import type { Paged } from './api';

type InfiniteDataOptions<T> = {
  fetchPage: (page: number) => Promise<Paged<T>>;
  resetKey?: string | number;
};

/** Server-backed infinite pagination with stale-request and duplicate-load protection. */
export function useInfiniteData<T>({ fetchPage, resetKey = 'default' }: InfiniteDataOptions<T>) {
  const fetchRef = React.useRef(fetchPage);
  const resetKeyRef = React.useRef(resetKey);
  const generationRef = React.useRef(0);
  const loadingMoreRef = React.useRef(false);
  fetchRef.current = fetchPage;
  resetKeyRef.current = resetKey;

  const [dataKey, setDataKey] = React.useState(resetKey);
  const [items, setItems] = React.useState<T[]>([]);
  const [page, setPage] = React.useState(0);
  const [total, setTotal] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const requestFirstPage = React.useCallback(async (refreshing: boolean) => {
    const generation = ++generationRef.current;
    const requestKey = resetKeyRef.current;
    loadingMoreRef.current = true;
    setError(null);
    setIsLoading(!refreshing);
    setIsRefreshing(refreshing);
    setIsLoadingMore(false);
    try {
      const response = await fetchRef.current(1);
      if (generation !== generationRef.current) return;
      setItems(response.items);
      setPage(response.pagination.page);
      setTotal(response.pagination.total);
      setHasMore(response.pagination.hasMore);
      setDataKey(requestKey);
    } catch (requestError) {
      if (generation !== generationRef.current) return;
      setError(requestError instanceof Error ? requestError.message : 'Unable to load data.');
      setItems([]);
      setPage(0);
      setTotal(0);
      setHasMore(false);
      setDataKey(requestKey);
    } finally {
      if (generation === generationRef.current) {
        loadingMoreRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  React.useEffect(() => {
    // Remove the previous key's cached rows as soon as the identity/filter key
    // changes. Returned values are also masked synchronously until this runs.
    setItems([]);
    setPage(0);
    setTotal(0);
    setHasMore(true);
    requestFirstPage(false);
    return () => {
      generationRef.current += 1;
      loadingMoreRef.current = false;
    };
  }, [requestFirstPage, resetKey]);

  const loadMore = React.useCallback(async () => {
    if (dataKey !== resetKey || loadingMoreRef.current || !hasMore) return;
    const generation = generationRef.current;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    setError(null);
    try {
      const response = await fetchRef.current(page + 1);
      if (generation !== generationRef.current) return;
      setItems((current) => {
        const existing = new Set(current.map((item: any) => String(item?._id ?? item?.id)));
        return [...current, ...response.items.filter((item: any) => !existing.has(String(item?._id ?? item?.id)))];
      });
      setPage(response.pagination.page);
      setTotal(response.pagination.total);
      setHasMore(response.pagination.hasMore);
    } catch (requestError) {
      if (generation === generationRef.current) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load more data.');
      }
    } finally {
      if (generation === generationRef.current) {
        loadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [dataKey, hasMore, page, resetKey]);

  const refresh = React.useCallback(() => requestFirstPage(true), [requestFirstPage]);

  const updateItem = React.useCallback((id: string, update: Partial<T>) => {
    const callerKey = resetKey;
    setItems((current) => {
      if (callerKey !== resetKeyRef.current) return current;
      return current.map((item: any) =>
        String(item?._id ?? item?.id) === id ? { ...item, ...update } : item);
    });
  }, [resetKey]);

  const isCurrentKey = dataKey === resetKey;
  return {
    items: isCurrentKey ? items : [],
    loadMore,
    refresh,
    updateItem,
    isLoading: isCurrentKey ? isLoading : true,
    isLoadingMore: isCurrentKey ? isLoadingMore : false,
    isRefreshing: isCurrentKey ? isRefreshing : false,
    hasMore: isCurrentKey ? hasMore : false,
    loadedCount: isCurrentKey ? items.length : 0,
    total: isCurrentKey ? total : 0,
    error: isCurrentKey ? error : null,
  };
}
