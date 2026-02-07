

# Fix: Upgrade jsPDF to 4.1.0 to Patch PDF Injection Vulnerability

## Impact Assessment

**Your application is NOT directly affected by this vulnerability.**

The vulnerability requires using jsPDF's AcroForm API, specifically:
- `AcroFormChoiceField.addOption`
- `AcroFormChoiceField.setOptions`
- `AcroFormCheckBox.appearanceState`
- `AcroFormRadioButton.appearanceState`

Your codebase uses jsPDF in exactly two files:
1. `src/components/dealer/documents/CancellationForm.tsx` -- uses only `doc.text()`, `doc.rect()`, `doc.line()`, `doc.setFont()`, `doc.save()`
2. `src/components/dealer/documents/LoyaltyAgreementForm.tsx` -- uses only `doc.text()`, `doc.addPage()`, `doc.splitTextToSize()`, `doc.save()`

Neither file uses any AcroForm features. A full codebase search for `AcroForm`, `addOption`, `setOptions`, and `appearanceState` returned zero results.

## Recommendation

Even though the app is not vulnerable today, upgrading clears the GitHub Dependabot alert and protects against future code that might use AcroForm features.

## Fix (1 file)

### `package.json` -- Upgrade jsPDF dependency

Update the jsPDF version from `^4.0.0` to `^4.1.0` in the dependencies section. This is a minor version bump with no breaking changes -- the patch only adds input sanitization to the AcroForm module.

**Current:**
```json
"jspdf": "^4.0.0"
```

**Updated:**
```json
"jspdf": "^4.1.0"
```

## What this changes

- Upgrades jsPDF from 4.0.0 to 4.1.0 (minor version, no breaking changes)
- The patch adds input sanitization to AcroForm fields to prevent PDF object injection
- Your existing PDF generation code (text-only, no forms) is completely unaffected
- The Dependabot alert on GitHub will be resolved

