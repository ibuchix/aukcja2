

# Fix: Add Missing Overrides to Resolve Dependabot Alert

## What went wrong previously

The earlier fix added `@remix-run/router` and `react-router` as **direct dependencies** instead of adding them to the **overrides section**. This resulted in:

- `@remix-run/router@1.23.2` installed at the root level (as a direct dep)
- `@remix-run/router@1.20.0` STILL installed nested under `react-router-dom` (the vulnerable transitive copy)
- Same situation for `react-router`: v7.13.0 at root, but v6.27.0 still nested under `react-router-dom`

npm's `overrides` is the mechanism that forces ALL copies of a package (including transitive/nested ones) to resolve to a specific version. Without it, both versions coexist.

## Fix (1 file)

### `package.json` -- Two changes

**1. Remove the unnecessary direct dependencies**

Remove these two lines from `dependencies` since they are not used directly by the app and were only added to try to patch the transitive versions:

```
"@remix-run/router": "^1.23.2",   (line 44 -- remove)
"react-router": "^7.13.0",        (line 72 -- remove)
```

**2. Add proper overrides**

Update the `overrides` section (currently lines 102-105) to force the transitive dependencies to the patched versions:

```json
"overrides": {
  "glob": ">=10.5.0",
  "js-yaml": ">=4.1.1",
  "@remix-run/router": ">=1.23.2",
  "react-router": ">=6.30.2"
}
```

## Why this works

- `overrides` tells npm: "wherever you see `@remix-run/router` in any dependency tree, resolve it to `>=1.23.2`"
- This eliminates the nested `1.20.0` copy under `react-router-dom/node_modules/`
- Same for `react-router`: forces `>=6.30.2` instead of the nested `6.27.0`
- The Dependabot alert will clear because the lockfile will no longer contain the vulnerable versions

## What this changes

- No functional change -- the app uses Declarative Mode (`BrowserRouter`) which is unaffected by these vulnerabilities
- Removes two unnecessary direct dependencies that were cluttering the dependency list
- Properly forces patched versions via overrides, which is the correct npm mechanism for transitive dependency patching
- Both Dependabot alerts (react-router #23 and @remix-run/router #22) will be resolved

