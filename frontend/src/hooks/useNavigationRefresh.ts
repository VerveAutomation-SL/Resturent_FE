import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';

/**
 * Custom hook that provides manual refresh functionality for queries
 */
export function useNavigationRefresh(queryKeys?: string[]) {
  const queryClient = useQueryClient();
  const location = useLocation();

  // Return only manual refresh function
  const manualRefresh = async () => {
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
    }
  };

  return { manualRefresh };
}