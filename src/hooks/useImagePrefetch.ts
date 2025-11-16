import { useCallback, useRef } from 'react';

interface PrefetchCache {
  [url: string]: boolean;
}

/**
 * Hook for prefetching images in the background
 * Uses requestIdleCallback to avoid blocking main thread
 */
export const useImagePrefetch = () => {
  const prefetchCache = useRef<PrefetchCache>({});
  const prefetchQueue = useRef<string[]>([]);
  const isProcessing = useRef(false);

  const processPrefetchQueue = useCallback(() => {
    if (isProcessing.current || prefetchQueue.current.length === 0) {
      return;
    }

    isProcessing.current = true;
    const url = prefetchQueue.current.shift();

    if (url && !prefetchCache.current[url]) {
      // Use requestIdleCallback for non-blocking prefetch
      const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
      
      idleCallback(() => {
        const img = new Image();
        img.onload = () => {
          prefetchCache.current[url] = true;
          console.debug(`Prefetched: ${url}`);
        };
        img.onerror = () => {
          console.debug(`Prefetch failed: ${url}`);
        };
        img.src = url;
        
        isProcessing.current = false;
        // Process next item in queue
        processPrefetchQueue();
      });
    } else {
      isProcessing.current = false;
      processPrefetchQueue();
    }
  }, []);

  const prefetchImage = useCallback((url: string) => {
    if (!url || url === '/placeholder.svg' || prefetchCache.current[url]) {
      return;
    }

    // Add to queue if not already there
    if (!prefetchQueue.current.includes(url)) {
      prefetchQueue.current.push(url);
      processPrefetchQueue();
    }
  }, [processPrefetchQueue]);

  const prefetchImages = useCallback((urls: string[]) => {
    urls.forEach(url => prefetchImage(url));
  }, [prefetchImage]);

  return {
    prefetchImage,
    prefetchImages,
  };
};
