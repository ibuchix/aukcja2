

# Plan: Add Cloudflare Turnstile to All Dealer Auth Forms

## Overview

Add Cloudflare Turnstile (managed mode) with Polish language to all 4 authentication forms. The existing `TURNSTILE_SECRET_KEY` already stored in Supabase will be used for server-side verification -- no new secrets needed.

## Prerequisites (Your Action)

Add `aukcja.autaro.pl` to your existing Turnstile widget's hostname list in the Cloudflare dashboard:
**Turnstile > your widget > Settings > Hostname Management > Add `aukcja.autaro.pl`**

You also need to provide your Turnstile **Site Key** (the public one, not the secret) so it can be embedded in the frontend code.

---

## Changes Summary

### 1. New File: `src/components/auth/CloudflareTurnstile.tsx`

A reusable React component that:
- Loads the Turnstile script from `challenges.cloudflare.com` (once, cached)
- Renders the managed widget with **Polish language** (`data-language="pl"`)
- Calls `onVerify(token)` when verification passes
- Handles errors and expiration gracefully
- Exposes a `reset()` method via ref for re-rendering after submissions
- Includes a fallback timeout so users are never locked out if Turnstile fails to load

### 2. Update: `index.html` (CSP Headers)

Add Cloudflare domains to the Content Security Policy:
- `script-src`: add `https://challenges.cloudflare.com`
- `frame-src`: add `https://challenges.cloudflare.com`
- `connect-src`: add `https://challenges.cloudflare.com`

### 3. Update: `src/components/auth/DealerLoginForm.tsx` (Login Form)

- Import and render `CloudflareTurnstile` between the form fields and submit button
- Store the Turnstile token in local state
- Disable the submit button until Turnstile verification passes
- Pass the token to the login submission flow

### 4. Update: `src/hooks/auth/useLoginForm.ts` (Login Hook)

- Accept a `turnstileToken` parameter in the `onSubmit` function
- Include the token in the request body sent to the `dealer-auth` edge function

### 5. Update: `src/services/auth/signin.ts` (Login Service)

- Accept an optional `turnstileToken` parameter in `signInWithEmail`
- Include it in the request body (`turnstileToken` field)

### 6. Update: `src/pages/auth/DealerSignupForm.tsx` (Registration Form)

- Add `CloudflareTurnstile` widget before the submit button
- Store the token in state
- Pass it through to the registration submission flow

### 7. Update: `src/components/auth/dealer-form/useFormSubmission.tsx` (Registration Submission)

- Accept a `turnstileToken` parameter
- Pass it to `useCompleteRegistration`

### 8. Update: `src/hooks/registration/useCompleteRegistration.ts` (Registration Service)

- Accept `turnstileToken` in the request body sent to `dealer-auth`

### 9. Update: `src/pages/PasswordReset.tsx` (Password Reset Request Form)

- Add `CloudflareTurnstile` widget before the submit button
- Store the token and include it in the `requestPasswordReset` call

### 10. Update: `src/pages/PasswordResetWithToken.tsx` (Password Reset Confirm Form)

- Add `CloudflareTurnstile` widget before the submit button
- Include the token in the `confirmPasswordReset` call

### 11. Update: `src/services/auth/passwordReset.ts` (Password Reset Service)

- Accept `turnstileToken` parameter in both `requestPasswordReset` and `confirmPasswordReset`
- Include it in the request body sent to `dealer-auth`

### 12. Update: `supabase/functions/dealer-auth/route-handler.ts` (Server-Side Verification)

Add a Turnstile verification function that runs **before** any action handler:

1. Extract `turnstileToken` from the request body
2. If token is missing, return 400 error with Polish message
3. POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with the secret key (`TURNSTILE_SECRET_KEY` from environment) and the token
4. If verification fails, return 403 error with Polish message
5. If verification passes, proceed to existing handler logic

This single checkpoint protects ALL actions (login, register, password_reset_request, password_reset_confirm) since they all route through this handler. The `debug` action will be excluded from Turnstile checks.

---

## Safety / Non-Breaking Guarantees

- **Graceful frontend degradation**: If Turnstile script fails to load (network issues, ad blockers), a 10-second timeout allows form submission anyway (with a console warning). Users are never locked out.
- **Server-side fallback**: If `TURNSTILE_SECRET_KEY` is not found in the environment, the edge function logs a warning and allows the request through. This means the app works normally even if the secret is temporarily unavailable.
- **No database changes**: Zero migrations required.
- **Polish language**: The widget uses `data-language="pl"` so all Turnstile UI elements (challenges, messages) appear in Polish.
- **Existing functionality untouched**: All current auth flows remain identical -- Turnstile is purely additive.

---

## Files to Create/Edit

| File | Action | Purpose |
|------|--------|---------|
| `src/components/auth/CloudflareTurnstile.tsx` | **Create** | Reusable Turnstile widget (Polish, managed mode) |
| `index.html` | Edit | Add Cloudflare to CSP |
| `src/components/auth/DealerLoginForm.tsx` | Edit | Add Turnstile to login form |
| `src/hooks/auth/useLoginForm.ts` | Edit | Pass token through login flow |
| `src/services/auth/signin.ts` | Edit | Include token in login request |
| `src/pages/auth/DealerSignupForm.tsx` | Edit | Add Turnstile to registration |
| `src/components/auth/dealer-form/useFormSubmission.tsx` | Edit | Pass token in registration flow |
| `src/hooks/registration/useCompleteRegistration.ts` | Edit | Include token in registration request |
| `src/pages/PasswordReset.tsx` | Edit | Add Turnstile to password reset request |
| `src/pages/PasswordResetWithToken.tsx` | Edit | Add Turnstile to password reset confirm |
| `src/services/auth/passwordReset.ts` | Edit | Include token in reset requests |
| `supabase/functions/dealer-auth/route-handler.ts` | Edit | Server-side Turnstile verification |

