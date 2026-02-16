

# Dealer Review System

## Overview
Allow dealers to leave reviews (1-5 stars + up to 300 words) for cars they've won. Reviews are tied to specific won vehicles, require admin approval, and the 7 most recent approved reviews display on the home page above the "Dlaczego warto nas wybrać" section.

## Database

### New table: `dealer_reviews`
Mirrors the existing `seller_reviews` table structure:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, default `gen_random_uuid()` |
| dealer_id | uuid | References `dealers.id` |
| car_id | uuid | References `cars.id` |
| rating | integer | 1-5, NOT NULL |
| review_text | text | NOT NULL |
| dealer_name | text | Dealership name snapshot |
| car_title | text | e.g. "2020 BMW 320i" |
| status | text | Default `'pending'`, values: pending / approved / rejected |
| created_at | timestamptz | Default `now()` |

### RLS Policies
- **Dealers can insert** their own reviews (where `dealer_id` matches their dealer record)
- **Dealers can view** their own reviews
- **Anyone authenticated can read approved reviews** (for the home page display)
- **Admins have full access** (to approve/reject)

## UI Changes

### 1. "Napisz recenzję" button on Won Vehicles cards
**File: `src/components/dealer/WonVehicles.tsx`**

Add a "Napisz recenzję" (Write a review) button next to the existing "Zobacz pelny profil pojazdu" button at the bottom of each won vehicle card. The button:
- Only appears when `payment_status === 'paid'` (dealer has completed the purchase)
- Is disabled with "Recenzja wysłana" label if a review already exists for that car
- Opens a review dialog/modal on click

### 2. New Review Dialog component
**File: `src/components/dealer/ReviewDialog.tsx`**

A modal dialog containing:
- Star rating selector (1-5 clickable stars using the Star icon from lucide-react)
- Textarea for review text (max 300 words, with live word counter)
- Submit button that inserts into `dealer_reviews`
- Polish labels throughout (e.g., "Oceń transakcję", "Twoja recenzja", "Wyślij recenzję")

### 3. Reviews section on the home page
**File: `src/components/DealerReviews.tsx`**

A new section component that:
- Fetches the 7 most recent approved dealer reviews from `dealer_reviews` where `status = 'approved'`
- Displays them in a horizontal scrollable card layout (matching the app's dark styling)
- Each card shows: star rating, review text (truncated if long), dealer name, car title
- Section title: "Opinie naszych dealerów"

**File: `src/pages/Index.tsx`**

Insert `<DealerReviews />` between `<Hero />` and `<Services />`.

### 4. Custom hook for reviews
**File: `src/hooks/useDealerReviews.ts`**

- `useSubmitReview(dealerId, carId, rating, reviewText, dealerName, carTitle)` -- mutation to insert
- `useApprovedReviews(limit)` -- query to fetch approved reviews for home page
- `useDealerCarReview(dealerId, carId)` -- query to check if a review already exists for a specific car

## Technical Details

- No new dependencies needed
- Star rating uses lucide-react `Star` icon (already installed)
- Word count validation done client-side before submit
- The review is a one-time action per won vehicle (checked via `useDealerCarReview`)
- Reviews table uses the same `status` pattern as `seller_reviews` for admin workflow consistency
