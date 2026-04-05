import { useRef, useState, useCallback } from 'react'

interface Props {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

const PULL_THRESHOLD = 60  // px of overscroll to trigger refresh

/**
 * Wraps the editor pane to detect downward overscroll on iOS and trigger
 * a file re-fetch. Uses a CSS transform on a spinner indicator.
 *
 * Only active when the scroll position is at the top (prevents triggering
 * mid-scroll). On iOS WKWebView, touchmove fires with clientY deltas that
 * can be used to detect the pull gesture.
 */
export function IOSPullToRefresh({ onRefresh, children }: Props) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (refreshing) return
    const container = containerRef.current
    if (!container) return

    // Only trigger pull-to-refresh when scrolled to the top
    if (container.scrollTop > 0) return

    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, PULL_THRESHOLD + 20))
    }
  }, [refreshing])

  const handleTouchEnd = useCallback(async () => {
    if (refreshing) return
    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    }
    setPullDistance(0)
  }, [pullDistance, refreshing, onRefresh])

  const showIndicator = pullDistance > 10 || refreshing
  const indicatorProgress = Math.min(pullDistance / PULL_THRESHOLD, 1)

  return (
    <div
      ref={containerRef}
      className="ios-ptr-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {showIndicator && (
        <div
          className={`ios-ptr-indicator ${refreshing ? 'refreshing' : ''}`}
          style={{ opacity: refreshing ? 1 : indicatorProgress }}
        >
          <div className={`ios-ptr-spinner ${refreshing ? 'spinning' : ''}`} />
        </div>
      )}
      {children}
    </div>
  )
}
