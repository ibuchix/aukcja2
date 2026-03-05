

# Security & Access Audit: Dealer Operations After Bucket Changes

## Summary

After reviewing all relevant RLS policies on storage, cars, bids, car_file_uploads, and dealer_wishlists — **everything is correctly configured**. The bucket visibility changes do not affect any dealer operations. No code or migration changes are needed.

## Detailed Findings

### 1. Image/Media Access (Storage Buckets)
- **`car-images`** — now public. `getPublicUrl()` works. Write policies (upload/delete) still require authentication. No issue.
- **`manual-valuation-photos`** — now public. `getPublicUrl()` works. Write policies still restricted to sellers/admins. No issue.
- **`dealer-documents`** — remains private. Not affected.

Making a bucket "public" only affects **read access** (anonymous GET requests). Upload, update, and delete operations still require authentication and pass through RLS policies. Dealers cannot tamper with images they do not own.

### 2. Placing Bids
The `bids` table RLS correctly allows verified dealers to:
- **INSERT** their own bids (dealer_id matches their profile)
- **UPDATE** their own bids
- **DELETE** their own bids
- **SELECT** their own bids + bids on cars they're bidding on

The `place_bid` RPC function handles bid logic server-side. No storage bucket change affects this.

### 3. Adding Cars to Favourites (Wishlists)
The `dealer_wishlists` table RLS correctly allows verified dealers to:
- **INSERT** to their own wishlist
- **DELETE** from their own wishlist
- **SELECT** their own wishlist

No dependency on storage bucket visibility.

### 4. Viewing Car Data & File Uploads
- **`cars` table**: Verified dealers can view active auction cars, cars they've bid on, and won vehicles. Correct.
- **`car_file_uploads` table**: Verified dealers can view file records for active auction cars and won vehicles. Correct.

### 5. Potential Edge Case (Already Handled)
The `car_file_uploads` RLS policy "Dealers can view active auction car images" requires the auction schedule status to be `'active'`. This means if an auction ends, dealers can no longer query new file upload records for that car — but this is **intentional behavior**. Won vehicle images are covered by a separate policy.

## Conclusion

No changes required. All dealer operations (bidding, favourites, viewing media) are unaffected by the bucket visibility changes. The security model is sound:
- Public buckets = anyone can **read** images (which is correct for car listings)
- RLS on tables = still controls who can **write/modify** data
- Write policies on storage = still controls who can **upload/delete** files

