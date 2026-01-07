import { FC, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useFeed } from '../hooks/useFeed';
import { FeedWorkoutCard } from '../components/social/FeedWorkoutCard';
import { Card } from '../components/ui';

export const Feed: FC = () => {
  const {
    workouts,
    likeSummaries,
    commentCounts,
    previewComments,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    updateLikeSummary,
    updateCommentCount,
    updatePreviewComments,
  } = useFeed();

  const loadMoreRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Activity Feed</h1>
        <button
          onClick={refresh}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Refresh"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive/50">
          <p className="text-destructive text-sm">{error}</p>
        </Card>
      )}

      {workouts.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="font-semibold mb-1">No workouts yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            When your friends complete workouts, they'll appear here
          </p>
          <Link
            to="/friends"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Find Friends
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
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
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
            {!hasMore && workouts.length > 0 && (
              <p className="text-sm text-muted-foreground">You've seen all recent workouts</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
