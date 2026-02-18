

# Fix Dealer Reviews: Missing Table Permissions

## Problem
The `dealer_reviews` table has RLS enabled and 4 policies correctly defined:
- "Admins full access dealer reviews" (ALL)
- "Anyone can read approved reviews" (SELECT)
- "Dealers can insert own reviews" (INSERT)
- "Dealers can view own reviews" (SELECT)

However, **no GRANT permissions** have been issued to the `anon` or `authenticated` roles. Without GRANTs, Postgres blocks access before RLS policies are even evaluated. Every request returns:

```
permission denied for table dealer_reviews
```

This breaks:
- The homepage "Opinie naszych dealerów" section (approved reviews won't load)
- Dealers submitting reviews from the Won Vehicles page
- Dealers checking if they've already reviewed a car

## Fix

### Step 1: Grant table permissions (SQL)

Run the following SQL to grant the necessary permissions:

```sql
-- Allow anonymous users to read approved reviews (homepage)
GRANT SELECT ON public.dealer_reviews TO anon;

-- Allow authenticated users to read and insert reviews
GRANT SELECT, INSERT ON public.dealer_reviews TO authenticated;
```

The existing RLS policies will then correctly restrict:
- `anon` to only reading rows where `status = 'approved'`
- `authenticated` dealers to inserting only their own reviews and reading their own reviews
- Admins to full access

### Step 2: Verify the fix

After applying the GRANTs, the following should work:
1. Homepage loads the "Opinie naszych dealerów" section without 401 errors (though it will be empty since there are no reviews yet)
2. A dealer can open the review dialog from Won Vehicles and submit a review
3. The review appears with status `pending` in the database
4. An admin can approve the review, after which it appears on the homepage

## No code changes needed
The frontend code (`DealerReviews.tsx`, `ReviewDialog.tsx`, `useDealerReviews.ts`) is already correct. Only the database permissions need to be added.
