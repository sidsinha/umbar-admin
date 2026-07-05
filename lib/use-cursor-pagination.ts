'use client'

import { useCallback, useState } from 'react'

export function useCursorPagination(defaultLimit = 25) {
  const [limit, setLimit] = useState(defaultLimit)
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null])
  const [cursorIndex, setCursorIndex] = useState(0)

  const currentCursor = cursorStack[cursorIndex] ?? null

  const resetPaging = useCallback(() => {
    setCursorStack([null])
    setCursorIndex(0)
  }, [])

  const goNext = useCallback((nextCursor: string | null) => {
    if (!nextCursor) return
    setCursorStack((stack) => {
      const trimmed = stack.slice(0, cursorIndex + 1)
      return [...trimmed, nextCursor]
    })
    setCursorIndex((index) => index + 1)
  }, [cursorIndex])

  const goPrev = useCallback(() => {
    setCursorIndex((index) => Math.max(0, index - 1))
  }, [])

  return {
    limit,
    setLimit,
    currentCursor,
    resetPaging,
    goNext,
    goPrev,
    hasPrev: cursorIndex > 0,
  }
}
