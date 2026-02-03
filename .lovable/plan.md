

# Plan: Optimize Mobile Layout for Dealer Auction Page

## Problem

On mobile devices, dealers need to scroll extensively to reach the bidding section because the "Specyfikacja pojazdu", "Historia Pojazdu", and "Raport Stanu Technicznego" sections display each item in a single column, creating a very long page.

## Current State

| Section | Current Mobile Layout | Current Desktop Layout |
|---------|----------------------|------------------------|
| Specyfikacja pojazdu | 1 column | 2-3 columns |
| Historia Pojazdu | 1 column | 2-3 columns |
| VehicleHealthReport | 1 column | 2 columns |

## Solution

Use the existing `isMobile` hook (already imported in `CarAuction.tsx`) to make all specification/history sections display as **2 columns on mobile** instead of 1. This approximately halves the scroll distance to reach the bidding section.

---

## Files to Modify

### 1. `src/pages/dealer/CarAuction.tsx`

**Change the Specyfikacja pojazdu grid (line 178):**

```text
Current:  grid-cols-1 md:grid-cols-2 lg:grid-cols-3
New:      grid-cols-2 lg:grid-cols-3
```

**Change the Historia Pojazdu grid (line 285):**

```text
Current:  grid-cols-1 md:grid-cols-2 lg:grid-cols-3
New:      grid-cols-2 lg:grid-cols-3
```

**Adjust individual card padding for mobile readability:**
- Use conditional padding: `p-3` on mobile, `p-4` on larger screens
- Reduce font sizes slightly on mobile for better fit in 2-column layout
- Use the `isMobile` variable already available in the component

**Example change for specification cards:**
```tsx
<div className={cn(
  "group bg-secondary/50 border border-transparent rounded-xl transition-all duration-300 hover:border-primary/40",
  isMobile ? "p-3" : "p-4"
)}>
  <div className={cn(
    "text-subtitle-text font-kanit font-medium uppercase tracking-widest mb-1 opacity-70",
    isMobile ? "text-[10px]" : "text-xs"
  )}>
    {translateSpecificationLabel('Year')}
  </div>
  <div className={cn(
    "font-kanit font-semibold text-body-text",
    isMobile ? "text-base" : "text-lg"
  )}>
    {car.year}
  </div>
</div>
```

---

### 2. `src/components/car-details/VehicleHealthReport.tsx`

**Add the `useIsMobile` hook import:**
```tsx
import { useIsMobile } from "@/hooks/use-mobile";
```

**Use the hook in the component:**
```tsx
export const VehicleHealthReport = ({ car }: VehicleHealthReportProps) => {
  const isMobile = useIsMobile();
  // ... rest of component
}
```

**Change the ConditionRow grid layout (line 121 in CategorySection):**
```text
Current:  grid-cols-1 md:grid-cols-2
New:      grid-cols-2
```

**Adjust ConditionRow styling for mobile:**
- Pass `isMobile` to the CategorySection and ConditionRow components
- Reduce padding and font size on mobile for better 2-column fit

**Example ConditionRow adjustment:**
```tsx
<div className={cn(
  "flex items-center justify-between rounded-md",
  isMobile ? "py-2 px-3" : "py-3 px-4",
  index % 2 === 0 ? "bg-background/30" : "bg-background/50"
)}>
  <span className={cn(
    "text-body-text font-medium",
    isMobile ? "text-sm" : "text-base"
  )}>{item.label}</span>
  <StatusIndicator ... />
</div>
```

---

## Visual Comparison

```text
BEFORE (Mobile - 1 column):             AFTER (Mobile - 2 columns):

+---------------------------+           +-------------+-------------+
|  ROK                      |           |  ROK        |  DATA       |
|  2014                     |           |  2014       |  13.08.2014 |
+---------------------------+           +-------------+-------------+
|  DATA PIERWSZEJ REJ.      |           |  PRZEBIEG   |  SKRZYNIA   |
|  13 sierpnia 2014         |           |  288,000 km |  Automatycz.|
+---------------------------+           +-------------+-------------+
|  PRZEBIEG                 |           |  TYP PALIWA |  POJEMNOŚĆ  |
|  288,000 km               |           |  Benzyna    |  3.0L       |
+---------------------------+           +-------------+-------------+
|  SKRZYNIA BIEGÓW          |
|  Automatyczna             |
+---------------------------+
|  TYP PALIWA               |
|  Benzyna                  |
+---------------------------+
|  POJEMNOŚĆ SILNIKA        |
|  3.0L                     |
+---------------------------+
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `CarAuction.tsx` | Change spec/history grids from `grid-cols-1 md:grid-cols-2` to `grid-cols-2`; adjust padding/font sizes for mobile using `isMobile` |
| `VehicleHealthReport.tsx` | Import `useIsMobile`; change condition grid to always 2 columns; adjust padding/font for mobile |

---

## Benefits

1. **~50% less scrolling** to reach the bidding section on mobile
2. **Compact but readable** - smaller padding and fonts fit well in 2-column layout
3. **Uses existing pattern** - the `useIsMobile` hook is already used in the project
4. **No layout changes on desktop** - only affects mobile viewport
