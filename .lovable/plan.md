

# Fix Video Playback for Auction Cars

## Problem Found
After investigating car `e32f42b5-6c3b-467e-8bac-0abe0e240c65` (2015 Opel Cross):

1. **The video EXISTS** in both the database (`car_file_uploads` table) and Supabase Storage (`car-images` bucket). It is a `video/mp4` file with status `completed`.

2. **Root cause**: The walk-around video detection logic in `VehiclePhotos.tsx` has a broken condition. It uses an `AND` check requiring BOTH the `fileType` to start with `video/` AND the `label` to contain "video" or "walkaround". However, the labels are generated as "IMAGE 1", "IMAGE 2", etc. -- they never contain the word "video" or "walkaround". This means:
   - The "Obejrzyj wideo" (Watch video) button **never appears**
   - The signed-URL video modal **never opens**
   - The video only shows inline in the gallery carousel, where a separate `normalizeVideoUrl` function can introduce URL encoding bugs for filenames with spaces (like WhatsApp videos)

3. **Secondary issue**: The `normalizeVideoUrl` function decodes and re-encodes URLs, which can break URLs that Supabase's `getPublicUrl` already encoded correctly -- especially for filenames with spaces like `WhatsApp Video 2026-01-28 at 15.42.17.mp4`.

## Fix (2 changes in 1 file)

### File: `src/components/car-details/VehiclePhotos.tsx`

**Change 1 -- Fix video detection (line 74-76)**

Replace the overly restrictive AND condition with a simpler check that only requires the `fileType` to start with `video/`:

```typescript
// Before (broken -- label never matches):
const walkaroundVideo = allImages.find(img => 
  img.fileType?.startsWith('video/') && (img.label?.toLowerCase().includes('video') || img.label?.toLowerCase().includes('walkaround'))
);

// After (fixed -- only checks file type):
const walkaroundVideo = allImages.find(img => 
  img.fileType?.startsWith('video/')
);
```

This restores the "Obejrzyj wideo" button and enables the signed-URL modal (which is the most reliable playback method, per the existing memory notes).

**Change 2 -- Fix inline video URL encoding (line 381)**

For the gallery carousel's inline video player, use `image.src` directly instead of passing it through `normalizeVideoUrl`, which can corrupt already-encoded URLs:

```typescript
// Before:
<source src={normalizeVideoUrl(image.src)} type="video/mp4" />

// After:
<source src={image.src} type="video/mp4" />
```

The `getPublicUrl` from Supabase already handles URL encoding correctly. The `normalizeVideoUrl` decode/re-encode cycle can break filenames with spaces.

## Impact
- The "Obejrzyj wideo" button will appear for all cars that have a walk-around video
- Clicking it opens the reliable signed-URL modal (1-hour expiry, handles special characters)
- Inline gallery video playback will also work correctly for WhatsApp-named files
- No new files or dependencies needed
- Affects all cars with videos, not just this one

## Technical Details
- Only 1 file modified: `src/components/car-details/VehiclePhotos.tsx`
- 2 line-level changes (no structural changes)
- The signed URL modal (the preferred playback path) was already fully implemented but unreachable due to the label detection bug
