import { useEffect, useRef } from 'react';
import { useImagePrefetch } from './useImagePrefetch';
import { CarListing } from '@/types/cars';
import { getPrimaryImage } from '@/utils/imageUtils';

interface UseScrollPrefetchProps {
  items: CarListing[];
  lookahead?: number; // How many items ahead to prefetch
  threshold?: number; // Scroll percentage to trigger prefetch (0-1)
}

/**
 * Hook to prefetch images as user scrolls
 * Prefetches images for upcoming items before they become visible
 */
export const useScrollPrefetch = ({ 
  items, 
  lookahead = 6, 
  threshold = 0.7 
}: UseScrollPrefetchProps) => {
  const { prefetchImages } = useImagePrefetch();
  const lastScrollY = useRef(0);
  const prefetchedIndices = useRef(new Set<number>());

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Calculate scroll percentage
      const scrollPercentage = (scrollY + windowHeight) / documentHeight;
      
      // Only prefetch when scrolling down and past threshold
      if (scrollY > lastScrollY.current && scrollPercentage > threshold) {
        // Calculate which items are currently visible
        const itemsPerRow = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
        const estimatedItemHeight = 400; // Approximate height of card + gap
        const visibleStartIndex = Math.floor(scrollY / estimatedItemHeight) * itemsPerRow;
        
        // Prefetch next batch of images
        const startIndex = visibleStartIndex + itemsPerRow * 2; // Start from 2 rows below visible
        const endIndex = Math.min(startIndex + lookahead, items.length);
        
        const imagesToPrefetch: string[] = [];
        
        for (let i = startIndex; i < endIndex; i++) {
          if (!prefetchedIndices.current.has(i) && items[i]) {
            const imageUrl = getPrimaryImage(items[i]);
            if (imageUrl && imageUrl !== '/placeholder.svg') {
              imagesToPrefetch.push(imageUrl);
              prefetchedIndices.current.add(i);
            }
          }
        }
        
        if (imagesToPrefetch.length > 0) {
          console.debug(`Prefetching ${imagesToPrefetch.length} images for scroll position ${scrollPercentage.toFixed(2)}`);
          prefetchImages(imagesToPrefetch);
        }
      }
      
      lastScrollY.current = scrollY;
    };

    // Throttle scroll events to once every 150ms
    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null as any;
      }, 150);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [items, lookahead, threshold, prefetchImages]);

  // Reset prefetched indices when items change
  useEffect(() => {
    prefetchedIndices.current.clear();
  }, [items]);
};
