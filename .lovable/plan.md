

# Plan: Fix Video Playback in Dealer Auction Interface

## Problem Identified

The video fails to load in both the gallery carousel and dedicated modal with the error:
```
Video load error: https://...car-images/.../1769448295335-WhatsApp%20Video%202026-01-26%20at%2017.23.56.mp4
```

**Root Causes:**
1. The filename contains spaces and special characters ("WhatsApp Video 2026-01-26 at 17.23.56.mp4")
2. Browser video elements can struggle with URL-encoded paths for streaming
3. The `preload="metadata"` setting may be too restrictive for some video formats
4. WhatsApp videos sometimes have proprietary encoding that requires more robust handling

---

## Solution: Enhanced Video Player with Multiple Fallback Strategies

### Files to Modify

#### 1. `src/components/car-details/VehiclePhotos.tsx`

**Changes:**

**A. Improve video element settings for better compatibility:**
- Change `preload="metadata"` to `preload="auto"` for carousel videos
- Add explicit `type="video/mp4"` using a `<source>` element instead of direct `src`
- Add a fallback empty source for better error handling

**B. Add a video URL normalization function:**
```typescript
// Normalize video URL to fix encoding issues
const normalizeVideoUrl = (url: string): string => {
  if (!url) return '';
  try {
    // Decode first to avoid double-encoding, then re-encode properly
    const decoded = decodeURIComponent(url);
    const urlObj = new URL(decoded);
    // Re-encode only the pathname portion
    urlObj.pathname = urlObj.pathname
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');
    return urlObj.toString();
  } catch {
    return url;
  }
};
```

**C. Update the carousel video player (around lines 309-338):**
```tsx
<video
  ref={(el) => setVideoRef(index, el)}
  className="max-w-full max-h-full object-contain"
  controls
  playsInline
  preload="auto"
  onLoadStart={() => {
    console.log('Video loading started:', image.src);
    setVideoLoading(prev => new Set([...prev, index]));
  }}
  onCanPlay={() => {
    console.log('Video can play:', image.src);
    setVideoLoading(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }}
  onError={(e) => {
    console.error('Video load error:', image.src, e);
    setVideoLoadErrors(prev => new Set([...prev, index]));
  }}
  style={{ 
    width: 'auto', 
    height: 'auto',
    maxHeight: '100%',
    maxWidth: '100%'
  }}
>
  <source src={normalizeVideoUrl(image.src)} type="video/mp4" />
  Your browser does not support the video tag.
</video>
```

**D. Update the dedicated video modal (around lines 508-515):**
```tsx
<video
  className="w-full h-full"
  controls
  autoPlay
  playsInline
  preload="auto"
>
  <source src={normalizeVideoUrl(walkaroundVideoSrc)} type="video/mp4" />
  Your browser does not support the video tag.
</video>
```

**E. Add an iframe fallback option for stubborn videos:**

If the video still fails to load, offer an iframe-based player as a last resort (which bypasses some browser restrictions):

```tsx
{videoLoadErrors.has(index) ? (
  <div className="text-center text-white p-4">
    <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
    <p className="mb-4">Nie udało się załadować wideo</p>
    <div className="flex flex-col gap-2 items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setVideoLoadErrors(prev => {
            const next = new Set(prev);
            next.delete(index);
            return next;
          });
        }}
      >
        Spróbuj ponownie
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          // Open in iframe player mode
          setIframePlayerSrc(image.src);
          setIframePlayerOpen(true);
        }}
      >
        Odtwórz w nowym oknie
      </Button>
    </div>
  </div>
) : (
  // ... video element
)}
```

**F. Add an iframe-based player dialog as ultimate fallback:**
```tsx
{/* Iframe Player Fallback */}
<Dialog open={iframePlayerOpen} onOpenChange={setIframePlayerOpen}>
  <DialogContent className="max-w-4xl p-0 bg-black border-0">
    <DialogTitle className="sr-only">Odtwarzacz wideo</DialogTitle>
    <div className="relative w-full aspect-video">
      <iframe
        src={iframePlayerSrc}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen"
        title="Video player"
      />
    </div>
  </DialogContent>
</Dialog>
```

---

## Technical Details

### Why This Approach Works

1. **`<source>` element with explicit type**: Better browser compatibility than direct `src` attribute
2. **URL normalization**: Fixes double-encoding issues with special characters
3. **`preload="auto"`**: More aggressive preloading helps with streaming
4. **Multiple fallback options**: Retry button and alternative player options
5. **No external dependencies**: Uses native browser features

### Alternative Approaches Considered

| Approach | Pros | Cons |
|----------|------|------|
| Video.js library | Robust, handles streaming well | Adds ~100KB dependency |
| Signed URLs | More secure | Requires edge function, URLs expire |
| Video proxy | Hides all URLs | Complex, memory issues for large files |
| **Native enhancements** | No dependencies, fast | May still fail for edge cases |

The native enhancement approach was chosen as it solves the immediate issue without adding complexity.

---

## Summary of Changes

| File | Change |
|------|--------|
| `VehiclePhotos.tsx` | Add `normalizeVideoUrl` helper function |
| `VehiclePhotos.tsx` | Change `src` to `<source>` element with type |
| `VehiclePhotos.tsx` | Change `preload="metadata"` to `preload="auto"` |
| `VehiclePhotos.tsx` | Add iframe fallback state and dialog |
| `VehiclePhotos.tsx` | Add "Odtwórz w nowym oknie" fallback button |

This solution maintains the security improvements from the previous implementation while fixing the video playback reliability issue.

