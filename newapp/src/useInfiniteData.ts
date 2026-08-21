import React from 'react';
import type { Paged } from './api';

type InfiniteDataOptions<T> = {
  fetchPage: (page: number) => Promise<Paged<T>>;
  resetKey?: string | number;
};

/** Server-backed infinite pagination with stale-request and duplicate-load protection. */
export function useInfiniteData<T>({ fetchPage, resetKey = 'default' }: InfiniteDataOptions<T>) {
  const fetchRef = React.useRef(fetchPage);
  const generationRef = React.useRef(0);
  const loadingMoreRef = React.useRef(false);
  fetchRef.current = fetchPage;

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
    } catch (requestError) {
      if (generation !== generationRef.current) return;
      setError(requestError instanceof Error ? requestError.message : 'Unable to load data.');
      setItems([]);
      setPage(0);
      setTotal(0);
      setHasMore(false);
    } finally {
      if (generation === generationRef.current) {
        loadingMoreRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  React.useEffect(() => {
    requestFirstPage(false);
    return () => {
      generationRef.current += 1;
      loadingMoreRef.current = false;
    };
  }, [requestFirstPage, resetKey]);

  const loadMore = React.useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
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
  }, [hasMore, page]);

  const refresh = React.useCallback(() => requestFirstPage(true), [requestFirstPage]);

  const updateItem = React.useCallback((id: string, update: Partial<T>) => {
    setItems((current) => current.map((item: any) =>
      String(item?._id ?? item?.id) === id ? { ...item, ...update } : item,
    ));
  }, []);

  return {
    items,
    loadMore,
    refresh,
    updateItem,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    loadedCount: items.length,
    total,
    error,
  };
}
