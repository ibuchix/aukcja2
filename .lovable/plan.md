
# Plan: Enhance "Złóż ofertę" Button and Add Info Text

## What We're Changing

### 1. Button Modifications

**Current button (line 241-247):**
```tsx
<Button
  onClick={handlePlaceBid}
  disabled={isSubmitting || !bidAmount || parseFloat(bidAmount) <= 0}
  className="w-full"
>
  {isSubmitting ? "Składanie oferty..." : "Złóż ofertę"}
</Button>
```

**New button:**
- Remove the `!bidAmount || parseFloat(bidAmount) <= 0` from disabled condition (only disable during submission)
- Make it very large with explicit brand red background (`bg-[#D81B24]`)
- Add larger text size, more padding, and font weight

```tsx
<Button
  onClick={handlePlaceBid}
  disabled={isSubmitting}
  className="w-full h-16 text-xl font-bold bg-[#D81B24] hover:bg-[#B01831]"
>
  {isSubmitting ? "Składanie oferty..." : "Złóż ofertę"}
</Button>
```

### 2. Add Informational Text Below Button

Add a new section directly after the button with the provided Polish text:

```tsx
<div className="mt-4 text-sm text-muted-foreground space-y-2">
  <p>Oferty są przekazywane sprzedającemu natychmiastowo.</p>
  <p>Po podjęciu decyzji przez sprzedającego kontaktujemy się z Tobą.</p>
  <p>Konkurencyjna oferta złożona wcześniej ma większą szansę na akceptację, zanim pojawią się kolejne — wyższe — oferty.</p>
  <p>W przypadku akceptacji oferty płatność następuje dopiero przy odbiorze auta, po jego obejrzeniu.</p>
</div>
```

---

## File to Modify

### `src/components/auction/SimpleBidManager.tsx`

**Lines 241-247** - Update button:
- Remove validation from `disabled` prop (keep only `isSubmitting`)
- Add styling classes: `h-16 text-xl font-bold bg-[#D81B24] hover:bg-[#B01831]`

**After line 247** - Add new informational text block

---

## Visual Result

```text
+--------------------------------+
| Złóż ofertę                    |
+--------------------------------+
| Twoja ostatnia oferta: X zł    |
| Cena wyjściowa = 22 394 zł     |
| (explanation text)             |
|                                |
| Twoja oferta (PLN)             |
| [________________]             |
|                                |
| +----------------------------+ |
| |      ZŁÓŻ OFERTĘ           | | ← BIG RED BUTTON (always active)
| +----------------------------+ |
|                                |
| Oferty są przekazywane...      |
| Po podjęciu decyzji...         |
| Konkurencyjna oferta...        |
| W przypadku akceptacji...      |
+--------------------------------+
```

---

## Summary

| Change | Details |
|--------|---------|
| Button always enabled | Remove `!bidAmount` check from disabled prop |
| Brand red color | `bg-[#D81B24]` with `hover:bg-[#B01831]` |
| Bigger button | `h-16 text-xl font-bold` for prominence |
| Info text below | 4 paragraphs explaining the bidding process |
