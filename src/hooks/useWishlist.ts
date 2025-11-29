import { useWishlistContext } from '@/contexts/WishlistContext';

/**
 * Hook to access wishlist functionality
 * Must be used within a WishlistProvider
 * 
 * This hook now uses React Query for caching and real-time updates,
 * reducing database queries from N (one per component) to 1 (shared state)
 */
export const useWishlist = () => {
  return useWishlistContext();
};
