

# Fix: Upgrade @remix-run/router to Clear Dependabot Alert

## Impact Assessment

**Your application is NOT affected by this vulnerability.**

The XSS-via-open-redirect vulnerability only applies to React Router apps using **Framework Mode**, **Data Mode**, or **unstable RSC modes** (i.e., those using `createBrowserRouter` / `RouterProvider`).

Your app uses **Declarative Mode** (`<BrowserRouter>`) exclusively -- confirmed by:
- `src/Root.tsx` wraps everything in `<BrowserRouter>`
- Zero usage of `createBrowserRouter`, `RouterProvider`, or any Data Mode APIs anywhere in the codebase
- All routing uses `<Routes>`, `<Route>`, `<Navigate>`, and `useNavigate()` -- all Declarative Mode

The advisory explicitly states: *"This does not impact applications that use Declarative Mode (`<BrowserRouter>`)."*

## Recommendation

Even though the app is not vulnerable, upgrading will clear the GitHub Dependabot alert and is good security hygiene.

## Fix (1 file)

### `package.json` -- Add override for `@remix-run/router`

Add `@remix-run/router` to the existing `overrides` section to force version `>=1.23.2`:

```json
"overrides": {
  "glob": ">=10.5.0",
  "js-yaml": ">=4.1.1",
  "@isaacs/brace-expansion": ">=5.0.1",
  "@remix-run/router": ">=1.23.2"
}
```

The locked version is currently `1.20.0` (transitive via `react-router-dom@6.27.0`). The override forces the package manager to resolve it to the patched version (`>=1.23.2`), clearing the alert.

## What this changes

- Forces `@remix-run/router` to resolve to at least `1.23.2` in the lockfile
- No functional change -- Declarative Mode routing is unaffected by this patch
- The Dependabot alert on GitHub will be resolved
- Zero risk of breakage since the patch only fixes a code path your app never uses

