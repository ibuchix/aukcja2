

# Fix: Images from `manual-valuation-photos` Bucket Not Loading

## Root Cause

The console logs reveal the problem clearly. Some cars (like the VW Golf 4) have images stored in the **`manual-valuation-photos`** bucket, not `car-images`. We only made `car-images` public in the last migration. The `manual-valuation-photos` bucket is still **private**, so `getPublicUrl()` returns 403 Forbidden errors.

From the logs:
```
VW Golf 4 → bucket: "manual-valuation-photos" → generates public URL → 403 on mobile
Peugeot 508 → bucket: "car-images" → generates public URL → works fine
```

Desktop may show cached versions from before the bucket was locked down, which is why it appears to work there but fails on mobile (no cache).

## Fix

**Single SQL migration** — make `manual-valuation-photos` bucket public as well:

```sql
UPDATE storage.buckets 
SET public = true 
WHERE id = 'manual-valuation-photos';
```

These are car photos displayed in auction listings to all dealers. They are not sensitive data and must be publicly accessible for the auction to function.

## No Code Changes Required

The `getStorageImageUrl()` function in `carFileUploads.ts` already correctly detects the bucket and generates URLs. The only issue is the bucket's visibility flag blocking access.

## What Stays Secure

- `dealer-documents` bucket remains private (sensitive dealer identity documents)
- Upload/delete policies still require authentication
- Only read access becomes public — matching the intended use case

