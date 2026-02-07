
# Fix: Upgrade @isaacs/brace-expansion to Patch DoS Vulnerability

## Risk Assessment

**Severity in your project: Very Low (dev-only dependency)**

The vulnerable package `@isaacs/brace-expansion@5.0.0` is a transitive **development-only** dependency. It is:
- Never shipped to production (not in the browser bundle)
- Never exposed to user input
- Only used during build by `tailwindcss` and `lovable-tagger`

However, patching it will clear the GitHub Dependabot alert and is good security hygiene.

## Fix (1 file)

### `package.json` -- Add override

Add `@isaacs/brace-expansion` to the existing `overrides` section (line 99-102) to force version `>=5.0.1`:

```json
"overrides": {
  "glob": ">=10.5.0",
  "js-yaml": ">=4.1.1",
  "@isaacs/brace-expansion": ">=5.0.1"
}
```

This tells the package manager to resolve any version of `@isaacs/brace-expansion` to at least `5.0.1`, which contains the fix for the unbounded brace range expansion DoS.

After the lockfile regenerates, the `package-lock.json` and `bun.lock` entries for `@isaacs/brace-expansion` will update from `5.0.0` to `5.0.1`.

## What this changes

- The `overrides` field forces all transitive references to use the patched version
- No functional change to your app -- this is a dev-only dependency
- The Dependabot alert on GitHub will be resolved
