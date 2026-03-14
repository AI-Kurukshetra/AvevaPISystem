"use client";

import { useEffect, useMemo, useState } from "react";

interface UsePaginationOptions {
  pageSize?: number;
}

export function usePagination<T>(items: T[], options?: UsePaginationOptions) {
  const pageSize = options?.pageSize ?? 10;
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [items.length]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const startItem = items.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, items.length);

  return {
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems: items.length,
    startItem,
    endItem,
    pagedItems
  };
}
