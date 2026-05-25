'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'

interface UsePaginationOptions {
  totalItems?: number
  initialPageSize?: number
}

interface UsePaginationReturn<T> {
  currentPage: number
  pageSize: number
  totalPages: number
  startIndex: number
  endIndex: number
  paginatedData: T[]
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  nextPage: () => void
  prevPage: () => void
}

export function usePagination<T>(
  data: T[],
  options?: UsePaginationOptions
): UsePaginationReturn<T> {
  const initialPageSize = options?.initialPageSize ?? 25

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(initialPageSize)

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))

  // Reset page to 1 when data length changes (via useEffect instead of during render)
  const lastDataLengthRef = useRef(data.length)
  useEffect(() => {
    if (data.length !== lastDataLengthRef.current) {
      lastDataLengthRef.current = data.length
      setCurrentPage(1)
    }
  }, [data.length])

  // Clamp page when total pages shrink (e.g. pageSize increases)
  const effectivePage = Math.min(currentPage, totalPages)

  const startIndex = (effectivePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, data.length)

  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex)
  }, [data, startIndex, endIndex])

  const setPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    },
    [totalPages]
  )

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setCurrentPage(1)
  }, [])

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }, [totalPages])

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }, [])

  return {
    currentPage: effectivePage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    paginatedData,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
  }
}
