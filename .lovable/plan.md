

# Plan: Reliable Single-Modal Video Player for Dealers

## Problem Summary

The current implementation shows fallback buttons (as seen in your screenshot) when video fails to load. You want a single, reliable video player that opens in a modal with volume controls - no fallbacks, just one working solution.

The root cause is that native HTML5 video elements struggle with:
1. URLs containing special characters (like "WhatsApp Video...")
2. Public Supabase Storage URLs that may have CORS/Range header issues

---

## Solution: Signed URL Video Player

Instead of trying to fix the public URL approach, we'll use **Supabase Signed URLs** which are more reliable for video streaming because they:
- Generate a clean, authenticated path for the browser's video engine
- Bypass CORS preflight issues
- Work consistently across browsers

---

## Implementation

### Files to Modify

#### 1. `src/utils/imageUtils/carFileUploads.ts`

**Add a new function to generate signed URLs for videos:**

```typescript
/**
 * Generate a signed URL for video playback
 * Signed URLs are more reliable for video streaming than public URLs
 */
export const getSignedVideoUrl = async (filePath: string): Promise<string> => {
  if (!filePath) return '';
  
  // If already a full URL, extract the path
  let actualPath = filePath;
  if (filePath.includes('/storage/v1/object/public/')) {
    // Extract path after bucket name
    const match = filePath.match(/\/storage\/v1\/object\/public\/car-images\/(.+)/);
    if (match) {
      actualPath = match[1];
    }
  }
  
  const { data, error } = await supabase.storage
    .from('car-images')
    .createSignedUrl(actualPath, 3600); // 1 hour expiry
  
  if (error || !data?.signedUrl) {
    console.error('Failed to create signed URL:', error);
    return filePath; // Fallback to original URL
  }
  
  return data.signedUrl;
};
```

---

#### 2. `src/components/car-details/VehiclePhotos.tsx`

**A. Remove the iframe fallback approach entirely:**
- Remove `iframePlayerOpen` and `iframePlayerSrc` state
- Remove the iframe Dialog component
- Remove the "Odtwórz w nowym oknie" fallback button

**B. Add signed URL state for the video modal:**
```typescript
const [videoModalOpen, setVideoModalOpen] = useState(false);
const [signedVideoUrl, setSignedVideoUrl] = useState<string>('');
const [videoModalLoading, setVideoModalLoading] = useState(false);
const [videoModalError, setVideoModalError] = useState(false);
const modalVideoRef = useRef<HTMLVideoElement>(null);
```

**C. Add function to open video modal with signed URL:**
```typescript
const openVideoModal = async () => {
  if (!walkaroundVideoSrc) return;
  
  setVideoModalOpen(true);
  setVideoModalLoading(true);
  setVideoModalError(false);
  
  try {
    // Generate signed URL for reliable video streaming
    const signedUrl = await getSignedVideoUrl(walkaroundVideoSrc);
    setSignedVideoUrl(signedUrl);
    setVideoModalLoading(false);
  } catch (error) {
    console.error('Failed to generate signed video URL:', error);
    // Fall back to normalized public URL
    setSignedVideoUrl(normalizeVideoUrl(walkaroundVideoSrc));
    setVideoModalLoading(false);
  }
};
```

**D. Create a dedicated video modal with volume controls:**

Replace the current video modal with a clean, full-featured player:

```tsx
{/* Dedicated Video Modal with Volume Controls */}
<Dialog open={videoModalOpen} onOpenChange={(open) => {
  setVideoModalOpen(open);
  if (!open) {
    setSignedVideoUrl('');
    setVideoModalError(false);
  }
}}>
  <DialogContent className="max-w-5xl p-0 bg-black border-0">
    <DialogTitle className="sr-only">Wideo pojazdu</DialogTitle>
    
    {videoModalLoading ? (
      <div className="w-full aspect-video flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    ) : videoModalError ? (
      <div className="w-full aspect-video flex flex-col items-center justify-center text-white">
        <Camera className="h-12 w-12 mb-4 opacity-50" />
        <p className="mb-4">Nie udało się załadować wideo</p>
        <Button
          variant="outline"
          onClick={() => {
            setVideoModalError(false);
            openVideoModal();
          }}
        >
          Spróbuj ponownie
        </Button>
      </div>
    ) : (
      <div className="relative">
        <video
          ref={modalVideoRef}
          className="w-full aspect-video"
          controls
          autoPlay
          playsInline
          preload="auto"
          onError={() => setVideoModalError(true)}
        >
          <source src={signedVideoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Volume Control Bar */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-3 z-20">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => {
              if (modalVideoRef.current) {
                modalVideoRef.current.muted = !modalVideoRef.current.muted;
                setIsMuted(modalVideoRef.current.muted);
              }
            }}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : videoVolume * 100]}
            max={100}
            step={1}
            onValueChange={(values) => {
              const newVolume = values[0] / 100;
              setVideoVolume(newVolume);
              if (modalVideoRef.current) {
                modalVideoRef.current.volume = newVolume;
                modalVideoRef.current.muted = newVolume === 0;
                setIsMuted(newVolume === 0);
              }
            }}
            className="w-24"
          />
          <span className="text-white text-xs min-w-[2rem] text-right">
            {isMuted ? 0 : Math.round(videoVolume * 100)}%
          </span>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
```

**E. Update the "Watch Video" button to use the new function:**
```tsx
{walkaroundVideo && (
  <Button
    className="absolute bottom-2 left-2 bg-primary hover:bg-primary/90 text-white"
    size="sm"
    onClick={openVideoModal}
  >
    <Play className="h-4 w-4 mr-2" />
    Obejrzyj wideo
  </Button>
)}
```

**F. Simplify the carousel video player (remove fallback buttons):**

In the carousel, replace the error state with multiple buttons with a simple retry:

```tsx
{videoLoadErrors.has(index) ? (
  <div className="text-center text-white p-4">
    <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
    <p className="mb-4">Nie udało się załadować wideo</p>
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
  </div>
) : (
  // video element...
)}
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `carFileUploads.ts` | Add `getSignedVideoUrl()` function |
| `VehiclePhotos.tsx` | Remove iframe fallback state and dialog |
| `VehiclePhotos.tsx` | Add signed URL video modal with loading state |
| `VehiclePhotos.tsx` | Add volume controls to video modal |
| `VehiclePhotos.tsx` | Simplify carousel error state (single retry button) |

---

## User Experience

1. **Dealer clicks "Obejrzyj wideo" button** on the auction page
2. **Modal opens immediately** with a loading spinner while signed URL generates
3. **Video plays automatically** with visible native controls
4. **Custom volume slider** appears below video for easy adjustment
5. **If error occurs**: Clean retry button (no confusing multiple options)

---

## Technical Notes

### Why Signed URLs?

| Approach | Reliability | Security |
|----------|-------------|----------|
| Public URL | Medium - fails with special chars | Shows bucket structure |
| Normalized URL | Better - handles encoding | Shows bucket structure |
| **Signed URL** | **Best - authenticated path** | **Hides internal structure** |

Signed URLs provide a clean, temporary authenticated path that:
- Expires after 1 hour (configurable)
- Works consistently across browsers
- Handles special characters automatically
- Does not expose your bucket structure

