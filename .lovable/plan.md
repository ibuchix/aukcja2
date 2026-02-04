

# Plan: Left-Align Explanation Text

## Current State

Looking at line 193 in `SimpleBidManager.tsx`:

```tsx
<p className="text-sm text-muted-foreground text-center">
  Oferty mogą być składane powyżej lub poniżej tej kwoty. Im bardziej atrakcyjna oferta, tym większa szansa na akceptację.
</p>
```

The `text-center` class is making this text centered.

## Change Required

Remove `text-center` from the explanation paragraph so it defaults to left-aligned, while keeping the price section centered.

**Line 193** changes from:
```tsx
<p className="text-sm text-muted-foreground text-center">
```

To:
```tsx
<p className="text-sm text-muted-foreground">
```

## File to Modify

**`src/components/auction/SimpleBidManager.tsx`** - Line 193

## Visual Result

```text
+--------------------------------+
|        Cena wyjściowa          |  ← Centered
|         22 394 zł              |  ← Centered, bold
|                                |
| Oferty mogą być składane...    |  ← Left-aligned
+--------------------------------+
```

