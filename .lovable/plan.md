

# Fix: Cloudflare Turnstile Stale Closure Bug

## What's Happening

1. **Console errors (401, cross-origin frame) are EXPECTED** -- Cloudflare confirms these are normal Turnstile behaviour. No action needed for those.

2. **The real bug**: A stale closure in the fallback timeout causes the Turnstile widget to be removed from the page after 10 seconds, even when it loaded successfully. The form then submits with a fake `TURNSTILE_TIMEOUT` token, and the backend accepts it as a fallback -- effectively bypassing Turnstile protection entirely.

## Root Cause

In `CloudflareTurnstile.tsx`, the timeout callback captures `scriptLoaded` at its initial value (`false`). When the timeout fires 10 seconds later, it still sees `false` even though `setScriptLoaded(true)` was called. This causes the widget to be destroyed and a fallback token to be sent.

## Fix (2 files)

### File 1: `src/components/auth/CloudflareTurnstile.tsx`

**Fix the stale closure** by clearing the timeout as soon as the script loads successfully:

- In the `loadTurnstileScript().then()` handler, call `clearTimeout(timeoutId)` after `setScriptLoaded(true)`
- In the `.catch()` handler, also call `clearTimeout(timeoutId)` to avoid double-firing
- Use a ref (`scriptLoadedRef`) to track load state reliably across closures
- This ensures the fallback timeout only fires if the script genuinely fails to load within 10 seconds

Additionally, stabilise the callback references using refs to prevent unnecessary widget re-renders when parent components re-render:
- Store `onVerify`, `onError`, `onExpire` in refs
- Reference the refs inside `renderWidget` instead of the props directly
- Remove callback props from the `useCallback` dependency array

### File 2: `vite.config.ts`

Update the CSP in the Vite dev server config to include `https://challenges.cloudflare.com` in `script-src`, `connect-src`, and add a `frame-src` directive. This only affects local development but ensures consistency with `index.html`.

## What This Fixes

- Turnstile widget will no longer be destroyed after 10 seconds
- Real Turnstile tokens will be sent to the backend instead of `TURNSTILE_TIMEOUT`
- Server-side verification will actually validate tokens against Cloudflare's API
- The fallback timeout will only trigger if the Turnstile script genuinely fails to load (network error, ad blocker, etc.)

## What About the Console Errors?

The 401 errors and cross-origin frame messages will remain in the console -- this is normal Cloudflare Turnstile behaviour and cannot be suppressed. They do not affect functionality.

