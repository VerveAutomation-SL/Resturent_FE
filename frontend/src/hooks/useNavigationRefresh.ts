import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import { useState } from 'react';

/**
 * Custom hook that provides manual refresh functionality for queries
 * and a loading flag that is true while a manual refresh is in progress.
 */
export function useNavigationRefresh(queryKeys?: string[]) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manual refresh function
  const manualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (queryKeys && queryKeys.length > 0) {
        await Promise.all(
          queryKeys.map((key) =>
            queryClient.invalidateQueries({ queryKey: [key] })
          )
        );
      } else {
        await queryClient.invalidateQueries();
      }
      console.log('🔄 Manual data refresh completed for:', location.pathname);
    } catch (error) {
      console.error('Failed to manually refresh data:', error);
    } finally {
      // slight delay to avoid flicker when refetch is very fast
      setTimeout(() => setIsRefreshing(false), 150);
    }
  };

  return { manualRefresh, isRefreshing };
}