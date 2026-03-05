

# Fix: Car Images Not Loading After Storage Security Changes

## Root Cause

The `car-images` storage bucket was changed from **public** to **private** (`public: false`) during recent security improvements. However, the entire codebase uses `getPublicUrl()` to generate image URLs. When a bucket is private, `getPublicUrl()` still returns a URL, but Supabase returns a **403 Forbidden** when anyone tries to load that URL — causing all car images to fail.

## Recommended Fix: Make `car-images` bucket public again

Car listing photos are not sensitive data. They are meant to be seen by all dealers (and potentially on public-facing pages). Making this bucket public is the correct approach. The RLS SELECT policies already in place (e.g., "Allow public read access to car-images") will continue to work, and the existing `getPublicUrl()` calls throughout the codebase will function again.

**Single SQL migration:**

```sql
UPDATE storage.buckets 
SET public = true 
WHERE id = 'car-images';
```

This one statement restores image loading across the entire app without any code changes.

## Why Not Use Signed URLs Instead?

Switching to `createSignedUrl()` would require:
- Changing every image URL generation call across 3+ files
- Adding async/await where URLs are currently generated synchronously
- Managing URL expiration and refresh logic
- Significant refactoring of components that display images

This is unnecessary complexity for non-sensitive car photos.

## What Stays Secure

- The `dealer-documents` bucket remains private (sensitive dealer files)
- The `manual-valuation-photos` bucket remains private with its RLS policies restricting access to verified dealers viewing active auctions
- Upload policies still require authentication — anonymous users cannot upload
- Delete/update policies still require ownership

## No Code Changes Required

All existing code already uses `getPublicUrl()` correctly. The only issue is the bucket visibility flag.

