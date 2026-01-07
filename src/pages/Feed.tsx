import { FC, useEffect, useRef, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFeed } from '../hooks/useFeed';
import { FeedWorkoutCard } from '../components/social/FeedWorkoutCard';
import { Card } from '../components/ui';

const PULL_THRESHOLD = 80; // pixels to pull before triggering refresh

export const Feed: FC = () => {
  const {
    workouts,
    likeSummaries,
    commentCounts,
    previewComments,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore,
    loadMore,
    refresh,
    updateLikeSummary,
    updateCommentCount,
    updatePreviewComments,
  } = useFeed();

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  // Pull-to-refresh touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container || isRefreshing) return;

    // Only start pull if at the top of the scroll container
    if (container.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    // Apply resistance to make it feel more natural
    const resistedDistance = Math.min(distance * 0.5, PULL_THRESHOLD * 1.5);
    setPullDistance(resistedDistance);
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      await refresh();
    }

    setPullDistance(0);
  }, [isPulling, pullDistance, isRefreshing, refresh]);

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoadingMore) {
        loadMore();
      }
    },
    [hasMore, isLoadingMore, loadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading feed...</p>
        </div>
      </div>
    );
  }

  const showPullIndicator = pullDistance > 0 || isRefreshing;
  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{
          height: showPullIndicator ? Math.max(pullDistance, isRefreshing ? 48 : 0) : 0,
        }}
      >
        <div
          className={`flex items-center gap-2 text-sm text-muted-foreground ${
            isRefreshing ? 'opacity-100' : ''
          }`}
          style={{ opacity: isRefreshing ? 1 : pullProgress }}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${pullProgress * 360}deg)`,
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{isRefreshing ? 'Refreshing...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}</span>
        </div>
      </div>

      <div className="px-3 py-2 space-y-3 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold">Activity Feed</h1>

        {error && (
          <Card className="p-3 bg-destructive/10 border-destructive/50">
            <p className="text-destructive text-sm">{error}</p>
          </Card>
        )}

        {workouts.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="font-semibold text-sm mb-1">No workouts yet</h3>
            <p className="text-xs text-muted-foreground mb-3">
              When your friends complete workouts, they'll appear here
            </p>
            <Link
              to="/friends"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Find Friends
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {workouts.map((workout) => (
              <FeedWorkoutCard
                key={workout.id}
                workout={workout}
                initialLikeSummary={likeSummaries[workout.id]}
                initialCommentCount={commentCounts[workout.id] || 0}
                initialPreviewComments={previewComments[workout.id] || []}
                onLikeSummaryChange={updateLikeSummary}
                onCommentCountChange={updateCommentCount}
                onPreviewCommentsChange={updatePreviewComments}
              />
            ))}

            {/* Load more trigger */}
            <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
              {isLoadingMore && (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
              {!hasMore && workouts.length > 0 && (
                <p className="text-xs text-muted-foreground">You've seen all recent workouts</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
