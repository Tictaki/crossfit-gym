import api from './api';

/**
 * Global fetcher function for SWR caching
 * Calls our pre-configured Axios API instance to ensure base URLs and interceptors apply.
 *
 * @param {string} url - The API endpoint to fetch
 * @returns {Promise<any>} The parsed data from axios response
 */
export const fetcher = url => api.get(url).then(res => res.data);

/**
 * Recommended global configuration options for SWR in this application.
 * Balances fresh data with reduced perceived loading times.
 */
export const swrConfig = {
  fetcher,
  revalidateOnFocus: false,      // Prevent barrage of fetches when user switches tabs back and forth
  revalidateIfStale: true,       // Get fresh data in background if cache is stale
  dedupingInterval: 5000,        // Cache identically duplicate requests strictly within 5s metric
  errorRetryCount: 2             // Limit failing background retries to save server load
};
