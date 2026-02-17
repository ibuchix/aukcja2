

# Fix: Gallery Close Button Frame Shift (Video-Only Bug)

## Root Cause
The video slide wrapper in `VehiclePhotos.tsx` (lines 317-329) calls `stopPropagation()` on all pointer/mouse/touch events to prevent the Embla Carousel from hijacking video controls. This creates an inconsistency: the carousel doesn't see any pointer activity during the video slide, but when the close "X" button is clicked (which sits outside this wrapper, at the `DialogContent` level), Embla suddenly receives an unexpected pointer event and misinterprets it as a drag gesture, shifting the frame.

Images don't have this problem because `TransformWrapper` manages pointer events differently and doesn't create this Embla inconsistency.

## Fix (1 change in 1 file)

### File: `src/components/car-details/VehiclePhotos.tsx`

On the gallery `DialogContent` (around line 293):

1. Add `[&>button]:hidden` to the className to hide the default Radix close button
2. Import `DialogClose` from the dialog component
3. Add a custom close button inside the dialog that calls `e.stopPropagation()` on both `onPointerDown` and `onClick`

```tsx
// Import DialogClose alongside existing dialog imports
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";

// On the DialogContent, hide the default close button:
<DialogContent className={cn(
  "max-w-6xl w-full p-0 [&>button]:hidden",
  isMobile ? "h-screen" : "h-[90vh]"
)}>
  <DialogTitle className="sr-only">Galeria zdjec pojazdu</DialogTitle>
  {/* Custom close button with event isolation */}
  <DialogClose
    className="absolute right-4 top-4 z-50 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
    onClick={(e) => e.stopPropagation()}
    onPointerDown={(e) => e.stopPropagation()}
  >
    <X className="h-5 w-5" />
    <span className="sr-only">Close</span>
  </DialogClose>
  ...
```

## Why This Works
- `onPointerDown` stopPropagation prevents Embla from initiating a drag sequence
- `onClick` stopPropagation prevents the click from reaching the carousel
- The fix is scoped to the gallery dialog only -- no other dialogs are affected
- The custom button is styled to be clearly visible over the dark gallery background

## Impact
- Closing the gallery on a video slide will no longer cause a frame shift
- Image slides remain unaffected (they already work correctly)
- The close button gets a slightly improved look (rounded, semi-transparent background) for better visibility on dark gallery backgrounds
