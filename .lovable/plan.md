

# Plan: Fix Video Playback with CSP Media-src Directive

## Root Cause Identified

The error message tells us exactly what's wrong:

```
Refused to load https://sdvakfhmoaoucmhbhwvy.supabase.co/storage/v1/object/public/car-images/... 
because it appears in neither the media-src directive nor the default-src directive of the Content Security Policy.
```

Your Content Security Policy (CSP) has:
- `img-src 'self' data: https:` - allows images from anywhere (works fine)
- **No `media-src` directive** - videos are blocked!

This is a one-line fix in two files.

---

## Solution: Add media-src to CSP

### Files to Modify

#### 1. `index.html` (line 18)

Add `media-src 'self' https:;` to the CSP meta tag:

**Current:**
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://sdvakfhmoaoucmhbhwvy.supabase.co wss://sdvakfhmoaoucmhbhwvy.supabase.co; frame-src https://app.supademo.com; worker-src 'self' blob:;" />
```

**New:**
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; media-src 'self' https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://sdvakfhmoaoucmhbhwvy.supabase.co wss://sdvakfhmoaoucmhbhwvy.supabase.co; frame-src https://app.supademo.com; worker-src 'self' blob:;" />
```

---

#### 2. `vite.config.ts` (line 12)

Add the same `media-src` directive to the server headers:

**Current:**
```typescript
'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://sdvakfhmoaoucmhbhwvy.supabase.co wss://sdvakfhmoaoucmhbhwvy.supabase.co; worker-src 'self' blob:;"
```

**New:**
```typescript
'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; media-src 'self' https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://sdvakfhmoaoucmhbhwvy.supabase.co wss://sdvakfhmoaoucmhbhwvy.supabase.co; worker-src 'self' blob:;"
```

---

## Why This Works

| Directive | Purpose | Current | After Fix |
|-----------|---------|---------|-----------|
| `img-src` | Controls images | `'self' data: https:` | Same |
| `media-src` | Controls video/audio | **Missing!** | `'self' https:` |

The `media-src` directive specifically controls `<video>` and `<audio>` elements. Without it, videos fall back to `default-src 'self'` which only allows media from your own domain - not from Supabase storage.

---

## Summary

| Change | File | Impact |
|--------|------|--------|
| Add `media-src 'self' https:;` | `index.html` | Allows video from Supabase |
| Add `media-src 'self' https:;` | `vite.config.ts` | Dev server also allows video |

This is the simplest possible fix - no code changes to VehiclePhotos, no fallbacks, no complexity. Just tell the browser "yes, you can load videos from external URLs."

