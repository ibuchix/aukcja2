

# Fix: Upgrade react-router and Add returnUrl Sanitization

## Risk Assessment

**Severity: Low-Medium**

Your app has two code paths where a dynamic `returnUrl` value flows into `navigate()`. While the `returnUrl` originates from `location.pathname` (set by ProtectedRoute), the React Router vulnerability means specially crafted URLs could potentially cause external redirects.

The advisory states: *"This is only an issue if developers pass untrusted content into navigation paths."* Your `returnUrl` is not directly user-input, but it derives from the browser's URL which users control.

## Fix (3 files)

### 1. `package.json` -- Add override for `react-router`

Add `react-router` to the existing `overrides` section to force the patched version:

```json
"overrides": {
  "glob": ">=10.5.0",
  "js-yaml": ">=4.1.1",
  "react-router": ">=6.30.2"
}
```

This forces the transitive dependency `react-router@6.27.0` (pulled in by `react-router-dom@6.27.0`) to resolve to the patched version.

### 2. Create `src/utils/sanitizeReturnUrl.ts` -- Defense-in-depth URL sanitizer

Create a small utility function that validates any `returnUrl` before it's used in navigation. This ensures that even if the React Router patch were somehow bypassed, the app would never navigate to an external URL.

The function will:
- Strip any protocol schemes (e.g., `javascript:`, `https://`)
- Reject URLs that start with `//` (protocol-relative external URLs)
- Ensure the path always starts with `/`
- Default to `/dealer/dashboard` if the URL is invalid

### 3. `src/components/auth/useAuthStateCheck.tsx` -- Sanitize returnUrl before navigate

Wrap the `returnUrl` parameter through the sanitizer before passing it to `navigate()`:

```typescript
import { sanitizeReturnUrl } from "@/utils/sanitizeReturnUrl";

// Inside the redirect logic:
const safeUrl = sanitizeReturnUrl(returnUrl);
navigate(safeUrl, { replace: true });
```

### 4. `src/contexts/auth/hooks/useAuthStateListener.ts` -- Sanitize targetUrl before navigate

Apply the same sanitization to `targetUrl` before navigation:

```typescript
import { sanitizeReturnUrl } from "@/utils/sanitizeReturnUrl";

// Inside the SIGNED_IN handler:
const targetUrl = sanitizeReturnUrl(currentLocation.state?.returnUrl || "/dealer/dashboard");
navigate(targetUrl, { replace: true });
```

## What this changes

- Forces `react-router` to resolve to at least `6.30.2` in the lockfile, patching the vulnerability at its source
- Adds a defense-in-depth sanitizer so that no navigation path can ever point to an external URL, even if new vulnerabilities are found in the future
- No functional change for normal users -- all internal redirect paths (like `/dealer/dashboard`) pass through unchanged
- The Dependabot alert on GitHub will be resolved

