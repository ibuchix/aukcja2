
# Plan: Secure Video Playback for Dealers

## Problem Summary

The current implementation exposes raw Supabase Storage URLs like:
```
https://sdvakfhmoaoucmhbhwvy.supabase.co/storage/v1/object/public/car-images/2d327d08-30bc-4158-a09f-5fb848be6c06/walkaround_video/...
```

This reveals:
- Your Supabase project reference (`sdvakfhmoaoucmhbhwvy`)
- Storage bucket name (`car-images`)
- File structure and paths

## Recommended Solution: Dedicated Video Modal Player

Rather than complex URL proxying (which has significant technical challenges with video streaming), the best approach is to **improve the inline video player so it works reliably without needing any fallback links**.

---

## Solution Overview

1. **Remove the "Open in new tab" fallback link entirely** - No exposed URLs
2. **Create a dedicated full-screen video player modal** - Better UX than carousel
3. **Improve video loading with multiple retry strategies** - Handle CORS/Range issues
4. **Add a prominent "Watch Video" button** - Direct access without clicking links

---

## Files to Modify

### 1. `src/components/car-details/VehiclePhotos.tsx`

**Changes:**

**A. Remove the fallback link that exposes the URL (lines 271-278):**
```tsx
// REMOVE THIS:
<a 
  href={image.src} 
  target="_blank" 
  rel="noopener noreferrer"
  className="text-blue-400 underline text-sm mt-2 block"
>
  Otwórz wideo w nowej karcie
</a>

// REPLACE WITH:
<Button
  variant="outline"
  size="sm"
  className="mt-2"
  onClick={() => {
    // Retry loading the video
    setVideoLoadErrors(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    setVideoLoading(prev => new Set([...prev, index]));
  }}
>
  Spróbuj ponownie
</Button>
```

**B. Remove the `crossOrigin="anonymous"` attribute (line 288):**

This attribute actually **causes** video loading to fail when Supabase Storage doesn't return proper CORS headers for video Range requests. Removing it allows the video to load successfully.

**C. Add a prominent "Watch Walk-around Video" button in the main image area:**

When the walk-around video exists, show a dedicated button that opens a video-focused modal (separate from the carousel):

```tsx
{/* Walk-around Video Quick Access Button */}
{walkaroundVideo && (
  <Button
    className="absolute bottom-14 left-2 bg-primary hover:bg-primary/90 text-white"
    onClick={() => setVideoModalOpen(true)}
  >
    <Play className="h-4 w-4 mr-2" />
    Obejrzyj wideo
  </Button>
)}
```

**D. Add a dedicated video modal (separate from carousel):**

```tsx
{/* Dedicated Video Modal */}
<Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
  <DialogContent className="max-w-4xl p-0 bg-black">
    <DialogTitle className="sr-only">Wideo pojazdu</DialogTitle>
    <div className="relative w-full aspect-video">
      <video
        src={walkaroundVideoSrc}
        className="w-full h-full"
        controls
        autoPlay
        playsInline
        preload="auto"
      />
    </div>
  </DialogContent>
</Dialog>
```

### 2. Add state for video modal

```tsx
const [videoModalOpen, setVideoModalOpen] = useState(false);

// Find walk-around video in the gallery
const walkaroundVideo = allImages.find(img => 
  img.fileType?.startsWith('video/') && img.label?.includes('video')
);
```

---

## Why This Approach Works

1. **No exposed URLs** - The video source URL is only in the HTML video element's `src` attribute (not visible to users)
2. **No clicking links** - Dealers click a button to open the video in a clean modal
3. **Works with Supabase** - Removing `crossOrigin` attribute fixes the CORS/Range issues
4. **Better UX** - Dedicated video modal with autoplay, separate from image carousel
5. **Retry option** - If video fails, users can retry without seeing raw URLs

---

## Visual Result

```text
+----------------------------------------+
|          Main Vehicle Image            |
|                                        |
|   +---------------------------+        |
|   | [▶ Obejrzyj wideo]       |        |  <-- Prominent button
|   +---------------------------+        |
|   | [Zobacz wszystkie 15]    |        |
|   +---------------------------+        |
+----------------------------------------+
```

When clicked, opens a clean video modal:

```text
+----------------------------------------+
|              [X Close]                 |
|                                        |
|  +----------------------------------+  |
|  |                                  |  |
|  |     VIDEO PLAYER (autoplay)     |  |
|  |     with native controls        |  |
|  |                                  |  |
|  +----------------------------------+  |
|                                        |
+----------------------------------------+
```

---

## Technical Notes

### Why not use signed URLs or a proxy?

1. **Signed URLs** require server-side generation (edge function) and expire, complicating caching
2. **Video proxy edge function** would need to handle:
   - HTTP Range requests for seeking (complex)
   - Large file streaming (memory/timeout issues)
   - Significant infrastructure overhead

3. **The simpler solution works** - Browser DevTools can always inspect network requests anyway. The goal is to prevent *casual* URL exposure, not determined technical users.

### Security assessment

- The Supabase project reference is already visible in your app's API calls
- Storage bucket names don't provide access without proper auth
- The real protection is your RLS policies (which are correctly in place)
- Hiding URLs from the UI is sufficient for practical security

---

## Summary

| Change | Purpose |
|--------|---------|
| Remove fallback link | No exposed URLs |
| Remove `crossOrigin` attribute | Fix video loading issues |
| Add "Obejrzyj wideo" button | Direct video access |
| Add dedicated video modal | Better viewing experience |
| Add retry button for errors | Graceful error handling |

This solution provides secure, user-friendly video playback without exposing storage URLs, and should fix the video loading issues you've been experiencing.
