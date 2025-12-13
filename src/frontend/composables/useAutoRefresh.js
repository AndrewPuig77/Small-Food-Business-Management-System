import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Auto-refresh composable for real-time data synchronization
 * Automatically refreshes data at specified intervals to keep all accounts in sync
 * 
 * @param {Function} refreshCallback - Function to call on each refresh
 * @param {Number} intervalMs - Refresh interval in milliseconds (default: 10000 = 10 seconds)
 * @param {Boolean} immediate - Whether to call refreshCallback immediately on mount (default: true)
 * @returns {Object} - { isRefreshing, manualRefresh, stopRefresh, startRefresh }
 */
export function useAutoRefresh(refreshCallback, intervalMs = 10000, immediate = true) {
  const isRefreshing = ref(false);
  let refreshInterval = null;

  const executeRefresh = async () => {
    if (isRefreshing.value) return; // Prevent concurrent refreshes
    
    try {
      isRefreshing.value = true;
      await refreshCallback();
    } catch (error) {
      console.error('[AutoRefresh] Error during refresh:', error);
    } finally {
      isRefreshing.value = false;
    }
  };

  const startRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(executeRefresh, intervalMs);
    console.log(`[AutoRefresh] Started with interval: ${intervalMs}ms`);
  };

  const stopRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
      console.log('[AutoRefresh] Stopped');
    }
  };

  const manualRefresh = async () => {
    console.log('[AutoRefresh] Manual refresh triggered');
    await executeRefresh();
  };

  onMounted(() => {
    if (immediate) {
      executeRefresh();
    }
    startRefresh();
  });

  onUnmounted(() => {
    stopRefresh();
  });

  return {
    isRefreshing,
    manualRefresh,
    stopRefresh,
    startRefresh
  };
}
