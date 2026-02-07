/**
 * Sanitizes a return URL to prevent open redirect attacks.
 * Ensures the URL is a relative path starting with "/" and contains no protocol schemes.
 * Returns a safe default if the URL is invalid.
 */
const DEFAULT_RETURN_URL = "/dealer/dashboard";

export function sanitizeReturnUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") {
    return DEFAULT_RETURN_URL;
  }

  // Trim whitespace
  let sanitized = url.trim();

  // Reject empty strings
  if (!sanitized) {
    return DEFAULT_RETURN_URL;
  }

  // Reject URLs with protocol schemes (e.g., javascript:, https:, data:)
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/i.test(sanitized)) {
    return DEFAULT_RETURN_URL;
  }

  // Reject protocol-relative URLs (e.g., //evil.com)
  if (sanitized.startsWith("//")) {
    return DEFAULT_RETURN_URL;
  }

  // Ensure the path starts with "/"
  if (!sanitized.startsWith("/")) {
    sanitized = "/" + sanitized;
  }

  // Double-check: after normalization, reject if it somehow becomes "//"
  if (sanitized.startsWith("//")) {
    return DEFAULT_RETURN_URL;
  }

  return sanitized;
}
